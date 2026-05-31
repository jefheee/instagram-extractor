import { NextRequest, NextResponse } from 'next/server';
import { getInstagramClient, shortcodeToMediaId } from '@/lib/instagram';

function handleInstagramError(error: any) {
  const message = error.message || 'Erro desconhecido no Instagram';
  const name = error.name || '';
  
  if (name.includes('IgLoginRequiredError') || message.includes('login_required')) {
    return { status: 401, message: 'A sessão do Instagram expirou ou é inválida. Atualize o INSTAGRAM_SESSION_ID.' };
  }
  if (name.includes('IgActionSpamError') || message.includes('rate_limit') || message.includes('429') || message.includes('spam')) {
    return { status: 429, message: 'Instagram bloqueou a requisição por limite de taxa (Rate Limit). Tente novamente mais tarde.' };
  }
  if (name.includes('IgExactUserNotFoundError') || message.includes('user not found') || message.includes('404')) {
    return { status: 404, message: 'Perfil ou conteúdo não encontrado.' };
  }
  if (name.includes('IgPrivateUserError') || message.includes('private')) {
    return { status: 403, message: 'Este perfil é privado e não pode ser acessado.' };
  }
  return { status: 500, message: `Falha no processamento do Instagram: ${message}` };
}

export async function POST(request: NextRequest) {
  try {
    const { url, cursor } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL do Instagram é obrigatória.' }, { status: 400 });
    }

    const ig = await getInstagramClient();

    // 1. Clean up URL/Username
    const cleanUrl = url.trim();

    // 2. Parse URL patterns using regex
    const postMatch = cleanUrl.match(/(?:\/p\/|\/reel\/|\/reels\/)([A-Za-z0-9_-]+)/);
    const storyMatch = cleanUrl.match(/\/stories\/([A-Za-z0-9_.-]+)\/([0-9]+)/);
    
    // Check if it's a URL or a raw username
    let isProfile = false;
    let username = '';

    if (storyMatch) {
      username = storyMatch[1];
    } else if (postMatch) {
      // It's a post/reel
    } else {
      // Check if it's a profile URL or raw username
      const profileUrlMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.-]+)/);
      const rawUsernameMatch = cleanUrl.match(/^[A-Za-z0-9_.-]+$/);

      if (profileUrlMatch) {
        username = profileUrlMatch[1];
        isProfile = true;
      } else if (rawUsernameMatch) {
        username = cleanUrl;
        isProfile = true;
      }
    }

    // List of reserved paths that shouldn't be parsed as profile usernames
    const reservedWords = ['p', 'reel', 'reels', 'stories', 'explore', 'developer', 'accounts', 'emails', 'about'];
    if (isProfile && reservedWords.includes(username.toLowerCase())) {
      return NextResponse.json({ error: 'URL do Instagram inválida.' }, { status: 400 });
    }

    // --- Scenario A: Profile Fetching ---
    if (isProfile && username) {
      try {
        const userId = await ig.user.getIdByUsername(username);
        const userInfo = await ig.user.info(userId);

        // Fetch feed items
        const userFeed = ig.feed.user(userId);
        if (cursor) {
          (userFeed as any).nextMaxId = cursor;
        }
        
        const feedItems = await userFeed.items();
        const nextCursor = (userFeed as any).nextMaxId || null;
        const hasMore = userFeed.isMoreAvailable();

        // Fetch active stories
        let stories: any[] = [];
        try {
          const reelsFeed = ig.feed.reelsMedia({ userIds: [userId] });
          const storyItems = await reelsFeed.items();
          stories = storyItems.map((item: any) => ({
            id: item.id,
            type: item.media_type === 2 ? 'video' : 'image',
            url: item.media_type === 2 ? item.video_versions[0].url : item.image_versions2.candidates[0].url,
            thumbnail: item.image_versions2.candidates[0].url,
            takenAt: item.taken_at,
          }));
        } catch (storyErr: any) {
          console.warn('Could not fetch stories:', storyErr.message);
        }

        return NextResponse.json({
          type: 'profile',
          id: userId,
          username: userInfo.username,
          fullName: userInfo.full_name,
          biography: userInfo.biography,
          profilePicUrl: userInfo.profile_pic_url,
          followerCount: userInfo.follower_count,
          followingCount: userInfo.following_count,
          mediaCount: userInfo.media_count,
          stories,
          feed: feedItems.map((item: any) => ({
            id: item.id,
            shortcode: item.code,
            caption: item.caption?.text || '',
            type: item.media_type === 8 ? 'carousel' : (item.media_type === 2 ? 'video' : 'image'),
            media: item.media_type === 8
              ? (item as any).carousel_media?.map((subItem: any) => ({
                  type: subItem.media_type === 2 ? 'video' : 'image',
                  url: subItem.media_type === 2 ? subItem.video_versions[0].url : subItem.image_versions2.candidates[0].url,
                  thumbnail: subItem.image_versions2.candidates[0].url,
                }))
              : [
                  {
                    type: item.media_type === 2 ? 'video' : 'image',
                    url: item.media_type === 2 ? item.video_versions[0].url : item.image_versions2.candidates[0].url,
                    thumbnail: item.image_versions2.candidates[0].url,
                  }
                ]
          })),
          nextCursor,
          hasMore,
        });
      } catch (err: any) {
        const errorDetails = handleInstagramError(err);
        return NextResponse.json({ error: errorDetails.message }, { status: errorDetails.status });
      }
    }

    // --- Scenario B: Story Match ---
    if (storyMatch && username) {
      const storyId = storyMatch[2];
      try {
        const userId = await ig.user.getIdByUsername(username);
        const reelsFeed = ig.feed.reelsMedia({ userIds: [userId] });
        const storyItems = await reelsFeed.items();
        
        // Find matching story item or default to first if single link requested
        const match = storyItems.find((item: any) => item.id.includes(storyId)) || storyItems[0];
        
        if (!match) {
          return NextResponse.json({ error: 'Story ativo específico não encontrado ou expirou.' }, { status: 404 });
        }

        return NextResponse.json({
          type: 'story',
          id: match.id,
          caption: 'Instagram Story',
          user: {
            username,
            fullName: username,
            profilePicUrl: match.user?.profile_pic_url || '',
          },
          media: [
            {
              type: match.media_type === 2 ? 'video' : 'image',
              url: match.media_type === 2 ? match.video_versions[0].url : match.image_versions2.candidates[0].url,
              thumbnail: match.image_versions2.candidates[0].url,
            }
          ]
        });
      } catch (err: any) {
        const errorDetails = handleInstagramError(err);
        return NextResponse.json({ error: errorDetails.message }, { status: errorDetails.status });
      }
    }

    // --- Scenario C: Post / Reel Fetching ---
    if (postMatch) {
      const shortcode = postMatch[1];
      try {
        const mediaPk = shortcodeToMediaId(shortcode);
        const mediaInfo = await ig.media.info(mediaPk);
        const item = mediaInfo.items[0];

        if (!item) {
          return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
        }

        return NextResponse.json({
          type: 'post',
          id: item.id,
          caption: item.caption?.text || '',
          user: {
            username: item.user.username,
            fullName: item.user.full_name,
            profilePicUrl: item.user.profile_pic_url,
          },
          media: item.media_type === 8
            ? (item as any).carousel_media?.map((subItem: any) => ({
                type: subItem.media_type === 2 ? 'video' : 'image',
                url: subItem.media_type === 2 ? subItem.video_versions[0].url : subItem.image_versions2.candidates[0].url,
                thumbnail: subItem.image_versions2.candidates[0].url,
              }))
            : [
                {
                  type: item.media_type === 2 ? 'video' : 'image',
                  url: item.media_type === 2 ? (item as any).video_versions[0].url : (item as any).image_versions2.candidates[0].url,
                  thumbnail: (item as any).image_versions2.candidates[0].url,
                }
              ]
        });
      } catch (err: any) {
        const errorDetails = handleInstagramError(err);
        return NextResponse.json({ error: errorDetails.message }, { status: errorDetails.status });
      }
    }

    return NextResponse.json({ error: 'URL do Instagram inválida ou não suportada.' }, { status: 400 });
  } catch (error: any) {
    console.error('Request parsing/processing error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

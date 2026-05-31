'use client';

import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  Loader2, 
  Users, 
  Film, 
  Image as ImageIcon, 
  Layers, 
  AlertCircle, 
  Play, 
  X, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
}

interface PostItem {
  id: string;
  shortcode: string;
  caption: string;
  type: 'image' | 'video' | 'carousel';
  media: MediaItem[];
}

interface StoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
  takenAt: number;
}

interface UserProfile {
  type: 'profile';
  id: string;
  username: string;
  fullName: string;
  biography: string;
  profilePicUrl: string;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
  stories: StoryItem[];
  feed: PostItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface SingleMediaResult {
  type: 'post' | 'story';
  id: string;
  caption: string;
  user: {
    username: string;
    fullName: string;
    profilePicUrl: string;
  };
  media: MediaItem[];
}

type ExtractorResult = UserProfile | SingleMediaResult;

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractorResult | null>(null);
  const [feedItems, setFeedItems] = useState<PostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Lightbox / Modal for active story viewing
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setFeedItems([]);
    setNextCursor(null);
    setHasMore(false);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar o link.');
      }

      setResult(data);

      if (data.type === 'profile') {
        setFeedItems(data.feed || []);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (err: any) {
      setError(err.message || 'Falha de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !nextCursor || result?.type !== 'profile') return;

    setLoadingMore(true);
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cursor: nextCursor }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar mais posts.');
      }

      setFeedItems((prev) => [...prev, ...(data.feed || [])]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar próxima página.');
    } finally {
      setLoadingMore(false);
    }
  };

  const getProxyUrl = (rawUrl: string) => {
    return `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err: any) {
      alert("Permissão negada ou restrição de HTTP. Pressione Ctrl+V para colar na barra.");
      console.error(err);
    }
  };

  // Slide stories carousel left/right
  const scrollStories = (direction: 'left' | 'right') => {
    const container = document.getElementById('stories-container');
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <main className="min-h-screen mesh-gradient relative pb-20 px-4 md:px-8">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <header className="w-full flex items-center justify-between p-4 bg-transparent">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold tracking-widest text-indigo-400 uppercase">
            IV // InstaVault
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-zinc-900/60 px-3.5 py-1.5 rounded-full border border-zinc-850 uppercase tracking-wide">
          v2.0 // Cobalt-Inspired
        </div>
      </header>

      {/* Main Container */}
      <section className="max-w-6xl mx-auto mt-16 md:mt-24 flex flex-col items-center">
        {/* Title & Tagline */}
        <div className="text-center mb-8 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Salve Mídias do <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">Instagram</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Insira o link ou usuário para extrair e baixar Reels, Posts, Stories e fotos de perfil instantaneamente com bypass de CORS.
          </p>
        </div>

        {/* Omnibox / Input */}
        <form onSubmit={handleSearch} className="w-full max-w-3xl mb-12">
          <div className="glass-panel p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Insira a URL do post, story, reel ou o nome do usuário..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-transparent pl-12 pr-20 py-3.5 text-white placeholder-slate-500 focus:outline-none text-sm md:text-base"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 px-2.5 py-1 text-xs text-indigo-400 font-medium hover:text-indigo-300 transition-colors bg-indigo-500/10 rounded-md border border-indigo-500/20"
              >
                Colar
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-sm md:text-base px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Analisar</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="w-full max-w-3xl glass-panel border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-400 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Falha no Processamento</h3>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-3xl py-20 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <InstagramIcon className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">
              Buscando e forjando cabeçalhos do Instagram...
            </p>
          </div>
        )}

        {/* --- SCENARIO 1: Single Post / Reel / Story Result --- */}
        {result && (result.type === 'post' || result.type === 'story') && (
          <div className="w-full max-w-3xl glass-panel rounded-2xl overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-300">
            {/* User header */}
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/50 pb-4">
              <img
                src={result.user.profilePicUrl ? getProxyUrl(result.user.profilePicUrl) : '/placeholder.jpg'}
                alt={result.user.username}
                className="w-12 h-12 rounded-full border border-indigo-500/30 object-cover"
              />
              <div>
                <h3 className="text-white font-bold text-base">@{result.user.username}</h3>
                <p className="text-slate-400 text-xs">{result.user.fullName}</p>
              </div>
              <div className="ml-auto bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase font-mono tracking-wider">
                {result.type}
              </div>
            </div>

            {/* Media List */}
            <div className="grid grid-cols-1 gap-6">
              {result.media.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-6 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/30">
                  <div className="relative w-full md:w-80 h-80 rounded-lg overflow-hidden bg-black shrink-0 flex items-center justify-center group">
                    {item.type === 'video' ? (
                      <video
                        src={getProxyUrl(item.url)}
                        controls
                        poster={getProxyUrl(item.thumbnail)}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={getProxyUrl(item.url)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex flex-col justify-between py-2 w-full">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5 mb-2">
                        {item.type === 'video' ? <Film className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        Mídia #{index + 1}
                      </span>
                      <p className="text-slate-300 text-sm leading-relaxed line-clamp-6 whitespace-pre-line">
                        {result.caption || 'Sem legenda disponível.'}
                      </p>
                    </div>

                    <a
                      href={getProxyUrl(item.url)}
                      download
                      className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar Mídia</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SCENARIO 2: Profile Hub --- */}
        {result && result.type === 'profile' && (
          <div className="w-full flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Profile Header Card */}
            <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                {/* Profile Pic with Violet/Indigo glow border */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-40 animate-pulse" />
                  <img
                    src={result.profilePicUrl ? getProxyUrl(result.profilePicUrl) : '/placeholder.jpg'}
                    alt={result.username}
                    className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-zinc-800 object-cover"
                  />
                </div>

                {/* Info and stats */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4 justify-center md:justify-start">
                    <h2 className="text-2xl font-bold text-white">@{result.username}</h2>
                    <span className="self-center bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase font-mono tracking-wider">
                      Perfil Completo
                    </span>
                  </div>

                  <p className="text-slate-300 text-base font-medium mb-3">{result.fullName}</p>
                  <p className="text-slate-400 text-sm whitespace-pre-line leading-relaxed mb-6 max-w-xl">
                    {result.biography || 'Sem biografia disponível.'}
                  </p>

                  {/* Profile stats */}
                  <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto md:mx-0 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50">
                    <div className="text-center">
                      <div className="text-white font-extrabold text-base md:text-lg">
                        {formatNumber(result.mediaCount)}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">Posts</div>
                    </div>
                    <div className="text-center border-x border-zinc-800/50 px-2">
                      <div className="text-white font-extrabold text-base md:text-lg">
                        {formatNumber(result.followerCount)}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">Seguidores</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-extrabold text-base md:text-lg">
                        {formatNumber(result.followingCount)}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">Seguindo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stories Section */}
            {result.stories && result.stories.length > 0 && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500" />
                    Stories Ativos ({result.stories.length})
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => scrollStories('left')}
                      className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => scrollStories('right')}
                      className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div 
                  id="stories-container" 
                  className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x scrollbar-none"
                >
                  {result.stories.map((story) => (
                    <div 
                      key={story.id} 
                      onClick={() => setActiveStory(story)}
                      className="snap-start shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      {/* Active story circle with glowing ring */}
                      <div className="relative p-1 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 group-hover:scale-105 transition-transform duration-300">
                        <div className="p-0.5 bg-zinc-950 rounded-full">
                          <img
                            src={getProxyUrl(story.thumbnail)}
                            alt="Story thumbnail"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        </div>
                        {story.type === 'video' && (
                          <div className="absolute bottom-1 right-1 p-1 bg-black/80 rounded-full border border-zinc-800">
                            <Play className="w-2.5 h-2.5 fill-white text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(story.takenAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed Grid (Masonry / Responsive) */}
            <div className="w-full mt-4">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Publicações Recentes
              </h3>

              {feedItems.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                  <p className="text-slate-400 text-sm">Este usuário não possui publicações visíveis.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {feedItems.map((post) => (
                    <div
                      key={post.id}
                      className="glass-panel rounded-2xl overflow-hidden group border border-zinc-800/40 relative flex flex-col justify-between"
                    >
                      {/* Top badge indicators for Video/Carousel */}
                      <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white flex items-center gap-1.5 border border-zinc-800/50">
                        {post.type === 'video' && (
                          <>
                            <Film className="w-3 h-3 text-indigo-400" />
                            <span>VÍDEO</span>
                          </>
                        )}
                        {post.type === 'carousel' && (
                          <>
                            <Layers className="w-3 h-3 text-pink-400" />
                            <span>SLIDES ({post.media.length})</span>
                          </>
                        )}
                        {post.type === 'image' && (
                          <>
                            <ImageIcon className="w-3 h-3 text-emerald-400" />
                            <span>IMAGEM</span>
                          </>
                        )}
                      </div>

                      {/* Content Preview Container */}
                      <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden">
                        <img
                          src={getProxyUrl(post.media[0]?.thumbnail || '')}
                          alt="Post preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Interactive overlay on hover */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between z-20">
                          <p className="text-slate-300 text-xs leading-relaxed line-clamp-8 whitespace-pre-line text-left">
                            {post.caption || 'Sem legenda.'}
                          </p>

                          <div className="flex flex-col gap-2">
                            {post.type === 'carousel' ? (
                              <div className="grid grid-cols-2 gap-2">
                                {post.media.map((media, idx) => (
                                  <a
                                    key={idx}
                                    href={getProxyUrl(media.url)}
                                    download
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 text-[10px] font-semibold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Mid #{idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <a
                                href={getProxyUrl(post.media[0]?.url || '')}
                                download
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Baixar {post.type === 'video' ? 'Vídeo' : 'Imagem'}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Simple Footer with caption summary */}
                      <div className="p-4 bg-zinc-950/20 border-t border-zinc-800/30">
                        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed text-left">
                          {post.caption || 'Sem legenda.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-zinc-900/60 hover:bg-zinc-800/80 text-indigo-400 font-semibold text-sm px-8 py-3.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 shadow-xl hover:shadow-indigo-500/5 transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Carregar Mais Publicações</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Story Lightbox / Modal */}
      {activeStory && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button
            onClick={() => setActiveStory(null)}
            className="absolute top-4 right-4 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-full max-w-md flex flex-col items-center gap-4">
            <div className="relative aspect-[9/16] w-full max-h-[70vh] rounded-2xl overflow-hidden bg-black border border-zinc-800/80 flex items-center justify-center">
              {activeStory.type === 'video' ? (
                <video
                  src={getProxyUrl(activeStory.url)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={getProxyUrl(activeStory.url)}
                  alt="Story content"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <a
              href={getProxyUrl(activeStory.url)}
              download
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/10 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Story</span>
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

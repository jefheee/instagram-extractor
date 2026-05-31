import { IgApiClient } from 'instagram-private-api';

declare global {
  var igClient: IgApiClient | undefined;
}

export async function getInstagramClient() {
  if (global.igClient) {
    return global.igClient;
  }

  const username = process.env.IG_USERNAME;
  const password = process.env.IG_PASSWORD;
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const proxyUrl = process.env.PROXY_URL;

  if (!username) {
    throw new Error('IG_USERNAME is required in environment variables');
  }

  const ig = new IgApiClient();
  ig.state.generateDevice(username);

  if (proxyUrl) {
    ig.state.proxyUrl = proxyUrl;
  }

  try {
    if (sessionId) {
      await ig.state.cookieJar.setCookie(
        `sessionid=${sessionId}; Domain=.instagram.com; Path=/; Secure; HttpOnly`,
        'https://instagram.com'
      );
      
      // Verify session
      try {
        await ig.account.currentUser();
      } catch (e: any) {
        console.warn('Session verification failed, attempting password login fallback:', e.message);
        if (password) {
          await performLogin(ig, username, password);
        } else {
          throw new Error('Session ID is invalid/expired, and no IG_PASSWORD was provided.');
        }
      }
    } else if (password) {
      await performLogin(ig, username, password);
    } else {
      throw new Error('Either INSTAGRAM_SESSION_ID or IG_PASSWORD must be configured.');
    }

    global.igClient = ig;
    return ig;
  } catch (error: any) {
    console.error('Error initializing Instagram Client:', error.message);
    throw error;
  }
}

async function performLogin(ig: IgApiClient, username: string, password: string) {
  await ig.simulate.preLoginFlow();
  await ig.account.login(username, password);
  process.nextTick(async () => {
    try {
      await ig.simulate.postLoginFlow();
    } catch (e: any) {
      console.warn('Post login simulation warning:', e.message);
    }
  });
}

// Helper to convert post shortcode to Instagram media PK (numeric id)
export function shortcodeToMediaId(shortcode: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = BigInt(0);

  for (let i = 0; i < shortcode.length; i++) {
    const char = shortcode[i];
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    id = (id * BigInt(64)) + BigInt(index);
  }

  return id.toString();
}

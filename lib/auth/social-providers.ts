export interface SocialProvider {
  id: string
  name: string
  clientId?: string
  redirectUri?: string
  authUrl?: string
  scope?: string
}

// In a real app, these would be environment variables
export const socialProviders: Record<string, SocialProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'demo-google-client-id',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/oauth/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
  },
  kakao: {
    id: 'kakao',
    name: 'Kakao',
    clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || 'demo-kakao-client-id',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/oauth/callback`,
    authUrl: 'https://kauth.kakao.com/oauth/authorize',
    scope: 'profile_nickname profile_image account_email',
  },
  naver: {
    id: 'naver',
    name: 'Naver',
    clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || 'demo-naver-client-id',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/oauth/callback`,
    authUrl: 'https://nid.naver.com/oauth2.0/authorize',
    scope: 'email profile',
  },
}

export function getOAuthUrl(providerId: string): string {
  const provider = socialProviders[providerId]
  if (!provider || !provider.authUrl) {
    throw new Error(`Provider ${providerId} not found or not configured`)
  }

  const params = new URLSearchParams({
    client_id: provider.clientId || '',
    redirect_uri: provider.redirectUri || '',
    response_type: 'code',
    scope: provider.scope || '',
    state: providerId, // Include provider ID in state for callback
  })

  return `${provider.authUrl}?${params.toString()}`
}
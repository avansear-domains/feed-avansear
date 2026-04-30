import { createHmac, timingSafeEqual } from 'crypto'

export const FEED_ADMIN_COOKIE = 'feed_admin_session'

const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000

function signBody(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url')
}

export function createFeedAdminSessionToken(): string | null {
  const secret = process.env.CUSTOM_PASS
  if (!secret) return null

  const exp = Date.now() + SESSION_MAX_MS
  const body = JSON.stringify({ exp })
  const sig = signBody(secret, body)
  return Buffer.from(JSON.stringify({ body, sig }), 'utf8').toString('base64url')
}

export function verifyFeedAdminSessionToken(token: string | undefined): boolean {
  const secret = process.env.CUSTOM_PASS
  if (!secret || !token) return false

  try {
    const raw = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      body: string
      sig: string
    }
    const expected = signBody(secret, raw.body)
    const a = Uint8Array.from(Buffer.from(raw.sig))
    const b = Uint8Array.from(Buffer.from(expected))
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
    const { exp } = JSON.parse(raw.body) as { exp: number }
    return typeof exp === 'number' && exp > Date.now()
  } catch {
    return false
  }
}

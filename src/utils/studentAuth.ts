import crypto from 'crypto'

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback_student_session_secret_key_vicinix'

/**
 * Creates a signed token for a student's enrollment number
 */
export function signSession(rollNo: string): string {
  const normalized = rollNo.trim().toLowerCase()
  const hmac = crypto.createHmac('sha256', SECRET).update(normalized).digest('hex')
  return `${normalized}.${hmac}`
}

/**
 * Verifies a signed token and returns the normalized enrollment number if valid, or null otherwise
 */
export function verifySession(token: string): string | null {
  if (!token) return null
  
  const parts = token.split('.')
  if (parts.length !== 2) return null
  
  const [rollNo, hash] = parts
  const expectedHash = crypto.createHmac('sha256', SECRET).update(rollNo).digest('hex')
  
  if (hash === expectedHash) {
    return rollNo
  }
  
  return null
}

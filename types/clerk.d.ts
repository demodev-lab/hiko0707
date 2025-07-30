export {}

// Clerk의 Private Metadata 타입 정의
export type AdminRole = 'admin'

declare global {
  interface CustomJwtSessionClaims {
    privateMetadata?: {
      role?: AdminRole
    }
  }
  
  interface UserPrivateMetadata {
    role?: AdminRole
  }
}
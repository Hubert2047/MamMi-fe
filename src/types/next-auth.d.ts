import type { UserRole } from './auth'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: {
      id: string
      role: UserRole
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role: UserRole
    accessToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    role?: UserRole
    userId?: string
  }
}

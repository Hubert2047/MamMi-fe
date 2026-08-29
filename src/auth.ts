import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { loginAPI } from '@/api/auth'

const isProduction = process.env.NODE_ENV === 'production'
const useSecureCookies = isProduction && process.env.COOKIE_SECURE === 'true'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies,
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        account: { label: 'Account', type: 'text' },
        password: { label: 'Password', type: 'password' },
        storeId: { label: 'Store', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.account || !credentials.password) return null

        try {
          const response = await loginAPI({
            account: credentials.account,
            password: credentials.password,
            ...(typeof credentials.storeId === 'string' && credentials.storeId !== 'undefined' ? { storeId: credentials.storeId } : {}),
          })
          const { accessToken, user } = response.data
          if (!accessToken || !user) return null

          return {
            id: String(user.id),
            name: user.name,
            role: user.role,
            accessToken,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.userId = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken ?? ''
      if (session.user) {
        session.user.id = token.userId ?? session.user.id
        session.user.role = token.role ?? 'Guest'
      }
      return session
    },
  },
}

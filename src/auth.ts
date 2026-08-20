import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { loginAPI } from '@/api/auth'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        account: { label: 'Account', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.account || !credentials.password) return null

        try {
          const response = await loginAPI({
            account: credentials.account,
            password: credentials.password,
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

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Số điện thoại',
      credentials: {
        phone: { label: 'Số điện thoại', type: 'text', placeholder: '0901234567' },
        otp: { label: 'Mã OTP', type: 'text', placeholder: '123456' },
      },
      async authorize(credentials) {
        if (credentials?.phone && credentials?.otp === '123456') {
          const isAdmin = credentials.phone === '0999999999';
          return {
            id: isAdmin ? 'admin-id' : 'user-id',
            name: isAdmin ? 'D\'Cor Administrator' : 'Khách hàng VIP',
            email: isAdmin ? 'admin@dcor.vn' : 'customer@gmail.com',
            role: isAdmin ? 'ADMIN' : 'CUSTOMER',
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'CUSTOMER';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || 'CUSTOMER';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

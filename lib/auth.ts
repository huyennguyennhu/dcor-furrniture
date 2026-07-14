import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Tài khoản',
      credentials: {
        phone: { label: 'Số điện thoại', type: 'text', placeholder: 'Nhập số điện thoại' },
        password: { label: 'Mật khẩu', type: 'password', placeholder: 'Mật khẩu' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('Vui lòng cung cấp số điện thoại và mật khẩu');
        }

        const phone = credentials.phone as string;
        const password = credentials.password as string;
        
        // Tìm user trong DB theo phone
        const user = await prisma.user.findUnique({
          where: { phone }
        });

        if (!user) {
          throw new Error('Tài khoản không tồn tại');
        }

        // Nếu user tồn tại và đã bị xóa mềm, chặn đăng nhập
        if (user.deletedAt !== null) {
          throw new Error('Tài khoản đã bị vô hiệu hóa');
        }

        if (!user.passwordHash) {
           throw new Error('Tài khoản chưa được thiết lập mật khẩu');
        }

        // So khớp mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error('Mật khẩu không chính xác');
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        
        let dbUser = await prisma.user.findFirst({
          where: { email: user.email }
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              fullName: user.name || 'Người dùng Google',
              phone: `google-${Date.now()}`, // Tạo SĐT ảo do Schema bắt buộc
              role: 'CUSTOMER'
            }
          });
        } else if (dbUser.deletedAt !== null) {
          return false; // Tài khoản bị khoá
        }

        user.id = dbUser.id;
        (user as any).role = dbUser.role;
        return true;
      }
      return true; // Credentials fallback
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

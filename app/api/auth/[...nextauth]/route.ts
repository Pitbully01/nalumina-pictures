import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ===== NEXTAUTH CONFIGURATION =====
const handler = NextAuth({
  session: { 
    strategy: "jwt" 
  },
  providers: [
    Credentials({
      credentials: { 
        email: {}, 
        password: {} 
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        
        const user = await prisma.user.findUnique({ 
          where: { email } 
        });
        
        if (!user?.passwordHash) return null;
        
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) return null;
        
        return { 
          id: user.id, 
          email: user.email, 
          name: user.name || "" 
        };
      },
    }),
  ],
});

export { handler as GET, handler as POST };

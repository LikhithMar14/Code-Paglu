import db from "@/db";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSession } from "next-auth/react";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }
        
        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email }
          });
          console.log("User:", user);
          
          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          };
        } catch (error) {
          console.error("Error in credentials authorize:", error);
          throw new Error(error.message || "Authentication failed");
        }
      }
    })
  ],
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("signIn callback triggered");
      if (profile?.email) {
        try {
          // Find the user or create if they don't exist
          let dbUser = await db.user.findUnique({
            where: { email: profile.email },
          });
          console.log("dbUser:", dbUser);
          
          if (!dbUser) {
            // Simplify name handling
            const name = user.name || '';
            
            dbUser = await db.user.create({
              data: {
                name,
                email: profile.email,
                image: user.image,
              },
            });
            console.log("User created:", dbUser);
          } else {
            await db.user.update({
              where: { email: profile.email },
              data: {
                name: user.name || dbUser.name,
                image: user.image || dbUser.image,
              },
            });
            console.log("User updated:", dbUser.id);
          }
          return true;
        } catch (error) {
          console.error("Error handling user:", error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user, account, profile }) {
      // Add database user info to the token
      if (account && profile) {
        try {
          const dbUser = await db.user.findUnique({
            where: { email: profile.email },
          });
          
          if (dbUser) {
            token.dbUserId = dbUser.id;
            // Add any other fields you want to include
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      
      // Add database user ID to the session
      if (token.dbUserId) {
        session.user.dbUserId = token.dbUserId;
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, prepend the base URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // If it's on the same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // For successful sign-in, redirect to a specific page
      if (url.includes("callbackUrl")) {
        // You could implement custom logic here based on the user
        // For example, redirect to dashboard after successful sign-in
        const session = await getSession();
        
        if (session?.user) {
          return `${baseUrl}/join`;
        }
      }
      
      // Default fallback to the base URL
      return baseUrl;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
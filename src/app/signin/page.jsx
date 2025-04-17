"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import EmailSignInForm from "@/components/EmailSignInForm";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");

      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black/95 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-3 text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent"
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-gray-400"
          >
            Sign in with your credentials
          </motion.p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-4 text-white hover:bg-white/20 transition-all duration-200 mb-4"
        >
          {isLoading ? (
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-violet-500"></div>
          ) : (
            <FcGoogle className="mr-3 h-5 w-5" />
          )}
          <span>{isLoading ? "Authenticating..." : "Sign in with Google"}</span>
        </motion.button>

        <div className="mt-10 text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="inline-flex items-center before:content-[''] before:mr-4 before:w-[30px] before:h-[1px] before:bg-white/20 after:content-[''] after:ml-4 after:w-[30px] after:h-[1px] after:bg-white/20 text-white/50 text-sm"
          >
            OR
          </motion.div>
        </div>

        <EmailSignInForm />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-10 text-center text-xs text-gray-500"
        >
          <Link
            href="/"
            className="inline-flex items-center text-violet-400 hover:text-violet-300 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Return to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
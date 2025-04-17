"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";

export default function EmailSignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      // You'll need to set up an email provider in your next-auth config
      await signIn("email", {
        email,
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
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="mt-6 space-y-4"
    >
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-400">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
          placeholder="your@email.com"
        />
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isLoading}
        type="submit" 
        className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 font-medium text-white hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200"
      >
        {isLoading ? (
          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
        ) : (
          <Mail className="mr-3 h-4 w-4" />
        )}
        <span>{isLoading ? "Sending link..." : "Sign in with Email"}</span>
      </motion.button>
    </motion.form>
  );
} 
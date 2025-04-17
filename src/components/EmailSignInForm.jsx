"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Mail, Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";

export default function EmailSignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      
      if (result?.error) {
        throw new Error(result.error || "Authentication failed");
      }
      
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.message || "Authentication failed. Please try again.");
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
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
          placeholder="your@email.com"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-400">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
            placeholder="••••••••"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300">
          Forgot password?
        </Link>
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
          <LogIn className="mr-3 h-4 w-4" />
        )}
        <span>{isLoading ? "Signing in..." : "Sign in"}</span>
      </motion.button>
      
      <div className="mt-4 text-center text-sm">
        <span className="text-gray-400">Don't have an account?</span>{" "}
        <Link href="/signup" className="font-medium text-violet-400 hover:text-violet-300">
          Sign up
        </Link>
      </div>
    </motion.form>
  );
} 
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      // You'll need to add API endpoint for registration
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      
      // After successful registration, sign in the user
      await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      
      window.location.href = "/dashboard";
      
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Authentication failed. Please try again.");
    } finally {
      setGoogleLoading(false);
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
            Create Account
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-gray-400"
          >
            Join our community today
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
          disabled={googleLoading}
          className="flex w-full items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-4 text-white hover:bg-white/20 transition-all duration-200 mb-4"
        >
          {googleLoading ? (
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-violet-500"></div>
          ) : (
            <FcGoogle className="mr-3 h-5 w-5" />
          )}
          <span>{googleLoading ? "Authenticating..." : "Sign up with Google"}</span>
        </motion.button>

        <div className="mt-8 mb-6 text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="inline-flex items-center before:content-[''] before:mr-4 before:w-[30px] before:h-[1px] before:bg-white/20 after:content-[''] after:ml-4 after:w-[30px] after:h-[1px] after:bg-white/20 text-white/50 text-sm"
          >
            OR
          </motion.div>
        </div>
        
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-400">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
              placeholder="John Doe"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
              Email Address
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
                autoComplete="new-password"
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
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            type="submit" 
            className="flex w-full items-center justify-center mt-6 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 font-medium text-white hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200"
          >
            {isLoading ? (
              <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            ) : (
              <UserPlus className="mr-3 h-4 w-4" />
            )}
            <span>{isLoading ? "Creating account..." : "Create Account"}</span>
          </motion.button>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-400">Already have an account?</span>{" "}
            <Link href="/signin" className="font-medium text-violet-400 hover:text-violet-300">
              Sign in
            </Link>
          </div>
        </motion.form>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-10 text-center text-xs text-gray-500"
        >
          <p className="mb-2">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-violet-400 hover:text-violet-300">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-violet-400 hover:text-violet-300">
              Privacy Policy
            </Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center mt-2 text-violet-400 hover:text-violet-300 transition-colors duration-200"
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
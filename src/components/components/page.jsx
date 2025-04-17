"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-800">Welcome</h1>
          <p className="text-gray-600">
            Sign in with your SRM University AP credentials
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
        >
          {isLoading ? (
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          ) : (
            <FcGoogle className="mr-3 h-5 w-5" />
          )}
          <span>{isLoading ? "Authenticating..." : "Sign in with Google"}</span>
        </button>
        <div className="mt-10 text-center text-sm text-gray-600">
          <p className="mb-1 font-medium">
            This portal is exclusively for SRM AP students
          </p>
          <p className="text-gray-500">
            Please use your @srmap.edu.in email address to access
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
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
        </div>
      </div>
    </div>
  );
}
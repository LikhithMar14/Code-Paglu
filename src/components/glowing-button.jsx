"use client"

import Link from "next/link"
import { FaArrowRight } from "react-icons/fa"

import { motion } from "framer-motion"


export default function GlowingButton({
  href,
  children,
  primary = false,
  icon = null,
  className = "",
}) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
      <Link
        href={href}
        className={`group relative px-8 py-4 rounded-full font-medium transition-all duration-300 flex items-center justify-center overflow-hidden ${
          primary
            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
            : "bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 hover:border-white/20"
        } ${className}`}
      >
        {/* Glow effect */}
        {primary && (
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-600/50 to-fuchsia-600/50 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></span>
        )}
        <span className="relative flex items-center z-10">
          {icon && <span className="mr-2">{icon}</span>}
          {children}
          {!icon && primary && (
            <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform duration-300" />
          )}
        </span>
      </Link>
    </motion.div>
  )
}
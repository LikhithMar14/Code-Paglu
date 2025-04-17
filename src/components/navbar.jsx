"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Menu, User, ExternalLink } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { FaGithub, FaDiscord } from 'react-icons/fa';

const Navbar = () => {
  const { data: session, status } = useSession();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-lg text-white border-b border-white/10 z-50"
    >
      <Link href="/">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent"
        >
          Code Paglu
        </motion.div>
      </Link>
      
      <div className="hidden md:flex items-center gap-8">
        <Link href="/features">
          <motion.div whileHover={{ y: -2 }} className="text-gray-300 hover:text-white transition-colors">
            Features
          </motion.div>
        </Link>
        <Link href="/pricing">
          <motion.div whileHover={{ y: -2 }} className="text-gray-300 hover:text-white transition-colors">
            Pricing
          </motion.div>
        </Link>

      </div>
      
      <div className="flex items-center gap-4">
        <Link href="https://github.com/yourusername/code-paglu" target="_blank" rel="noopener noreferrer">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-300 hover:text-white p-2"
          >
            <FaGithub className="h-5 w-5" />
          </motion.div>
        </Link>
        
        <Link href="https://discord.gg/yourserver" target="_blank" rel="noopener noreferrer">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-300 hover:text-white p-2"
          >
            <FaDiscord className="h-5 w-5" />
          </motion.div>
        </Link>
        
        {/* User Profile */}
        {status === "authenticated" ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
              >
                <Avatar className="h-8 w-8 border-2 border-violet-600/50">
                  <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                    {session?.user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-50 w-56 bg-black/80 backdrop-blur-lg text-white border border-white/10"
              sideOffset={5}
            >
              <DropdownMenuLabel className="text-violet-400">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="flex items-center gap-2 text-gray-300 hover:bg-white/10 focus:bg-white/10">
                <User className="h-4 w-4 text-violet-400" />
                <span>{session?.user?.name}</span>
              </DropdownMenuItem>
              <Link href="/dashboard">
                <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                  Dashboard
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                className="hover:bg-white/10 focus:bg-white/10 cursor-pointer text-red-400 hover:text-red-300"
                onClick={() => signOut()}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/signin" prefetch={false}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white hover:bg-white/20 hover:border-white/20 transition-all"
              >
                Log in
              </motion.button>
            </Link>
   
          </div>
        )}
        
        {/* Mobile menu button - only visible on small screens */}
        <div className="md:hidden">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white hover:bg-white/20"
          >
            <Menu className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;
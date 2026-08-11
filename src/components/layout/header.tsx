"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Search, Home, Compass, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const Header = () => {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-livehub-card border-b border-livehub-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="w-8 h-8 bg-livehub-accent rounded-lg flex items-center justify-center">
              ▶
            </div>
            <span className="hidden sm:inline">LiveHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/discover" className="text-gray-300 hover:text-white transition-colors">
              Discover
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search creators..."
                className="w-full pl-10 pr-4 py-2 bg-livehub-hover border border-livehub-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-livehub-accent"
              />
            </div>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                {session.user.role === "CREATOR" && (
                  <Link href="/creator-dashboard">
                    <Button size="sm" variant="secondary">
                      Go Live
                    </Button>
                  </Link>
                )}
                <div className="relative group">
                  <Avatar
                    initials={session.user.username?.slice(0, 2).toUpperCase() || "U"}
                    size="md"
                    className="cursor-pointer"
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-livehub-card border border-livehub-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-white hover:bg-livehub-hover first:rounded-t-lg"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-white hover:bg-livehub-hover"
                    >
                      Settings
                    </Link>
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-white hover:bg-livehub-hover"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-livehub-hover last:rounded-b-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm" variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="primary">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block px-4 py-2 text-gray-300 hover:text-white">
              Home
            </Link>
            <Link href="/discover" className="block px-4 py-2 text-gray-300 hover:text-white">
              Discover
            </Link>
            {session?.user && (
              <>
                <Link href="/dashboard" className="block px-4 py-2 text-gray-300 hover:text-white">
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-red-500 hover:text-red-400"
                >
                  Sign Out
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export { Header };

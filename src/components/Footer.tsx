import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Github, LinkIcon, Heart, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-cosmic-900 border-t border-cosmic-700/30">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="bg-cosmic-gradient p-2 rounded-lg animate-constellation-twinkle">
                <LinkIcon className="h-6 w-6 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-cosmic-gradient">
                Dislink
              </span>
            </div>
            <p className="text-cosmic-300 mb-4 max-w-md">
              Navigate your cosmic web of relationships. Build meaningful connections across the stellar network of human interaction.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com/dislink" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-nebula-400 transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com/company/dislink" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-nebula-400 transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-cosmic-200 tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/story" className="text-cosmic-400 hover:text-nebula-400 transition-colors duration-200">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/app/login" className="text-cosmic-400 hover:text-nebula-400 transition-colors duration-200">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/app/register" className="text-cosmic-400 hover:text-nebula-400 transition-colors duration-200">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-cosmic-200 tracking-wider uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-cosmic-400 hover:text-nebula-400 transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-cosmic-400 hover:text-nebula-400 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-cosmic-700/30">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-cosmic-400 text-sm">
              © {new Date().getFullYear()} Dislink. All rights reserved. ✨
            </p>
            <p className="text-cosmic-500 text-xs mt-2 md:mt-0">
              Mapping relationships across the cosmic web
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Github, Heart, Mail } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-50 to-purple-50 border-t border-gray-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-6 md:mb-0">
            <Logo size="md" linkTo="/" />
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-6 md:mb-0">
            <Link to="/about" className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200">
              About
            </Link>
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Terms
            </Link>
            <Link to="/contact" className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0 flex items-center">
            © 2025 Dislink. Built with <Heart className="h-3 w-3 mx-1 text-red-500" /> in Lisbon.
          </p>
          <div className="flex items-center space-x-6">
            <a href="mailto:hello@dislink.com" className="text-sm text-gray-500 hover:text-purple-600 flex items-center transition-colors duration-200">
              <Mail className="h-4 w-4 mr-2" />
              hello@dislink.com
            </a>
            <a href="mailto:support@dislink.com" className="text-sm text-gray-500 hover:text-purple-600 flex items-center transition-colors duration-200">
              <Mail className="h-4 w-4 mr-2" />
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
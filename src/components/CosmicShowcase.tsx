import React from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles, Globe, Users, Heart, Zap } from 'lucide-react';

export function CosmicShowcase() {
  return (
    <div className="min-h-screen bg-constellation-field p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header with Cosmic Gradient Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-6xl font-bold text-cosmic-gradient animate-cosmic-float">
            Cosmic Design System
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience the beauty of human connections across the cosmic web of relationships
          </p>
        </motion.div>

        {/* Color Palette Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Cosmic Colors */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-cosmic-300/30"
          >
            <h3 className="text-lg font-semibold text-cosmic-300 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 animate-constellation-twinkle" />
              Cosmic Primary
            </h3>
            <div className="space-y-2">
              <div className="h-12 bg-cosmic-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">900 - Primary</span>
              </div>
              <div className="h-8 bg-cosmic-700 rounded-lg"></div>
              <div className="h-8 bg-cosmic-500 rounded-lg"></div>
              <div className="h-8 bg-cosmic-300 rounded-lg"></div>
              <div className="h-8 bg-cosmic-100 rounded-lg"></div>
            </div>
          </motion.div>

          {/* Nebula Colors */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-nebula-300/30"
          >
            <h3 className="text-lg font-semibold text-nebula-300 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-starlight-pulse" />
              Nebula Secondary
            </h3>
            <div className="space-y-2">
              <div className="h-12 bg-nebula-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">700 - Secondary 1</span>
              </div>
              <div className="h-8 bg-nebula-600 rounded-lg"></div>
              <div className="h-8 bg-nebula-400 rounded-lg"></div>
              <div className="h-8 bg-nebula-200 rounded-lg"></div>
              <div className="h-8 bg-nebula-100 rounded-lg"></div>
            </div>
          </motion.div>

          {/* Stardust Colors */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-stardust-300/30"
          >
            <h3 className="text-lg font-semibold text-stardust-300 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 animate-nebula-drift" />
              Stardust Warm
            </h3>
            <div className="space-y-2">
              <div className="h-12 bg-stardust-700 rounded-lg flex items-center justify-center">
                <span className="text-cosmic-900 text-sm font-medium">700 - Secondary 2</span>
              </div>
              <div className="h-8 bg-stardust-600 rounded-lg"></div>
              <div className="h-8 bg-stardust-400 rounded-lg"></div>
              <div className="h-8 bg-stardust-200 rounded-lg"></div>
              <div className="h-8 bg-stardust-100 rounded-lg"></div>
            </div>
          </motion.div>

          {/* Constellation Colors */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-constellation-300/30"
          >
            <h3 className="text-lg font-semibold text-constellation-300 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 animate-aurora-dance" />
              Constellation Accent
            </h3>
            <div className="space-y-2">
              <div className="h-12 bg-constellation-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">700 - Accent Pop</span>
              </div>
              <div className="h-8 bg-constellation-600 rounded-lg"></div>
              <div className="h-8 bg-constellation-400 rounded-lg"></div>
              <div className="h-8 bg-constellation-200 rounded-lg"></div>
              <div className="h-8 bg-constellation-100 rounded-lg"></div>
            </div>
          </motion.div>
        </div>

        {/* Gradient Backgrounds Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-cosmic-gradient rounded-2xl p-8 text-center"
          >
            <Zap className="h-12 w-12 text-white mx-auto mb-4 animate-constellation-twinkle" />
            <h3 className="text-2xl font-bold text-white mb-2">Cosmic Gradient</h3>
            <p className="text-white/80">Perfect for hero sections and primary buttons</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-nebula-gradient rounded-2xl p-8 text-center"
          >
            <Users className="h-12 w-12 text-white mx-auto mb-4 animate-starlight-pulse" />
            <h3 className="text-2xl font-bold text-white mb-2">Nebula Gradient</h3>
            <p className="text-white/80">Ideal for secondary actions and highlights</p>
          </motion.div>
        </div>

        {/* Button Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-cosmic-900 hover:bg-cosmic-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
            Primary Action
          </button>
          
          <button className="bg-nebula-700 hover:bg-nebula-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
            Secondary Action
          </button>
          
          <button className="bg-stardust-700 hover:bg-stardust-600 text-cosmic-900 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
            Warm Action
          </button>
          
          <button className="bg-constellation-700 hover:bg-constellation-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
            Accent Action
          </button>
        </div>

        {/* Text Gradient Examples */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-cosmic-gradient">
            Cosmic Gradient Text
          </h2>
          <h2 className="text-4xl font-bold text-nebula-gradient">
            Nebula Gradient Text
          </h2>
          <h2 className="text-4xl font-bold text-stardust-gradient">
            Stardust Gradient Text
          </h2>
        </div>

        {/* Animation Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-cosmic-700 rounded-full mx-auto mb-4 animate-constellation-twinkle"></div>
            <h3 className="text-cosmic-300 font-semibold">Constellation Twinkle</h3>
            <p className="text-gray-400 text-sm">Perfect for interactive elements</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-nebula-700 rounded-full mx-auto mb-4 animate-cosmic-float"></div>
            <h3 className="text-nebula-300 font-semibold">Cosmic Float</h3>
            <p className="text-gray-400 text-sm">Great for floating UI elements</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-stardust-700 rounded-full mx-auto mb-4 animate-starlight-pulse"></div>
            <h3 className="text-stardust-300 font-semibold">Starlight Pulse</h3>
            <p className="text-gray-400 text-sm">Ideal for notifications and alerts</p>
          </div>
        </div>

        {/* Usage Guidelines */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-nebula-gradient mb-6">🎯 Usage Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-cosmic-300 font-semibold mb-3">🌌 Primary Usage:</h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• <code className="text-cosmic-400">cosmic-900</code> for main branding, logos, primary buttons</li>
                <li>• <code className="text-nebula-400">nebula-700</code> for secondary actions, highlights</li>
                <li>• <code className="text-stardust-400">stardust-700</code> for warm accents, success states</li>
                <li>• <code className="text-constellation-400">constellation-700</code> for energy, alerts, CTAs</li>
              </ul>
            </div>
            <div>
              <h4 className="text-cosmic-300 font-semibold mb-3">🎨 Design Philosophy:</h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• Use space metaphors: "constellation of relationships"</li>
                <li>• Emphasize connection and wonder</li>
                <li>• Clean, minimal approach with subtle cosmic elements</li>
                <li>• Hero sections: <code className="text-cosmic-400">bg-constellation-field</code></li>
              </ul>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
} 
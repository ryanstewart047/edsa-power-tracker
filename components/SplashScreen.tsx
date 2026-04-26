'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we've already shown the splash screen in this session to avoid annoyance
    // But per user request "at any given time the app is loading... it should always show"
    // I will show it on every full page load.
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617] text-white overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full" />
          
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                ease: "backOut",
                delay: 0.2
              }}
              className="relative"
            >
              <div className="h-24 w-24 rounded-[2rem] bg-yellow-400 flex items-center justify-center shadow-2xl shadow-yellow-400/20 ring-4 ring-yellow-400/10">
                <Zap className="h-12 w-12 text-black fill-black" />
              </div>
              
              {/* Spinning Ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-8px] border-2 border-dashed border-yellow-400/30 rounded-[2.5rem]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <h2 className="text-xl font-black tracking-tight uppercase">EDSA Native</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-500/80 mt-1">Platform Operations</p>
            </motion.div>
          </div>

          {/* Developer Credit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-12 text-center"
          >
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-2">Developed by</p>
            <p className="text-sm font-black text-white">Ryan J Stewart, BCA</p>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Amity University India</p>
          </motion.div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="h-full bg-yellow-500"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

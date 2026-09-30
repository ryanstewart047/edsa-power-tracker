'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                ease: "backOut",
                delay: 0.2
              }}
              className="relative w-64 sm:w-72"
            >
              <Image
                src="/assets/edsa-splash-logo.png"
                alt="EDSA - Electricity Distribution and Supply Authority"
                width={512}
                height={512}
                priority
                className="h-auto w-full shadow-2xl shadow-[#2607d5]/35"
              />
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

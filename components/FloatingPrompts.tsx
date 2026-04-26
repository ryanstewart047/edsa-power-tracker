'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, X, ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const prompts = [
  {
    id: 1,
    question: "Is your area safe today?",
    icon: ShieldAlert,
    color: "text-red-400",
    bg: "bg-red-500/10",
    action: "Report Hazard"
  },
  {
    id: 2,
    question: "Got power right now?",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    action: "Update Status"
  },
  {
    id: 3,
    question: "Notice any illegal connections?",
    icon: MessageSquare,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    action: "Alert Admin"
  }
];

export default function FloatingPrompts() {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show the first prompt after 8 seconds
    const initialTimer = setTimeout(() => setShow(true), 8000);
    
    // Rotate prompts every 15 seconds
    const rotateTimer = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setCurrentPrompt((prev) => (prev + 1) % prompts.length);
        setShow(true);
      }, 1000);
    }, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(rotateTimer);
    };
  }, []);

  const active = prompts[currentPrompt];
  const Icon = active.icon;

  return (
    <div className="fixed bottom-24 right-4 z-40 pointer-events-none md:bottom-8 md:right-8">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="pointer-events-auto"
          >
            <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl max-w-[280px] relative overflow-hidden group">
              {/* Animated Progress Bar */}
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 15, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-yellow-500/30"
              />

              <button 
                onClick={() => setShow(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${active.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${active.color}`} />
                </div>
                
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold leading-tight pr-4">
                    {active.question}
                  </p>
                  
                  <Link 
                    href="/tracker"
                    className="mt-3 flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors group/btn"
                  >
                    {active.action}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

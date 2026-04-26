'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    url: '/assets/slide1.png',
    title: 'Grid Maintenance',
    description: 'Technicians working on overhead lines to ensure stable power distribution.',
  },
  {
    url: '/assets/slide2.png',
    title: 'Modern Infrastructure',
    description: 'Upgrading substations with state-of-the-art monitoring systems.',
  },
  {
    url: '/assets/slide3.png',
    title: 'Community Response',
    description: 'Rapid maintenance teams responding to field reports across Freetown.',
  },
];

export default function WorkSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden group border border-white/10 shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${slides[currentIndex].url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{slides[currentIndex].title}</h3>
              <p className="text-gray-300 text-sm md:text-base max-w-xl">{slides[currentIndex].description}</p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={prev} className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={next} className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 transition-all duration-300 rounded-full ${
              i === currentIndex ? 'w-8 bg-yellow-400' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

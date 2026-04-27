'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle, ChevronRight, Search, Zap } from 'lucide-react';
import { FREETOWN_AREAS } from '@/lib/areas';

interface LocationOnboardingProps {
  onComplete: (areaName: string) => void;
}

export default function LocationOnboarding({ onComplete }: LocationOnboardingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  useEffect(() => {
    const hasSetLocation = localStorage.getItem('edsa_primary_area');
    if (!hasSetLocation) {
      const timer = setTimeout(() => setIsOpen(true), 3500); // Show after splash and initial load
      return () => clearTimeout(timer);
    }
  }, []);

  const filteredAreas = FREETOWN_AREAS.filter(area => 
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFinish = () => {
    if (selectedArea) {
      localStorage.setItem('edsa_primary_area', selectedArea);
      setIsOpen(false);
      onComplete(selectedArea);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md bg-[#020617] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                  <MapPin className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Location Setup</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Improving Accuracy</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Which community do you primarily live in or report for? This helps us provide 100% accurate power signals for your area.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search your neighborhood..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm focus:outline-none focus:border-yellow-500/50 transition-all text-white"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {filteredAreas.map((area) => (
                  <button
                    key={area.name}
                    onClick={() => setSelectedArea(area.name)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      selectedArea === area.name 
                        ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-bold text-sm">{area.name}</span>
                    {selectedArea === area.name && <CheckCircle className="h-4 w-4" />}
                  </button>
                ))}
              </div>

              <button
                onClick={handleFinish}
                disabled={!selectedArea}
                className="w-full py-4 rounded-2xl bg-yellow-400 text-gray-950 font-black text-sm uppercase tracking-widest transition-all hover:bg-yellow-300 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                Set Primary Community
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest pt-2">
                <Zap className="h-3 w-3" />
                Location-Verified Reporting
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

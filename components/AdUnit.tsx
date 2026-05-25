'use client';

import React, { useEffect } from 'react';

const AdUnit: React.FC = () => {
  useEffect(() => {
    // Manually trigger the script re-execution for this component
    const script = document.createElement('script');
    script.src = "https://itservicesfreetown.com/js/its-ads.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="my-10 flex justify-center w-full px-4">
      <div className="w-full max-w-5xl flex justify-center">
        <div className="its-ad-unit min-h-[100px] w-full flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:bg-white/[0.04]">
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-yellow-500 animate-spin mb-2" />
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] animate-pulse">Loading Advertisement...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdUnit;

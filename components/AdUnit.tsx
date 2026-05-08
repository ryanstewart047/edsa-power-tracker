import React from 'react';

const AdUnit: React.FC = () => {
  return (
    <div className="my-10 flex justify-center w-full px-4">
      <div className="w-full max-w-5xl">
        <div className="its-ad-unit min-h-[100px] flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
          {/* The script will inject the ad content here */}
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">Advertisement</p>
        </div>
      </div>
    </div>
  );
};

export default AdUnit;

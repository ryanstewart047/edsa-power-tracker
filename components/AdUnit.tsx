'use client';

import React from 'react';

const AdUnit: React.FC = () => {
  return (
    <div className="my-10 flex justify-center w-full px-4">
      <div className="w-full max-w-5xl flex justify-center">
        <div className="its-ad-unit"></div>
        <script src="https://itservicesfreetown.com/js/its-ads.js" async />
      </div>
    </div>
  );
};

export default AdUnit;

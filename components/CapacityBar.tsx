'use client';

import React from 'react';

interface CapacityBarProps {
  filled: number;
  capacity: number;
}

const CapacityBar: React.FC<CapacityBarProps> = ({ filled, capacity }) => {
  const percentage = capacity > 0 ? (filled / capacity) * 100 : 0;

  return (
    <div className="w-full">
      <div className="relative h-6 w-full bg-gray-300 dark:bg-gray-600 rounded overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white mix-blend-difference">
            {filled} / {capacity}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CapacityBar;

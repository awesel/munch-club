'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  role?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', role }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const sizeStyles = {
    sm: { width: '16px', height: '16px' },
    md: { width: '24px', height: '24px' },
    lg: { width: '32px', height: '32px' }
  };

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div
        className={`animate-spin rounded-full border-b-2 border-indigo-600 dark:border-indigo-400 ${sizeClasses[size]}`}
        style={sizeStyles[size]}
        role={role}
      >
      </div>
    </div>
  );
};

export default Spinner;

'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'full' | 'auto';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'full',
  disabled = false,
  children,
  className,
  ...props
}) => {
  const baseStyle = 
    'h-12 px-4 py-2 rounded-md font-bold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 flex items-center justify-center';

  const sizeStyle = size === 'full' ? 'w-full' : 'w-auto';

  const variantStyle = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary:
      'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
  };

  const disabledStyle = disabled
    ? 'opacity-50 cursor-not-allowed'
    : '';

  return (
    <button
      {...props}
      disabled={disabled}
      aria-disabled={disabled}
      className={`${baseStyle} ${sizeStyle} ${variantStyle[variant]} ${disabledStyle} ${className || ''}`}
    >
      {children}
    </button>
  );
};

export default Button;

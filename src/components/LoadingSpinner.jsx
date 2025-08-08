import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin shadow-md`}></div>
      {text && (
        <p className="mt-3 text-gray-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-full shadow-sm">
          {text}
        </p>
      )}
    </div>
  );
}
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Main Spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Đang tải lịch học
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Vui lòng chờ trong giây lát...
        </p>
      </div>

      {/* Animated Dots */}
      <div className="flex items-center gap-1 mt-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};
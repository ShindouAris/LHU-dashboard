import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  color = 'blue'
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'from-blue-500 to-blue-600',
          text: 'text-blue-600 dark:text-blue-400',
          bgLight: 'from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50'
        };
      case 'green':
        return {
          bg: 'from-green-500 to-green-600',
          text: 'text-green-600 dark:text-green-400',
          bgLight: 'from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50'
        };
      case 'purple':
        return {
          bg: 'from-purple-500 to-purple-600',
          text: 'text-purple-600 dark:text-purple-400',
          bgLight: 'from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50'
        };
      case 'orange':
        return {
          bg: 'from-orange-500 to-orange-600',
          text: 'text-orange-600 dark:text-orange-400',
          bgLight: 'from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50'
        };
      case 'red':
        return {
          bg: 'from-red-500 to-red-600',
          text: 'text-red-600 dark:text-red-400',
          bgLight: 'from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50'
        };
      default:
        return {
          bg: 'from-blue-500 to-blue-600',
          text: 'text-blue-600 dark:text-blue-400',
          bgLight: 'from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50'
        };
    }
  };

  const colors = getColorClasses(color);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardContent className="relative p-4 sm:p-6">
        {/* Header section */}
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.bgLight} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-3`}>
        <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${colors.text}`} />
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-400">
        {title}
          </h1>
        </div>

        {/* Content section */}
        <div className="text-center space-y-2">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        {value}
          </p>
          {description && (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
          )}
        </div>

        {/* Bottom hover effect */}
        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colors.bg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left w-full`}></div>
      </CardContent>
    </Card>
  );
};

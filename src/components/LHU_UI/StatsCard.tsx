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

// Solid neobrutalism accents (bright fill + black text on top).
const ACCENTS: Record<string, string> = {
  blue: 'bg-[hsl(199_93%_60%)]',
  green: 'bg-[hsl(142_71%_45%)]',
  purple: 'bg-[hsl(258_90%_66%)]',
  orange: 'bg-[hsl(27_96%_61%)]',
  red: 'bg-[hsl(0_84%_60%)]',
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  color = 'blue',
}) => {
  const accent = ACCENTS[color] ?? ACCENTS.blue;

  return (
    <Card className="brutal-hover group overflow-hidden">
      <CardContent className="relative p-4 sm:p-6">
        <div className="flex flex-col items-center mb-4 sm:mb-5">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 ${accent} text-black border-2 border-border rounded-md shadow-brutal-sm flex items-center justify-center mb-3`}
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.5} />
          </div>
          <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-muted-foreground">
            {title}
          </h1>
        </div>

        <div className="text-center space-y-1">
          <p className="font-black text-3xl sm:text-4xl text-foreground tabular-nums">
            {value}
          </p>
          {description && (
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* Bottom accent bar */}
        <div
          className={`absolute bottom-0 left-0 h-1.5 w-full ${accent} border-t-2 border-border`}
        />
      </CardContent>
    </Card>
  );
};

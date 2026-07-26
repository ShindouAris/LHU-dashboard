import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, ArrowRight } from 'lucide-react';

interface EmptyScheduleProps {
  onViewFullSchedule: (page: string) => void;
}

export const EmptySchedule: React.FC<EmptyScheduleProps> = ({ onViewFullSchedule }) => {
  return (
    <Card className="text-center py-14 overflow-hidden">
      <CardContent className="relative">
        {/* Icon */}
        <div className="relative mb-6 w-fit mx-auto">
          <div className="w-24 h-24 bg-secondary text-black border-2 border-border rounded-md shadow-brutal flex items-center justify-center">
            <Calendar className="h-12 w-12" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-9 h-9 bg-primary text-black border-2 border-border rounded-md flex items-center justify-center">
            <Clock className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </div>

        <h3 className="font-display text-2xl font-black text-foreground mb-3">
          Không có lịch học trong 7 ngày tới
        </h3>
        <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed font-medium">
          Hiện tại không có lịch học nào trong tuần này. Bạn có thể xem lịch học đầy đủ để kiểm tra các lớp học khác.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => onViewFullSchedule('schedule')} size="lg" className="group">
            <BookOpen className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Lịch học đầy đủ
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            onClick={() => onViewFullSchedule('timetable')}
            size="lg"
            variant="secondary"
            className="group"
          >
            <Calendar className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Thời khóa biểu
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary border-2 border-border"></div>
            <span>Lịch học hiện tại</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[hsl(258_90%_66%)] border-2 border-border"></div>
            <span>Lịch học tương lai</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

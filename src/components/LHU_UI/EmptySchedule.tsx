import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, ArrowRight } from 'lucide-react';

interface EmptyScheduleProps {
  onViewFullSchedule: (page: string) => void;
}

export const EmptySchedule: React.FC<EmptyScheduleProps> = ({ onViewFullSchedule }) => {
  return (
    <Card className="text-center py-16 border-0 shadow-2xl bg-gradient-to-br from-white/90 to-blue-50/90 dark:from-gray-800/90 dark:to-blue-950/90 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
      <CardContent className="relative">
        {/* Icon Container */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Clock className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Không có lịch học trong 7 ngày tới
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
          Hiện tại không có lịch học nào trong tuần này. Bạn có thể xem lịch học đầy đủ để kiểm tra các lớp học khác.
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => onViewFullSchedule("schedule")}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <BookOpen className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Lịch học đầy đủ
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button
            onClick={() => onViewFullSchedule("timetable")}
            size="lg"
            variant="outline"
            className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <Calendar className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Thời khóa biểu
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Lịch học hiện tại</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>Lịch học tương lai</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
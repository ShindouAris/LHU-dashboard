import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock, MapPin, IdCard } from 'lucide-react';
import type { ExamInfo } from '@/types/schedule';

interface ExamCardProps {
  exam: ExamInfo;
}

function buildDateTime(exam: ExamInfo): { dateText: string; timeText: string } {
  const dateText = exam.NgayThi || '';
  const timeText = exam.GioThi || '';
  return { dateText, timeText };
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const { dateText, timeText } = buildDateTime(exam);
  return (
    <Card className="transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-l from-pink-200 to-sky-200 dark:bg-gray-800/90">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-center mb-4 gap-3">
          <div className="min-w-0 text-center">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {exam.TenKT}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <div className="w-full text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Ngày thi</div>
              <div className="font-semibold text-gray-900 dark:text-white">{dateText}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30">
            <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="w-full text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Giờ thi</div>
              <div className="font-semibold text-gray-900 dark:text-white">{timeText}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="w-full min-w-0 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Địa điểm</div>
              <div className="font-semibold text-gray-900 dark:text-white">{exam.PhongThi || exam.CSS || 'Chưa rõ'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
            <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center">
              <IdCard className="w-4 h-4 text-white" />
            </div>
            <div className="w-full min-w-0 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Số báo danh</div>
              <div className="font-semibold text-gray-900 dark:text-white">{exam.SoBaoDanh || '—'}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



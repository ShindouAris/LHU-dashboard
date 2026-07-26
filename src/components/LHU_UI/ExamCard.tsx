import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock, MapPin, IdCard, type LucideIcon } from 'lucide-react';
import type { ExamInfo } from '@/types/schedule';

interface ExamCardProps {
  exam: ExamInfo;
}

function buildDateTime(exam: ExamInfo): { dateText: string; timeText: string } {
  const dateText = exam.NgayThi || '';
  const timeText = exam.GioThi || '';
  return { dateText, timeText };
}

const InfoTile: React.FC<{
  icon: LucideIcon;
  accent: string;
  label: string;
  value: React.ReactNode;
}> = ({ icon: Icon, accent, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-md border-2 border-border bg-card">
    <div
      className={`w-9 h-9 shrink-0 rounded-md border-2 border-border ${accent} text-black flex items-center justify-center`}
    >
      <Icon className="w-4 h-4" strokeWidth={2.5} />
    </div>
    <div className="w-full min-w-0">
      <div className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">
        {label}
      </div>
      <div className="font-bold text-foreground truncate">{value}</div>
    </div>
  </div>
);

export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const { dateText, timeText } = buildDateTime(exam);
  return (
    <Card className="overflow-hidden">
      <div className="bg-section text-section-foreground border-b-2 border-border px-5 py-3">
        <h3 className="font-display text-lg sm:text-xl font-black text-center">
          {exam.TenKT}
        </h3>
      </div>
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoTile
            icon={CalendarDays}
            accent="bg-[hsl(199_93%_60%)]"
            label="Ngày thi"
            value={dateText}
          />
          <InfoTile
            icon={Clock}
            accent="bg-[hsl(50_100%_50%)]"
            label="Giờ thi"
            value={timeText}
          />
          <InfoTile
            icon={MapPin}
            accent="bg-[hsl(142_71%_45%)]"
            label="Địa điểm"
            value={exam.PhongThi || exam.CSS || 'Chưa rõ'}
          />
          <InfoTile
            icon={IdCard}
            accent="bg-[hsl(27_96%_61%)]"
            label="Số báo danh"
            value={exam.SoBaoDanh || '—'}
          />
        </div>
      </CardContent>
    </Card>
  );
};

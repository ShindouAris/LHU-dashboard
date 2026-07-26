import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Clock, Calendar, BookOpen } from 'lucide-react';
import { DuplicateScheduleGroup, getDuplicateGroupStatus } from '@/utils/scheduleUtils';
import { formatTime, formatDate } from '@/utils/dateUtils';

interface DuplicateScheduleWarningProps {
  duplicates: DuplicateScheduleGroup[];
  onViewDetails?: (group: DuplicateScheduleGroup) => void;
}

export const DuplicateScheduleWarning: React.FC<DuplicateScheduleWarningProps> = ({ 
  duplicates 
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-6 border-2 border-border bg-[hsl(27_96%_61%)] text-black shadow-brutal">
      {/* <AlertTriangle className="h-4 w-4 text-black" /> */}
      <AlertTitle className="text-black font-display font-bold">
        Cảnh báo: Phát hiện {duplicates.length} nhóm lịch trùng thời gian
      </AlertTitle>
      <AlertDescription className="text-black mt-2">
        <p className="mb-3">
          Có {duplicates.length} nhóm lịch học có cùng thời gian bắt đầu và kết thúc. 
          Vui lòng kiểm tra lại thông tin để tránh nhầm lẫn.
        </p>
        
        <div className="space-y-3">
          {duplicates.map((group) => {
            const isExpanded = expandedGroups.has(group.key);
            const status = getDuplicateGroupStatus(group.schedules);
            
            return (
              <Collapsible key={group.key} open={isExpanded} onOpenChange={() => toggleGroup(group.key)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between bg-card"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <div className="flex items-center gap-1">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                        ) : (
                          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                        )}
                        <BookOpen className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-bold">{group.subject}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatTime(group.startTime)} - {formatTime(group.endTime)}
                          <Calendar className="h-3 w-3 ml-1" />
                          {formatDate(group.startTime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="secondary"
                        className={`text-xs border-2 border-border text-black ${
                          status.hasCancelled
                            ? 'bg-[hsl(0_84%_60%)]'
                            : status.hasRescheduled
                            ? 'bg-[hsl(50_100%_50%)]'
                            : 'bg-[hsl(142_71%_45%)]'
                        }`}
                      >
                        {group.schedules.length} lịch
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div className="bg-card rounded-md border-2 border-border shadow-brutal-sm p-3 space-y-2">
                    {group.schedules.map((schedule, _) => (
                      <div
                        key={schedule.ID}
                        className="flex items-center justify-between p-2 bg-muted rounded-md border-2 border-border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {schedule.TenNhom}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs border-2 border-border text-black ${
                                schedule.TinhTrang === 0
                                  ? 'bg-[hsl(142_71%_45%)]'
                                  : schedule.TinhTrang === 1
                                  ? 'bg-[hsl(50_100%_50%)]'
                                  : 'bg-[hsl(0_84%_60%)]'
                              }`}
                            >
                              {schedule.TinhTrang === 0 ? 'Bình thường' : 'Báo nghỉ'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 text-center">
                            Phòng: {schedule.TenPhong} • GV: {schedule.GiaoVien}
                          </div>
                        </div>
                        {schedule.TinhTrang === 0 && (
                          <Badge className="bg-[hsl(142_71%_45%)] text-black border-2 border-border text-xs">
                            Chính
                          </Badge>
                        )}
                      </div>
                    ))}

                    <div className="pt-2 border-t-2 border-border">
                      <div className="text-xs text-muted-foreground">
                        <strong>Khuyến nghị:</strong> Ưu tiên theo lịch "Bình thường" nếu có. 
                        Nếu không có lịch bình thường, theo dõi lịch "Dời lịch".
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </AlertDescription>
    </Alert>
  );
};

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
    <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
      {/* <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" /> */}
      <AlertTitle className="text-orange-800 dark:text-orange-200">
        Cảnh báo: Phát hiện {duplicates.length} nhóm lịch trùng thời gian
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300 mt-2">
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
                    className="w-full justify-between bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 border-orange-200 dark:border-orange-700"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <div className="flex items-center gap-1">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <BookOpen className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium">{group.subject}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
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
                        className={`text-xs ${
                          status.hasCancelled 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : status.hasRescheduled 
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {group.schedules.length} lịch
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-700 p-3 space-y-2">
                    {group.schedules.map((schedule, _) => (
                      <div 
                        key={schedule.ID} 
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {schedule.TenNhom}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                schedule.TinhTrang === 0 
                                  ? 'border-green-300 text-green-700 dark:border-green-600 dark:text-green-300'
                                  : schedule.TinhTrang === 1
                                  ? 'border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300'
                                  : 'border-red-300 text-red-700 dark:border-red-600 dark:text-red-300'
                              }`}
                            >
                              {schedule.TinhTrang === 0 ? 'Bình thường' : 'Báo nghỉ'}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                            Phòng: {schedule.TenPhong} • GV: {schedule.GiaoVien}
                          </div>
                        </div>
                        {schedule.TinhTrang === 0 && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                            Chính
                          </Badge>
                        )}
                      </div>
                    ))}
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
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

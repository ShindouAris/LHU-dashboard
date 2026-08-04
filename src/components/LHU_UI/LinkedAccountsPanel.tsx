import {
  CheckCircledIcon,
  CrossCircledIcon,
  PersonIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import type { UserSession } from '@/services/multisession';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export interface AttendanceResult {
  user: UserSession['user'];
  status: 'success' | 'error';
  message: string;
}

interface LinkedAccountsPanelProps {
  sessions: UserSession[];
  selectedUserIds: Set<string>;
  currentUserId?: string;
  disabled?: boolean;
  onToggle: (userId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onRemove: (userId: string) => void;
}

const initials = (name: string, userId: string) =>
  (name || userId)
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export function LinkedAccountsPanel({
  sessions,
  selectedUserIds,
  currentUserId,
  disabled = false,
  onToggle,
  onSelectAll,
  onRemove,
}: LinkedAccountsPanelProps) {
  const allSelected = sessions.length > 0 && selectedUserIds.size === sessions.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle>Người sẽ điểm danh</CardTitle>
            <CardDescription>
              Chọn các tài khoản sẽ dùng chung mã QR vừa quét.
            </CardDescription>
          </div>
          <Badge variant="outline">{selectedUserIds.size}/{sessions.length}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {sessions.length === 0 ? (
          <Empty className="border-2 border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PersonIcon />
              </EmptyMedia>
              <EmptyTitle>Chưa có tài khoản</EmptyTitle>
              <EmptyDescription>
                Đăng nhập hoặc quét mã liên kết để thêm tài khoản.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
            {sessions.map(({ user }) => {
              const checked = selectedUserIds.has(user.UserID);
              const isCurrent = user.UserID === currentUserId;
              const checkboxId = `attendance-account-${user.UserID}`;

              return (
                <div
                  key={user.UserID}
                  className="flex min-w-0 items-center gap-3 rounded-md border-2 border-border p-3"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) => onToggle(user.UserID, value === true)}
                    aria-label={`Chọn ${user.FullName || user.UserID}`}
                  />
                  <label htmlFor={checkboxId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <Avatar className="size-10 border-2 border-border">
                      <AvatarImage src={user.Avatar} alt={user.FullName || user.UserID} />
                      <AvatarFallback>{initials(user.FullName, user.UserID)}</AvatarFallback>
                    </Avatar>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold">
                        {user.FullName || user.UserName || user.UserID}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.UserID}{user.Class ? ` · ${user.Class}` : ''}
                      </span>
                    </span>
                  </label>
                  {isCurrent ? (
                    <Badge variant="secondary">Hiện tại</Badge>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => onRemove(user.UserID)}
                      aria-label={`Xóa ${user.FullName || user.UserID}`}
                    >
                      <TrashIcon />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {sessions.length > 0 && (
        <CardFooter>
          <Button className="w-full" variant="outline" onClick={onSelectAll} disabled={disabled}>
            {allSelected ? <CrossCircledIcon data-icon="inline-start" /> : <CheckCircledIcon data-icon="inline-start" />}
            {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

interface AttendanceResultsPanelProps {
  results: AttendanceResult[];
}

export function AttendanceResultsPanel({ results }: AttendanceResultsPanelProps) {
  if (results.length === 0) return null;

  const successCount = results.filter((result) => result.status === 'success').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle>Kết quả điểm danh</CardTitle>
            <CardDescription>Mỗi tài khoản được xử lý độc lập.</CardDescription>
          </div>
          <Badge variant={successCount === results.length ? 'success' : 'secondary'}>
            {successCount}/{results.length} thành công
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {results.map((result) => (
          <div key={result.user.UserID} className="flex min-w-0 items-center gap-3 rounded-md border-2 border-border p-3">
            <Avatar className="size-9 border-2 border-border">
              <AvatarImage src={result.user.Avatar} alt={result.user.FullName || result.user.UserID} />
              <AvatarFallback>{initials(result.user.FullName, result.user.UserID)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold">{result.user.FullName || result.user.UserID}</span>
              <span className="text-xs text-muted-foreground">{result.message}</span>
            </div>
            <Badge variant={result.status === 'success' ? 'success' : 'destructive'}>
              {result.status === 'success' ? 'Thành công' : 'Thất bại'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

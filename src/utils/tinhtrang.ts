export type TinhTrangType = 'normal' | 'menu' | 'cancelled' | 'holiday' | 'special';

export interface TinhTrangInfo {
  type: TinhTrangType;
  flagText: string | null;
  badgeClassName: string | null;
}

const MENU_STATUSES = new Set<number>([4, 5, 10]);
const CANCELLED_STATUSES = new Set<number>([1, 2]);
const HOLIDAY_STATUS = 6;

const DEFAULT_CANCELLED_BADGE =
  'bg-destructive text-destructive-foreground border-2 border-border';
const DEFAULT_HOLIDAY_BADGE =
  'bg-[hsl(142_71%_45%)] text-black border-2 border-border';
const DEFAULT_SPECIAL_BADGE =
  'bg-[hsl(27_96%_61%)] text-black border-2 border-border';

export const getTinhTrangInfo = (status: number): TinhTrangInfo => {
  if (status === HOLIDAY_STATUS) {
    return {
      type: 'holiday',
      flagText: 'Nghỉ lễ',
      badgeClassName: DEFAULT_HOLIDAY_BADGE,
    };
  }

  if (CANCELLED_STATUSES.has(status)) {
    return {
      type: 'cancelled',
      flagText: 'Báo nghỉ',
      badgeClassName: DEFAULT_CANCELLED_BADGE,
    };
  }

  if (status === 0) {
    return {
      type: 'normal',
      flagText: null,
      badgeClassName: null,
    };
  }

  if (MENU_STATUSES.has(status)) {
    return {
      type: 'menu',
      flagText: null,
      badgeClassName: null,
    };
  }

  return {
    type: 'special',
    flagText: 'Báo nghỉ',
    badgeClassName: DEFAULT_SPECIAL_BADGE,
  };
};

export const isTinhTrangCancelled = (status: number): boolean => {
  const info = getTinhTrangInfo(status);
  return info.type === 'cancelled' || info.type === 'holiday' || info.type === 'special';
};


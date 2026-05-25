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
  'bg-gradient-to-r from-[#f38ba8]/20 to-[#f38ba8]/10 text-[#d20f39] dark:text-[#f38ba8] border border-[#f38ba8]/30';
const DEFAULT_HOLIDAY_BADGE =
  'bg-gradient-to-r from-[#a6e3a1]/20 to-[#a6e3a1]/10 text-[#40a02b] dark:text-[#a6e3a1] border border-[#a6e3a1]/30';
const DEFAULT_SPECIAL_BADGE =
  'bg-gradient-to-r from-[#fab387]/20 to-[#fab387]/10 text-[#df8e1d] dark:text-[#fab387] border border-[#fab387]/30';

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


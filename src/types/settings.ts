export interface UserSettings {
  hiddenSidebarItems: string[];
}

export const defaultSettings: UserSettings = {
  hiddenSidebarItems: [],
};

export interface NavigationItem {
    id: string;
    label: string;
    icon: React.ElementType;
    description: string;
    url?: string;
    authrequired?: boolean;
    forceshow?: boolean;
  }

export enum NavigationInstruction {
    HOME = "home",
    SCHEDULE = "schedule",
    TIMETABLE = "timetable",
    WEATHER = "weather",
    MARK = "mark",
    DIEMDANH = "diemdanh",
    QRSCAN = "qrscan",
    PARKINGLHU = "parkinglhu",
    SETTINGS = "settings",
    DIEMRENLUYEN = "diemrenluyen",
    THUVIEN = "thuvien",
    TOOLLHU = "toollhu"
}

export const getSettings = (): UserSettings => {
    let settings = localStorage.getItem("userSettings");
    if (settings) {
        return JSON.parse(settings) as UserSettings;
    }
    if (!settings) {
        localStorage.setItem("userSettings", JSON.stringify(defaultSettings))
    }
    return defaultSettings;
}
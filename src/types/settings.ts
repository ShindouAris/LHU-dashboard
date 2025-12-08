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
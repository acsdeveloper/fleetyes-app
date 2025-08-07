import { config, mergeConfigs } from '../src/utils/config';

// Define toArray locally to avoid circular dependency
function toArray(target, delimiter = ',') {
    if (Array.isArray(target)) {
        return target;
    }

    if (typeof target === 'string') {
        return target.split(delimiter);
    }

    if (target === null || target === undefined) {
        return [];
    }

    return Array.from(target);
}

export const DefaultConfig = {
    theme: config('APP_THEME') || 'blue',
    driverNavigator: {
        tabs: toArray(config('DRIVER_NAVIGATOR_TABS') || 'DriverDashboardTab,DriverTaskTab,DriverReportTab,DriverChatTab,DriverAccountTab'),
        defaultTab: toArray(config('DRIVER_NAVIGATOR_DEFAULT_TAB') || 'DriverDashboardTab'),
    },
    defaultLocale: config('DEFAULT_LOCALE') || 'en',
    colors: {
        loginBackground: config('LOGIN_BG_COLOR') || '#111827',
    },
};

export function createNavigatorConfig(userConfig = {}) {
    return mergeConfigs(DefaultConfig, userConfig);
}

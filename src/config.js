import Environment from 'react-native-config';

/**
 * ----------------------------------------------------------
 * Storefront App Configuration
 * ----------------------------------------------------------
 *
 * Define your own custom configuration properties below.
 * @TODO Allow 3rd party configurations for plugins
 *
 * @type {object}
 */

Environment.FLEETBASE_KEY 
Environment.FLEETBASE_HOST
const Config = {
    ...Environment,
    theme: Environment.APP_THEME || 'blue',
    driverNavigator: {
        apiKey: Environment.FLEETBASE_KEY,
        host: Environment.FLEETBASE_HOST,
        namespace: Environment.FLEETBASE_NAMESPACE || 'v1',
    },
    defaultLocale: Environment.DEFAULT_LOCALE || 'en',
    colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#1F2937',
        textSecondary: '#6B7280',
    },
    getConstants: () => Config,
};

export default Config;

import Environment from 'react-native-config';
import { DefaultConfig } from '../config/default';

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
    ...DefaultConfig,
};

export default Config;

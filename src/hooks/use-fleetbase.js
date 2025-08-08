import Fleetbase from '@fleetbase/sdk';
import { isObject } from 'utils';
import { get, getString } from 'storage';
import config from '../config';

const useFleetbase = (namespace) => {
    let { FLEETBASE_KEY, FLEETBASE_HOST, FLEETBASE_NAMESPACE } = config;
    let _DRIVER = get('driver');
    let _FLEETBASE_KEY = getString('_FLEETBASE_KEY');
    let _FLEETBASE_HOST = getString('_FLEETBASE_HOST');

    if (_FLEETBASE_KEY) {
        FLEETBASE_KEY = _FLEETBASE_KEY;
    }

    if (_FLEETBASE_HOST) {
        FLEETBASE_HOST = _FLEETBASE_HOST;
    }

    if (isObject(_DRIVER) && typeof _DRIVER.token === 'string') {
        FLEETBASE_KEY = _DRIVER.token;
    }

    // Validate the API key format
    if (!FLEETBASE_KEY || typeof FLEETBASE_KEY !== 'string' || FLEETBASE_KEY.trim() === '') {
        throw new Error('FLEETBASE_KEY is required and must be a non-empty string');
    }

    // Ensure the key is properly formatted (remove any whitespace)
    FLEETBASE_KEY = FLEETBASE_KEY.trim();

    const fleetbase = new Fleetbase(FLEETBASE_KEY, {
        host: FLEETBASE_HOST,
        namespace: FLEETBASE_NAMESPACE ?? namespace,
    });

    return fleetbase;
};

export default useFleetbase;

import { Driver } from '@fleetbase/sdk';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { Platform } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { LoginManager as FacebookLoginManager } from 'react-native-fbsdk-next';
import useFleetbase from '../hooks/use-fleetbase.js';
import useStorage, { storage } from '../hooks/use-storage';
import { later, navigatorConfig } from '../utils';
import { getVerificationCode, sendAccountCreationCode, sendCode, verifyAccountCreationCode } from '../utils/request';
import { useLanguage } from './LanguageContext';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

const authReducer = (state, action) => {
    switch (action.type) {
        case 'RESTORE_SESSION':
            return { ...state, driver: action.driver };
        case 'SEND_OTP':
            return { ...state, isSendingOtp: action.isSendingOtp ?? false };
        case 'VERIFY_OTP':
            return { ...state, isVerifyingOtp: action.isVerifyingOtp ?? false };
        case 'CREATING_ACCOUNT':
            return { ...state, isCreatingAccount: action.isCreatingAccount ?? false };
        case 'VERIFY':
            return { ...state, driver: action.driver, isVerifyingCode: action.isVerifyingCode ?? false };
        case 'LOGOUT':
            return { ...state, driver: null, phone: null, isSigningOut: action.isSigningOut ?? false };
        case 'START_UPDATE':
            return { ...state, driver: action.driver, isUpdating: action.isUpdating ?? true };
        case 'END_UPDATE':
            return { ...state, driver: action.driver, isUpdating: action.isUpdating ?? false };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const fleetbase = useFleetbase();
    const { setLocale } = useLanguage();
    const { deviceToken } = useNotification();
    const [storedDriver, setStoredDriver] = useStorage('driver');
    const [organizations, setOrganizations] = useStorage('organizations', []);
    const [authToken, setAuthToken] = useStorage('_driver_token');
    const [state, dispatch] = useReducer(authReducer, {
        isVerifyingCode: false,
        isSigningOut: false,
        isUpdating: false,
        isSendingOtp: false,
        isVerifyingOtp: false,
        isCreatingAccount: false,
        driver: null, // Initialize as null, will be set in useEffect
        phone: null,
    });
    const organizationsLoadedRef = useRef(false);
    const loadOrganizationsPromiseRef = useRef();
    const fleetbaseRef = useRef(fleetbase);

    // Update fleetbase ref when it changes
    useEffect(() => {
        fleetbaseRef.current = fleetbase;
    }, [fleetbase]);

    // Restore session on app load - only run once when storedDriver changes
    useEffect(() => {
        if (storedDriver && fleetbaseRef.current) {
            if (storedDriver.token) {
                setAuthToken(storedDriver.token);
            }
            dispatch({ type: 'RESTORE_SESSION', driver: new Driver(storedDriver, fleetbaseRef.current.getAdapter()) });
        } else {
            dispatch({ type: 'RESTORE_SESSION', driver: null });
        }
    }, [storedDriver]); // Remove fleetbase from dependencies

    // Load organizations once when driver is available
    useEffect(() => {
        if (state.driver && !organizationsLoadedRef.current) {
            loadOrganizations();
        }
    }, [state.driver]);

    const setDriver = useCallback(
        (newDriver) => {
            if (!newDriver) {
                setStoredDriver(null);
                EventRegister.emit('driver.updated', null);
                return;
            }

            const driverInstance = newDriver instanceof Driver ? newDriver : new Driver(newDriver, fleetbaseRef.current.getAdapter());

            // Restore driver token if needed
            if (!driverInstance.token && storage.getString('_driver_token')) {
                driverInstance.setAttribute('token', storage.getString('_driver_token'));
            }

            setStoredDriver(driverInstance.serialize());
            EventRegister.emit('driver.updated', driverInstance);
        },
        [setStoredDriver]
    );

    // Track driver location
    const trackDriverLocation = useCallback(
        async (location) => {
            try {
                const driver = await state.driver.update({ place: location.id });
                setDriver(driver);
            } catch (err) {
                throw err;
            }
        },
        [state.driver, setDriver]
    );

    // Reload the driver resource
    const reloadDriver = useCallback(
        async (data = {}) => {
            try {
                const driver = await state.driver.reload();
                setDriver(driver);
            } catch (err) {
                throw err;
            }
        },
        [state.driver, setDriver]
    );

    // Track driver position and other position related data
    const trackDriver = useCallback(
        async (data = {}) => {
            try {
                const driver = await state.driver.track(data);
                setDriver(driver);
            } catch (err) {
                throw err;
            }
        },
        [state.driver, setDriver]
    );

    // Update driver meta attributes
    const updateDriverMeta = useCallback(
        async (newMeta = {}) => {
            const meta = { ...state.driver.getAttribute('meta'), ...newMeta };
            try {
                const driver = await state.driver.update({ meta });
                setDriver(driver);
                return driver;
            } catch (err) {
                throw err;
            }
        },
        [state.driver, setDriver]
    );

    // Update driver meta attributes
    const updateDriver = useCallback(
        async (data = {}) => {
            try {
                dispatch({ type: 'START_UPDATE', driver: state.driver, isUpdating: true });
                const driver = await state.driver.update({ ...data });
                setDriver(driver);
                dispatch({ type: 'END_UPDATE', driver, isUpdating: false });
                return driver;
            } catch (err) {
                dispatch({ type: 'END_UPDATE', driver: state.driver, isUpdating: false });
                throw err;
            }
        },
        [state.driver, setDriver]
    );

    // Toggle driver online status
    const toggleOnline = useCallback(
        async (online = null) => {
            if (!fleetbaseRef.current.getAdapter()) return;

            online = online === null ? !state.driver.isOnline : online;

            try {
                const driver = await fleetbaseRef.current.getAdapter().post(`drivers/${state.driver.id}/toggle-online`, { online });
                setDriver(driver);

                return driver;
            } catch (err) {
                throw err;
            }
        },
        [state.driver, setDriver]
    );

    // Register driver's device and platform
    const syncDevice = async (driver, token) => {
        try {
            await driver.syncDevice({ token, platform: Platform.OS });
        } catch (err) {
            throw err;
        }
    };

    // Register current state driver's device and platform
    const registerDevice = async (token) => {
        try {
            await syncDevice(state.driver, token);
        } catch (err) {
            throw err;
        }
    };

    // Email-based OTP login - send OTP using HttpRequest (like legacy)
    const sendOtpToEmail = useCallback(async (email: string) => {
        try {
            const result = await sendCode(email);
            if (result) {
                return result;
            } else {
                throw new Error('Failed to send OTP');
            }
        } catch (error) {
            throw error;
        }
    }, []);

    // Email-based OTP login - verify OTP using HttpRequest (like legacy)
    const verifyOtpWithEmail = useCallback(
        async (email, otpCode) => {
            dispatch({ type: 'VERIFY_OTP', isVerifyingOtp: true });
            try {
                const driverData = await getVerificationCode(email, otpCode);
                
                if (!driverData) {
                    throw new Error('Invalid verification code. Please try again.');
                }
                
                // Create a Driver instance from the response data
                const driver = new Driver(driverData, fleetbaseRef.current.getAdapter());
                createDriverSession(driver);
                dispatch({ type: 'VERIFY_OTP', isVerifyingOtp: false });
            } catch (error) {
                dispatch({ type: 'VERIFY_OTP', isVerifyingOtp: false });
                console.warn('[AuthContext] Verify OTP failed:', error);
                throw error;
            }
        },
        []
    );

    // Email-based account creation with OTP using HttpRequest (like legacy)
    const createAccountWithEmailOtp = useCallback(async (email: string, attributes: any = {}) => {
        try {
            const result = await sendAccountCreationCode(email, attributes);
            if (result) {
                return result;
            } else {
                throw new Error('Failed to send account creation OTP');
            }
        } catch (error) {
            throw error;
        }
    }, []);

    // Verify account creation OTP using HttpRequest (like legacy)
    const verifyAccountCreationOtp = useCallback(async (email: string, code: string, attributes: any = {}) => {
        try {
            const result = await verifyAccountCreationCode(email, code, attributes);
            if (result) {
                return result;
            } else {
                throw new Error('Invalid account creation OTP code');
            }
        } catch (error) {
            throw error;
        }
    }, []);

    // Remove local session data
    const clearSessionData = () => {
        storage.removeItem('_driver_token');
        storage.removeItem('organizations');
        storage.removeItem('driver');

        // If logged in with facebook
        FacebookLoginManager.logOut();
    };

    // Create a session from driver data/JSON
    const createDriverSession = useCallback(async (driver, callback = null) => {
        clearSessionData();
        setDriver(driver);
        setAuthToken(driver.token);

        const instance = new Driver(driver, fleetbaseRef.current.getAdapter());
        if (typeof callback === 'function') {
            callback(instance);
        }

        if (deviceToken) {
            syncDevice(instance, deviceToken);
        }

        organizationsLoadedRef.current = false;
        loadOrganizationsPromiseRef.current = null;

        return instance;
    }, [setDriver, setAuthToken, deviceToken]);

    // Load organizations driver belongs to
    const loadOrganizations = useCallback(async () => {
        if (!state.driver || loadOrganizationsPromiseRef.current) return;

        try {
            loadOrganizationsPromiseRef.current = state.driver.listOrganizations();
            const organizations = await loadOrganizationsPromiseRef.current;
            setOrganizations(organizations?.map((n) => n.serialize()) || []);
        } catch (err) {
            console.warn('Error trying to load driver organizations:', err);
        } finally {
            organizationsLoadedRef.current = true;
            loadOrganizationsPromiseRef.current = null;
        }
    }, [state.driver, setOrganizations]);

    // Load organizations driver belongs to
    const switchOrganization = useCallback(
        async (organization) => {
            if (!fleetbaseRef.current.getAdapter()) return;

            try {
                const { driver } = await fleetbaseRef.current.getAdapter().post(`drivers/${state.driver.id}/switch-organization`, { next: organization.id });
                createDriverSession(driver);
            } catch (err) {
                console.warn('Error trying to switch driver organization:', err);
            }
        },
        [state.driver, createDriverSession]
    );

    // Load organizations driver belongs to
    const getCurrentOrganization = useCallback(async () => {
        if (!state.driver) return;

        try {
            const currentOrganization = await state.driver.currentOrganization();
            return currentOrganization;
        } catch (err) {
            console.warn('Error trying fetch drivers current organization:', err);
        }
    }, [state.driver]);

    // Logout: Clear session
    const logout = useCallback(() => {
        dispatch({ type: 'LOGOUT', isSigningOut: true });

        // Remove driver session
        setDriver(null);

        // Clear storage/ cache
        clearSessionData();

        // Reset locale
        setLocale(navigatorConfig('defaultLocale', 'en'));

        later(() => {
            dispatch({ type: 'LOGOUT', isSigningOut: false });
        });
    }, [setDriver, setLocale]);

    // Memoize useful props and methods
    const value = useMemo(
        () => ({
            driver: state.driver,
            phone: state.phone,
            isVerifyingCode: state.isVerifyingCode,
            isAuthenticated: !!state.driver,
            isNotAuthenticated: !state.driver,
            isOnline: state.driver?.isOnline,
            isOffline: state.driver?.isOnline === false,
            isUpdating: state.isUpdating,
            isSendingOtp: state.isSendingOtp,
            isVerifyingOtp: state.isVerifyingOtp,
            isCreatingAccount: state.isCreatingAccount,
            updateDriverMeta,
            updateDriver,
            organizations,
            loadOrganizations,
            switchOrganization,
            getCurrentOrganization,
            reloadDriver,
            trackDriver,
            trackDriverLocation,
            toggleOnline,
            clearSessionData,
            setDriver,
            sendOtpToEmail,
            verifyOtpWithEmail,
            createAccountWithEmailOtp,
            verifyAccountCreationOtp,
            logout,
            createDriverSession,
            syncDevice,
            registerDevice,
            authToken,
        }),
        [
            state,
            organizations,
            sendOtpToEmail,
            verifyOtpWithEmail,
            createAccountWithEmailOtp,
            verifyAccountCreationOtp,
            loadOrganizations,
            switchOrganization,
            getCurrentOrganization,
            reloadDriver,
            trackDriver,
            trackDriverLocation,
            toggleOnline,
            setDriver,
            logout,
            createDriverSession,
            syncDevice,
            registerDevice,
            updateDriverMeta,
            updateDriver,
            authToken,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const useIsAuthenticated = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated;
};

export const useIsNotAuthenticated = () => {
    const { isNotAuthenticated } = useAuth();
    return isNotAuthenticated;
};

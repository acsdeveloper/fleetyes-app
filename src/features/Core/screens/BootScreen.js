import SetupWarningScreen from 'exceptions/SetupWarningScreen';
import { useDriver, useMountedState } from 'hooks';
import React, { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import { EventRegister } from 'react-native-event-listeners';
import { tailwind } from 'tailwind';
import { getColorCode, hasRequiredKeys } from 'utils';
import { setI18nConfig } from 'utils/Localize';
import { CommonActions } from '@react-navigation/native';
import { useTheme } from '../../../ThemeContext'; // Import Theme Hook


const { addEventListener } = EventRegister;

/**
 * BootScreen is a simple initialization screen, will load
 * the store or network information and navigate to the correct
 * screens.
 *
 * @component
 */
const BootScreen = ({ navigation }) => {
    // If the required keys are not provided display the setup warning screen
    if (!hasRequiredKeys()) {
        return <SetupWarningScreen />;
    }

    // Initialize i18n
    setI18nConfig();

    // Check if driver is authenticated, if not send to login
    const [driver, setDriver] = useDriver();
    const { isDark } = useTheme();
    
    const isMounted = useMountedState();

    const checkForAuthenticatedDriver = () => {
        return new Promise((resolve, reject) => {
            if (driver) {
                resolve(driver);
            } else {
                reject(null);
            }
        });
    };

    useEffect(() => {
        checkForAuthenticatedDriver()
            .then(() => {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'MainStack' }],
                    })
                );
            })
            .catch(() => {
                 navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'LoginScreen' }],
                    })
                );
            })
            .finally(() => {
                setTimeout(() => {
                    RNBootSplash.hide();
                }, 300);
            });
    }, [isMounted, driver]);

    return (
        <SafeAreaView style={[isDark ? tailwind('bg-gray-800') : tailwind('bg-white')]}>
            <View style={[tailwind('flex items-center justify-center w-full h-full'), isDark ? tailwind('bg-gray-900') : tailwind('bg-white'),]}>
                <ActivityIndicator size="large" color={getColorCode('text-blue-500')} />
            </View>
        </SafeAreaView>
    );
};

export default BootScreen;

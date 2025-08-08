import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { LinearGradient } from 'react-native-linear-gradient';
import { PERMISSIONS, RESULTS, check } from 'react-native-permissions';
import { Button, Image, Spinner, XStack, YStack, useTheme } from 'tamagui';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { useLanguage } from '../contexts/LanguageContext';
import useFleetbase from '../hooks/use-fleetbase.ts';
import { config, isArray, later, toArray } from '../utils';
import SetupWarningScreen from './SetupWarningScreen';

const APP_NAME = config('APP_NAME');
const BootScreen = ({ route }) => {
    const params = route.params ?? {};
    const theme = useTheme();
    const navigation = useNavigation();
    const fleetbaseApi = useFleetbase();
    const { hasFleetbaseConfig } = fleetbaseApi;
    console.log('BootScreen: fleetbaseApi:', fleetbaseApi);
    console.log('BootScreen: hasFleetbaseConfig:', hasFleetbaseConfig);
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const { resolveConnectionConfig } = useConfig();
    const [error, setError] = useState<Error | null>(null);
    const backgroundColor = toArray(config('BOOTSCREEN_BACKGROUND_COLOR', '$background'));
    const isGradientBackground = isArray(backgroundColor) && backgroundColor.length > 1;
    const locationEnabled = params.locationEnabled;

    useFocusEffect(
        useCallback(() => {
            console.log('BootScreen: useFocusEffect triggered');
            
            const checkLocationPermission = async () => {
                console.log('BootScreen: Checking location permission');
                const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

                const result = await check(permission);
                console.log('BootScreen: Location permission result:', result);
                if (result === RESULTS.GRANTED) {
                    initializeNavigator();
                } else {
                    later(() => BootSplash.hide(), 300);
                    // If the locationEnabled flag is set meaning not null or undefined then initialize navigator
                    if (locationEnabled !== undefined && locationEnabled !== null) {
                        initializeNavigator();
                    } else {
                        navigation.navigate('LocationPermission');
                    }
                }
            };

                const initializeNavigator = async () => {
                try {
                    console.log('BootScreen: initializeNavigator called');
                    console.log('BootScreen: hasFleetbaseConfig type:', typeof hasFleetbaseConfig);
                    console.log('BootScreen: hasFleetbaseConfig result:', typeof hasFleetbaseConfig === 'function' ? hasFleetbaseConfig() : 'not a function');
                    console.log('BootScreen: isAuthenticated:', isAuthenticated);
                    
                    // Add more detailed logging using the existing config context
                    const fleetbaseKey = resolveConnectionConfig('FLEETBASE_KEY');
                    const fleetbaseHost = resolveConnectionConfig('FLEETBASE_HOST');
                    console.log('BootScreen: FLEETBASE_KEY:', fleetbaseKey ? 'present' : 'missing');
                    console.log('BootScreen: FLEETBASE_HOST:', fleetbaseHost ? 'present' : 'missing');
                    
                    if (typeof hasFleetbaseConfig !== 'function' || !hasFleetbaseConfig()) {
                        console.log('BootScreen: No Fleetbase config, navigating to InstanceLink');
                        // Instead of showing an error, navigate to the InstanceLink screen
                        later(() => {
                            try {
                                navigation.navigate('InstanceLink');
                            } catch (err) {
                                console.warn('Failed to navigate to InstanceLink:', err);
                            }
                        }, 0);
                        return;
                    }

                try {
                    later(() => {
                        try {
                            // Any initialization processes will run here
                            if (isAuthenticated) {
                                navigation.navigate('DriverNavigator');
                            } else {
                                navigation.navigate('Login');
                            }
                        } catch (err) {
                            console.warn('Failed to navigate to screen:', err);
                        }
                    }, 0);
                } catch (initializationError) {
                    setError(initializationError);
                } finally {
                    later(() => BootSplash.hide(), 300);
                }
            } catch (error) {
                console.error('BootScreen: Error in initializeNavigator:', error);
                setError(error);
            }
            };

            checkLocationPermission();
        }, [navigation, isAuthenticated])
    );

    if (error) {
        return <SetupWarningScreen error={error} />;
    }

    return (
        <YStack flex={1} bg={backgroundColor[0]} alignItems='center' justifyContent='center' width='100%' height='100%'>
            {isGradientBackground && (
                <LinearGradient
                    colors={backgroundColor}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        height: '100%',
                        width: '100%',
                    }}
                />
            )}
            <YStack alignItems='center' justifyContent='center' space='$4'>
                <Image source={require('../../assets/splash-screen.png')} width={100} height={100} borderRadius='$4' mb='$1' />
                <XStack mt='$2' alignItems='center' justifyContent='center' space='$3'>
                    <Spinner size='small' color='$textPrimary' />
                </XStack>
                
                {/* Temporary bypass button for development */}
                <Button 
                    size="$3" 
                    variant="outlined" 
                    onPress={() => navigation.navigate('Login')}
                    mt="$4"
                >
                    Skip to Login (Dev)
                </Button>
            </YStack>
        </YStack>
    );
};

export default BootScreen;

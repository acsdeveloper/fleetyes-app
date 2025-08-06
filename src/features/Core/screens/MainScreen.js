import { faCalendarDay, faClipboardList, faCommentDots, faFileAlt, faRoute, faUser, faWallet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';
import AccountStack from 'account/AccountStack';
import { Header } from 'components';
import OrdersStack from 'core/OrdersStack';
import { useDriver, useMountedState } from 'hooks';
import useFleetbase from 'hooks/use-fleetbase';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import PushNotification from 'react-native-push-notification';
import { tailwind } from 'tailwind';
import { createNewOrderLocalNotificationObject, getColorCode, listenForOrdersFromSocket, logError, translate } from 'utils';
import { syncDevice } from 'utils/Auth';
import { getCurrentLocation, trackDriver } from 'utils/Geo';
import ChatsScreen from './ChatsScreen';
import BackgroundTimer from 'react-native-background-timer';
import IssuesScreen from './IssuesScreen';
import LeaveRequestScreen from '../../Account/screens/LeaveRequestScreen';
import ExpensesScreen from './ExpensesScreen';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext

const { addEventListener, removeEventListener } = EventRegister;
const Tab = createBottomTabNavigator();
const isAndroid = Platform.OS === 'android';


const MainScreen = ({ navigation, route }) => {
    // Setup
    const fleetbase = useFleetbase();
    const isMounted = useMountedState();
    const navigationRoute = useRoute();
    const { isDark } = useTheme(); // Get the current theme

    // State Management
    const [driver, setDriver] = useDriver();
    const [isOnline, setIsOnline] = useState(driver?.isOnline);
    const [trackingSubscriptions, setTrackingSubscriptions] = useState([]);
    const [isPinged, setIsPinged] = useState(0);

    // Listen for push notifications for new orders
    const listenForNotifications = useCallback(() => {
        const notifications = addEventListener('onNotification', notification => {
            const { data, id } = notification;
            const { action } = data;

            console.log('[onNotification() #notification]', notification);
            console.log('[onNotification() #data]', data);
            console.log('[onNotification() #action]', action);

            if (typeof id === 'string' && id.startsWith('order')) {
                return fleetbase.orders.findRecord(id).then(order => {
                    const data = order.serialize();

                    if (navigationRoute.name === 'MainScreen') {
                        navigation.navigate('OrderScreen', { data });
                    }
                });
            }
        });

        return notifications;
    });

    // Initialize when Component is Mounted
    // Get the user's current location
    // Sync the users device for the driver
    // Start listening for push notifications
    useEffect(() => {
        // Set location
        getCurrentLocation();

        // Sync device
        syncDevice(driver);

        // Listen for incoming remote notification events
        const notifications = listenForNotifications();

        return () => {
            removeEventListener(notifications);
        };
    }, [isMounted]);


    // useEffect(() => {
    //     if (isOnline) {
    //         // Start sending location every 15 minutes
    //         const interval = BackgroundTimer.setInterval(async () => {
    //            getCurrentLocation().then((location)=> {
    //             console.log("location", location);
    //            }).catch(logError);
    //         }, 1000); // 15 minutes in milliseconds

    //         // Cleanup interval on component unmount or when driver goes offline
    //         return () => {
    //             BackgroundTimer.clearInterval(interval);
    //         };
    //     }
    // }, [isOnline]);

    // Toggle driver location tracking
    useEffect(() => {
        // Start tracking the driver location
        if (isOnline) {
            trackDriver(driver)
                .then(unsubscribeFn => {
                    setTrackingSubscriptions([...trackingSubscriptions, unsubscribeFn]);
                })
                .catch(logError);
        } else {
            // Unsubscribe to all tracking subscriptions in state
            trackingSubscriptions.forEach(unsubscribeFn => {
                unsubscribeFn();
            });
        }
    }, [isOnline]);

    // Listen for Driver record update to update this screens localized isOnline state
    useEffect(() => {
        const driverUpdated = addEventListener('driver.updated', ({ isOnline }) => {
            setIsOnline(isOnline);
        });

        return () => {
            removeEventListener(driverUpdated);
        };
    }, [isMounted]);

    // Listen for new orders via Socket Connection
    useEffect(() => {
        const notifiableEvents = ['order.ready', 'order.ping', 'order.driver_assigned', 'order.dispatched'];

        listenForOrdersFromSocket(`driver.${driver?.id}`, (order, event) => {
            if (typeof event === 'string' && notifiableEvents.includes(event)) {
                let localNotificationObject = createNewOrderLocalNotificationObject(order, driver);
                PushNotification.localNotification(localNotificationObject);
            }
        });
    }, []);

    return (
        <>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, size }) => {
                        let icon;
                        switch (route.name) {
                            case 'trips':
                                icon = faClipboardList;
                                break;
                            case 'reports':
                                icon = faFileAlt;
                                break;
                            case 'leaves':
                                icon = faCalendarDay;
                                break;
                            case 'account':
                                icon = faUser;
                                break;
                            case 'issues':
                                icon = faFileAlt;
                                break;
                            case 'chats':
                                icon = faCommentDots;
                                break;
                        }
                        return (
                            <FontAwesomeIcon
                                icon={icon}
                                size={isAndroid ? 20 : size}
                                color={focused ? getColorCode('bg-white') : getColorCode('text-gray-500')}
                            />
                        );
                    },
                    tabBarLabel: ({ focused }) => (
                        <Text style={[tailwind(`${focused ? 'text-white' : 'text-gray-500'} montserrat-bold text-xs`)]}>
                            {translate('app.menu.' + route.name)}
                        </Text>
                    ),
                    // tabBarLabel: translate('app.menu.' + route.name),
                    tabBarStyle: tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'} border-gray-700 shadow-lg`),
                    tabBarItemStyle: tailwind(`${isDark ? 'bg-gray-800' : 'bg-custom'} border-gray-700 ${isAndroid ? 'pt-1.5' : 'pt-1.5'}`),
                    tabBarActiveTintColor: getColorCode('text-white'),
                    tabBarInactiveTintColor: getColorCode('text-gray-600'),
                    showLabel: false,
                    headerShown: true,
                    header: ({ navigation, route, options }) => {
                        return <Header navigation={navigation} route={route} options={options} />;
                    },
                })}>
                <Tab.Screen key="trips" name="trips" component={OrdersStack} />
                <Tab.Screen key="leaves" name="leaves" component={LeaveRequestScreen} />
                <Tab.Screen key="issue" name="issues" component={IssuesScreen} />
                {/* <Tab.Screen key="chat" name="chats" component={ChatsScreen} /> */}
                <Tab.Screen key="account" name="account" component={AccountStack} />
            </Tab.Navigator>
        </>
    );
};

export default MainScreen;
// OrderScreen.js
import { Order } from '@fleetbase/sdk';
import {
    faBell,
    faFile,
    faLightbulb,
    faMapMarkerAlt,
    faMoneyBillWave,
    faRoute,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNetInfo } from '@react-native-community/netinfo';
import OrderStatusBadge from 'components/OrderStatusBadge';
import OrderWaypoints from 'components/OrderWaypoints';
import { format } from 'date-fns';
import { useDriver, useFleetbase, useLocale, useMountedState } from 'hooks';
import React, { createRef, useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { EventRegister } from 'react-native-event-listeners';
import FastImage from 'react-native-fast-image';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tailwind from 'tailwind';
import {
    calculatePercentage,
    formatCurrency,
    formatMetaValue,
    getColorCode,
    getStatusColors,
    isArray,
    isEmpty,
    logError,
    titleize,
    translate,
} from 'utils';
import { getString, setString } from 'utils/Storage';
import { orderAcceptRejectRequest, driverUpdateActivity } from 'utils/request';
import OrderMapPicker from '../../components/OrderMapPicker';
import loadOrders from '../../features/Core/screens/OrdersScreen';
import { t } from 'i18n-js';

const { addEventListener, removeEventListener } = EventRegister;
const { width, height } = Dimensions.get('window');
import { useTheme } from '../../ThemeContext'; // Import your ThemeContext

const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const isObjectEmpty = (obj) => isEmpty(obj) || Object.values(obj).length === 0;

const getOrderCurrency = (order) => {
    let currency = order.getAttribute('meta.currency');
    if (!currency) {
        currency = order.getAttribute('currency');
    }
    if (!currency) {
        const entities = order.getAttribute('payload.entities', []);
        if (isArray(entities) && entities.length) {
            currency = entities[0].currency;
        }
    }
    return currency ?? 'USD';
};

const OrderScreen = ({ navigation, route }) => {
    const { data } = route.params;
    const { isConnected } = useNetInfo();
    const { isDark } = useTheme(); // Get current theme

    const insets = useSafeAreaInsets();
    const isMounted = useMountedState();
    const actionSheetRef = createRef();
    const fleetbase = useFleetbase();
    const [driver, setDriver] = useDriver();
    const [locale] = useLocale();

    const [order, setOrder] = useState(new Order(data, fleetbase.getAdapter()));
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);
    const [driverActivity, setDriverActivity] = useState('');

    const [isLoadingRejectAction, setIsLoadingRejectAction] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [nextActivity, setNextActivity] = useState(null);
    const [actionSheetAction, setActionSheetAction] = useState('update_activity');
    const [map, setMap] = useState(null);
    const [isParkingLoading, setParkingLoading] = useState(false);

    const isPickupOrder = order.getAttribute('meta.is_pickup');
    const currency = getOrderCurrency(order);
    const subtotal = order.getAttribute('meta.subtotal', 0);
    const total = order.getAttribute('meta.total', 0);
    const tip = order.getAttribute('meta.tip', 0);
    const deliveryTip = order.getAttribute('meta.delivery_tip', 0);
    const isCod = order.getAttribute('payload.cod_amount') > 0;
    const isMultiDropOrder = !isEmpty(order.getAttribute('payload.waypoints', []));
    const scheduledAt = order.isAttributeFilled('scheduled_at')
        ? format(new Date(order.getAttribute('scheduled_at')), 'PPpp')
        : null;
    const estimatedEndDate = order.isAttributeFilled('estimated_end_date')
        ? format(new Date(order.getAttribute('estimated_end_date')), 'PPpp')
        : null;
    const createdAt = format(new Date(order.getAttribute('created_at')), 'PPpp');
    const customer = order.getAttribute('customer');
    const destination = [
        order.getAttribute('payload.pickup'),
        ...order.getAttribute('payload.waypoints', []),
        order.getAttribute('payload.dropoff'),
    ].find((place) => {
        return place?.place_public_id === order.getAttribute('payload.current_waypoint');
    });
    const canNavigate = order.isDispatched || order.isInProgress;
    const isCompleted = order.getAttribute('status').toLowerCase() == 'completed';

    const onBreak = ['shift_ended', 'on_break', 'incident_reported'].includes(order.getAttribute('status').toLowerCase());
    const canSetDestination = isMultiDropOrder && order.isInProgress && !destination;
    const isAdhoc = order.getAttribute('adhoc') === true;
    const isDriverAssigned = order.getAttribute('driver_assigned') !== null;
    const isOrderPing =
        isDriverAssigned === false &&
        isAdhoc === true &&
        !['completed', 'canceled'].includes(order.getAttribute('status').toLowerCase());
    const documents = order.getAttribute('files', []);

    // Define theme-based styles
    const backgroundColor = isDark ? 'bg-gray-800' : 'bg-white';
    const textColor = isDark ? 'text-white' : 'text-gray-800';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    const entitiesByDestination = (() => {
        const groups = [];
        if (isEmpty(order.getAttribute('payload.waypoints', []))) {
            return groups;
        }
        order.getAttribute('payload.waypoints', []).forEach((waypoint) => {
            const destination = waypoint?.id;
            if (destination) {
                const entities = order
                    .getAttribute('payload.entities', [])
                    .filter((entity) => entity.destination === destination);
                if (entities.length === 0) {
                    return;
                }
                const group = {
                    destination,
                    waypoint,
                    entities,
                };
                groups.push(group);
            }
        });
        return groups;
    })();

    const waypointsInProgress = (() => {
        const waypointsInProgress = [];
        const waypoints = order.getAttribute('payload.waypoints', []);
        const statusesToSkip = ['completed', 'canceled'];
        for (let index = 0; index < waypoints.length; index++) {
            const waypoint = waypoints[index];
            if (!waypoint?.tracking || statusesToSkip.includes(waypoint.tracking?.toLowerCase())) {
                continue;
            }
            waypointsInProgress.push(waypoint);
        }
        return waypointsInProgress;
    })();

    const formattedTip = (() => {
        if (typeof tip === 'string' && tip.endsWith('%')) {
            const tipAmount = formatCurrency(calculatePercentage(parseInt(tip), subtotal) / 100, currency);
            return `${tip} (${tipAmount})`;
        }
        return formatCurrency(tip / 100, currency);
    })();

    const formattedDeliveryTip = (() => {
        if (typeof deliveryTip === 'string' && deliveryTip.endsWith('%')) {
            const tipAmount = formatCurrency(calculatePercentage(parseInt(deliveryTip), subtotal) / 100, currency);
            return `${deliveryTip} (${tipAmount})`;
        }
        return formatCurrency(deliveryTip / 100, currency);
    })();

    const calculateEntitiesSubtotal = () => {
        const entities = order.getAttribute('payload.entities', []);
        let subtotal = 0;
        for (let index = 0; index < entities.length; index++) {
            const entity = entities[index];
            subtotal += parseInt(entity?.price ?? 0);
        }
        return subtotal;
    };

    const calculateDeliverySubtotal = () => {
        const purchaseRate = order.getAttribute('purchase_rate');
        let subtotal = 0;
        if (purchaseRate) {
            subtotal = purchaseRate.amount;
        } else if (order?.meta?.delivery_free) {
            subtotal = order.getAttribute('meta.delivery_fee');
        }
        return parseInt(subtotal);
    };

    const calculateTotal = () => {
        let subtotal = calculateEntitiesSubtotal();
        let deliveryFee = calculateDeliverySubtotal();
        let tips = parseInt(deliveryTip ? deliveryTip : 0) + parseInt(tip ? tip : 0);
        return subtotal + deliveryFee + tips;
    };

    const catchError = (error) => {
        if (!error) {
            return;
        }
        logError(error);
        Alert.alert('Error', error?.message ?? 'An error occurred');
    };

    const loadOrder = (options = {}) => {
        console.log('Loading order' + JSON.stringify(order.getAttribute('tracking_statuses')));
        if (options.isRefreshing) {
            setIsRefreshing(true);
        }
        return fleetbase.orders
            .findRecord(order.id)
            .then(setOrder)
            .catch(catchError)
            .finally(() => {
                setIsRefreshing(false);
            });
    };

    const addToRequestQueue = (type, params, order, action) => {
        let apiRequestQueue = JSON.parse(getString('apiRequestQueue'));
        const queueItem = {
            type: type,
            params,
            order,
            action: action,
            time: new Date(),
        };
        if (apiRequestQueue?.length > 0) {
            apiRequestQueue.push(queueItem);
        } else apiRequestQueue = [queueItem];
        setString('apiRequestQueue', JSON.stringify(apiRequestQueue));
    };

    const setOrderDestination = (waypoint) => {
        if (!waypoint) {
            return;
        }
        setIsLoadingAction(true);
        order
            .setDestination(waypoint.id)
            .then(setOrder)
            .catch(catchError)
            .finally(() => {
                setActionSheetAction('update_activity');
                setIsLoadingAction(false);
            });
    };

    const handleOrderAcceptance = ({ token }) => {
        setIsLoadingAction(true);
        console.log('Accept order' + order.id);
        console.log('Driver' + token);
        acceptOrder(token)
            .then(async () => {
                console.log('Order loading');
                await loadOrder({ isRefreshing: true });
            })
            .catch(() => {
                console.log('Order was not accepted.');
            })
            .finally(async () => {
                console.log('finally');
                await loadOrder({ isRefreshing: true });
                setIsLoadingAction(false);

            });
    };

    const isOrderConfirmed = (orders) => {
        return orders.some((order) => order.code === 'CONFIRMED');
    };

    const acceptOrder = (token) => {
        return new Promise((resolve, reject) => {
            Alert.alert(
                translate('Core.OrderScreen.accept'),
                translate('Core.OrderScreen.accpetOrderConfirm'),
                [
                    {
                        text: translate('Core.SettingsScreen.yes'),
                        onPress: () => {
                            console.log('Order accepted');
                            orderAcceptRejectRequest(order.id, '1', token);
                            resolve(true);
                        },
                    },
                    {
                        text: translate('Core.SettingsScreen.cancel'),
                        onPress: () => {
                            console.log('Order not accepted');
                            reject(false);
                        },
                    },
                ]
            );
        });
    };

    const rejectOrder = ({ token }) => {
        setIsLoadingRejectAction(true);
        console.log('Rejecting order');
        Alert.alert(
            translate('Core.OrderScreen.reject'),
            translate('Core.OrderScreen.rejectOrderConfirm'),
            [
                {
                    text: translate('Core.SettingsScreen.yes'),
                    onPress: () => {
                        orderAcceptRejectRequest(order.id, '0', token);
                        setIsLoadingRejectAction(false);
                        navigation.goBack();
                        return;
                    },
                },
                {
                    text: translate('Core.SettingsScreen.cancel'),
                    onPress: () => {
                        setIsLoadingRejectAction(false);
                        return loadOrder();
                    },
                },
            ]
        );
    };

    const startOrder = (params = {}) => {
        setIsLoadingAction(true);
        if (!isConnected) {
            addToRequestQueue('startOrder', params, order, 'start');
            setIsLoadingAction(false);
            return;
        }
        order
            .start(params)
            .then(setOrder)
            .catch((error) => {
                if (error?.message?.startsWith('Order has not been dispatched')) {
                    return Alert.alert(
                        translate('Core.OrderScreen.orderNotDispatchedTitle'),
                        translate('Core.OrderScreen.orderNotDispatchedMessage'),
                        [
                            {
                                text: translate('Core.SettingsScreen.yes'),
                                onPress: () => {
                                    return startOrder({ skipDispatch: true });
                                },
                            },
                            {
                                text: translate('Core.SettingsScreen.cancel'),
                                onPress: () => {
                                    return loadOrder();
                                },
                            },
                        ]
                    );
                }
                logError(error);
            })
            .finally(() => {
                setIsLoadingAction(false);
            });
    };

    const declineOrder = (params = {}) => {
        return navigation.goBack();
    };

    const updateReport = async (params = {}) => {
        console.log(params);
        navigation.navigate('ExpenseScreen', { order: order, type: params });
    };

    const updateOrderActivity = async () => {
        setActionSheetAction('update_activity');
        if (!isConnected) {
            addToRequestQueue('updateOrder', '', order, 'updated');
            setIsLoadingAction(false);
            return;
        }
        const activity = await order
            .getNextActivity({ waypoint: destination?.id })
            .finally(() => {
                setIsLoadingAction(false);
            });
        if (activity.code === 'dispatched') {
            return Alert.alert(
                translate('Core.OrderScreen.orderNotDispatchedTitle'),
                translate('Core.OrderScreen.orderNotDispatchedMessage'),
                [
                    {
                        text: translate('Core.SettingsScreen.yes'),
                        onPress: () => {
                            return order.updateActivity({ skipDispatch: true }).then(setOrder).catch(catchError);
                        },
                    },
                    {
                        text: translate('Core.SettingsScreen.cancel'),
                        onPress: () => {
                            return loadOrder();
                        },
                    },
                ]
            );
        }
        setNextActivity(activity);
    };

    const toggleChangeDestinationWaypoint = () => {
        if (actionSheetAction === 'change_destination') {
            actionSheetRef.current?.setModalVisible(true);
        } else {
            setActionSheetAction('change_destination');
        }
    };

    const sendOrderActivityUpdate = (activity) => {
        setIsLoadingActivity(true);
        if (activity.require_pod) {
            actionSheetRef.current?.setModalVisible(false);
            return navigation.push('ProofScreen', { activity, _order: order.serialize(), _waypoint: destination });
        }
        return order
            .updateActivity({ activity })
            .then(setOrder)
            .catch(catchError)
            .finally(() => {
                setNextActivity(null);
                setIsLoadingActivity(false);
            });
    };

    const completeOrder = (activity) => {
        setIsLoadingActivity(true);
        return order
            .complete()
            .then(setOrder)
            .catch(catchError)
            .finally(() => {
                setTimeout(() => {
                    setNextActivity(null);
                    setIsLoadingActivity(false);
                }, 2000);
            });
    };

    const endShift = () => {
        setIsLoadingActivity(true);
        setDriverActivity("Shift Ended")
        confirmDriverActivity("Shift Ended", translate('Core.OrderScreen.finishDay'), translate('Core.OrderScreen.finishDayConfirmation'))
            .then(async () => {
                console.log('driver end shift loading');
                await loadOrder({ isRefreshing: true });
            })
            .catch(() => {
                console.log('driver end shift accepted.');
            })
            .finally(async () => {
                console.log('finally');
                await loadOrder({ isRefreshing: true });
                setDriverActivity("")

                setIsLoadingActivity(false);

            });
    };

    const takeBreak = () => {
        setIsLoadingActivity(true);
        setDriverActivity("On Break")
        confirmDriverActivity("On Break", translate('Core.OrderScreen.takeBreak'), translate('Core.OrderScreen.takeBreakConfirmation'))
            .then(async () => {
                console.log('driver on break loading');
                await loadOrder({ isRefreshing: true });
            })
            .catch(() => {
                console.log('driver on break shift accepted.');
            })
            .finally(async () => {
                console.log('finally');
                await loadOrder({ isRefreshing: true });
                setDriverActivity("")
                setIsLoadingActivity(false);

            });
    };

    const reportIncident = () => {
        setIsLoadingActivity(true);
        setDriverActivity("Incident Reported")
        confirmDriverActivity("Incident Reported", translate('Core.OrderScreen.reportIncident'), translate('Core.OrderScreen.reportIncidentConfirmation'))
            .then(async () => {
                console.log('driver incident reported loading');
                await loadOrder({ isRefreshing: true });
            })
            .catch(() => {
                console.log('driver incident accepted.');
            })
            .finally(async () => {
                console.log('finally');
                await loadOrder({ isRefreshing: true });
                setDriverActivity("")

                setIsLoadingActivity(false);

            });
    }

    const confirmDriverActivity = (status, title, description) => {
        return new Promise((resolve, reject) => {
            Alert.alert(
                title,
                description,
                [
                    {
                        text: translate('Core.SettingsScreen.yes'),
                        onPress: () => {
                            console.log('Order accepted');
                            driverUpdateActivity(driver.token, order.id, status);
                            setNextActivity(null);
                            resolve(true);
                        },
                    },
                    {
                        text: translate('Core.SettingsScreen.cancel'),
                        onPress: () => {
                            console.log('Order not accepted');
                            reject(false);
                        },
                    },
                ]
            );
        });
    };

    const focusPlaceOnMap = (place) => {
        if (!map) {
            return;
        }
        const destination = {
            latitude: place.location.coordinates[1] - 0.0005,
            longitude: place.location.coordinates[0],
        };
        const latitudeZoom = 8;
        const longitudeZoom = 8;
        const latitudeDelta = LATITUDE_DELTA / latitudeZoom;
        const longitudeDelta = LONGITUDE_DELTA / longitudeZoom;
        map.current?.animateToRegion({
            ...destination,
            latitudeDelta,
            longitudeDelta,
        });
    };

    const handleMetafieldPress = useCallback((metaValue) => {
        if (typeof metaValue === 'string' && metaValue.startsWith('http')) {
            Linking.openURL(metaValue);
        }
    });

    useEffect(() => {
        console.log('Started fetching trips');
        setTimeout(() => {
            loadOrder();
        }, 600);
    }, [nextActivity]);

    useEffect(() => {
        if (actionSheetAction === 'change_destination') {
            actionSheetRef.current?.setModalVisible(true);
        } else {
            actionSheetRef.current?.setModalVisible(false);
        }
    }, [actionSheetAction]);

    useEffect(() => {
        if (nextActivity !== null) {
            actionSheetRef.current?.setModalVisible(true);
        } else {
            actionSheetRef.current?.setModalVisible(false);
        }
    }, [nextActivity]);

    useEffect(() => {
        const watchNotifications = addEventListener('onNotification', (notification) => {
            loadOrder();
        });
        loadOrder();
        return () => {
            removeEventListener(watchNotifications);
        };
    }, [isMounted]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadOrder().then(() => {
                setIsLoadingActivity(false);
            });
        });
        return unsubscribe;
    }, [isMounted]);

    let actionSheetHeight = height / 1.5;
    if (actionSheetAction === 'change_destination') {
        actionSheetHeight = height - 150;
    }
    if (destination) {
        focusPlaceOnMap(destination);
    }

    const openMedia = async (url) => {
        const fileNameParts = url?.split('/')?.pop()?.split('?');
        const fileName = fileNameParts.length > 0 ? fileNameParts[0] : '';
        const localFile = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        const options = {
            fromUrl: url,
            toFile: localFile,
        };
        RNFS.downloadFile(options).promise.then(() => {
            RNFS.readDir(RNFS.DocumentDirectoryPath);
            FileViewer.open(localFile);
        });
    };

    const checkIsImage = (documentType) => {
        return documentType.content_type.startsWith('image/');
    };

    const renderDocumentItem = (document, index) => {
        return (
            <View style={tailwind(`flex rounded-md ${backgroundColor} mt-2 mr-3`)} key={index.toString()}>
                <TouchableOpacity
                    onPress={() => {
                        openMedia(document.url);
                    }}>
                    {checkIsImage(document) ? (
                        <FastImage style={tailwind('w-18 h-18 m-1')} source={{ uri: document.url }} resizeMode={FastImage.resizeMode.contain} />
                    ) : (
                        <View style={tailwind('items-center justify-between p-1')}>
                            <FontAwesomeIcon size={70} icon={faFile} style={tailwind('text-gray-400')} />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };
    console.log("{order}", order);
    return (
        <View style={[tailwind(`${backgroundColor} h-full`)]}>
            {/* Header */}
            <View style={[tailwind(`z-50 ${backgroundColor} border-b ${borderColor} shadow-lg pt-2`)]}>
                <View style={tailwind('flex flex-row items-start justify-between px-4 py-2 overflow-hidden')}>
                    <View style={tailwind('flex items-start')}>
                        <Text style={tailwind(`text-xl montserrat-bold ${textColor}`)}>{order.id}</Text>
                        <Text style={tailwind(`mb-1 montserrat-medium ${textColor}`)}>{scheduledAt ?? createdAt}</Text>
                        <View style={tailwind('flex flex-row')}>
                            <OrderStatusBadge status={order.getAttribute('status').toLowerCase()} wrapperStyle={tailwind('flex-grow-0')} />
                            {order.getAttribute('status').toLowerCase() === 'created' && order.isDispatched && (
                                <OrderStatusBadge status={'dispatched'} wrapperStyle={tailwind('ml-1')} />
                            )}
                        </View>
                    </View>
                    <View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={tailwind('')}>
                            <View style={tailwind(`rounded-full ${isDark ? 'bg-gray-900' : 'bg-gray-300'} w-10 h-10 flex items-center justify-center`)}>
                                <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-400')} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={tailwind('flex flex-row items-center px-4 pb-2 mt-1')}>
                    <View style={tailwind('flex-1')}>
                        {/* {isOrderPing && (
                            <View>
                                <View style={tailwind('mb-2 flex flex-row items-center')}>
                                    <FontAwesomeIcon icon={faBell} style={tailwind('text-yellow-400 mr-1')} />
                                    <Text style={tailwind(`text-lg ${textColor} montserrat-bold`)}>Incoming Trip!</Text>
                                </View>
                                <View style={tailwind('flex flex-row items-center justify-between')}>
                                    <View style={tailwind('pr-1 flex-1')}>
                                        <TouchableOpacity style={tailwind('')} onPress={() => startOrder({ assign: driver.id })}>
                                            <View style={tailwind('btn bg-green-900 border border-green-700')}>
                                                {isLoadingAction && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('mr-2')} />}
                                                <Text style={tailwind('montserrat-bold text-green-50 text-sm')}>
                                                    {translate('Core.OrderScreen.accept')}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={tailwind('pl-1 flex-1')}>
                                        <TouchableOpacity style={tailwind('')} onPress={() => declineOrder()}>
                                            <View style={tailwind('btn bg-red-900 border border-red-700')}>
                                                <Text style={tailwind('montserrat-bold text-red-50 text-sm')}>
                                                    {translate('Core.OrderScreen.reject')}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )} */}

                        {!isOrderConfirmed(order.getAttribute('tracking_statuses')) &&
                            order.isNotStarted &&
                            !order.isInProgress &&
                            !order.isCanceled &&
                            !isOrderPing &&
                            order.getAttribute('status').toLowerCase() !== 'confirmed' ? (
                            <View>
                                <View style={tailwind('flex flex-row items-center justify-between mb-2')}>
                                    <View style={tailwind('pr-1 flex-1')}>
                                        <TouchableOpacity style={tailwind('')} onPress={() => handleOrderAcceptance({ token: driver.token })}>
                                            <View style={tailwind('btn bg-green-900 border border-green-700')}>
                                                {isLoadingAction && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('mr-2')} />}
                                                <Text style={tailwind('montserrat-bold text-green-50 text-sm')}>
                                                    {translate('Core.OrderScreen.accept')}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={tailwind('pl-1 flex-1')}>
                                        <TouchableOpacity style={tailwind('')} onPress={() => rejectOrder({ token: driver.token })}>
                                            <View style={tailwind('btn bg-red-900 border border-red-700')}>
                                                {isLoadingRejectAction && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('mr-2')} />}
                                                <Text style={tailwind('montserrat-bold text-red-50 text-sm')}>
                                                    {translate('Core.OrderScreen.reject')}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : ((order.isNotStarted || onBreak) &&
                            !order.isCanceled &&
                            !isOrderPing &&
                            order.getAttribute('status').toLowerCase() !== 'completed') && (
                            <TouchableOpacity style={tailwind('')} onPress={() => startOrder()}>
                                <View style={tailwind('btn bg-green-900 border border-green-700')}>
                                    {isLoadingAction && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('mr-2')} />}
                                    <Text style={tailwind('montserrat-bold text-green-50 text-base')}>
                                        {onBreak ? translate('Core.OrderScreen.resume') : translate('Core.OrderScreen.start')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {order.isInProgress && !onBreak && !isCompleted && (
                            <TouchableOpacity style={tailwind('')} onPress={updateOrderActivity}>
                                <View style={tailwind('btn bg-green-900 border border-green-700')}>
                                    {isLoadingAction && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('mr-2')} />}
                                    <Text style={tailwind('montserrat-bold text-green-50 text-base')}>
                                        {translate('Core.OrderScreen.updateActivity')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            {/* Scrollable Content */}
            <ScrollView
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={() => loadOrder({ isRefreshing: true })} tintColor={getColorCode('text-blue-200')} />
                }>
                <View style={tailwind('flex w-full h-full pb-60')}>
                    {!onBreak && destination && canNavigate && !isCompleted && (
                        <View style={tailwind('flex flex-row items-center justify-center flex-1')}>
                            <OrderMapPicker order={order} />
                        </View>
                    )}
                    <View style={tailwind(`mt-2 border-t border-b ${isDark ? "border-gray-700" : "border-gray-300"}`)}>
                        {order.isInProgress && (
                            <TouchableOpacity style={tailwind('px-4')} onPress={() => updateReport('Parking')}>
                                <View style={tailwind('btn bg-blue-900 border border-blue-700 mt-3')}>
                                    {isParkingLoading && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('mr-2')} />}
                                    <Text style={tailwind('montserrat-bold text-green-50 text-base')}>
                                        {translate('Core.OrderScreen.parking')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        {order.isInProgress && (
                            <TouchableOpacity style={tailwind('px-4')} onPress={() => updateReport('Fuel')}>
                                <View style={tailwind('btn bg-green-900 border border-green-700 mt-3')}>
                                    {isParkingLoading && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('mr-2')} />}
                                    <Text style={tailwind('montserrat-bold text-green-50 text-base')}>
                                        {translate('Core.OrderScreen.fuel')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        {order.isInProgress && (
                            <TouchableOpacity style={tailwind('px-4')} onPress={() => updateReport('Toll')}>
                                <View style={tailwind('btn bg-button-custom border border-yellow-700 mt-3 mb-3')}>
                                    {isParkingLoading && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('mr-2')} />}
                                    <Text style={tailwind('montserrat-bold text-green-50 text-base')}>
                                        {translate('Core.OrderScreen.toll')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={tailwind(`${backgroundColor}`)}>
                        <View style={tailwind('px-4 pb-3 pt-4')}>
                            {!onBreak && destination && order.isInProgress && !isCompleted && (
                                <View style={tailwind('mb-4')}>
                                    <View style={tailwind('flex bg-blue-900 border border-blue-700')}>
                                        <View style={tailwind('px-4 py-2 border-b border-blue-700')}>
                                            <Text style={tailwind('montserrat-bold text-white mb-1')}>
                                                {translate('Core.OrderScreen.currentDestination')}
                                            </Text>
                                            <Text style={tailwind('text-blue-50 montserrat-medium')}>{destination.address}</Text>
                                            {destination?.tracking && (
                                                <View style={tailwind('my-2 flex flex-row')}>
                                                    <OrderStatusBadge status={destination?.tracking ?? 'pending'} wrapperStyle={tailwind('flex-grow-0')} />
                                                </View>
                                            )}
                                        </View>
                                        {waypointsInProgress.length > 0 && (
                                            <View style={tailwind('flex flex-row')}>
                                                <TouchableOpacity
                                                    onPress={toggleChangeDestinationWaypoint}
                                                    style={tailwind('flex-1 px-2 py-2 border-r border-blue-700 flex items-center justify-center')}>
                                                    <FontAwesomeIcon icon={faRoute} style={tailwind('text-blue-50 mb-1')} />
                                                    <Text style={tailwind('text-blue-50 montserrat-medium')}>{translate('Core.OrderScreen.change')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                            {!onBreak && canSetDestination && (
                                <View style={tailwind('mb-4')}>
                                    <View style={tailwind('flex bg-blue-900 border border-blue-700')}>
                                        <View style={tailwind('flex flex-row')}>
                                            <TouchableOpacity
                                                onPress={toggleChangeDestinationWaypoint}
                                                style={tailwind('flex flex-row px-4 py-3 flex items-center justify-center')}>
                                                <FontAwesomeIcon icon={faMapMarkerAlt} style={tailwind('text-blue-50 mr-2')} />
                                                <Text style={tailwind('text-blue-50 montserrat-bold')}>Set Destination</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )} 
                            <OrderWaypoints 
                                order={order} 
                            />
                        </View>

                        <View style={tailwind('mt-2')}>
                            <View style={tailwind('flex flex-col items-center')}>
                                <View style={tailwind(`flex flex-row items-center justify-between w-full p-4 border-t border-b ${isDark ? "border-gray-700" : "border-gray-300"} mb-1`)}>
                                    <View style={tailwind('flex flex-row items-center')}>
                                        <Text style={tailwind(`montserrat-bold ${textColor}`)}>{translate('Core.OrderScreen.details')}</Text>
                                    </View>
                                </View>
                                <View style={tailwind('w-full py-2')}>
                                    <View style={tailwind('flex flex-row items-center justify-between pb-1 px-3')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{translate('Core.OrderScreen.status')}</Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <OrderStatusBadge status={order.getAttribute('status').toLowerCase()} style={tailwind('px-3 py-0.5')} />
                                        </View>
                                    </View>
                                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{translate('Core.OrderScreen.internalId')}</Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{order.getAttribute('internal_id')}</Text>
                                        </View>
                                    </View>
                                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{translate('Core.OrderScreen.trackingNumber')}</Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                {order.getAttribute('tracking_number.tracking_number')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{translate('Core.OrderScreen.dateCreated')}</Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                {order.createdAt ? format(order.createdAt, 'PPpp') : 'None'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{translate('Core.OrderScreen.dateScheduled')}</Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                {order.scheduledAt ? format(order.scheduledAt, 'PPpp') : 'None'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{translate('Core.OrderScreen.dateEstimated')}</Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                {estimatedEndDate ? estimatedEndDate : 'None'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{translate('Core.OrderScreen.dateDispatched')}</Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                {order.dispatchedAt ? format(order.dispatchedAt, 'PPpp') : 'None'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>{translate('Core.OrderScreen.dateStarted')}</Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                {order.startedAt ? format(order.startedAt, 'PPpp') : 'None'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        {!isObjectEmpty(order.meta) && (
                            <View style={tailwind('mt-2')}>
                                <View style={tailwind('flex flex-col items-center')}>
                                    <View style={tailwind(`flex flex-row items-center justify-between w-full p-4 border-t border-b ${isDark ? "border-gray-700" : "border-gray-300"} mb-1`)}>
                                        <View style={tailwind('flex flex-row items-center')}>
                                            <Text style={tailwind(`montserrat-bold ${textColor}`)}>{translate('Core.OrderScreen.meta')}</Text>
                                        </View>
                                    </View>
                                    <View style={tailwind('w-full py-2 -mt-1')}>
                                        {isArray(Object.keys(order.meta)) &&
                                            Object.keys(order.meta).map((key, index) => (
                                                <View key={index} style={tailwind('flex flex-row items-start justify-between py-2 px-3')}>
                                                    <View style={tailwind('w-20')}>
                                                        <Text style={tailwind(`montserrat-medium ${textColor}`)}>{titleize(key)}</Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => handleMetafieldPress(order.meta[key])} style={tailwind('flex-1 flex-col items-end')}>
                                                        <Text style={tailwind(`montserrat-medium ${textColor}`)} numberOfLines={1}>
                                                            {formatMetaValue(order.meta[key])}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                    </View>
                                </View>
                            </View>
                        )}
                        <View style={tailwind('mt-2')}>
                            <View style={tailwind('flex flex-col items-center')}>
                                <View style={tailwind(`flex flex-row items-center justify-between w-full p-4 border-t border-b ${isDark ? "border-gray-700" : "border-gray-300"}`)}>
                                    <View style={tailwind('flex flex-row items-center')}>
                                        <Text style={tailwind(`montserrat-bold ${textColor}`)}>{translate('Core.OrderScreen.notes')}</Text>
                                    </View>
                                </View>
                                <View style={tailwind('w-full p-4')}>
                                    <Text style={tailwind(`montserrat-medium ${textColor}`)}>{order.getAttribute('notes') || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                        {/* {order.getAttribute('payload.entities', []).length > 0 && (
                            <View>
                                <View style={tailwind('flex flex-col items-center')}>
                                    <View style={tailwind(`flex flex-row items-center justify-between w-full p-4 border-t border-b ${isDark ? "border-gray-700" : "border-gray-300"}`)}>
                                        <View style={tailwind('flex flex-row items-center')}>
                                            <Text style={tailwind(`montserrat-bold ${textColor}`)}>{translate('Core.OrderScreen.payload')}</Text>
                                        </View>
                                    </View>
                                    <View>
                                        {  ? (
                                            <View style={tailwind('flex flex-row flex-wrap')}>
                                                {isArray(entitiesByDestination) &&
                                                    entitiesByDestination.map((group, i) => (
                                                        <View key={i} style={tailwind('w-full')}>
                                                            <View style={tailwind(`rounded-md p-4 mb-4 border-b ${isDark ? "border-gray-700" : "border-gray-300"}`)}>
                                                                <View style={tailwind('mb-3')}>
                                                                    <Text style={tailwind(`text-sm mb-1 montserrat-medium ${textColor}`)}>
                                                                        {translate('Core.OrderScreen.itemDropAt')}
                                                                    </Text>
                                                                    <Text style={tailwind('montserrat-bold')}>{group.waypoint.address}</Text>
                                                                </View>
                                                                <View style={tailwind('w-full flex flex-row flex-wrap items-start')}>
                                                                    {isArray(group.entities) &&
                                                                        group.entities.map((entity, ii) => (
                                                                            <View key={ii} style={tailwind('w-40')}>
                                                                                <View style={tailwind('pb-2 pr-2')}>
                                                                                    <TouchableOpacity
                                                                                        onPress={() =>
                                                                                            navigation.push('EntityScreen', {
                                                                                                _entity: entity,
                                                                                                _order: order.serialize(),
                                                                                            })
                                                                                        }>
                                                                                        <View style={tailwind('flex items-center justify-center py-4 px-1 border border-gray-700 rounded-md')}>
                                                                                            <FastImage
                                                                                                source={{ uri: entity.photo_url }}
                                                                                                style={{ width: 50, height: 50, marginBottom: 5 }}
                                                                                            />
                                                                                            <Text numberOfLines={1} style={tailwind('montserrat-bold')}>
                                                                                                {entity.name}
                                                                                            </Text>
                                                                                            <Text numberOfLines={1} style={tailwind('montserrat-medium')}>
                                                                                                {entity.id}
                                                                                            </Text>
                                                                                            <Text numberOfLines={1} style={tailwind('montserrat-medium')}>
                                                                                                {entity.tracking_number.tracking_number}
                                                                                            </Text>
                                                                                            <Text numberOfLines={1} style={tailwind('montserrat-medium')}>
                                                                                                {formatCurrency((entity.price ?? 0) / 100, entity.currency)}
                                                                                            </Text>
                                                                                        </View>
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                            </View>
                                                                        ))}
                                                                </View>
                                                            </View>
                                                        </View>
                                                    ))}
                                            </View>
                                        ) : (
                                            <View style={tailwind('p-4')}>
                                                <View style={tailwind('flex flex-row flex-wrap items-start')}>
                                                    {order.getAttribute('payload.entities', []).map((entity, i) => (
                                                        <View key={i} style={tailwind('w-40')}>
                                                            <View style={tailwind('p-1')}>
                                                                <TouchableOpacity
                                                                    onPress={() =>
                                                                        navigation.push('EntityScreen', {
                                                                            _entity: entity,
                                                                            _order: order.serialize(),
                                                                        })
                                                                    }>
                                                                    <View style={tailwind(`flex items-center justify-center py-4 px-1 border ${isDark ? "border-gray-700" : "border-gray-300"} rounded-md`)}>
                                                                        <FastImage source={{ uri: entity.photo_url }} style={{ width: 50, height: 50, marginBottom: 5 }} />
                                                                        <Text numberOfLines={1} style={tailwind('montserrat-bold')}>
                                                                            {entity.name}
                                                                        </Text>
                                                                        <Text numberOfLines={1} style={tailwind('montserrat-medium')}>
                                                                            {entity.id}
                                                                        </Text>
                                                                        <Text numberOfLines={1} style={tailwind('montserrat-medium')}>
                                                                            {entity.tracking_number.tracking_number}
                                                                        </Text>
                                                                        <Text numberOfLines={1} style={tailwind('montserrat-medium')}>
                                                                            {formatCurrency((entity.price ?? 0) / 100, entity.currency)}
                                                                        </Text>
                                                                    </View>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )} */}
                        <View style={tailwind('mt-2')}>
                            <View style={tailwind('flex flex-col items-center')}>
                                <View style={tailwind(`flex flex-row items-center justify-between w-full p-4 border-t border-b ${isDark ? "border-gray-700" : "border-gray-300"}`)}>
                                    <View style={tailwind('flex flex-row items-center')}>
                                        <Text style={tailwind(`montserrat-bold ${textColor}`)}>{translate('Core.OrderScreen.doc')}</Text>
                                    </View>
                                </View>
                                <View style={tailwind('w-full p-4 flex items-start flex-row')}>
                                    {documents.map((document, index) => renderDocumentItem(document, index))}
                                </View>
                            </View>
                        </View>
                        {/* {isArray(order.getAttribute('payload.entities', [])) && order.getAttribute('payload.entities', []).length > 0 && (
                            <View>
                                <View style={tailwind('mt-2')}>
                                    <View style={tailwind('flex flex-col items-center')}>
                                        <View style={tailwind(`flex flex-row items-center justify-between w-full p-4 border-t border-b ${isDark ? "border-gray-700" : "border-gray-300"}`)}>
                                            <View style={tailwind('flex flex-row items-center')}>
                                                <Text style={tailwind(`montserrat-bold ${textColor}`)}>{translate('Shared.OrderScreen.orderSummary')}</Text>
                                            </View>
                                            {isCod && (
                                                <View style={tailwind('flex flex-row items-center')}>
                                                    <FontAwesomeIcon icon={faMoneyBillWave} style={tailwind('text-green-500 mr-1')} />
                                                    <Text style={tailwind('montserrat-bold text-green-500')}>
                                                        {translate('Shared.OrderScreen.cash')}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={tailwind(`w-full p-4 border-b ${isDark ? "border-gray-700" : "border-gray-300"}`)}>
                                            {isArray(order.getAttribute('payload.entities', [])) &&
                                                order.getAttribute('payload.entities', []).map((entity, index) => (
                                                    <View key={index} style={tailwind('flex flex-row mb-2')}>
                                                        <View style={tailwind('mr-3')}>
                                                            <View style={tailwind('rounded-md border border-gray-300 flex items-center justify-center w-7 h-7 mr-3')}>
                                                                <Text style={tailwind('montserrat-bold text-blue-500 text-sm')}>
                                                                    {entity.meta.quantity ?? 1}x
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={tailwind('flex-1')}>
                                                            <Text style={tailwind('montserrat-bold text-gray-50')}>{entity.name}</Text>
                                                            <Text style={tailwind('text-xs text-gray-200 montserrat-medium')} numberOfLines={1}>
                                                                {entity.description ?? 'No description'}
                                                            </Text>
                                                            <View>
                                                                {entity.meta?.variants?.map((variant) => (
                                                                    <View key={variant.id}>
                                                                        <Text style={tailwind('text-xs text-gray-200 montserrat-medium')}>{variant.name}</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                            <View>
                                                                {entity.meta?.addons?.map((addon) => (
                                                                    <View key={addon.id}>
                                                                        <Text style={tailwind('text-xs text-gray-200 montserrat-medium')}>+ {addon.name}</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        </View>
                                                        <View>
                                                            <Text style={tailwind('text-gray-200 montserrat-medium')}>
                                                                {formatCurrency((entity.price ?? 0) / 100, currency)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ))}
                                        </View>
                                    </View>
                                </View>
                                <View style={tailwind('mb-2')}>
                                    <View style={tailwind('flex flex-col items-center')}>
                                        <View style={tailwind(`w-full p-4 border-b ${isDark ? "border-gray-700" : "border-gray-300"}`)}>
                                            <View style={tailwind('flex flex-row items-center justify-between mb-2')}>
                                                <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                    {translate('Shared.OrderScreen.subtotal')}
                                                </Text>
                                                <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                    {formatCurrency(calculateEntitiesSubtotal() / 100, currency)}
                                                </Text>
                                            </View>
                                            {!isPickupOrder && (
                                                <View style={tailwind('flex flex-row items-center justify-between mb-2')}>
                                                    <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                        {translate('Shared.OrderScreen.deliveryFee')}
                                                    </Text>
                                                    <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                        {formatCurrency(calculateDeliverySubtotal() / 100, currency)}
                                                    </Text>
                                                </View>
                                            )}
                                            {tip && (
                                                <View style={tailwind('flex flex-row items-center justify-between mb-2')}>
                                                    <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                        {translate('Shared.OrderScreen.tip')}
                                                    </Text>
                                                    <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                        {formattedTip}
                                                    </Text>
                                                </View>
                                            )}
                                            {deliveryTip && !isPickupOrder && (
                                                <View style={tailwind('flex flex-row items-center justify-between mb-2')}>
                                                    <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                        {translate('Shared.OrderScreen.deliveryTip')}
                                                    </Text>
                                                    <Text style={tailwind(`montserrat-medium ${textColor}`)}>
                                                        {formattedDeliveryTip}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={tailwind('w-full p-4')}>
                                            <View style={tailwind('flex flex-row items-center justify-between')}>
                                                <Text style={tailwind('montserrat-bold text-white')}>
                                                    {translate('Shared.OrderScreen.total')}
                                                </Text>
                                                <Text style={tailwind('montserrat-bold text-white')}>
                                                    {formatCurrency(calculateTotal() / 100, currency)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )} */}
                    </View>
                </View>
            </ScrollView>
            {/* ActionSheet for activity updates / destination changes */}
            <ActionSheet
                ref={actionSheetRef}
                containerStyle={{ height: actionSheetHeight, backgroundColor: getColorCode(isDark ? 'bg-gray-800' : 'bg-white') }}
                parentContainer={[tailwind(isDark ? 'bg-gray-800' : 'bg-white')]}
                indicatorColor={getColorCode(isDark ? 'bg-gray-900' : 'bg-gray-100')}
                overlayColor={getColorCode(isDark ? 'bg-gray-900' : 'bg-gray-100')}
                gestureEnabled={true}
                bounceOnOpen={true}
                closeOnTouchBackdrop={false}
                nestedScrollEnabled={true}
                statusBarTranslucent={true}
                defaultOverlayOpacity={isLoadingAction ? 0.8 : 0.65}
                onMomentumScrollEnd={() => actionSheetRef.current?.handleChildScrollEnd()}>
                <View style={{ minHeight: 1000 }}>
                    {actionSheetAction === 'update_activity' && (
                        <View style={tailwind('w-full h-full')}>
                            <View style={tailwind('px-5 py-2 flex flex-row items-center justify-between mb-4')}>
                                <View style={tailwind('flex flex-row items-center')}>
                                    <Text style={tailwind(`text-lg montserrat-bold ${textColor}`)}>{translate('Core.OrderScreen.confirmActivity')}</Text>
                                </View>
                                <View>
                                    <TouchableOpacity onPress={() => actionSheetRef.current?.hide()}>
                                        <View style={tailwind(`rounded-full ${isDark ? 'bg-gray-900' : 'bg-gray-300'} w-10 h-10 flex items-center justify-center`)}>
                                            <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-400')} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View>
                                {!isEmpty(nextActivity) ? (
                                    <View style={tailwind('px-5')}>
                                        {isArray(nextActivity) &&
                                            nextActivity.map((activity, index) => (
                                                <View key={index} style={tailwind('mb-4')}>
                                                    <TouchableOpacity
                                                        style={[tailwind('btn bg-green-900 border border-green-700 px-4'), getStatusColors(activity.code, true).statusWrapperStyle]}
                                                        onPress={() => sendOrderActivityUpdate(activity)}>
                                                        {isLoadingActivity && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('ml-8 mr-3')} />}
                                                        <View style={tailwind('w-full flex flex-col items-start py-2')}>
                                                            <Text style={tailwind(`montserrat-bold text-lg text-${getStatusColors(activity.code).color}-50`)}>
                                                                {activity.status}
                                                            </Text>
                                                            <Text style={tailwind(`montserrat-medium text-${getStatusColors(activity.code).color}-100`)}>
                                                                {activity.details}
                                                            </Text>
                                                            {activity.require_pod && (
                                                                <View style={tailwind('mt-3')}>
                                                                    <View style={tailwind('rounded-md px-2 py-1 bg-yellow-400 border border-yellow-700 shadow-sm flex flex-row items-center')}>
                                                                        <FontAwesomeIcon icon={faLightbulb} style={tailwind('text-yellow-900 mr-2')} />
                                                                        <Text style={tailwind('montserrat-bold text-yellow-900')}>{translate('Core.OrderScreen.proof')}</Text>
                                                                    </View>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                    </View>
                                ) : (
                                    <View style={tailwind('px-5')}>
                                        <View>
                                            <TouchableOpacity style={tailwind('btn bg-green-900 border border-green-700 px-4')} onPress={completeOrder}>
                                                {isLoadingActivity && driverActivity == "" && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('ml-8 mr-3')} />}
                                                <View style={tailwind('w-full flex flex-col items-start py-2')}>
                                                    <Text style={tailwind('montserrat-bold text-lg text-green-50')}>{translate('Core.OrderScreen.completeOrder')}</Text>
                                                    <Text style={tailwind('montserrat-medium text-green-50')}>{translate('Core.OrderScreen.completeOrderContinue')}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        <View>
                                            <TouchableOpacity style={tailwind('btn bg-green-900 border border-green-700 px-4 mt-2')} onPress={endShift}>
                                                {isLoadingActivity && driverActivity == "Shift Ended" && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('ml-8 mr-3')} />}
                                                <View style={tailwind('w-full flex flex-col items-start py-2')}>
                                                    <Text style={tailwind('montserrat-bold text-lg text-green-50')}>{translate('Core.OrderScreen.finishDay')}</Text>
                                                    <Text style={tailwind('montserrat-medium text-green-50')}>{translate('Core.OrderScreen.finishDayDescription')}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        <View>
                                            <TouchableOpacity style={tailwind('btn bg-green-900 border border-green-700 px-4 mt-2')} onPress={takeBreak}>
                                                {isLoadingActivity && driverActivity == "On Break" && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('ml-8 mr-3')} />}
                                                <View style={tailwind('w-full flex flex-col items-start py-2')}>
                                                    <Text style={tailwind('montserrat-bold text-lg text-green-50')}>{translate('Core.OrderScreen.takeBreak')}</Text>
                                                    <Text style={tailwind('montserrat-medium text-green-50')}>{translate('Core.OrderScreen.takeBreakDescription')}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        <View>
                                            <TouchableOpacity style={tailwind('btn bg-green-900 border border-green-700 px-4 mt-2')} onPress={reportIncident}>
                                                {isLoadingActivity && driverActivity == "Incident Reported" && <ActivityIndicator color={getColorCode('text-green-50')} style={tailwind('ml-8 mr-3')} />}
                                                <View style={tailwind('w-full flex flex-col items-start py-2')}>
                                                    <Text style={tailwind('montserrat-bold text-lg text-green-50')}>{translate('Core.OrderScreen.reportIncident')}</Text>
                                                    <Text style={tailwind('montserrat-medium text-green-50')}>{translate('Core.OrderScreen.reportIncidentDescription')}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                    {actionSheetAction === 'change_destination' && (
                        <View style={tailwind('w-full h-full')}>
                            <View style={tailwind('px-5 py-2 flex flex-row items-center justify-between mb-2')}>
                                <View style={tailwind('flex flex-row items-center')}>
                                    {isLoadingAction && <ActivityIndicator color={getColorCode('text-blue-300')} style={tailwind('mr-3')} />}
                                    <Text style={tailwind(`text-lg montserrat-bold ${textColor}`)}>{translate('Core.OrderScreen.changeWayPoints')}</Text>
                                </View>
                                <View>
                                    <TouchableOpacity onPress={() => actionSheetRef.current?.hide()} disabled={isLoadingAction}>
                                        <View style={tailwind(`rounded-full ${isDark ? 'bg-gray-900' : 'bg-gray-300'} w-10 h-10 flex items-center justify-center ${isLoadingAction ? 'opacity-50' : ''}`)}>
                                            <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-400')} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
                                <View style={tailwind('pb-64')}>
                                    {isArray(waypointsInProgress) &&
                                        waypointsInProgress.map((waypoint, index) => (
                                            <TouchableOpacity key={index} onPress={() => setOrderDestination(waypoint)} disabled={isLoadingAction} style={tailwind('mb-4 px-4')}>
                                                <View style={tailwind(`flex flex-row rounded-md bg-blue-900 border ${isDark ? "border-gray-700" : "border-gray-300"} ${isLoadingAction ? 'opacity-50' : ''}`)}>
                                                    <View style={tailwind('px-4 py-2 flex-1 flex flex-row')}>
                                                        <View style={tailwind('mr-4')}>
                                                            <View style={tailwind('rounded-full bg-blue-700 w-8 h-8 flex items-center justify-center')}>
                                                                <Text style={tailwind('montserrat-bold text-white')}>{index + 1}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={tailwind('flex-1')}>
                                                            <Text style={tailwind('montserrat-medium text-blue-50')}>{waypoint.address}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ActionSheet>
        </View>
    );
};

export default OrderScreen;

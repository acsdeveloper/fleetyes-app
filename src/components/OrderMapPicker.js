import { faLocationArrow, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { createRef, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import LaunchNavigator from 'react-native-launch-navigator';
import tailwind from 'tailwind-rn';
import { deepGet, getColorCode, translate } from 'utils';
import { useTheme } from '../ThemeContext'; // Adjust the path to your ThemeContext

function waypointMustHaveId(waypoint) {
    return typeof waypoint?.id === 'string' && waypoint.id.startsWith('place_');
}


/**
 * Retrieves the destination from the given order based on the current waypoint.
 *
 * @param {Object} order - The order object containing the pickup, waypoints, and dropoff details.
 * @param {Object} order.payload.pickup - The pickup location details.
 * @param {Array} order.payload.waypoints - An array of waypoint location details.
 * @param {Object} order.payload.dropoff - The dropoff location details.
 * @param {string} order.payload.current_waypoint - The ID of the current waypoint.
 *
 * @returns {Object|undefined} The destination location object if found, otherwise undefined.
 */
function getOrderDestination(order) {
    const destination = [
        order.getAttribute('payload.pickup'),
        ...order.getAttribute('payload.waypoints', []),
        order.getAttribute('payload.dropoff'),
    ].find((place) => {
        return place?.place_public_id === order.getAttribute('payload.current_waypoint');
    });

    return destination
}


const OrderMapPicker = ({ title, wrapperStyle, order, buttonStyle }) => {
    const actionSheetRef = createRef();
    const destinationWaypoint = getOrderDestination(order);
    const destination = [...deepGet(destinationWaypoint, 'location.coordinates', [])].reverse();
    const [mapProviders, setMapProviders] = useState([]);
    const { isDark } = useTheme(); // Get the current theme

    title = translate('Core.OrderScreen.selectNavigator');

    useEffect(() => {
        LaunchNavigator.getAvailableApps().then(setMapProviders);
    }, []);

    const handleNavigate = async app => {
        LaunchNavigator.navigate(destination, {
            launchMode: LaunchNavigator.LAUNCH_MODE.TURN_BY_TURN,
            app,
        });
    };

    return (
        <View style={[wrapperStyle]}>
            <TouchableOpacity style={tailwind('flex flex-row items-center px-4 pb-2 mt-1')} onPress={() => actionSheetRef.current?.setModalVisible()}>
                <View style={tailwind('btn bg-blue-900 border border-blue-700 py-0 pl-4 pr-2')}>
                    <View style={tailwind('flex flex-row justify-start')}>
                        <View style={tailwind('border-r border-blue-700 py-2 pr-4 flex flex-row items-center')}>
                            <FontAwesomeIcon icon={faLocationArrow} style={tailwind('text-blue-50 mr-2')} />
                            <Text style={tailwind('montserrat-bold text-blue-50 text-base')}>{translate('Core.OrderScreen.navigate')}</Text>
                        </View>
                        <View style={tailwind('flex-1 py-2 px-2 flex items-center')}>
                            <Text numberOfLines={1} style={tailwind('text-blue-50 text-base montserrat-medium')}>
                                {destinationWaypoint.address}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
            <ActionSheet
                gestureEnabled={true}
                bounceOnOpen={true}
                nestedScrollEnabled={true}
                onMomentumScrollEnd={() => actionSheetRef.current?.handleChildScrollEnd()}
                ref={actionSheetRef}
                containerStyle={[tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'}`)]}
                indicatorColor={getColorCode(isDark ? 'text-gray-900' : 'text-gray-600')}>
                <View>
                    <View style={tailwind('px-5 py-2 flex flex-row items-center justify-between mb-2')}>
                        <View style={tailwind('flex flex-row items-center')}>
                            <Text style={tailwind(`${isDark ? 'text-white' : 'text-black'} text-lg montserrat-bold`)}>{title}</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => actionSheetRef.current?.hide()}>
                                <View style={tailwind('rounded-full bg-red-700 w-8 h-8 flex items-center justify-center')}>
                                    <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-100')} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
                        {Object.keys(mapProviders).map(provider =>
                            mapProviders[provider] ? (
                                <TouchableOpacity
                                    key={provider}
                                    onPress={() => {
                                        handleNavigate(provider);
                                    }}>
                                    <View style={tailwind(`flex flex-row items-center px-5 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-300'}`)}>
                                        <Text style={tailwind(`montserrat-bold text-lg ${isDark ? 'text-white' : 'text-black'}`)}>{LaunchNavigator.getAppDisplayName(provider)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : null
                        )}
                        <View style={tailwind('w-full h-40')}></View>
                    </ScrollView>
                </View>
            </ActionSheet>
        </View>
    );
};

export default OrderMapPicker;

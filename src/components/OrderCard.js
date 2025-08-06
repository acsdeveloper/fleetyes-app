import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { tailwind } from 'tailwind';
import { format } from 'date-fns';
import { formatDuration, formatKm } from 'utils';
import OrderStatusBadge from './OrderStatusBadge';
import OrderWaypoints from './OrderWaypoints';
import { useTheme } from '../ThemeContext'; // Adjust the path to your ThemeContext

const OrderCard = ({
    order,
    onPress,
    wrapperStyle,
    containerStyle,
    headerStyle,
    waypointsContainerStyle,
    badgeWrapperStyle,
    badgeProps = {},
    textStyle,
    orderIdStyle,
    dateStyle,
    timeStyle,
    distanceStyle,
    headerTop = null,
    headerBottom = null,
}) => {
    const { isDark } = useTheme(); // Get the current theme

    const scheduledAt = order.scheduledAt ? format(order.scheduledAt, 'PPpp') : null;
    const createdAt = order.createdAt ? format(order.createdAt, 'PPpp') : null;

    return (
        <View style={[tailwind('p-2'), wrapperStyle]}>
            <TouchableOpacity
                style={[
                    tailwind(`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'} border shadow-sm w-full`),
                    containerStyle,
                ]}
                onPress={onPress}
            >
                {headerTop}
                <View style={[tailwind(`border-b ${isDark ? 'border-gray-800' : 'border-gray-300'} py-3 px-3 flex flex-row items-start justify-between flex flex-col`), headerStyle]}>


                    <View style={tailwind('flex flex-row items-center justify-between pb-1')}>
                        <View style={tailwind('')}>
                            <Text style={[tailwind(`${isDark ? 'text-white' : 'text-gray-900'} montserrat-bold mb-1 mr-1`), textStyle, orderIdStyle]}>
                                {order.id}
                            </Text>
                        </View>
                        <View style={tailwind('flex-1 flex-col items-end')}>
                            <OrderStatusBadge status={order.getAttribute('status').toLowerCase()} style={tailwind('px-3 py-0.5')} />
                        </View>
                    </View>
                    {order.hasAttribute('internal_id') && (
                        <Text style={[tailwind(`${isDark ? 'text-gray-50' : 'text-gray-700'} montserrat-bold mb-1`), textStyle, orderIdStyle]}>
                            {order.getAttribute('internal_id')}
                        </Text>
                    )}
                    <Text style={[tailwind(`${isDark ? 'text-gray-50' : 'text-gray-700'} montserrat-medium mb-1`), textStyle, dateStyle]}>
                        {scheduledAt ?? createdAt}
                    </Text>
                    <View style={[tailwind('flex flex-row'), textStyle]}>
                        <Text style={[tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium`), textStyle, timeStyle]}>
                            {formatDuration(order.getAttribute('time'))}
                        </Text>
                        <Text style={[tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium mx-1`), textStyle]}>•</Text>
                        <Text style={[tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium`), textStyle, distanceStyle]}>
                            {formatKm(order.getAttribute('distance') / 1000)}
                        </Text>
                    </View>
                    {headerBottom}

                </View>
                <View style={[tailwind('p-4'), waypointsContainerStyle]}>
                    <OrderWaypoints order={order} textStyle={textStyle} />
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default OrderCard;
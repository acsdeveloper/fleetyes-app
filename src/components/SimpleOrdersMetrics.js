import React from 'react';
import { View, Text } from 'react-native';
import { pluralize, formatDuration, formatMetersToKilometers, getActiveOrdersCount, getTotalStops, getTotalDuration, getTotalDistance } from 'utils';
import { Order } from '@fleetbase/sdk';
import { tailwind } from 'tailwind';
import { format } from 'date-fns';
import { translate } from 'utils';
import { useTheme } from '../ThemeContext'; // Adjust the path to your ThemeContext

const SimpleOrdersMetrics = ({ orders, date = new Date(), wrapperStyle, containerStyle }) => {
    const { isDark } = useTheme(); // Get the current theme

    return (
        <View style={[wrapperStyle]}>
            <View style={[tailwind('px-0'), containerStyle]}>
                <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold text-lg w-full mb-1`)}>
                    {`${format(date, 'eeee')} ` + translate('Core.OrderScreen.orders')}
                </Text>
                <View>
                    <View style={tailwind('flex flex-row items-center mb-1')}>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium text-base`)}>
                            {pluralize(getActiveOrdersCount(orders), translate('Core.OrderScreen.order'))}
                        </Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium text-base mx-2`)}>•</Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium text-base`)}>
                            {`${getTotalStops(orders)} ` + translate('Core.OrderScreen.stops')}
                        </Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium text-base mx-2`)}>•</Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium text-base`)}>
                            {formatDuration(getTotalDuration(orders))}
                        </Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium text-base mx-2`)}>•</Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium text-base`)}>
                            {formatMetersToKilometers(getTotalDistance(orders))}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default SimpleOrdersMetrics;
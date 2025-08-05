import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { getStatusColors, translate } from 'utils';
import { tailwind } from 'tailwind';
import { format } from 'date-fns';

const OrderStatusBadge = ({ status, onPress, wrapperStyle, containerStyle, style, textStyle }) => {
    const { statusWrapperStyle, statusTextStyle } = getStatusColors(status);
    console.log("status", status);
    const statusValue = translate('status.'+status);
    console.log("statusValue", statusValue);
    return (
        <View style={[tailwind('flex'), wrapperStyle]}>
            <TouchableOpacity style={[tailwind('border'), statusWrapperStyle, containerStyle]} onPress={onPress}>
                <View style={[tailwind('px-4 py-1 flex flex-row items-center justify-center'), style]}>
                    <Text style={[tailwind('capitalize montserrat-bold'), statusTextStyle, textStyle]}>{statusValue.replace(/_/g, ' ')}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default OrderStatusBadge;

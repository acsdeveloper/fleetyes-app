import { faAngleDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import React, { createRef, useEffect, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import tailwind from 'tailwind-rn';

import { getColorCode, translate } from 'utils';

const DropdownActionSheet = ({ items, onChange, title, value, isDark = false, isLocation = false, disabled = false }) => {
    const actionSheetRef = createRef();
    const navigation = useNavigation();
    const [selectedItem, setSelectedItem] = useState(null);
    const screenWidth = Dimensions.get('window').width;

    useEffect(() => {
        const selected = items.find(item => item.value === value);
        if (selected) {
            setSelectedItem(selected);
        }
    }, [value]);

    const handleItemSelection = item => {
        setSelectedItem(item);
        onChange(item.value);
        actionSheetRef.current?.hide();
    };

    console.log('[items][0]', items[0]);
    return (
        <View style={tailwind('mb-0')}>
            <TouchableOpacity disabled={disabled} onPress={() => actionSheetRef.current?.setModalVisible()}>
                <View style={tailwind(`flex flex-row items-center justify-between pb-1 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-gray-200'}  px-2`)}>
                    <View style={tailwind('border-blue-700 py-2 pr-4 flex flex-row items-center h-14')}>
                        <Text style={[tailwind(`montserrat-medium ${isDark ? 'text-blue-50' : 'text-gray-400'} text-base`), selectedItem && tailwind(`px-2 ${isDark ? 'text-blue-50' : 'text-gray-900'}`), {
                            flex: 0,                // we don’t want this to grow to fill the whole row
                            flexShrink: 1,          // but we do let it shrink if it’s too long
                            maxWidth: screenWidth,  // cap at 50% of screen width (tweak as needed)
                        },]} numberOfLines={1}
                            ellipsizeMode="tail">{selectedItem ? isLocation ? selectedItem.label : translate('dropdown.' + selectedItem.value) : title}</Text>
                    </View>
                    <View style={tailwind('flex flex-row items-center')}>{<FontAwesomeIcon icon={faAngleDown} style={tailwind(`${isDark ? 'text-blue-50' : 'text-gray-400'}`)} />}</View>
                </View>
            </TouchableOpacity>
            <ActionSheet
                gestureEnabled={false}
                bounceOnOpen={false}
                nestedScrollEnabled={false}
                onMomentumScrollEnd={() => actionSheetRef.current?.handleChildScrollEnd()}
                ref={actionSheetRef}
                containerStyle={tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'}`)}
                indicatorColor={getColorCode(isDark ? 'text-gray-900' : 'text-gray-600')}>
                <View>
                    <View style={tailwind('px-5 py-2 flex flex-row items-center justify-between mb-2')}>
                        <View style={tailwind('flex flex-row items-center')}>
                            <Text style={tailwind(`${isDark ? 'text-white' : 'text-black'} text-lg montserrat-bold`)}>
                                {selectedItem ? isLocation ? selectedItem.label : translate('dropdown.' + selectedItem.value) : title}
                            </Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => actionSheetRef.current?.hide()}>
                                <View style={tailwind(`rounded-full ${isDark ? 'bg-red-700' : 'bg-red-500'} w-8 h-8 flex items-center justify-center`)}>
                                    <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-100')} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView>
                        {items?.map(item => (
                            <TouchableOpacity key={item.value} onPress={() => handleItemSelection(item)}>
                                <View style={tailwind(`flex flex-row items-center px-5 py-4 border-b ${isDark ? 'border-gray-900' : 'border-gray-300'}`)}>
                                    <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium text-lg`)}>
                                        {isLocation ? item.label : translate('dropdown.' + item.value)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <View style={tailwind('w-full h-40')}></View>
                    </ScrollView>
                </View>
            </ActionSheet>
        </View>
    );
};

export default DropdownActionSheet;

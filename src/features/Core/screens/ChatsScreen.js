import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useFleetbase, useMountedState } from 'hooks';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableHighlight, TouchableOpacity, View, Platform, Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import { SwipeListView } from 'react-native-swipe-list-view';
import Toast from 'react-native-toast-message';
import { tailwind } from 'tailwind';
import { translate } from 'utils';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext

const isAndroid = Platform.OS === 'android';

const ChatsScreen = () => {
    const navigation = useNavigation();
    const isMounted = useMountedState();
    const fleetbase = useFleetbase();
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { isDark } = useTheme(); // Get the current theme
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchChannels();
        });

        return unsubscribe;
    }, [isMounted]);

    const fetchChannels = async () => {
        setIsLoading(true);
        try {
            const adapter = fleetbase.getAdapter();
            const response = await adapter.get('chat-channels');
            console.log(response);

            setChannels(response);
            setIsLoading(false);
            return response;
        } catch (error) {
            console.error('Error fetching channels:', error);
            setIsLoading(false);
            return [];
        }
    };

    const formatTime = dateTime => {
        const date = new Date(dateTime);
        const formattedTime = format(date, 'PPpp');
        return formattedTime;
    };

    const handleDelete = async itemId => {
        Alert.alert(translate('Core.ChatScreen.confirmation'), translate('Core.ChatScreen.deleteChannel'), [
            {
                text: translate('Core.SettingsScreen.cancel'),
                style: 'cancel',
            },
            {
                text: translate('Account.LeaveRequestScreen.delete'),
                onPress: () => confirmDelete(itemId),
            },
        ]);
    };

    const confirmDelete = async itemId => {
        try {
            const adapter = fleetbase.getAdapter();
            await adapter.delete(`chat-channels/${itemId}`).then(res => {
                Toast.show({
                    type: 'success',
                    text1: `Channel deleted`,
                });
            });
            setChannels(channels.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Error deleting channel:', error);
        }
    };

    const renderItem = ({ item }) => (

        <TouchableHighlight
            activeOpacity={0.6}
            underlayColor="#DDDDDD"
            style={tailwind(`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'} border shadow-sm mt-2 p-2 mx-4`)}
            onPress={() => navigation.navigate('ChatScreen', { channel: item })}
        >
            <View style={[tailwind(`py-3 flex flex-row items-center`)]}>
                <FastImage
                    source={item.participants.avatar_url ? { uri: item.participants.avatar_url } : require('../../../../assets/app-icon.png')}
                    style={tailwind('w-10 h-10 rounded-full')}
                />
                <View style={tailwind('flex')}>
                    <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold  px-2 w-64`)}>{item.name}</Text>
                    <View style={isAndroid ? tailwind('flex flex-col') : tailwind('flex flex-col')}>
                        <Text style={tailwind('text-gray-400  px-2  montserrat-bold')}>{item?.last_message?.created_at != null ? formatTime(item?.last_message?.created_at) : formatTime(item.created_at)}</Text>
                    </View>
                    <Text style={tailwind('text-sm text-gray-400 px-2  montserrat-bold')}>{item?.last_message?.content}</Text>

                </View>

            </View>
        </TouchableHighlight>
    );

    const renderHiddenItem = ({ item }) => (
        <View style={tailwind('w-full h-full p-2')}>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.backRightBtn, styles.backRightBtnRight]}>
                <Text style={tailwind('text-white montserrat-bold')}>{translate('Core.ChatsScreen.delete')}</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[tailwind(`flex flex-1 items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`)]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    return (
        <View style={tailwind(`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} flex-grow`)}>

            <View style={tailwind('p-4')}>
                <View style={tailwind('flex flex-row items-center justify-center')}>
                    <TouchableOpacity style={tailwind('flex-1')} onPress={() => navigation.navigate('ChannelScreen')}>
                        <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-custom'}`)}>
                            <Text style={tailwind('montserrat-bold text-gray-50 text-base')}>{translate('Core.ChatsScreen.create-channel')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            <SwipeListView data={channels} renderItem={renderItem} renderHiddenItem={renderHiddenItem} rightOpenValue={-75} />
        </View>
    );
};

export default ChatsScreen;

const styles = StyleSheet.create({
    backRightBtn: {
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        width: 75,
    },
    backRightBtnRight: {
        backgroundColor: '#FF3A3A',
        right: 4,
        top: 10,
        bottom: 2,
        marginRight: 12,
        marginLeft: 6,
        borderRadius: 0,
    },
    loaderContainer: {
        position: 'absolute',
        top: '50%',
        left: '60%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        zIndex: 10,
    },
});

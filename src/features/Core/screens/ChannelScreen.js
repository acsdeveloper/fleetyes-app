import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tailwind from 'tailwind-rn';
import { getColorCode, logError, translate } from 'utils';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext
import { useFleetbase } from './src/hooks';

const ChannelScreen = ({ route }) => {
    const navigation = useNavigation();
    const fleetbase = useFleetbase();
    const [name, setName] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [channelId, setChannelId] = useState();
    const { isDark } = useTheme(); // Get the current theme

    useEffect(() => {
        if (route?.params) {
            const { data } = route.params;
            setChannelId(data?.id);
            setName(data?.name);
        }
    }, [route]);

    const saveChannel = () => {
        setIsLoading(true);
        const adapter = fleetbase.getAdapter();
        const data = { name };
        if (channelId) {
            return adapter
                .put(`chat-channels/${channelId}`, data)
                .then(res => {
                    navigation.navigate('ChatScreen', { channel: res });
                })
                .catch(logError)
                .finally(() => setIsLoading(false));
        } else {
            return adapter
                .post('chat-channels', { name })
                .then(res => {
                    navigation.navigate('ChatScreen', { channel: res });
                    Toast.show({
                        type: 'success',
                        text1: `Channel created successfully`,
                    });
                })
                .catch(logError)
                .finally(() => setIsLoading(false));
        }
    };

    return (
        <View style={tailwind(`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} flex-grow`)}>
            <Pressable onPress={Keyboard.dismiss} style={tailwind('w-full h-full relative')}>
                <View style={tailwind('flex flex-row items-center justify-between p-4')}>
                    <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'}  text-xl montserrat-bold`)}>{channelId ? translate('Core.ChannelScreen.update-channel') : translate('Core.ChannelScreen.title')}</Text>
                    <TouchableOpacity onPress={() => navigation.pop(2)} style={tailwind('mr-4')}>
                        <View style={tailwind(`rounded-full ${isDark ? 'bg-gray-900' : 'bg-gray-100'} w-10 h-10 flex items-center justify-center`)}>
                            <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-400')} />
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={tailwind('flex w-full h-full')}>
                    <KeyboardAvoidingView style={tailwind('p-4')}>
                        <View style={tailwind('mb-4')}>
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'}  text-xl montserrat-bold  mb-2`)}>
                                {channelId ? translate('Core.ChannelScreen.update') : translate('Core.ChannelScreen.name')}
                            </Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                keyboardType={'default'}
                                placeholder={translate('Core.ChannelScreen.name')}

                                placeholderTextColor={getColorCode(isDark ? 'text-gray-600' : 'text-gray-400')} style={tailwind(`form-input montserrat-medium ${isDark ? 'text-white' : 'bg-gray-200 border-gray-200 text-gray-900'}`)}
                            />
                        </View>

                        <TouchableOpacity onPress={saveChannel} disabled={isLoading}>
                            <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'} mt-4`)}>
                                {isLoading && <ActivityIndicator color={getColorCode(isDark ? 'text-gray-50' : 'text-white')} style={tailwind('mr-2')} />}
                                <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-white'} montserrat-bold text-base text-center`)}>
                                    {channelId ? translate('Core.ChannelScreen.update-channel') : translate('Core.ChannelScreen.title')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Pressable>
        </View>
    );
};

export default ChannelScreen;

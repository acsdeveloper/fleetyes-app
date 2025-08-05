import { faWindowClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import config from 'config';
import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import tailwind from 'tailwind-rn';
import { translate } from 'utils';
import { getString, remove } from 'utils/Storage';
import { useTheme } from '../../ThemeContext'; // Adjust the path to your ThemeContext

const ConfigScreen = ({ navigation }) => {
    let { FLEETBASE_HOST, SOCKETCLUSTER_HOST, SOCKETCLUSTER_PORT } = config;
    let _FLEETBASE_HOST = getString('_FLEETBASE_HOST');
    let _SOCKETCLUSTER_HOST = getString('_SOCKETCLUSTER_HOST');
    let _SOCKETCLUSTER_PORT = getString('_SOCKETCLUSTER_PORT');

    if (_FLEETBASE_HOST) {
        FLEETBASE_HOST = _FLEETBASE_HOST;
    }

    if (_SOCKETCLUSTER_HOST) {
        SOCKETCLUSTER_HOST = _SOCKETCLUSTER_HOST;
    }

    if (_SOCKETCLUSTER_PORT) {
        SOCKETCLUSTER_PORT = _SOCKETCLUSTER_PORT;
    }

    const { isDark } = useTheme(); // Get the current theme
    const [host, setHost] = useState(FLEETBASE_HOST);
    const [socketHost, setSocketHost] = useState(SOCKETCLUSTER_HOST);
    const [socketPort, setSocketPort] = useState(SOCKETCLUSTER_PORT);

    const removeInstanceLinkValue = key => {
        remove(key);
        switch (key) {
            case '_FLEETBASE_HOST':
                setHost(config.FLEETBASE_HOST);
                break;

            case '_SOCKETCLUSTER_HOST':
                setSocketHost(config.SOCKETCLUSTER_HOST);
                break;

            case '_SOCKETCLUSTER_PORT':
                setSocketPort(config.SOCKETCLUSTER_PORT);
                break;
        }
    };

    const reset = () => {
        removeInstanceLinkValue('_FLEETBASE_HOST');
        removeInstanceLinkValue('_FLEETBASE_KEY');
        removeInstanceLinkValue('_SOCKETCLUSTER_HOST');
        removeInstanceLinkValue('_SOCKETCLUSTER_PORT');
    };

    return (
        <SafeAreaView style={tailwind(`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} flex-grow`)}>
            <View style={tailwind('flex flex-row items-center justify-between p-4 ')}>
                <View>
                    <Text style={tailwind(`${isDark ? 'text-white' : 'text-black'} montserrat-bold text-base`)}>Instance Configuration</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} style={tailwind('rounded-full')}>
                    <FontAwesomeIcon size={20} icon={faWindowClose} style={tailwind('text-red-400')} />
                </TouchableOpacity>
            </View>
            <View style={[tailwind('p-4')]}>
                <View style={[tailwind(`bg-gray-900 border border-gray-700 rounded-md flex flex-row items-center mb-6`)]}>
                    <View style={[tailwind('border-r border-gray-700 bg-gray-200 px-4 py-2 flex flex-row items-center rounded-l-md'), { width: 150 }]}>
                        <Text style={tailwind(`${isDark ? 'text-black' : 'text-gray-900'} text-xs montserrat-bold`)} numberOfLines={1}>
                            {translate('Shared.ConfigScreen.host').toUpperCase().concat(':')}
                        </Text>
                    </View>

                    <View style={[tailwind('px-4 py-2 flex flex-row items-center rounded-r-md')]}>
                        <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-white'} montserrat-medium text-xs`)} numberOfLines={1}>
                            {host}
                        </Text>
                    </View>
                </View>
                <View style={[tailwind(`bg-gray-900 border border-gray-700 rounded-md flex flex-row items-center mb-6`)]}>
                    <View style={[tailwind('border-r border-gray-700 bg-gray-200 px-4 py-2 flex flex-row items-center rounded-l-md'), { width: 150 }]}>
                        <Text style={tailwind(`${isDark ? 'text-black' : 'text-gray-900'} text-xs montserrat-bold`)} numberOfLines={1}>
                            {translate('Shared.ConfigScreen.socket').toUpperCase().concat(':')}
                        </Text>
                    </View>

                    <View style={[tailwind('px-4 py-2 flex flex-row items-center rounded-r-md')]}>
                        <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-white'} montserrat-medium text-xs`)} numberOfLines={1}>
                            {socketHost}
                        </Text>
                    </View>
                </View>
                <View style={[tailwind (`bg-gray-900 border border-gray-700 rounded-md flex flex-row items-center mb-6`)]}>
                    <View style={[tailwind('border-r border-gray-700 bg-gray-200 px-4 py-2 flex flex-row items-center rounded-l-md'), { width: 150 }]}>
                        <Text style={tailwind(`${isDark ? 'text-black' : 'text-gray-900'} text-xs montserrat-bold`)} numberOfLines={1}>
                            {translate('Shared.ConfigScreen.port').toUpperCase().concat(':')}
                        </Text>
                    </View>

                    <View style={[tailwind('px-4 py-2 flex flex-row items-center rounded-r-md')]}>
                        <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-white'} montserrat-medium text-xs`)} numberOfLines={1}>
                            {socketPort}
                        </Text>
                    </View>
                </View>

                <View>
                    <View style={tailwind('flex flex-row items-center justify-center')}>
                        <TouchableOpacity style={tailwind('flex-1')} onPress={reset}>
                            <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'}`)}>
                                <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-white'} montserrat-bold text-base`)}>
                                    {translate('Shared.ConfigScreen.reset')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ConfigScreen;
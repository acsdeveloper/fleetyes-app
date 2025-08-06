import { faCheck, faWindowClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tailwind from 'tailwind-rn';
import { getColorCode, logError, translate } from 'utils';
import { useDriver } from 'utils/Auth';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext

const Organization = ({ navigation, route }) => {
    const { currentOrganization } = route.params;
    const [driver] = useDriver();
    const [organizations, setOrganizations] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { isDark } = useTheme(); // Get the current theme

    const fetchData = () => {
        setIsLoading(true);
        setIsRefreshing(true);
        driver
            .listOrganizations()
            .then(setOrganizations)
            .catch(logError)
            .finally(() => {
                setIsLoading(false);
                setIsRefreshing(false);
            });
    };

    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, []);

    const switchOrganization = organizationId => {
        if (currentOrganization.getAttribute('id') === organizationId) {
            return Alert.alert('Warning', 'This organization already selected');
        }
        return driver
            .switchOrganization(organizationId)
            .then(() => {
                Toast.show({
                    type: 'success',
                    text1: `Switched organization`,
                });

                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'AccountScreen' }],
                    });

                    navigation.goBack();
                }, 1500);
            })
            .catch(error => {
                logError(error);
            });
    };

    const confirmSwitchOrganization = organizationId => {
        Alert.alert(
            translate('Core.ChatScreen.confirmation'),
            'Are you sure you want to switch organizations?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'OK',
                    onPress: () => switchOrganization(organizationId),
                },
            ],
            { cancelable: false }
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => confirmSwitchOrganization(item.id)}>
            <View style={[tailwind('p-1')]}>
                <View style={[tailwind('px-4 py-2 flex flex-row items-center justify-between')]}>
                    <Text style={tailwind(isDark ? 'text-gray-200' : 'text-gray-800 text-base montserrat-medium')} numberOfLines={1}>
                        {item.getAttribute('name')}
                    </Text>
                    {currentOrganization.getAttribute('id') === item.id && <FontAwesomeIcon icon={faCheck} size={15} style={tailwind('text-green-400')} />}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={tailwind(`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} flex-grow`)}>
            {isLoading ? (
                <ActivityIndicator size="small" color={getColorCode(isDark ? 'bg-gray-800' : 'bg-gray-200')} style={tailwind('mr-2')} />
            ) : (
                <View style={tailwind('flex flex-row items-center justify-between p-4')}>
                    <View>
                        <Text style={tailwind(`${isDark ? 'text-white' : 'text-gray-800'} text-base montserrat-bold`)}>
                            {translate('Account.OrganizationScreen.title')}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={tailwind('rounded-full')}>
                        <FontAwesomeIcon size={20} icon={faWindowClose} style={tailwind('text-red-400')} />
                    </TouchableOpacity>
                </View>
            )}
            {organizations.length === 0 ? (
                <Text style={tailwind(`${isDark ? 'text-gray-200' : 'text-gray-800'} text-center p-4 montserrat-medium`)}>
                    {translate('Account.OrganizationScreen.empty')}
                </Text>
            ) : (
                <FlatList
                    refreshControl={<RefreshControl refreshing={isRefreshing } onRefresh={fetchData} tintColor={getColorCode(isDark ? 'text-blue-200' : 'text-blue-500')} />}
                    data={organizations}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                />
            )}
        </View>
    );
};

export default Organization;
import { useNavigation } from '@react-navigation/native';
import { useDriver, useFleetbase, useMountedState } from 'hooks';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import tailwind from 'tailwind-rn';
import { getColorCode, translate } from 'utils';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext

const IssuesScreen = () => {
    const navigation = useNavigation();
    const isMounted = useMountedState();
    const [driver] = useDriver();
    const fleetbase = useFleetbase();
    const [issues, setIssueList] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { isDark } = useTheme(); // Get the current theme

    const fetchIssues = async () => {
        setIsLoading(true);
        try {
            const adapter = fleetbase.getAdapter();
            const response = await adapter.get('issues');
            setIssueList(response);
        } catch (error) {
            console.error('Error fetching issue:', error);
            setIssueList([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchIssues();
        });

        return unsubscribe;
    }, [isMounted]);

    const renderItem = ({ item }) => (
        <View style={tailwind('p-2')}>
            <TouchableOpacity
                style={tailwind(`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'} border shadow-sm w-full`)}
                onPress={() => navigation.navigate('IssueScreen', { issue: item, isEdit: true })}>

                <View style={[tailwind(`${isDark ? 'border-gray-800' : 'border-gray-200'} border-b py-3 px-3 flex flex-row items-start justify-between`)]}>

                    <View style={tailwind('flex flex-col')}>
                        <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold`)}>{translate('Core.IssueScreen.report')}:</Text>
                        <View style={tailwind('')}>
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-medium`)} numberOfLines={3}>
                                {item.report}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                    <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold`)}>{translate('Core.IssueScreen.driverName')}:</Text>

                    <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-medium`)}>{item.driver_name}</Text>
                </View>
                {item.vehicle_name && <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                    <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold`)}>{translate('Core.IssueScreen.vehicleName')}:</Text>
                    <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} flex-1 montserrat-medium`)} numberOfLines={1} ellipsizeMode="tail" // Add ellipsis at the end if text overflows
                    >                        {item.vehicle_name}</Text>

                </View>}
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[tailwind(`flex flex-1 items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`)]}>
                <ActivityIndicator size="large"/>
            </View>
        );
    }

    return (
        <View style={tailwind(`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} flex-grow`)}>
            <View style={tailwind('flex flex-row items-center justify-between px-4 py-2')}>
                <View>
                    <Text style={tailwind(`${isDark ? 'text-white' : 'text-black'} montserrat-bold text-base`)}>{translate('Core.IssueScreen.issues')}</Text>
                </View>
            </View>

            <FlatList
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchIssues} tintColor={getColorCode('text-blue-200')} />}
                data={issues}
                keyExtractor={item => item.id}
                renderItem={renderItem}
            />
            <View style={tailwind('p-4')}>
                <View style={tailwind('flex flex-row items-center justify-center')}>
                    <TouchableOpacity
                        style={tailwind('flex-1')}
                        onPress={() => {
                            navigation.navigate('IssueScreen');
                            // navigation.navigate('ExpenseScreen');

                        }}>
                        <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-custom'}`)}>
                            <Text style={tailwind('montserrat-bold text-gray-50 text-base')}>{translate('Core.IssueScreen.createIssue')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default IssuesScreen;

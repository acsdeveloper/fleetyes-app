import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import tailwind from 'tailwind';
import { useNavigation } from '@react-navigation/native';
import { useDriver, useFleetbase, useMountedState, getDriver, useUserIds } from 'hooks';
import { getColorCode, translate, getStatusColors } from 'utils';
import { fetchReports } from 'utils/request';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext

import OrdersStack from 'core/OrdersStack';
import { Header } from 'components';
import { faCalendarDay, faClipboardList, faCommentDots, faFileAlt, faRoute, faUser, faWallet, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';


const ExpensesScreen = ({ navigation, route }) => {
    // const navigation = useNavigation();
    const isMounted = useMountedState();
    const [driver] = useDriver();
    const [userIds] = useUserIds();
    const fleetbase = useFleetbase();
    const { isDark } = useTheme(); // Get the current theme

    const [reports, setReportList] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);           // Page tracking for pagination
    const [hasMore, setHasMore] = useState(true);  // To check if more data is available
    const [isLoadingMore, setIsLoadingMore] = useState(false); // For loading spinner at the bottom

    const fetchReportsList = async (reset = false) => {
        if (isLoadingMore || (!hasMore && !reset)) return;
        console.log('userIds', userIds['user_uuid']);
        if (reset) {
            setPage(1);
            setHasMore(true);
            setIsRefreshing(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const driverData = {
                'token': driver.token,
                'user_uuid': userIds['user_uuid'],
                'driver_uuid': userIds['driver_uuid'],
                'page': reset ? 1 : page,
                'limit': 10,  // Number of items per page
            };

            console.log("fetchReportsList", driverData);

            const response = await fetchReports(driverData);

            if (reset) {
                setReportList(response);
            } else {
                setReportList(prevReports => [...prevReports, ...response]);
            }

            // Check if more data exists and increment the page number
            if (response.length === driverData.limit) {
                setHasMore(true);
                setPage(prevPage => prevPage + 1);  // Increment page
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            if (reset) setReportList([]);
        } finally {
            if (reset) {
                setIsRefreshing(false);
            } else {
                setIsLoadingMore(false);
            }
            setIsLoading(false);
        }
    };

    // Handle loading more data on scroll
    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchReportsList(false);
        }
    };

    useEffect(() => {
        fetchReportsList(true);
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchReportsList(true);
        });

        return unsubscribe;
    }, [isMounted]);


    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={tailwind('py-4')}>
                <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
        );
    };

    const renderItem = ({ item }) => {
        // console.log(item.created_at);
        const { statusWrapperStyle, statusTextStyle } = getStatusColors(item.status);
        const createdAt = item.created_at
            ? format(parseISO(item.created_at), 'PPpp')
            : null;
        console.log("reported", item.status);
        if(item.status == "Pending Approval") {
            item.status = "pending-approval";
        }
        const statusValue = translate('status.'+item.status);
        console.log("item.report_type", item.report_type);
        return (
            <View style={[tailwind('p-2')]}>
                <TouchableOpacity style={[tailwind(`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'} border shadow-sm w-full`)]} onPress={() => navigation.navigate('ExpenseScreen', { issue: item, isEdit: true, type: item.report_type })}>
                    <View style={[tailwind(`${isDark ? 'border-gray-800' : 'border-gray-200'} border-b py-3 px-3 flex flex-row items-start justify-between`)]}>
                        <View style={[tailwind('w-full')]}>
                            <View style={[tailwind('flex flex-row items-start justify-between')]}>
                            <Text style={[tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold mb-1`)]}>{item.public_id}</Text>
                            {item.status && (
                            <View style={[
                                tailwind('flex flex-col items-end justify-start'),
                                tailwind('border'),
                                statusWrapperStyle
                            ]}>
                                <Text style={[
                                    tailwind('text-white montserrat-medium px-3 capitalize'),
                                    statusTextStyle
                                ]}>
                                    {statusValue.replace(/[-_]/g, " ")}
                                </Text>
                            </View>
                        )}
                            </View>
                            <Text style={[tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-medium mb-1`)]}>{createdAt}</Text>

                        </View>
                       
                    </View>
                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                        <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold`)}>{translate('Core.ExpenseScreen.type')}:</Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-medium`)}>{translate('Core.OrderScreen.'+ item.report_type.toLowerCase())}</Text>

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
        )
    };

    if (isLoading) {
        return (
            <View style={[tailwind(`flex flex-1 items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`)]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }


    return (
        <View style={tailwind(`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} flex-grow`)}>
            <View style={tailwind('flex flex-row items-center justify-between px-4 py-2')}>
                <View>
                    <Text style={tailwind(`${isDark ? 'text-white' : 'text-black'} montserrat-bold text-base`)}>{translate('Core.ExpenseScreen.report')}</Text>
                    
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} style={tailwind('mr-4')}>
                                    <View style={tailwind(`rounded-full ${isDark ? 'bg-gray-900' : 'bg-gray-100'} w-10 h-10 flex items-center justify-center`)}>
                                        <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-400')} />
                                    </View>
                                </TouchableOpacity> 
            </View>

            <FlatList
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchReportsList(true)}  // Pass `true` to reset
                        tintColor={getColorCode('text-blue-200')}
                    />
                }
                data={reports}
                keyExtractor={item => item.uuid}
                renderItem={renderItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
            />
            <View style={tailwind('p-4')}>
                <View style={tailwind('flex flex-row items-center justify-center')}>
                    <TouchableOpacity
                        style={tailwind('flex-1')}
                        onPress={() => {
                            navigation.navigate('ExpenseScreen', { type: 'Parking' });
                        }}>
                        <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-custom'}`)}>
                            <Text style={tailwind('montserrat-bold text-gray-50 text-base')}>{translate('Core.IssueScreen.createReportButton')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default ExpensesScreen;

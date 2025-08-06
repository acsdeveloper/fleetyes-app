import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import PhoneInput from 'components/PhoneInput';
import { useDriver, useLocale, useUserIds, useMountedState } from 'hooks';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Pressable, Text, TextInput, TouchableOpacity, View, FlatList, RefreshControl, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tailwind from 'tailwind';
import { getColorCode, logError, translate, getStatusColors } from 'utils';
import { getLocation } from 'utils/Geo';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import { LeaveType } from 'constant/Enum';
import DropdownActionSheet from '../../../components/DropdownActionSheet';
import { markUnavailability, getLeaveList, deleteLeaveRequest } from 'utils/request';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext
import Toast from 'react-native-toast-message';

const LeaveRequestScreen = ({ navigation }) => {

    const { isDark } = useTheme(); // Get the current theme

    const [locale, setLocale] = useLocale();
    const [driver, setDriver] = useDriver();
    const [userIds] = useUserIds();
    const isMounted = useMountedState();


    const [isLoading, setIsLoading] = useState(false);

    const [leaveList, setLeaveList] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [page, setPage] = useState(1);           // Page tracking for pagination
    const [hasMore, setHasMore] = useState(true);  // To check if more data is available
    const [isLoadingMore, setIsLoadingMore] = useState(false); // For loading spinner at the bottom

    useEffect(() => {
        fetchLeaveList(true);
    }, []);

    const fetchLeaveList = async (reset = false) => {
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
                'limit': 10,  // Number of items per page
            };

            console.log("getLeaveList", driverData);

            const response = await getLeaveList(driverData);
            console.log("response", response);
            if (reset) {
                setLeaveList(response);
            } else {
                setLeaveList(prevLeaveList => [...prevLeaveList, ...response]);
            }

            // Check if more data exists and increment the page number
            if (response.length === driverData.limit) {
                setHasMore(true);
                setPage(prevPage => prevPage + 1);  // Increment page
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching leave lists', error);
            if (reset) setLeaveList([]);
        } finally {
            if (reset) {
                setIsRefreshing(false);
            } else {
                setIsLoadingMore(false);
            }
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchLeaveList(true);;
        });

        return unsubscribe;
    }, [isMounted]);

    const renderItem = ({ item }) => {
        const { statusWrapperStyle, statusTextStyle } = getStatusColors(item.status);
        const startDate = item.start_date
            ? moment(item.start_date).format('dddd, Do MMMM YYYY')
            : null;
        const endDate = item.end_date
            ? moment(item.end_date).format('dddd, Do MMMM YYYY')
            : null;
        return (
            <View style={[tailwind('p-2')]}>
                <TouchableOpacity style={[tailwind(`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'} border shadow-sm w-full`)]} onPress={() => {
                    const isViewOnly = item.status === 'Approved' || item.status === 'Rejected';
                    if (isViewOnly) {
                        navigation.navigate('AddUpdateLeaveScreen', { data: item, isView: true, isEdit: false });
                    } else {
                        navigation.navigate('AddUpdateLeaveScreen', { data: item, isEdit: true });
                    }
                }}>
                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-900'} montserrat-bold`)}>{translate('Account.LeaveRequestScreen.status')}:</Text>
                        {item.status && (
                            <View style={[
                                tailwind('flex flex-col items-end justify-start'),
                                tailwind('border'),
                                statusWrapperStyle
                            ]}>
                                <Text style={[
                                    tailwind('text-white px-3 capitalize montserrat-medium'),
                                    statusTextStyle
                                ]}>
                                    {translate('dropdown.' + item.status)}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={[tailwind(`${isDark ? 'border-gray-800' : 'border-gray-200'} border-b py-3 px-3 flex flex-row items-start justify-between`)]}>
                        <View style={[tailwind('flex flex-col')]}>
                            <Text style={[tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} mb-1 montserrat-medium`)]}>{translate('Account.LeaveRequestScreen.from')}: {startDate}</Text>
                            <Text style={[tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} mb-1 montserrat-medium`)]}>{translate('Account.LeaveRequestScreen.to')}: {endDate}</Text>
                        </View>
                        {/* {item.status && (
                            <View style={[
                                tailwind('flex flex-col items-end justify-start'),
                                tailwind('border rounded-md'),
                                statusWrapperStyle
                            ]}>
                                <Text style={[
                                    tailwind('text-white mb-1 px-3 capitalize montserrat-medium'),
                                    statusTextStyle
                                ]}>
                                    {item.status}
                                </Text>
                            </View>
                        )} */}
                    </View>
                    <View style={tailwind('flex flex-row items-center justify-between py-2 px-3')}>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-900'} montserrat-bold`)}>{translate('Account.LeaveRequestScreen.leaveType')}:</Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-900'} montserrat-medium`)}>{translate('dropdown.' + item.leave_type)}</Text>
                    </View>
                    <View style={tailwind('flex py-2 px-3')}>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-900'} montserrat-bold`)}>{translate('Account.LeaveRequestScreen.reason')}:</Text>
                        <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-900'} montserrat-medium`)}>{item.reason}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    // Handle loading more data on scroll
    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchLeaveList(false);
        }
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={tailwind('py-4')}>
                <ActivityIndicator size="small" color={getColorCode(isDark ? 'text-gray-50' : 'text-gray-900')} />
            </View>
        );
    };





    return (
        <View style={tailwind(`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} flex-grow`)}>
            <View style={tailwind('flex flex-row items-center justify-between px-4 py-2')}>
                <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} text-base montserrat-bold`)}>
                    {translate('Account.LeaveRequestScreen.leaves')}
                </Text>

            </View>


            <FlatList
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchLeaveList(true)}  // Pass `true` to reset
                        tintColor={getColorCode(isDark ? 'text-blue-200' : 'text-blue-500')}
                    />
                }
                data={leaveList}
                keyExtractor={item => item.uuid}
                renderItem={renderItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
            />


            <View style={tailwind('p-4')}>
                <View style={tailwind('flex flex-row items-center justify-center')}>
                    <TouchableOpacity
                        style={tailwind('flex-1')}
                        onPress={() => {
                            // setListView(false);
                            navigation.navigate('AddUpdateLeaveScreen');

                        }}>
                        <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'}`)}>
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-white'} montserrat-bold text-base`)}>
                                {translate('Account.LeaveRequestScreen.newLeave')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

        </View>
    );
};

export default LeaveRequestScreen;
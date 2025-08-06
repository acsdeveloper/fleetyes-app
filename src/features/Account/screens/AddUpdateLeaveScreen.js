import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import PhoneInput from 'components/PhoneInput';
import { useDriver, useLocale, useUserIds } from 'hooks';
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

const AddUpdateLeaveScreen = ({ navigation, route }) => {

    const { isDark } = useTheme(); // Get the current theme
    const data = route.params;
    const isEdit = route.params;
    const [locale, setLocale] = useLocale();
    const [driver, setDriver] = useDriver();
    const [userIds] = useUserIds();

    const [isView] = useState(route.params?.isView || false);  // Set `isView` based on route param

    // State for start date and its date picker visibility
    const [startDate, setStartDate] = useState('');
    const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);

    // State for end date and its date picker visibility
    const [endDate, setEndDate] = useState('');
    const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
    // State for error messages
    const [startDateError, setStartDateError] = useState('');
    const [endDateError, setEndDateError] = useState('');
    const [leaveTypeError, setLeaveTypeError] = useState('');
    const [reasonError, setReasonError] = useState('');

    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteLoading, setDeleteIsLoading] = useState(false);
    const [dataId, setDataId] = useState('');

    useEffect(() => {
        console.log('AddUpdateLeaveScreen mounted');
        if (data) {
            setData(data.data);
        }
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
    };


    const applyLeave = async () => {
        if (!validateInputs()) {
            return;
        }

        setIsLoading(true);

        const reportData = {
            'user_uuid': userIds['user_uuid'],
            'driver_uuid': userIds['driver_uuid'],
            "start_date": formatDate(startDate),
            "end_date": formatDate(endDate),
            "reason": reason,
            "leave_type": leaveType
        };
        console.log("reportData", reportData);
        try {
            let res;

            res = await markUnavailability(reportData, driver.token, data.data?.id ? data.data?.id : "");

            console.log("res", res);
            if (res['success'] == true) {
                navigation.goBack();
                Toast.show({
                    type: 'success',
                    text1: data.data?.id ? res['message'] : translate('Account.LeaveRequestScreen.createSuccess'),
                });
                resetFields();
                setIsLoading(false);
            } else {
                Toast.show({
                    type: 'error',
                    text1: res['message'],
                });
                setIsLoading(false);
            }
        } catch (e) {
            setIsLoading(false);
        }
    };
    const resetFields = () => {
        setDataId('');
        setStartDate('');
        setStartDateError('');
        setEndDate('');
        setEndDateError('');
        setLeaveTypeError('');
        setReason('');
        setReasonError('');
        setLeaveType();
    }
    const validateStartDate = (value) => {
        setStartDate(value);
        if (!value) {
            setStartDateError(translate('Account.LeaveRequestScreen.selectStartDateError'));
        } else {
            setStartDateError('');
        }
    };

    // const validateEndDate = (value) => {
    //     setEndDate(value);
    //     if (!value) {
    //         setEndDateError(translate('Account.LeaveRequestScreen.selectEndDateError'));
    //     } else if (new Date(startDate) > new Date(value)) {
    //         setEndDateError(translate('Account.LeaveRequestScreen.dateError'));
    //     } else {
    //         setEndDateError('');
    //     }
    // };

    const validateInputs = () => {
        let isValid = true;

        // Reset error messages
        setStartDateError('');
        setEndDateError('');
        setLeaveTypeError('');
        setReasonError('');

        // Validate start date
        if (!startDate) {
            setStartDateError(translate('Account.LeaveRequestScreen.selectStartDateError'));
            isValid = false;
        }

        // Validate end date
        if (!endDate) {
            setEndDateError(translate('Account.LeaveRequestScreen.selectEndDateError'));
            isValid = false;
        } else if (new Date(startDate) > new Date(endDate)) {
            setEndDateError(translate('Account.LeaveRequestScreen.dateError'));
            isValid = false;
        }

        // Validate leave type
        if (!leaveType) {
            setLeaveTypeError(translate('Account.LeaveRequestScreen.selectLeaveTypeError'));
            isValid = false;
        }

        // Validate reason
        if (!reason) {
            setReasonError(translate('Account.LeaveRequestScreen.reasonError'));
            isValid = false;
        }

        return isValid;
    };

    // Functions to show/hide the start date picker
    const showStartDatePicker = () => {
        console.log('TouchableOpacity for Start Date pressed');
        setStartDatePickerVisibility(true);
    };
    const hideStartDatePicker = () => {
        console.log('Start Date Picker cancelled');
        setStartDatePickerVisibility(false);
    };

    // Functions to show/hide the end date picker
    const showEndDatePicker = () => {
        console.log('TouchableOpacity for End Date pressed');
        setEndDatePickerVisibility(true);
    };
    const hideEndDatePicker = () => {
        console.log('End Date Picker cancelled');
        setEndDatePickerVisibility(false);
    };

    const setData = (item) => {
        console.log(item);
        setDataId(item?.id);
        setLeaveType(item?.leave_type);
        setReason(item?.reason);
        setStartDate(item?.start_date);
        setEndDate(item?.end_date);
    };

    const deleteLeave = () => {
        Alert.alert(translate('Core.ChatScreen.confirmation'), translate('Account.LeaveRequestScreen.deleteConfirmation'), [
            {
                text: translate('Core.SettingsScreen.cancel'),
                style: 'cancel',
            },
            {
                text: translate('Account.LeaveRequestScreen.delete'),
                onPress: () => confirmDelete(),
            },
        ]);
    };

    const confirmDelete = () => {
        setDeleteIsLoading(true);
        deleteLeaveRequest(dataId, driver.token).then((res) => {
            try {
                Toast.show({
                    type: 'success',
                    text1: `Successfully deleted`,
                });
                setDeleteIsLoading(false);
                navigation.goBack();
                resetFields();
            }
            catch (error) {
                setDeleteIsLoading(false);
                logError(error);
            }
        });
    };

    const navigateBack = () => {
        navigation.goBack();
    }
    return (
        <View style={tailwind(`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} flex-grow`)}>
            <View style={tailwind('flex flex-row items-center justify-between px-4 py-2')}>
                <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'}  text-xl montserrat-bold`)}>
                    {data.isEdit ? translate('Account.LeaveRequestScreen.updateLeave') : translate('Account.LeaveRequestScreen.newLeave')}

                </Text>
                <TouchableOpacity onPress={() => navigateBack()} style={tailwind('mr-4')}>
                    <View style={tailwind(`rounded-full ${isDark ? 'bg-gray-900' : 'bg-gray-100'} w-10 h-10 flex items-center justify-center`)}>
                        <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-400')} />
                    </View>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={tailwind('p-4')}>
                <ScrollView>
                    {/* Start Date Picker */}
                    <TouchableOpacity
                        onPress={showStartDatePicker}
                        disabled={isView}
                        style={{}}
                    >
                        <View style={{width: '100%'}}>
                            <Text
                                style={tailwind(`form-input montserrat-medium ${isDark ? 'text-white' : 'bg-gray-200 border-gray-200 text-gray-900'}`)}
                            >
                                {startDate ? '📅  ' + moment(startDate).format('dddd, Do MMMM YYYY') : translate('Account.LeaveRequestScreen.startDate')}
                            </Text>
                            {startDateError ? (
                                <Text style={tailwind('text-red-500')}>{startDateError}</Text>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                    {/* End Date Picker */}
                    <TouchableOpacity
                        onPress={showEndDatePicker}
                        disabled={isView}
                        style={{ marginTop: 20 }}
                    >
                        <View style={{width: '100%'}}>
                            <Text
                                style={tailwind(`form-input montserrat-medium ${isDark ? 'text-white' : 'bg-gray-200 border-gray-200 text-gray-900'}`)}
                            >
                                {endDate ? '📅  ' + moment(endDate).format('dddd, Do MMMM YYYY') : translate('Account.LeaveRequestScreen.endDate')}
                            </Text>
                            {endDateError ? (
                                <Text style={tailwind('text-red-500')}>{endDateError}</Text>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                    <View style={tailwind('mt-5 mb-4')}>
                        <DropdownActionSheet
                            value={leaveType}
                            items={Object.keys(LeaveType).map(leave => {
                                return { label: LeaveType[leave], value: leave };
                            })}
                            onChange={isView ? () => { } : setLeaveType}
                            isDark={isDark}
                            title={translate('Account.LeaveRequestScreen.selectLeaveType')}
                            disabled={isView}
                        />
                        {leaveTypeError ? (
                            <Text style={tailwind('text-red-500')}>{leaveTypeError}</Text>
                        ) : null}
                    </View>

                    <View style={tailwind('mt-2')}>
                        <TextInput
                            value={reason}
                            onChangeText={setReason}
                            keyboardType="default"
                            multiline={true}
                            placeholder={translate('Account.LeaveRequestScreen.reason')}
                            placeholderTextColor={getColorCode(isDark ? 'text-gray-600' : 'text-gray-400')}
                            style={[
                                tailwind(`form-input montserrat-medium ${isDark ? 'text-white' : 'bg-gray-200 border-gray-200 text-gray-900'}`),
                                { height: 100, textAlignVertical: 'top' }
                            ]}
                            editable={!isView}
                        />
                        {reasonError ? (
                            <Text style={tailwind('text-red-500')}>{reasonError}</Text>
                        ) : null}
                    </View>

                    {!isView && (
                        <TouchableOpacity onPress={applyLeave} disabled={isLoading}>
                            <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'} mt-5`)}>
                                {isLoading && <ActivityIndicator color={getColorCode(isDark ? 'text-gray-50' : 'text-white')} style={tailwind('mr-2')} />}
                                <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-white'} montserrat-bold text-base text-center`)}>
                                    {data.isEdit ? translate('Account.LeaveRequestScreen.save') : translate('Account.LeaveRequestScreen.apply')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    {data.isEdit && !isView && <TouchableOpacity onPress={deleteLeave} disabled={isDeleteLoading} style={tailwind('flex')}>
                        <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'} mt-4`)}>
                            {isDeleteLoading && <ActivityIndicator color={getColorCode(isDark ? 'text-gray-50' : 'text-white')} style={tailwind('mr-2')} />}
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-white'} montserrat-bold text-base text-center`)}>
                                {translate('Account.LeaveRequestScreen.delete')}
                            </Text>
                        </View>
                    </TouchableOpacity>}
                </ScrollView>
            </KeyboardAvoidingView>
            <DatePicker
                modal
                open={isStartDatePickerVisible}
                date={startDate ? new Date(startDate) : new Date()}
                onConfirm={(date) => {
                    console.log('Start Date Picker confirmed', date);
                    setStartDate(date);
                    hideStartDatePicker();
                }}
                onCancel={hideStartDatePicker}
                mode="date"
                minimumDate={new Date()}
            />
            <DatePicker
                modal
                open={isEndDatePickerVisible}
                date={endDate ? new Date(endDate) : new Date()}
                onConfirm={(date) => {
                    console.log('End Date Picker confirmed', date);
                    setEndDate(date);
                    hideEndDatePicker();
                }}
                onCancel={hideEndDatePicker}
                mode="date"
                minimumDate={new Date()}
            />
        </View>
    );
};

export default AddUpdateLeaveScreen;
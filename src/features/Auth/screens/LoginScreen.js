import { useDriver, useFleetbase, useLocale, useUserIds } from 'hooks';

import { CommonActions } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import tailwind from 'tailwind-rn';
import { config, deepGet, getColorCode, logError, syncDevice, translate } from 'utils';
import { getString } from 'utils/Storage';
import { getVerificationCode, sendCode } from 'utils/request';
import { useTheme } from '../../../ThemeContext'; // Import Theme Hook

import { getLocation } from 'utils/Geo';

const isPhone = (phone = '') => {
    return /^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g.test(phone);
};

const LoginScreen = ({ navigation, route }) => {
    const fleetbase = useFleetbase();
    const location = getLocation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const [phone, setPhone] = useState(null);
    const [value, setInputValue] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(null);
    const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    const [locale, setLocale] = useLocale();
    const [driver, setDriver] = useDriver();
    const [userIds, setUserIds] = useUserIds();

    const _LOGO = getString('_LOGO');
    const _BRANDING_LOGO = getString('_BRANDING_LOGO');

    const isNotAwaitingVerification = isAwaitingVerification === false;
    const redirectTo = deepGet(route, 'params?.redirectTo', 'MainStack');

    console.log('FLEETBASE SDK OPTIONS', fleetbase.options);

    const sendVerificationCode = useCallback(() => {
        if (!validateEmail(email.trim())) {
            setError('Auth.LoginScreen.emailError');
            return
        }
        setIsLoading(true);
        console.log('Sending verification code');
        console.log(email);

        try {
            return sendCode(email.trim())
                .then(driver => {
                    if (driver == null) {
                        setError(null);
                        setIsLoading(false);
                        Toast.show({
                            type: 'error',
                            text1: '😅 Authentication Failed',
                            text2: 'This email is not registered as a driver.',
                        });
                        return;
                    }
                    setIsAwaitingVerification(true);
                    setError(null);
                    setIsLoading(false);
                    console.log("driver", driver);
                })
                .catch(error => {
                    logError(error);
                    setIsLoading(false);
                    Toast.show({
                        type: 'error',
                        text1: '😅 Authentication Failed',
                        text2: error.message,
                    });
                });
        } catch (error) {
            logError(error);
            setIsLoading(false);
            Toast.show({
                type: 'error',
                text1: '😅 Authentication Failed',
                text2: error.message,
            });
        }
    });

    const verifyCode = useCallback(() => {
        setIsLoading(true);

        return getVerificationCode(email.trim(), code.trim())
            .then(driver => {
                console.log("driver", driver);
                if (driver == null) {
                    setIsLoading(false);
                    Toast.show({
                        type: 'error',
                        text1: '😅 Authentication Failed',
                        text2: 'Verification code is invalid.',
                    });
                    return
                }
                setDriver(driver);
                setUserIds({ "user_uuid": driver.user_uuid, "driver_uuid": driver.driver_uuid });
                syncDevice(driver);
                setIsLoading(false);

                if (redirectTo) {
                    navigation.navigate(redirectTo);
                } else {
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'MainStack' }],
                        })
                    );
                }
            })
            .catch(error => {
                logError(error);
                Toast.show({
                    type: 'error',
                    text1: '😅 Authentication Failed',
                    text2: error.message,
                });
                retry();
            });
    });

    // Basic email regex pattern
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const retry = useCallback(() => {
        setIsLoading(false);
        setPhone(null);
        setIsAwaitingVerification(false);
    });

    return (

        <View style={[isDark ? tailwind('bg-gray-800') : tailwind('bg-white'), tailwind(`flex-row flex-1 items-center justify-center`), config('ui.loginScreen.containerStyle'), { paddingTop: insets.top }]}>
            <View style={tailwind('flex-grow')}>
                <Pressable onPress={Keyboard.dismiss} style={[tailwind('px-5 -mt-28'), config('ui.loginScreen.contentContainerStyle')]}>
                    <KeyboardAvoidingView style={tailwind('')} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
                        <View style={tailwind('mb-10 flex items-center justify-center rounded-full')}>
                            <FastImage
                                source={require('../../../../assets/logo.png')}
                                style={tailwind('w-40 h-40')}
                            />
                            {/* <AppLogo width={50} height={50} /> */}
                        </View>
                        {isNotAwaitingVerification && (
                            <View style={[tailwind('p-4'), config('ui.loginScreen.loginFormContainerStyle')]}>
                                <View style={[tailwind('form-input flex flex-row items-center px-1.5 py-1 mb-5 mx-0.5 border border-gray-100 bg-white shadow-sm'), { height: 52, elevation: 3 }]}>
                                    {/* <PhoneInput
                                        onChangePhone={setInputValue}
                                        onChangeValue={setPhone}
                                        autoFocus={true}
                                        defaultCountryCode={deepGet(location, 'country', '+1')}
                                        style={[tailwind('flex-1'), config('ui.loginScreen.phoneInputStyle')]}
                                        {...(config('ui.createAccountScreen.phoneInputProps') ?? {})}
                                    /> */}
                                    <TextInput
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (error) setError(''); // Clear error as user types
                                        }}
                                        keyboardType={'email-address'}
                                        placeholder={translate('Auth.SignUpScreen.email')}
                                        placeholderTextColor={getColorCode('text-gray-600')}
                                        style={[tailwind('h-12 px-2 w-full text-black montserrat-medium'),]}
                                    />
                                </View>
                                {error ? <Text style={tailwind('text-red-500 mb-2')}>{translate(error)}</Text> : null}
                                <TouchableOpacity style={tailwind('mb-2')} onPress={sendVerificationCode}>
                                    <View style={[tailwind(`btn border`), isDark ? tailwind('bg-gray-800 border-gray-700') : tailwind('bg-custom border-gray-300'), config('ui.loginScreen.sendVerificationCodeButtonStyle')]}>
                                        {isLoading && <ActivityIndicator size={'small'} color={getColorCode(isDark ? 'text-gray-50' : 'text-white')} style={tailwind('mr-2')} />}
                                        <Text style={[tailwind('montserrat-bold text-gray-50 text-lg text-center'), config('ui.loginScreen.sendVerificationCodeButtonTextStyle')]}>
                                            {translate('Auth.LoginScreen.sendVerificationCodeButtonText')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}





                        {isAwaitingVerification && (
                            <View style={[tailwind('p-4'), config('ui.loginScreen.verifyFormContainerStyle')]}>
                                <View style={[tailwind('border-gray-700 mb-6'), config('ui.loginScreen.verifyCodeButtonStyle')]}>
                                    <Text style={[tailwind(`montserrat-bold ${isDark ? 'text-gray-50' : 'text-black'} text-lg text-center`), config('ui.loginScreen.verifyCodeButtonTextStyle')]}>
                                        {translate('Auth.LoginScreen.verifyCodeText')}
                                    </Text>
                                </View>
                                <View style={tailwind('mb-6')}>
                                    
                                     <View style={[tailwind('form-input flex flex-row items-center px-1.5 py-1 mb-5 mx-0.5 border border-gray-100 bg-white shadow-sm'), { height: 52, elevation: 3 }]}>
                                    <TextInput
                                        onChangeText={setCode}
                                        autoFocus={true}
                                        textAlign={'center'}
                                        keyboardType={'phone-pad'}
                                        placeholder={translate('Auth.LoginScreen.codeInputPlaceholder')}
                                        placeholderTextColor={getColorCode('text-gray-600')}
                                        style={[tailwind('h-12 px-2 w-full text-black montserrat-medium'),]}
                                        {...(config('ui.loginScreen.verifyCodeInputProps') ?? {})}
                                    />
                                    </View>
                                    <View style={tailwind('flex flex-row justify-end w-full')}>
                                        <TouchableOpacity style={[tailwind('bg-gray-900 bg-opacity-50 px-4 py-2'), config('ui.loginScreen.retryButtonStyle')]} onPress={retry}>
                                            <Text style={[tailwind('text-white montserrat-bold'), config('ui.loginScreen.retryButtonTextStyle')]}>
                                                {translate('Auth.LoginScreen.retryButtonText')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={verifyCode}>
                                    <View style={[tailwind('btn border'), isDark ? tailwind('bg-gray-800 border-gray-700') : tailwind('bg-custom border-gray-300'), config('ui.loginScreen.verifyCodeButtonStyle')]}>
                                        {isLoading && <ActivityIndicator size={'small'} color={getColorCode(isDark ? 'text-gray-50' : 'text-white')} style={tailwind('mr-2')} />}
                                        <Text style={[tailwind('montserrat-bold text-gray-50 text-lg text-center'), config('ui.loginScreen.verifyCodeButtonTextStyle')]}>
                                            {translate('Auth.LoginScreen.verifyCodeButtonText')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </KeyboardAvoidingView>
                </Pressable>
            </View>
        </View>
    );
};

export default LoginScreen;

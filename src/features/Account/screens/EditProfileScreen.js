import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import PhoneInput from 'components/PhoneInput';
import { useDriver, useLocale } from 'hooks';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tailwind from 'tailwind-rn';
import { getColorCode, logError, translate } from 'utils';
import { getLocation } from 'utils/Geo';
import { useTheme } from '../../../ThemeContext'; // Adjust path if needed

const EditProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const location = getLocation();
    const { isDark } = useTheme();

    const [locale, setLocale] = useLocale();
    const [driver, setDriver] = useDriver();
    const [name, setName] = useState(driver.getAttribute('name'));
    const [email, setEmail] = useState(driver.getAttribute('email'));
    const [phone, setPhone] = useState(driver.getAttribute('phone'));
    const [isLoading, setIsLoading] = useState(false);

    const saveProfile = () => {
        setIsLoading(true);

        return driver
            .update({ name, email, phone })
            .then((driver) => {
                setDriver(driver);
                setIsLoading(false);
                navigation.goBack();
            })
            .catch((err) => {
                setIsLoading(false);
                logError(err);
            });
    };
    useEffect(() => {
    }, [phone]);
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[tailwind(`flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'}`)]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={tailwind('flex-1')}
                >
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={tailwind('pb-10')}
                    >
                        <View style={tailwind('flex-row items-center justify-between p-4')}>
                            <Text
                                style={tailwind(
                                    `${isDark ? 'text-gray-50' : 'text-gray-900'} text-xl montserrat-bold`
                                )}
                            >
                                {translate('Account.EditProfileScreen.title')}
                            </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={tailwind('mr-4')}>
                                <View
                                    style={tailwind(
                                        `rounded-full ${isDark ? 'bg-gray-900' : 'bg-gray-100'} w-10 h-10 flex items-center justify-center`
                                    )}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-400')} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={tailwind('px-4')}>
                            <View style={tailwind('mb-4')}>
                                <Text
                                    style={tailwind(
                                        `${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold text-base mb-2`
                                    )}
                                >
                                    {translate('Account.EditProfileScreen.nameLabelText')}
                                </Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    keyboardType={'default'}
                                    placeholder={translate('Account.EditProfileScreen.nameLabelText')}
                                    placeholderTextColor={getColorCode(
                                        isDark ? 'text-gray-600' : 'text-gray-100'
                                    )}
                                    style={tailwind(
                                        `form-input montserrat-medium ${isDark ? 'text-white' : 'text-gray-900 bg-gray-200 border-gray-200'}`
                                    )}
                                />
                            </View>

                            <View style={tailwind('mb-4')}>
                                <Text
                                    style={tailwind(
                                        `${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold text-base mb-2`
                                    )}
                                >
                                    {translate('Account.EditProfileScreen.emailLabelText')}
                                </Text>
                                <TextInput
                                    value={email}
                                    editable={false}
                                    keyboardType={'email-address'}
                                    placeholder={translate('Account.EditProfileScreen.emailLabelText')}
                                    placeholderTextColor={getColorCode(
                                        isDark ? 'text-gray-600' : 'text-gray-100'
                                    )}
                                    style={tailwind(
                                        `form-input montserrat-medium ${isDark ? 'text-white' : 'text-gray-900 bg-gray-200 border-gray-200'}`
                                    )}
                                />
                            </View>

                            <View style={tailwind('mb-6')}>
                                <Text
                                    style={tailwind(
                                        `${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold text-base mb-2`
                                    )}
                                >
                                    {translate('Account.EditProfileScreen.phoneLabelText')}
                                </Text>
                                <PhoneInput
                                    value={phone}
                                    onChangePhone={setPhone}
                                    defaultCountry={location?.country}
                                />
                            </View>

                            {/* Save button here */}
                            <TouchableOpacity onPress={saveProfile} disabled={isLoading} activeOpacity={0.8}>
                                <View
                                    style={tailwind(
                                        `btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'} mt-2`
                                    )}
                                >
                                    {isLoading && (
                                        <ActivityIndicator
                                            color={getColorCode(isDark ? 'text-gray-50' : 'text-white')}
                                            style={tailwind('mr-2')}
                                        />
                                    )}
                                    <Text
                                        style={tailwind(
                                            `${isDark ? 'text-gray-50' : 'text-white'} montserrat-bold text-lg text-center`
                                        )}
                                    >
                                        {translate('Account.EditProfileScreen.saveButtonText')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
};
export default EditProfileScreen;

// AccountScreen.js
import { faAdjust, faChevronRight, faFileAlt, faIdBadge, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import tailwind from 'tailwind-rn';
import { config, translate } from 'utils';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext
import ThemeToggleButton from './../../../ThemeToggleButton'; // Adjust the path to your ThemeToggleButton
import { useFleetbase } from './src/hooks';
import { useDriver } from './src/utils/Auth';

const fullHeight = Dimensions.get('window').height;

const AccountScreen = ({ navigation }) => {
    const { isDark, toggleTheme } = useTheme();

    const [driver, setDriver] = useDriver();
    const fleetbase = useFleetbase();
    const [currentOrganization, setCurrentOrganization] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const displayHeaderComponent = config(driver ? 'ui.accountScreen.displaySignedInHeaderComponent' : 'ui.accountScreen.displaySignedOutHeaderComponent') ?? true;
    const containerHeight = displayHeaderComponent === true ? fullHeight - 224 : fullHeight;

    const signOut = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'BootScreen' }],
        });
        setDriver(null);
    };

    useEffect(() => {
        driver.currentOrganization().then(setCurrentOrganization);
    }, []);

    const RenderBackground = props => {
        return (
            <View style={[tailwind('h-full'), isDark ? tailwind('bg-gray-800') : tailwind('bg-white')]}>
                {props.children}
            </View>
        );
    };

    return (
        <RenderBackground>
            <View
                style={[
                    isDark ? tailwind('bg-gray-800') : tailwind('bg-white'),
                    config('ui.accountScreen.containerStyle'),
                    driver ? config('ui.accountScreen.signedInContainerStyle') : config('ui.accountScreen.signedOutContainerStyle'),
                    { height: containerHeight },
                ]}>
                {!driver && (
                    <View style={tailwind('w-full h-full relative')}>
                        <View style={tailwind('flex items-center justify-center w-full h-full relative')}>
                            {config('ui.accountScreen.displayEmptyStatePlaceholder') === true && (
                                <View style={[tailwind('-mt-20'), config('ui.accountScreen.emptyStatePlaceholderContainerStyle')]}>
                                    <View
                                        style={[
                                            tailwind('flex items-center justify-center mb-10 rounded-full w-60 h-60'),
                                            isDark ? tailwind('bg-gray-800') : tailwind('bg-gray-200'),
                                            config('ui.accountScreen.emptyStatePlaceholderIconContainerStyle'),
                                        ]}>
                                        <FontAwesomeIcon icon={faIdBadge} size={88} style={[isDark ? tailwind('text-gray-400') : tailwind('text-gray-600'), config('ui.accountScreen.emptyStatePlaceholderIconStyle')]} />
                                    </View>
                                    <Text style={[tailwind('text-lg text-center mb-10 montserrat-medium'), isDark ? tailwind('text-gray-200') : tailwind('text-gray-800'), config('ui.accountScreen.emptyStatePlaceholderTextStyle')]}>
                                        {translate('Account.AccountScreen.title')}
                                    </Text>
                                </View>
                            )}
                            <View style={[tailwind('px-3 flex flex-row w-full'), config('ui.accountScreen.actionButtonsContainerStyle')]}>
                                <View style={tailwind('w-1/2 px-1')}>
                                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                        <View style={[tailwind('btn border'), isDark ? tailwind('bg-gray-800 border-gray-700') : tailwind('bg-gray-200 border-gray-300'), config('ui.accountScreen.loginButtonStyle')]}>
                                            <Text style={[tailwind('text-sm montserrat-medium'), isDark ? tailwind('text-gray-200') : tailwind('text-gray-800'), config('ui.accountScreen.loginButtonTextStyle')]} numberOfLines={1}>
                                                {translate('Account.AccountScreen.loginButtonText')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                                <View style={tailwind('w-1/2 px-1')}>
                                    <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')}>
                                        <View style={[tailwind('btn border'), isDark ? tailwind('bg-gray-800 border-gray-700') : tailwind('bg-gray-200 border-gray-300'), config('ui.accountScreen.createAccountButtonStyle')]}>
                                            <Text style={[tailwind('text-sm montserrat-medium'), isDark ? tailwind('text-gray-200') : tailwind('text-gray-800'), config('ui.accountScreen.createAccountButtonTextStyle')]} numberOfLines={1}>
                                                {translate('Account.AccountScreen.createAccountButtonText')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
                {driver && (
                    <View style={tailwind('w-full h-full relative')}>
                        <View style={[tailwind('p-4 border-b'), isDark ? tailwind('bg-gray-800 border-gray-700') : tailwind('bg-white border-gray-300')]}>
                            <View style={tailwind('flex flex-row')}>
                                <View style={tailwind('mr-3')}>
                                    <FastImage source={{ uri: driver.getAttribute('photo_url') }} style={tailwind('w-14 h-14 rounded-full')} />
                                </View>
                                <View>
                                    <Text style={[tailwind('text-lg montserrat-bold'), isDark ? tailwind('text-gray-200') : tailwind('text-gray-900')]}>
                                        {translate('Account.AccountScreen.userGreetingTitle', {
                                            driverName: driver.getAttribute('name'),
                                        })}
                                    </Text>
                                    <Text style={[tailwind('mb-1 montserrat-medium'), isDark ? tailwind('text-gray-400') : tailwind('text-gray-900')]}>{currentOrganization && currentOrganization.getAttribute('name')}</Text>
                                    <Text style={[isDark ? tailwind('text-gray-400') : tailwind('text-gray-900'), tailwind('montserrat-medium')]}>{driver.getAttribute('phone')}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={tailwind('mb-4')}>
                            <View>
                                <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { attributes: driver.serialize() })}>
                                    <View style={[tailwind('flex flex-row items-center justify-between p-4 border-b'), isDark ? tailwind('border-gray-700') : tailwind('border-gray-300')]}>
                                        <View style={tailwind('flex flex-row items-center')}>
                                            <FontAwesomeIcon icon={faUser} size={18} style={[isDark ? tailwind('text-gray-200') : tailwind('text-gray-900'), tailwind('mr-3')]} />
                                            <Text style={[isDark ? tailwind('text-gray-200') : tailwind('text-gray-900'), tailwind('text-base montserrat-medium')]}>{translate('Account.AccountScreen.profileLinkText')}</Text>
                                        </View>
                                        <View>
                                            <FontAwesomeIcon icon={faChevronRight} size={18} style={[isDark ? tailwind('text-gray-400') : tailwind('text-gray-600')]} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View>
                                <TouchableOpacity onPress={() => navigation.navigate('ExpensesScreen')}>
                                    <View style={[tailwind('flex flex-row items-center justify-between p-4 border-b'), isDark ? tailwind('border-gray-700') : tailwind('border-gray-300')]}>
                                        <View style={tailwind('flex flex-row items-center')}>
                                            <FontAwesomeIcon icon={faFileAlt} size={18} style={[isDark ? tailwind('text-gray-200') : tailwind('text-gray-900'), tailwind('mr-3')]} />
                                            <Text style={[isDark ? tailwind('text-gray-200') : tailwind('text-gray-900'), tailwind('text-base montserrat-medium')]}>{translate('app.menu.reports')}</Text>
                                        </View>
                                        <View>
                                            <FontAwesomeIcon icon={faChevronRight} size={18} style={[isDark ? tailwind('text-gray-400') : tailwind('text-gray-600')]} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View>
                                <View style={[tailwind('flex flex-row items-center justify-between p-4 border-b'), isDark ? tailwind('border-gray-700') : tailwind('border-gray-300')]}>
                                    <View style={tailwind('flex flex-row items-center')}>
                                        <FontAwesomeIcon icon={faAdjust} size={18} style={[isDark ? tailwind('text-gray-200') : tailwind('text-gray-900'), tailwind('mr-3')]} />
                                        <Text style={[isDark ? tailwind('text-gray-200') : tailwind('text-gray-900'), tailwind('text-base montserrat-medium')]}>{translate('app.menu.darkMode')}</Text>
                                    </View>
                                    <View>
                                        <ThemeToggleButton />
                                    </View>
                                </View>
                            </View>
                            {/* <View>
                                <TouchableOpacity onPress={() => navigation.navigate('ConfigScreen', { attributes: driver.serialize() })}>
                                    <View style={[tailwind('flex flex-row items-center justify-between p-4 border-b'), isDark ? tailwind('border-gray-700') : tailwind('border-gray-300')]}>
                                        <View style={tailwind('flex flex-row items-center')}>
                                            <FontAwesomeIcon icon={faLink} size={18} style={[isDark ? tailwind('text-gray-200') : tailwind('text-gray-900'), tailwind('mr-3')]} />
                                            <Text style={[isDark ? tailwind('text-gray-200') : tailwind('text-gray-900'), tailwind('text-base montserrat-medium')]}>{translate('Account.AccountScreen.config')}</Text>
                                        </View>
                                        <View>
                                            <FontAwesomeIcon icon={faChevronRight} size={18} style={[isDark ? tailwind('text-gray-400') : tailwind('text-gray-600')]} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View> */}
                        </View>
                        <View style={tailwind('p-4')}>
                            <View style={tailwind('flex flex-row items-center justify-center')}>
                                <TouchableOpacity style={tailwind('flex-1')} onPress={signOut}>
                                    <View style={[tailwind('btn border'), isDark ? tailwind('bg-gray-800 border-gray-700') : tailwind('bg-custom border-gray-300')]}>
                                        {isLoading && <ActivityIndicator style={tailwind('mr-2')} />}
                                        <Text style={[tailwind('text-base montserrat-bold'), isDark ? tailwind('text-gray-200') : tailwind('text-white')]}>{translate('Account.AccountScreen.signoutButtonText')}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </RenderBackground>
    );
};

export default AccountScreen;
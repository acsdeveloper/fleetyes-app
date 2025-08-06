import { Collection } from '@fleetbase/sdk';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import { LangPicker, SearchButton } from 'components';
import { useDriver, useFleetbase, useLocale } from 'hooks';
import React, { useCallback, useState } from 'react';
import { ImageBackground, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import packageJson from '../../../package.json';
import tailwind from 'tailwind';
import { config, logError, toBoolean, translate } from 'utils';
import { useTheme } from '../../ThemeContext'; // Adjust the path to your ThemeContext
import { displayName as title  } from '../../../app.json';

const DefaultHeader = props => {
    let {
        onBack,
        backButtonIcon,
        hideSearch,
        hideSearchBar,
        hideCategoryPicker,
        categories,
        searchPlaceholder,
        onSearchButtonPress,
        backgroundImage,
        backgroundImageResizeMode,
        backgroundImageStyle,
        displayLogoText,
        children,
    } = props;

    searchPlaceholder = searchPlaceholder ?? translate('components.interface.headers.DefaultHeader.search');

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const fleetbase = useFleetbase();
    const { isDark } = useTheme(); // Get the current theme

    const [locale] = useLocale();
    const [driver, setDriver] = useDriver();
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(new Collection());
    const [isOnline, setIsOnline] = useState(toBoolean(driver?.getAttribute('online')));

    const shouldDisplayLogoText = (displayLogoText ?? config('ui.headerComponent.displayLogoText')) === true;

    const appName = title;
    const appVersion = packageJson.version;

    const toggleOnline = useCallback(() => {
        setIsLoading(true);
        setIsOnline(!isOnline);

        return driver
            .update({ online: !isOnline })
            .then(setDriver)
            .catch(logError)
            .finally(() => setIsLoading(false));
    });

    const onLangChange = useCallback(() => {
        setIsLoading(true);

        return driver
            .update({ online: driver?.getAttribute('online') })
            .then(setDriver)
            .catch(logError)
            .finally(() => setIsLoading(false));
    });

    return (
        <ImageBackground
            source={backgroundImage ?? config('ui.headerComponent.backgroundImage')}
            resizeMode={backgroundImageResizeMode ?? config('ui.headerComponent.backgroundImageResizeMode')}
            style={[tailwind(`z-50 ${isDark ? 'bg-gray-800' : 'bg-custom'}`), { paddingTop: insets.top }, props.style, backgroundImageStyle ?? config('ui.headerComponent.backgroundImageStyle')]}
        >
            <View style={[tailwind(''), props.wrapperStyle, config('ui.headerComponent.containerStyle')]}>
                <View style={[tailwind('flex flex-row items-center justify-between px-4 py-1 overflow-hidden'), props.innerStyle]}>
                    <View style={tailwind('flex flex-row items-center')}>
                        {onBack && (
                            <TouchableOpacity style={tailwind('mr-2')} onPress={onBack}>
                                <View style={[tailwind(`rounded-full ${isDark ? 'bg-gray-50' : 'bg-gray-900'} w-8 h-8 flex items-center justify-center`), props.backButtonStyle ?? {}]}>
                                    <FontAwesomeIcon icon={backButtonIcon ?? faArrowLeft} style={[tailwind(isDark ? 'text-gray-900' : 'text-white'), props.backButtonIconStyle ?? {}]} />
                                </View>
                            </TouchableOpacity>
                        )}
                        {shouldDisplayLogoText && (
                            <View>
                                <Text style={[tailwind(`montserrat-bold text-lg text-white`), props.logoStyle ?? {}]}>{appName}</Text>
                                <Text style={[tailwind(`text-xs text-white montserrat-medium`)]}>{appVersion}</Text>
                            </View>
                        )}
                    </View>
                    <View style={tailwind('flex flex-row items-center')}>
                    <Text style={[tailwind(`text-xs text-white montserrat-bold`)]}>{isOnline ? translate('app.menu.online') :translate('app.menu.offline')}</Text>

                        <Switch
                            trackColor={{ false: 'rgba(209, 213, 219, 1)', true: 'rgba(52, 211, 153, 1)' }}
                            thumbColor={isOnline ? 'rgba(243, 244, 246, 1)' : 'rgba(243, 244, 246, 1)'}
                            ios_backgroundColor="rgba(209, 213, 219, 1)"
                            onValueChange={toggleOnline}
                            value={isOnline}
                            disabled={isLoading}
                        />
                    </View>
                    <View style={tailwind('flex flex-row')}>
                        {config('ui.headerComponent.displayLocalePicker') === true && config('app.enableTranslations') === true && (
                            <LangPicker wrapperStyle={tailwind('mr-2')} buttonStyle={[config('ui.headerComponent.localePickerStyle')]} onLangPress={onLangChange} />
                        )}
                    </View>
                </View>

                {!hideSearchBar && (
                    <View>
                        {!hideSearch && (
                            <View style={tailwind('px-4 py-2')}>
                                <SearchButton
                                    buttonTitle={searchPlaceholder}
                                    onPress={onSearchButtonPress}
                                    buttonStyle={[tailwind(`${isDark ? '' : 'text-gray-900 bg-gray-200 border-gray-200'}`), config('ui.headerComponent.searchButtonStyle')]}
                                    buttonIconStyle={[tailwind(`${isDark ? '' : 'text-gray-500'}`), config('ui.headerComponent.searchButtonIconStyle')]}
                                    wrapperStyle={[tailwind(`${isDark ? 'text-white' : 'text-gray-900 bg-gray-200'}`),]}
                                />
                            </View>
                        )}
                        <View>{children}</View>
                    </View>
                )}
            </View>
        </ImageBackground>
    );
};

export default DefaultHeader;
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useLocale, useMountedState } from 'hooks';
import { getLangNameFromCode } from 'language-name-map';
import localeEmoji from 'locale-emoji';
import React, { createRef } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import tailwind from 'tailwind-rn';
import { getColorCode, translate } from 'utils';
import { activeTranslations, setLanguage } from 'utils/Localize';
import { useTheme } from '../ThemeContext'; // Adjust the path to your ThemeContext

const windowHeight = Dimensions.get('window').height;
const dialogHeight = windowHeight / 1.7;

const LangPicker = ({ title, buttonStyle, wrapperStyle, hideButtonTitle, onLangPress }) => {
    const actionSheetRef = createRef();
    const isMounted = useMountedState();
    const [locale, setLocale] = useLocale();
    const { isDark } = useTheme(); // Get the current theme

    title = title ?? translate('components.interface.LangPicker.title');

    const selectLanguage = (lang) => {
        if (!isMounted()) {
            return;
        }

        setLocale(lang);
        setLanguage(lang);
        if (typeof onLangPress === 'function') {
            onLangPress(lang, actionSheetRef?.current);
        }

        actionSheetRef?.current?.hide();
    };

    return (
        <View style={[wrapperStyle]}>
            <TouchableOpacity onPress={() => actionSheetRef.current?.setModalVisible()}>
                <View style={[tailwind(`flex flex-row items-center justify-center rounded-full px-2 py-2 ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`), buttonStyle]}>
                    <Text>{localeEmoji(locale)}</Text>
                </View>
            </TouchableOpacity>

            <ActionSheet
                containerStyle={[tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'}`), { height: dialogHeight }]}
                gestureEnabled={true}
                bounceOnOpen={true}
                nestedScrollEnabled={true}
                onMomentumScrollEnd={() => actionSheetRef.current?.handleChildScrollEnd()}
                ref={actionSheetRef}
                indicatorColor={getColorCode(isDark ? 'text-gray-900' : 'text-gray-600')}
            >
                <View>
                    <View style={tailwind('px-5 py-2 flex flex-row items-center justify-between mb-0')}>
                        <View style={tailwind('flex flex-row items-center')}>
                            <Text style={tailwind(`${isDark ? 'text-white' : 'text-black'} text-lg montserrat-bold`)}>{title}</Text>
                        </View>

                        <View>
                            <TouchableOpacity onPress={() => actionSheetRef.current?.hide()}>
                                <View style={tailwind('rounded-full bg-red-700 w-8 h-8 flex items-center justify-center')}>
                                    <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-100')} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
                        {activeTranslations.map((lang, index) => (
                            <TouchableOpacity key={index} onPress={() => selectLanguage(lang)}>
                                <View style={tailwind(`flex flex-row items-center px-5 py-4 border-b ${isDark ? 'border-gray-900' : 'border-gray-300'}`)}>
                                    <View style={tailwind('w-10')}>
                                        <Text style={tailwind('text-base montserrat-medium')}>{localeEmoji(lang)}</Text>
                                    </View>
                                    <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-bold text-base`)}>
                                        {getLangNameFromCode(lang)?.native}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <View style={tailwind('w-full h-60')}></View>
                    </ScrollView>
                </View>
            </ActionSheet>
        </View>
    );
};

export default LangPicker;
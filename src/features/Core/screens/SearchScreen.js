import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import OrderCard from 'components/OrderCard';
import { useDriver, useFleetbase, useLocale, useMountedState } from 'hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, TextInput, View } from 'react-native';
import tailwind from 'tailwind-rn';
import { debounce, getColorCode, isEmpty, logError, translate } from 'utils';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext

const isAndroid = Platform.OS === 'android';

const SearchScreen = ({ navigation }) => {
    const fleetbase = useFleetbase();
    const isMounted = useMountedState();
    const searchInput = useRef();
    const [driver] = useDriver();
    const [locale] = useLocale();

    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState(null);
    const { isDark } = useTheme(); // Get the current theme

    const onOrderPress = useCallback(order => {
        navigation.push('OrderScreen', { data: order.serialize() });
    });

    const fetchResults = useCallback(async (query, cb) => {
        setIsLoading(true);

        const results = await fleetbase.orders.query({ query, driver: driver.id }).catch(logError);

        setIsLoading(false);

        if (typeof cb === 'function') {
            cb(results);
        }
    });

    const debouncedSearch = useCallback(
        debounce((query, cb) => {
            fetchResults(query, cb);
        }, 600)
    );

    useEffect(() => {
        if (isEmpty(query)) {
            return setResults([]);
        }

        debouncedSearch(query, setResults);
    }, [query]);

    console.log('[SearchScreen #results]', results);
    
    return (
        <View style={[tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'} flex-1 relative pt-4`)]}>
            <View style={tailwind('px-4')}>
                <View style={[tailwind(`flex flex-row items-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-200 border-gray-300'} border shadow-sm rounded-lg px-3 pr-2 h-12`), tailwind('relative flex-row')]}>
                    <View style={tailwind('')}>
                        <FontAwesomeIcon icon={faSearch} size={18} style={[tailwind(`${isDark ? 'text-gray-400' : 'text-gray-700'} mr-3`)]} />
                    </View>
                    <TextInput
                        ref={searchInput}
                        value={query}
                        onChangeText={setQuery}
                        autoComplete={'off'}
                        autoCorrect={false}
                        autoCapitalize={'none'}
                        autoFocus={isAndroid ? false : true}
                        clearButtonMode={'while-editing'}
                        textAlign={'left'}
                        style={tailwind(`${isDark ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-900'} montserrat-medium flex-1 h-full pr-2`)}
                        placeholder={translate('Core.SearchScreen.searchInputPlaceholderText')}
                        placeholderTextColor={getColorCode(isDark ? 'text-gray-600' : 'text-gray-400')}
                    />
                    {isLoading && (
                        <View style={tailwind('absolute inset-y-0 right-0 h-full items-center')}>
                            <View style={[tailwind('items-center justify-center flex-1 opacity-75 mr-10'), isEmpty(query) ? tailwind('mr-3.5') : null]}>
                                <ActivityIndicator color={getColorCode(isDark ? 'text-gray-400' : 'text-gray-600')} />
                            </View>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView style={tailwind('px-4')} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
                {results.map((order, index) => (
                    <OrderCard key={index} order={order} onPress={() => onOrderPress(order)} wrapperStyle={tailwind('px-0')} />
                ))}
                <View style={tailwind('w-full h-40')}></View>
            </ScrollView>
        </View>
    );
};

export default SearchScreen;
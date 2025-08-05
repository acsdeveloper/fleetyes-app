import { countries } from 'constant/Country';
import React, { useEffect, useState } from 'react';
import { Dimensions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CountryPicker, countryCodes } from 'react-native-country-codes-picker';
import * as RNLocalize from 'react-native-localize';
import tailwind from 'tailwind-rn';
import { getColorCode } from 'utils';

function isValidCountryCode(code) {
    // Regular expression to match ISO-2 alpha country codes
    var regex = /^[A-Za-z]{2}$/;

    // Check if the code matches the regular expression
    return regex.test(code);
}

function findDialCodeFromCountryCode(code) {
    const countryData = countryCodes.find(country => country.code === code);

    if (countryData) {
        return countryData.dial_code;
    }

    return null;
}

const PhoneInput = ({
    value,
    onCountryCodeSelected,
    onChangePhone,
    onChangeValue,
    defaultCountryCode = '+1',
    placeholder = '+1 (999) 999 9999',
    style = {},
    wrapperStyle = {},
    autoFocus = false,
}) => {
    const windowHeight = Dimensions.get('window').height;

    const [show, setShow] = useState(false);
    const [countryCode, setCountryCode] = useState(defaultCountryCode);
    const [input, setInput] = useState(value);

    useEffect(() => {
        const timeZone = RNLocalize.getTimeZone();
        const dialCode = findDialCodeByTimezone(timeZone);
        setCountryCode(dialCode);
    }, []);

    const findDialCodeByTimezone = timezone => {
        for (const country of countries) {
            if (country.timeZones.includes(timezone)) {
                return country.dialCode;
            }
        }
    };

    // if the default country code is alphanumeric ISO-2 convert to phone code
    useEffect(() => {
        if (isValidCountryCode(countryCode)) {
            // convert from ISO-2 to Dial Code
            const dialCode = findDialCodeFromCountryCode(countryCode);

            if (dialCode) {
                setCountryCode(dialCode);
            }
        }
    }, [setCountryCode]);

    const sortedCodes = React.useMemo(() => {
        return countryCodes
            .map(c => c.dial_code)
            .sort((a, b) => b.length - a.length);
    }, []);

    useEffect(() => {
        if (value) {
            const found = sortedCodes.find(code => value.startsWith(code));
            if (found) {
                setCountryCode(found);
                setInput(value.slice(found.length));
            } else {
                setInput(value);
            }
        }
    }, [value]);

    // Commented to avoid repeated render issue
    // useEffect(() => {
    //     const newValue = `${countryCode}${input}`;

    //     if (typeof onChangeValue === 'function') {
    //         onChangeValue(newValue);
    //     }
    // }, [input, countryCode]);

    return (
        <View style={[tailwind('flex flex-1'), { height: 52, elevation: 3 }, wrapperStyle]}>
            <View style={[tailwind('form-input flex flex-row items-center px-1.5 py-1 border border-gray-100 bg-white shadow-sm'), { height: 52, elevation: 3 }, style]}>
                <TouchableOpacity onPress={() => setShow(true)} style={tailwind('bg-gray-200 py-1.5 px-2')}>
                    <Text style={tailwind('text-black montserrat-medium')}>{countryCode}</Text>
                </TouchableOpacity>
                <TextInput
                    style={[tailwind('h-12 px-2 w-full text-black montserrat-medium'),]}
                    value={input}
                    onChangeText={text => {
                        const fullPhone = `${countryCode}${text}`;
                        if (typeof onChangePhone === 'function') {
                            onChangePhone(fullPhone);
                        }

                        setInput(text);
                    }}
                    keyboardType={'phone-pad'}
                    autoFocus={autoFocus}
                    autoComplete={'off'}
                    autoCorrect={false}
                    autoCapitalize={'none'}
                    placeholder={placeholder}
                    placeholderTextColor={getColorCode('text-gray-400')}
                />
            </View>
            <CountryPicker
                show={show}
                enableModalAvoiding={true}
                onBackdropPress={() => setShow(false)}
                popularCountries={['US', 'UK', 'SG', 'IN', 'NG']}
                inputPlaceholder={'Search your country'}
                pickerButtonOnPress={item => {
                    setCountryCode(item.dial_code);
                    setShow(false);
                    if (typeof onCountryCodeSelected === 'function') {
                        onCountryCodeSelected(item.dial_code);
                    }
                    const fullPhone = `${item.dial_code}${input}`;
                    if (typeof onChangePhone === 'function') {
                        onChangePhone(fullPhone);
                    }
                }}
                style={{
                    dialCode: {
                        color: 'black'
                    },
                    countryName: {
                        color: 'black'
                    },
                    modal: {
                        height: windowHeight / 2,
                        color: 'black'
                    },
                    textInput: {
                        paddingLeft: 15,
                        color: 'black',
                    },
                }}
            />
        </View>
    );
};

export default PhoneInput;

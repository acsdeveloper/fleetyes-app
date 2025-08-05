import countryLocaleMap from 'country-locale-map';
import { format as formatDate, isValid as isValidDate } from 'date-fns';
import Inflector from 'inflector-js';
import React from 'react';
import FastImage from 'react-native-fast-image';
import tailwind from 'tailwind-rn';
import getCurrency from './get-currency';
import { isVoid } from './Helper';

/**
 *  Utility class for formatting strings.
 *
 * @export
 * @class FormatUtil
 */
export default class FormatUtil {
    /**
     * Formats string into internationalized currency format.
     *
     * @static
     * @param {number} [amount=0]
     * @param {string} [currency='USD']
     * @param {string} [currencyDisplay='symbol']
     * @return {string}
     * @memberof FormatUtil
     */
    static currency(amount = 0, currency = 'USD', currencyDisplay = 'symbol', options = {}) {
        if (isVoid(currency)) {
            // default back to usd
            currency = 'USD';
        }

        const currencyData = getCurrency(currency);
        const locale = countryLocaleMap.getLocaleByAlpha2(currencyData?.iso2)?.replace('_', '-') ?? 'en-US';

        if (currencyData?.precision === 0) {
            options.minimumFractionDigits = 0;
            options.maximumFractionDigits = 0;
        }

        return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay, ...options }).format(amount);
    }

    /**
     * Capitalize string
     *
     * @static
     * @param {String} string
     * @return {String}
     * @memberof FormatUtil
     */
    static capitalize([first, ...rest]) {
        return first.toUpperCase() + rest.join('');
    }

    /**
     * Uppercase string
     *
     * @static
     * @param {String} string
     * @return {String}
     * @memberof FormatUtil
     */
    static uppercase(string) {
        return string.toUpperCase();
    }

    /**
     * Humanize string
     *
     * @static
     * @param {String} string
     * @return {String}
     * @memberof FormatUtil
     */
    static humanize(string) {
        if (isVoid(string) || typeof string !== 'string') {
            return '';
        }

        let result = string.toLowerCase().replace(/_+|-+/g, ' ');
        return result.charAt(0).toUpperCase() + result.slice(1);
    }

    /**
     * Titleize string
     *
     * @static
     * @param {String} string
     * @return {String}
     * @memberof FormatUtil
     */
    static titleize(string) {
        if (isVoid(string) || typeof string !== 'string') {
            return '';
        }

        // special words
        const specialWords = [
            { k: 'bl_number', v: 'BL Number' },
            { k: 'dstn_port', v: 'DSTN Port' },
            { k: 'eta', v: 'ETA' },
            { k: 'etd', v: 'ETD' },
            { k: 'id', v: 'ID' },
            { k: 'uuid', v: 'UUID' },
        ];

        for (let index = 0; index < specialWords.length; index++) {
            const sw = specialWords[index];

            if (string.includes(sw.k)) {
                string = string.replace(sw.k, sw.v);
            }
        }

        let result = string.replace(/_+|-+/g, ' ');

        return result.replace(/(?:^|\s|-|\/)\S/g, function (m) {
            return m.toUpperCase();
        });
    }

    /**
     * Format kilometers
     *
     * @static
     * @param {*} km
     * @return {*}
     * @memberof FormatUtil
     */
    static km(km) {
        return km.toFixed(2) + ' km';
    }

    /**
     * Format meters to kilometers
     *
     * @static
     * @memberof FormatUtil
     */
    static formatMetersToKilometers(meters) {
        const kilometers = meters / 1000;
        return kilometers.toFixed(2) + ' km';
    }

    /**
     * Pluralize a word
     *
     * @static
     * @param {*} km
     * @return {*}
     * @memberof FormatUtil
     */
    static pluralize(num, word) {
        return num === 1 ? `${num} ${Inflector.singularize(word)}` : `${num} ${Inflector.pluralize(word)}`;
    }

    static secondsToTime(secs) {
        const hours = Math.floor(secs / (60 * 60));
        const divisor_for_minutes = secs % (60 * 60);
        const minutes = Math.floor(divisor_for_minutes / 60);
        const divisor_for_seconds = divisor_for_minutes % 60;
        const seconds = Math.ceil(divisor_for_seconds);

        const obj = {
            h: hours,
            m: minutes,
            s: seconds,
        };

        return obj;
    }

    static formatDuration(secs) {
        let time = FormatUtil.secondsToTime(secs);
        let parts = [];

        if (time.h) {
            parts.push(`${time.h}h`);
        }

        if (time.m) {
            parts.push(`${time.m}m`);
        }

        if (parts.length < 2 && time.s) {
            parts.push(`${time.s}s`);
        }

        if (parts.length === 0) {
            parts.push('0s');
        }

        return parts.join(' ');
    }

    /**
     * Display a resource meta value formatted.
     *
     * @static
     * @param {String} string
     * @return {String}
     * @memberof HelperUtil
     */
    static formatMetaValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }

        if (isVoid(value)) {
            return 'N/A';
        }

        if (typeof value === 'string' && (value.endsWith('.png') || value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.gif'))) {
            return <FastImage source={{ uri: value }} style={[{ width: 100, height: 100 }]} />;
        }

        if (isValidDate(new Date(value))) {
            return formatDate(new Date(value), 'PPpp');
        }

        if (['import', 'export', 'one_way'].includes(value)) {
            return value.toUpperCase();
        }

        return value;
    }

    /**
     * Get styles for statuses
     *
     * @static
     * @param {String} status
     * @return {Object}
     * @memberof FormatUtil
     */
    static getStatusColors(status, inverted = false) {
        status = status?.toLowerCase();

        let statusWrapperStyle = tailwind();
        let statusTextStyle = tailwind();
        let color = 'yellow';

        switch (status) {
            case 'live':
            case 'success':
            case 'operational':
            case 'active':
            case 'created':
            case 'draft':
                statusWrapperStyle = inverted ? tailwind('bg-gray-900 border-gray-700') : tailwind('bg-gray-100 border-gray-300');
                statusTextStyle = inverted ? tailwind('text-gray-50') : tailwind('text-gray-800');
                color = 'gray';
                break;
            case 'shift_ended':
            case 'on_break':
            // case 'incident_reported':
            //     statusWrapperStyle = inverted ? tailwind('bg-gray-900 border-gray-700') : tailwind('bg-gray-300 border-gray-300');
            //     statusTextStyle = inverted ? tailwind('text-gray-50') : tailwind('text-gray-800');
            //     color = 'gray';
            //     break;
            case 'approved':
                statusWrapperStyle = inverted ? tailwind('bg-green-900 border-green-700') : tailwind('bg-green-100 border-green-300');
                statusTextStyle = inverted ? tailwind('text-green-50') : tailwind('text-green-800');
                color = 'green';
                break;
            case 'completed':
                statusWrapperStyle = inverted ? tailwind('bg-green-900 border-green-700') : tailwind('bg-green-100 border-green-300');
                statusTextStyle = inverted ? tailwind('text-green-50') : tailwind('text-green-800');
                color = 'green';
                break;

            case 'dispatched':
                statusWrapperStyle = inverted ? tailwind('bg-purple-900 border-purple-700') : tailwind('bg-purple-100 border-purple-300');
                statusTextStyle = inverted ? tailwind('text-purple-50') : tailwind('text-purple-800');
                color = 'purple';
                break;
            case 'submitted':
                statusWrapperStyle = inverted ? tailwind('bg-yellow-900 border-yellow-700') : tailwind('bg-yellow-100 border-yellow-300');
                statusTextStyle = inverted ? tailwind('text-yellow-50') : tailwind('text-yellow-800');
                color = 'yellow';
                break;
            case 'assigned':
                statusWrapperStyle = inverted ? tailwind('bg-indigo-900 border-indigo-700') : tailwind('bg-indigo-100 border-indigo-300');
                statusTextStyle = inverted ? tailwind('text-indigo-50') : tailwind('text-indigo-800');
                color = 'indigo';
                break;

            case 'disabled':
            case 'canceled':
            case 'cancelled':
            case 'order_canceled':
            case 'incomplete':
            case 'unable':
            case 'failed':
            case 'incident_reported':
            case 'rejected':
                statusWrapperStyle = inverted ? tailwind('bg-red-900 border-red-700') : tailwind('bg-red-100 border-red-300');
                statusTextStyle = inverted ? tailwind('text-red-50') : tailwind('text-red-800');
                color = 'red';
                break;

            case 'warning':
            case 'preparing':
            case 'pending':
            case 'enroute':
            case 'driver_enroute':
                statusWrapperStyle = inverted ? tailwind('bg-yellow-900 border-yellow-700') : tailwind('bg-yellow-100 border-yellow-300');
                statusTextStyle = inverted ? tailwind('text-yellow-50') : tailwind('text-yellow-800');
                color = 'yellow';
                break;
            case 'confirmed':
                statusWrapperStyle = inverted ? tailwind('bg-blue-900 border-blue-700') : tailwind('bg-blue-100 border-blue-300');
                statusTextStyle = inverted ? tailwind('text-blue-50') : tailwind('text-blue-500');
                color = 'blue';
                break;
            case 'started':
                statusWrapperStyle = inverted ? tailwind('bg-navy-900 border-navy-700') : tailwind('bg-navy-100 border-navy-300');
                statusTextStyle = inverted ? tailwind('text-navy-50') : tailwind('text-navy-800');
                color = 'navy';
                break;
            case 'info':
            case 'in_progress':
            case 'processed':
                statusWrapperStyle = inverted ? tailwind('bg-blue-900 border-blue-700') : tailwind('bg-blue-100 border-blue-300');
                statusTextStyle = inverted ? tailwind('text-blue-50') : tailwind('text-blue-800');
                color = 'blue';
                break;
            case 'pending-approval':
                statusWrapperStyle = inverted ? tailwind('bg-blue-900 border-blue-700') : tailwind('bg-blue-100 border-blue-300');
                statusTextStyle = inverted ? tailwind('text-blue-50') : tailwind('text-blue-800');
                color = 'blue';
            default:
                statusWrapperStyle = inverted ? tailwind('bg-yellow-900 border-yellow-700') : tailwind('bg-yellow-100 border-yellow-300');
                statusTextStyle = inverted ? tailwind('text-yellow-50') : tailwind('text-yellow-800');
                color = 'yellow';
                break;
        }

        return { statusWrapperStyle, statusTextStyle, color };
    }

}


const formatCurrency = FormatUtil.currency;
const formatKm = FormatUtil.km;
const formatMetersToKilometers = FormatUtil.formatMetersToKilometers;
const formatDuration = FormatUtil.formatDuration;
const capitalize = FormatUtil.capitalize;
const uppercase = FormatUtil.uppercase;
const pluralize = FormatUtil.pluralize;
const titleize = FormatUtil.titleize;
const humanize = FormatUtil.humanize;
const formatMetaValue = FormatUtil.formatMetaValue;
const getStatusColors = FormatUtil.getStatusColors;

export { capitalize, formatCurrency, formatDuration, formatKm, formatMetaValue, formatMetersToKilometers, getStatusColors, humanize, pluralize, titleize };


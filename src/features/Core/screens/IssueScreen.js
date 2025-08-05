import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IssuePriority, IssueType, Status } from 'constant/Enum';
import { useDriver, useFleetbase } from 'hooks';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tailwind from 'tailwind-rn';
import { getColorCode, getCurrentLocation, logError, translate } from 'utils';
import DropdownActionSheet from '../../../components/DropdownActionSheet';
import getIssueCategories from '../../../constant/GetIssueCategoy';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext

const IssueScreen = ({ navigation, route }) => {
    const issue = route.params;
    const isEdit = route.params;
    const { isDark } = useTheme(); // Get the current theme

    const [isLoading, setIsLoading] = useState(false);
    const fleetbase = useFleetbase();
    const [driver] = useDriver();
    const [driverId] = useState(driver.getAttribute('id'));

    const [type, setType] = useState(issue.type);
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState();
    const [priority, setPriority] = useState();
    const [status, setStatus] = useState();
    const [report, setReport] = useState(issue.report);
    const [error, setError] = useState('');
    const screenWidth = Dimensions.get('window').width;

    useEffect(() => {
        if (issue) {
            if (issue.issue?.category != null) {
                setCategory(issue.issue?.category.replace(/\s+/g, '-').toLowerCase());
            } else {
                setCategory(issue.issue?.category);
            }

            if (issue.issue?.type != null) {
                setType(issue.issue?.type.toLowerCase());
            } else {
                setType(issue.issue?.type);
            }
            setPriority(issue.issue?.priority);
            setReport(issue.issue?.report);
            setStatus(issue.issue?.status);
        }
    }, []);

    useEffect(() => {
        if (!type) return;
        setCategories(getIssueCategories(type));
    }, [type]);

    const saveIssue = () => {
        if (!validateInputs()) {
            return;
        }
        setIsLoading(true);
        const location = getCurrentLocation().then();
        const adapter = fleetbase.getAdapter();

        if (issue.issue?.id) {
            adapter
                .put(`issues/${issue.issue.id}`, {
                    type,
                    category,
                    priority,
                    report,
                    status,
                    location: location,
                    driver: driverId,
                })
                .then(() => {
                    Toast.show({
                        type: 'success',
                        text1: `Successfully updated`,
                    });
                    setIsLoading(false);
                    navigation.goBack();
                })
                .catch(error => {
                    setIsLoading(false);
                    logError(error);
                });
        } else {
            adapter
                .post('issues', {
                    type,
                    category,
                    priority,
                    report,
                    status,
                    location: location,
                    driver: driverId,
                })
                .then(() => {
                    Toast.show({
                        type: 'success',
                        text1: `Successfully created`,
                    });
                    setIsLoading(false);
                    navigation.goBack();
                })
                .catch(error => {
                    setIsLoading(false);
                    logError(error);
                });
        }
    };

    const deleteIssues = () => {
        Alert.alert(translate('Core.ChatScreen.confirmation'), translate('Core.IssueScreen.deleteIssueMessage'), [
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
        const adapter = fleetbase.getAdapter();
        adapter
            .delete(`issues/${issue.issue.id}`)
            .then(() => {
                Toast.show({
                    type: 'success',
                    text1: `Successfully deleted`,
                });
                setIsLoading(false);
                navigation.goBack();
            })
            .catch(error => {
                setIsLoading(false);
                logError(error);
            });
    };

    const validateInputs = () => {
        if (!type || !category || !priority || !status || !report?.trim()) {
            setError('This field is required.');
            return false;
        } else if (report.trim().length === 0) {
            setError('Report cannot be empty.');
            return false;
        }
        setError('');
        return true;
    };

    return (
        <View style={[tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'} w-full h-full`)]}>
            <Pressable onPress={Keyboard.dismiss} style={tailwind('w-full h-full relative')}>
                <ScrollView contentContainerStyle={tailwind('flex-grow')}>
                    <View style={tailwind('flex flex-row items-center justify-between p-4')}>
                        {issue.isEdit ? (
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} text-xl montserrat-bold`)}>{translate('Core.IssueScreen.updateIssue')}</Text>
                        ) : (
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} text-xl montserrat-bold`)}>{translate('Core.IssueScreen.createIssue')}</Text>
                        )}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={tailwind('mr-4')}>
                            <View style={tailwind(`rounded-full ${isDark ? 'bg-gray-900' : 'bg-gray-300'} w-10 h-10 flex items-center justify-center`)}>
                                <FontAwesomeIcon icon={faTimes} style={tailwind(`${isDark ? 'text-red-400' : 'text-red-600'}`)} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={tailwind('flex w-full h-full')}>
                        <KeyboardAvoidingView style={tailwind('p-4')}>
                            <View style={[isEdit.isEdit ? tailwind('flex flex-row items-center justify-between pb-1') : {}, tailwind('mb-2')]}>
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold mb-2`)}>{translate('Core.IssueScreen.type')}</Text>
                            {isEdit.isEdit ? (
                                <Text
                                    style={[
                                        tailwind(`${isDark ? 'text-white' : 'text-gray-800'} montserrat-medium text-right mb-2`),
                                        {
                                            flex: 0,                // we don’t want this to grow to fill the whole row
                                            flexShrink: 1,          // but we do let it shrink if it’s too long
                                            maxWidth: screenWidth * 0.65,  // cap at 50% of screen width (tweak as needed)
                                        },
                                    ]}
                                    numberOfLines={2}
                                    ellipsizeMode="tail"
                                >{translate('dropdown.' + type)}</Text>
                            ) : (
                                <View style={tailwind('mb-2')}>
                                    <DropdownActionSheet
                                        value={type}
                                        items={Object.keys(IssueType).map(type => {
                                            return { label: IssueType[type], value: type };
                                        })}
                                        onChange=
                                        {(data) => {
                                            setType(data);
                                            setCategory();
                                        }}
                                        isDark={isDark}
                                        title={translate('Core.IssueScreen.selectType')}
                                    />
                                </View>
                            )}
                            {error && !type ? <Text style={tailwind('text-red-500 mb-2 montserrat-medium')}>{error}</Text> : null}
                        </View>

                        <View style={[isEdit.isEdit ? tailwind('flex flex-row items-center justify-between pb-1') : {}, tailwind('mb-2')]}>
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold mb-2`)}>{translate('Core.IssueScreen.category')}</Text>
                            {isEdit.isEdit ? (
                                <Text
                                    style={[
                                        tailwind(`${isDark ? 'text-white' : 'text-gray-800'} montserrat-medium text-right mb-2`),
                                        {
                                            flex: 0,                // we don’t want this to grow to fill the whole row
                                            flexShrink: 1,          // but we do let it shrink if it’s too long
                                            maxWidth: screenWidth * 0.65,  // cap at 50% of screen width (tweak as needed)
                                        },
                                    ]}
                                    numberOfLines={2}
                                    ellipsizeMode="tail"
                                >{translate('dropdown.' + category)}</Text>
                            ) : (
                                <View style={tailwind('mb-2')}>
                                    <DropdownActionSheet
                                        value={category}
                                        items={categories?.map(category => {
                                            return { label: category, value: category };
                                        })}
                                        onChange={setCategory}
                                        isDark={isDark}
                                        title={translate('Core.IssueScreen.categoryType')}
                                    />
                                </View>
                            )}
                            {error && !category ? <Text style={tailwind('text-red-500 mb-2 montserrat-medium')}>{error}</Text> : null}
                        </View>
                        <View style={tailwind('mb-4')}>
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold mb-2`)}>{translate('Core.IssueScreen.issueReport')}</Text>
                            <TextInput
                                value={report}
                                onChangeText={setReport}
                                numberOfLines={4}
                                multiline={true}
                                placeholder={translate('Core.IssueScreen.comments')}
                                placeholderTextColor={getColorCode(`${isDark ? 'text-gray-600' : 'text-gray-400'}`)}
                                style={[tailwind(`form-input montserrat-medium ${isDark ? 'text-white' : 'bg-gray-200 border-gray-200 text-gray-900'} h-28`), { textAlignVertical: 'top' }]}

                            />
                            {error && !report?.trim() ? <Text style={tailwind('text-red-500 mt-2 mb-2 montserrat-medium')}>{error}</Text> : null}
                        </View>
                        <View style={tailwind('mb-4')}>
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold mb-2`)}>{translate('Core.IssueScreen.priority')}</Text>
                            <DropdownActionSheet
                                value={priority}
                                items={Object.keys(IssuePriority).map(priority => {
                                    return { label: IssuePriority[priority], value: priority };
                                })}
                                onChange={setPriority}
                                isDark={isDark}
                                title={translate('Core.IssueScreen.selectPriority')}
                            />
                            {error && !priority ? <Text style={tailwind('text-red-500 mt-2 mb-2 montserrat-medium')}>{error}</Text> : null}
                        </View>
                        <View style={tailwind('mb-4')}>
                            <Text style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-900'} montserrat-bold mb-2`)}>{translate('Core.IssueScreen.status')}</Text>
                            <DropdownActionSheet
                                value={status}
                                items={Object.keys(Status).map(status => {
                                    return { label: Status[status], value: status };
                                })}
                                onChange={setStatus}
                                isDark={isDark}
                                title={translate('Core.IssueScreen.selectStatus')}
                            />
                            {error && !status ? <Text style={tailwind('text-red-500 mt-2 mb-2 montserrat-medium')}>{error}</Text> : null}
                        </View>
                        <TouchableOpacity onPress={saveIssue} disabled={isLoading} style={tailwind('flex')}>
                            <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'} border mt-4`)}>
                                {isLoading && <ActivityIndicator color={getColorCode(`${isDark ? 'text-gray-50' : 'text-white'}`)} style={tailwind('mr-2')} />}
                                <Text style={tailwind('montserrat-bold text-lg text-gray-50 text-center')}>{translate('Core.IssueScreen.saveIssue')}</Text>
                            </View>
                        </TouchableOpacity>
                        {isEdit.isEdit && (
                            <TouchableOpacity onPress={deleteIssues} disabled={isLoading} style={tailwind('flex')}>
                                <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'} border mt-4`)}>
                                    <Text style={tailwind('montserrat-bold text-lg text-gray-50 text-center')}>{translate('Core.IssueScreen.deleteIssue')}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        </KeyboardAvoidingView>
                    </View>
                </ScrollView>
            </Pressable>
        </View>
    );
};

export default IssueScreen;

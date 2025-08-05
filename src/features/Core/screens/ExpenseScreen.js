import { faAngleDown, faFile, faImages, faPlus, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { PaymentMethod, volumeUnits } from 'constant/Enum';
import CurrencyPicker from "currency-picker";
import getSymbolFromCurrency from 'currency-symbol-map';
import { useDriver, useFleetbase, useUserIds } from 'hooks';
import React, { createRef, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Keyboard, KeyboardAvoidingView, PermissionsAndroid, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import CurrencyInput from 'react-native-currency-input';
import FastImage from 'react-native-fast-image';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import Toast from 'react-native-toast-message';
import tailwind from 'tailwind-rn';
import { getColorCode, getCurrentLocation, isHttpOrHttps, logError, translate } from 'utils';
import { createExpenseReport, deleteExpenseReport, deleteFile, fileUploadAPI, getNearByParkingLocation, updateExpenseReport } from 'utils/request';
import data from "../../../../packages/currency-picker/src/constants/CommonCurrency.json";
import DropdownActionSheet from '../../../components/DropdownActionSheet';
import getIssueCategories from '../../../constant/GetIssueCategoy';
import { useTheme } from '../../../ThemeContext'; // Adjust the path to your ThemeContext
const currencies = Object.values(data);

const ExpenseScreen = ({ navigation, route }) => {
    const data = route.params;
    const isEdit = route.params;
    const { isDark } = useTheme(); // Get the current theme

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [isDeleteLoading, setDeleteIsLoading] = useState(false);
    const [isFileDeleteLoading, setFileDeleteIsLoading] = useState(false);

    const fleetbase = useFleetbase();
    const [driver] = useDriver();
    const [userIds] = useUserIds();
    const [driverId] = useState(driver.getAttribute('id'));
    const [type, setType] = useState(data.type);
    const [odometer, setOdometer] = useState('');
    const [volume, setVolume] = useState('');
    const [units, setUnits] = useState('L');
    const [selectedUnits, setSelectedUnits] = useState(null);

    const [categories, setCategories] = useState([]);
    const [report, setReport] = useState(data.report);
    const [error, setError] = useState('');
    const [parkingLocation, setParkingLocation] = useState([]);
    const [cost, setCost] = useState(null);
    const [currencyCode, setCurrencyCode] = useState(driver.getAttribute('currency'));
    const [currencySymbol, setcurrencySymbol] = useState(getSymbolFromCurrency(driver.getAttribute('currency')));

    const [location, setLocation] = useState();
    const [coordinates, setCoordinates] = useState(null);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [method, setMethod] = useState('other');
    const [card, setCard] = useState('');
    const [imageSrc, setSrc] = useState(null);
    const [imageSrcData, setSrcData] = useState(null);
    const [filesData, setFilesData] = useState([]);
    const [vehicleName, setVehicleName] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [vehiclePublicId, setVehiclePublicId] = useState('');
    const [OrderId, setOrderId] = useState('');
    const actionSheetRef = createRef();
    const actionImageUploadSheetRef = createRef();
    const actionCurrenyCodeSheetRef = createRef();
    let currencyPickerRef = undefined;
    const backgroundColor = isDark ? 'bg-gray-800' : 'bg-white';
    const screenWidth = Dimensions.get('window').width;


    const fetchParkingList = async (locationData) => {
        setIsLoadingLocation(true);
        try {
            const response = await getNearByParkingLocation(locationData);
            console.log("parkingList", response);
            setParkingLocation(response['data']);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setParkingLocation([]);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    useEffect(() => {
        if (data) {
            console.log("data", data);
            setCost(data.issue?.amount);
            setMethod(data.issue?.payment_method);
            setCoordinates(data.issue?.location);
            setOdometer(data.issue?.odometer);
            setVolume(data.issue?.volume);
            if (data.isEdit) {
                setUnits(data.issue?.metric_unit);
                setCurrencyCode(data.issue?.currency);
                console.log("item", currencies);

                const item = currencies.filter(i => i.code == data.issue?.currency.toString());
                console.log("item", item);
                if (item.length > 0) {
                    setcurrencySymbol(item[0].symbol);
                }
            }

            setLatitude(data.issue?.location['coordinates'][1]);
            setLongitude(data.issue?.location['coordinates'][0]);

            if (data.issue?.files.length > 0) {
                setSrc(data.issue?.files[0].url);
                console.log("data.issue?.filesurl", data.issue?.files[0].url);
                console.log("data.issue?.files", data.issue?.files);
                setFilesData(data.issue?.files);
            }
            if (data.order != null) {
                setOrderId(data.order?.id);
            }
        }
        console.log(driver.getAttribute('vehicle'))
        setVehicleName(driver.getAttribute('vehicle') != null ? driver.getAttribute('vehicle')['name'] : "");
        setVehicleId(driver.getAttribute('vehicle') != null ? driver.getAttribute('vehicle')['uuid'] : "");
        setVehiclePublicId(driver.getAttribute('vehicle') != null ? driver.getAttribute('vehicle')['id'] : "");
    }, []);

    useEffect(() => {
        if (!type) return;
        setCategories(getIssueCategories(type));
    }, [type]);

    useEffect(() => {
        getCurrentLocation().then((value) => {
            const location = extractOriginCoordinates(value);
            const locationData = {
                'token': driver.token,
                'longitude': location[0],
                'latitude': location[1]
            };
            setLatitude(location[1]);
            setLongitude(location[0]);
            fetchParkingList(locationData);
        }).catch(logError);
    }, []);

    const extractOriginCoordinates = useCallback(_origin => {
        if (_origin?.coordinates && isArray(_origin?.coordinates)) {
            return _origin?.coordinates?.reverse();
        }
        if (_origin?.coords && _origin?.coords?.latitude && _origin?.coords?.longitude) {
            return [_origin?.coords?.longitude, _origin?.coords?.latitude];
        }
    });

    const saveReport = async () => {
        if (!validateInputs()) {
            return;
        }
        setIsLoading(true);
        const reportData = {
            "report_type": type,
            "payment_method": method,
            "odometer": odometer,
            "volume": volume,
            "metric_unit": units,
            'user_uuid': userIds['user_uuid'],
            'driver_uuid': userIds['driver_uuid'],
            "amount": cost,
            "currency": currencyCode,
            "latitude": latitude,
            "longitude": longitude,
            "driver_name": driver.getAttribute('name'),
            "vehicle_name": vehicleName,
            "vehicle_uuid": vehicleId,
            "vehicle_public_id": vehiclePublicId,
            "reported_by_uuid": userIds['user_uuid'], "order_id": OrderId
        };

        console.log(reportData);
        try {
            let res;
            if (data.issue?.uuid) {
                res = await updateExpenseReport(data.issue.uuid, reportData, driver.token);
            } else {
                res = await createExpenseReport(reportData, driver.token);
            }
            if (res['status'] === "success") {
                const reportUUID = res['data']['uuid'];
                if (filesData && filesData.length > 0) {
                    const filesToUpload = filesData.filter(file => file.public_id === "");
                    if (filesToUpload.length > 0) {
                        await Promise.all(
                            filesToUpload.map((file) => fileUploadAPI(file, driver.token, reportUUID))
                        );
                    }
                }
                Toast.show({
                    type: 'success',
                    text1: data.issue?.uuid ? 'Successfully updated' : 'Successfully created',
                });
                setIsLoading(false);
                navigation.goBack();
            }
        } catch (e) {
            setIsLoading(false);
        }
    };

    const CustomCurrencyPickerUI = () => {
        return (
            <View >
                <Text style={tailwind(`text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium`)}>{currencyCode}</Text>
            </View>
        );
    };


    const deleteIssues = () => {
        Alert.alert(translate('Core.ChatScreen.confirmation'), translate('Core.ExpenseScreen.deleteReportMessage'), [
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
        deleteExpenseReport(data.issue?.uuid, driver.token).then((res) => {
            Toast.show({
                type: 'success',
                text1: `Successfully deleted`,
            });
            setDeleteIsLoading(false);
            navigation.goBack();
        }).catch(error => {
            setDeleteIsLoading(false);
            logError(error);
        });
    };

    const validateInputs = () => {
        if (!cost) {
            setError('This field is required.');
            return false;
        }
        setError('');
        return true;
    };
    const sleep = async (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const takeImage = async () => {
        actionImageUploadSheetRef.current?.hide();
        await sleep(300);
        // 1. Define options
        const options = {
            quality: 0.5,
            maxWidth: 800,
            maxHeight: 600,
            includeBase64: true,
            saveToPhotos: true, // Optionally save the captured image to the gallery
        };

        try {
            // 2. Handle Android Permissions
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "App Camera Permission",
                        message: "App needs access to your camera.",
                        buttonPositive: "OK",
                        buttonNegative: "Cancel",
                    }
                );
                // If permission is not granted, exit the function.
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log("Camera permission denied");
                    return;
                }
            }

            // 3. Launch Camera (this part is the same for both platforms)
            const response = await launchCamera(options);
            console.log("response", response);
            // 4. Handle the response
            if (response.didCancel) {
                console.log('User cancelled camera');
                return;
            }
            if (response.errorCode) {
                console.log('Camera Error: ', response.errorMessage);
                return;
            }

            // Process the captured asset
            if (response.assets && response.assets.length > 0) {
                let asset = response.assets[0];
                console.log('Camera Asset:', asset);

                // Compress the image before uploading
                try {
                    const resizedImage = await ImageResizer.createResizedImage(
                        asset.uri,
                        800, // width
                        600, // height
                        'JPEG', // format
                        70 // quality
                    );
                    asset = {
                        ...asset,
                        uri: resizedImage.uri,
                        fileName: resizedImage.name || asset.fileName,
                        fileSize: resizedImage.size || asset.fileSize,
                        type: 'image/jpeg',
                    };
                } catch (resizeErr) {
                    console.warn('Image resize failed, using original image.', resizeErr);
                }

                const data = {
                    url: asset.uri,
                    content_type: asset.type,
                    fileName: asset.fileName,
                    size: asset.fileSize,
                    public_id: "",
                };

                setFilesData(prevFiles => [...prevFiles, data]);
                setSrc(asset.uri);
            }
        } catch (err) {
            console.error("An unexpected error occurred: ", err);
        }
    };
    // Make sure your component or function is async
    const chooseFile = async () => {
        actionImageUploadSheetRef.current?.hide();
        await sleep(300);
        const options = {
            quality: 0.5,
            maxWidth: 800,
            maxHeight: 600,
            includeBase64: true,
            // Add other options you need
            mediaType: 'photo',
            selectionLimit: 1,
        };

        try {
            // Await the result from the promise
            const response = await launchImageLibrary(options);

            // Check if the user cancelled the process
            if (response.didCancel) {
                console.log('User cancelled image picker');
                return;
            }

            // Check for errors
            if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
                return;
            }

            // Process the selected assets (it's an array)
            if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                console.log('ImagePicker Asset:', asset);

                const data = {
                    url: asset.uri,
                    content_type: asset.type,
                    fileName: asset.fileName,
                    size: asset.fileSize,
                    public_id: "",
                };

                // setSrcData(response); // You might want to set the whole asset
                setFilesData(prevFiles => [...prevFiles, data]);
                setSrc(asset.uri);
            }
        } catch (error) {
            // This will catch any unexpected errors during the launch
            console.error('An unexpected error occurred: ', error);
        }
    };
    // const chooseFile1 = () => {
    //     actionImageUploadSheetRef.current?.hide();
    //     const options = {
    //         quality: 0.5,
    //         maxWidth: 800,
    //         maxHeight: 600,
    //         includeBase64: true,
    //     };
    //     console.log("launchImageLibrary");
    //     console.log("changes happened");
    //     launchImageLibrary(
    //         {
    //           mediaType: 'photo',
    //           selectionLimit: 1,
    //           presentationStyle: 'fullScreen',
    //           includeExtra: true,
    //           useLegacy: true, // Only if your version supports it
    //         },
    //         (response) => {
    //           console.log('Full launchImageLibrary response:', JSON.stringify(response, null, 2));
    //         }
    //       );
    //       return;
    //     launchImageLibrary(options, response => {
    //         console.log("response", response);
    //         if (response.didCancel) {
    //             console.log('User  cancelled image picker');
    //         } else if (response.error) {
    //             console.log('ImagePicker Error: ', response.error);
    //         } else {
    //             console.log('ImagePicker', response?.assets[0])
    //             var data = {
    //                 url: response?.assets[0].uri,
    //                 content_type: response?.assets[0].type,
    //                 fileName: response?.assets[0].fileName,
    //                 size: response?.assets[0].fileSize,
    //                 public_id: ""
    //             };
    //             setSrcData(response);
    //             setFilesData(prevFiles => [...prevFiles, data]);
    //             setSrc(response?.assets[0].uri);
    //         }
    //     });
    // };

    const handleDelete = (item, index, uuid) => {
        Alert.alert(translate('Core.ChatScreen.confirmation'), translate('Core.ExpenseScreen.deleteFileMessage'), [
            {
                text: translate('Core.SettingsScreen.cancel'),
                style: 'cancel',
            },
            {
                text: translate('Account.LeaveRequestScreen.delete'),
                onPress: () => {
                    if (item.public_id === "") {
                        const updatedList = filesData.filter((_, i) => i !== index - 1);
                        setFilesData(updatedList);

                    } else {
                        deleteFile(uuid, driver.token).then(() => {
                            const updatedList = filesData.filter((_, i) => i !== index - 1);
                            setFilesData(updatedList);
                            Toast.show({
                                type: 'success',
                                text1: `Successfully deleted`,
                            });
                        }).catch(logError);
                    }
                },
            },
        ]);
    };


    const openMedia = async (url) => {
        let isServerFile = await isHttpOrHttps(url);
        if (!isServerFile) {
            FileViewer.open(url);
        } else {
            const fileNameParts = url?.split('/')?.pop()?.split('?');
            const fileName = fileNameParts.length > 0 ? fileNameParts[0] : '';
            const localFile = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            const options = {
                fromUrl: url,
                toFile: localFile,
            };
            RNFS.downloadFile(options).promise.then(() => {
                RNFS.readDir(RNFS.DocumentDirectoryPath);
                FileViewer.open(localFile);
            });
        }
    };

    const checkIsImage = (documentType) => {
        console.log(documentType.content_type);
        return documentType.content_type.startsWith('image/');
    };


    const renderPhoto = ({ item, index, onDelete }) => {
        if (item.content_type === 'upload') {
            return <TouchableOpacity onPress={() => actionImageUploadSheetRef.current?.setModalVisible()} disabled={isLoading} style={tailwind('flex mb-4')}>
                <View style={{
                    width: 100,
                    height: 100,
                    marginRight: 10,
                    position: 'relative' // Ensures the delete icon stacks properly
                }}>
                    <View style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#716B6BFF',
                    }}>

                        <FontAwesomeIcon icon={faImages} size={50} style={tailwind('text-gray-300')} />
                        <View

                            style={{
                                position: 'absolute',
                                top: 50,
                                right: 20,
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: 12,
                                padding: 4,
                                elevation: 3, // For shadow effect on Android
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 1,
                            }}
                        >
                            <FontAwesomeIcon icon={faPlus} size={20} style={tailwind('text-green-500')} />
                        </View>
                    </View>


                </View>
            </TouchableOpacity>
        } else {

            return (
                <View style={{
                    width: 100,
                    height: 100,
                    marginRight: 10,
                    position: 'relative'
                }}>
                    {isFileDeleteLoading && <ActivityIndicator color={getColorCode('text-gray-50')} style={tailwind('mr-2')} />}


                    <View style={tailwind(`flex rounded-md ${backgroundColor} mt-2 mr-3`)} key={index.toString()}>
                        <TouchableOpacity
                            onPress={() => {
                                openMedia(item.url);
                            }}>
                            {checkIsImage(item) ? (
                                <FastImage
                                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                                    resizeMode={FastImage.resizeMode.cover}
                                    source={{ uri: item.url }}
                                    onError={(error) => console.log('Error loading image', error)}
                                    fallback={true}
                                />
                            ) : (
                                <View style={tailwind('items-center justify-between p-1')}>
                                    <FontAwesomeIcon size={70} icon={faFile} style={tailwind('text-gray-400')} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => onDelete(item, index, item.uuid)}
                        style={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: 12,
                            padding: 4,
                            elevation: 3,
                        }}
                    >
                        <FontAwesomeIcon icon={faTrash} size={20} style={tailwind('text-red-500')} />
                    </TouchableOpacity>
                </View>
            );
        };
    }


    const handleItemSelection = item => {
        setSelectedUnits(item);
        setUnits(item.units);
        actionSheetRef.current?.hide();
    };


    const handleCurrencySelection = item => {
        actionCurrenyCodeSheetRef.current?.hide();
    };

    const formatCurrency = (text) => {
        // Remove all non-numeric characters
        const numericValue = text.replace(/[^0-9]/g, '');

        // Format the numeric value as currency
        const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Update the state with the formatted value
        setValue(formattedValue);
    };
    return (
        <KeyboardAvoidingView style={tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'} flex-1`)}>
            <ScrollView>
                <View style={tailwind('w-full h-full')}>
                    <Pressable onPress={Keyboard.dismiss} style={tailwind('w-full h-full relative')}>
                        <View style={tailwind('flex flex-row items-center justify-between p-4')}>
                            <Text style={tailwind(`${isDark ? ' text-xl text-gray-50 montserrat-bold' : 'text-xl text-gray-900 montserrat-bold'}`)}>
                                {data.isEdit ? translate('Core.ExpenseScreen.updateReport') : translate('Core.ExpenseScreen.newReport')}
                            </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={tailwind('mr-4')}>
                                <View style={tailwind(`rounded-full ${isDark ? "bg-gray-900" : "bg-gray-300"} w-10 h-10 flex items-center justify-center`)}>
                                    <FontAwesomeIcon icon={faTimes} style={tailwind(`${isDark ? 'text-red-400' : 'text-red-600'}`)} />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={tailwind('flex w-full h-full')}>
                            <KeyboardAvoidingView style={tailwind('p-4')}>
                                <View style={tailwind('flex flex-row items-center justify-between pb-2')}>
                                    <Text style={tailwind(`${isDark ? 'text-gray-50 mb-2' : 'text-gray-900 mb-2'} montserrat-bold`)}>
                                        {translate('Core.ExpenseScreen.type')}
                                    </Text>
                                    <Text style={tailwind(`${isDark ? 'text-white' : 'text-gray-800'} montserrat-medium`)}>{translate('Core.OrderScreen.' + type.toLowerCase())}</Text>
                                </View>
                                <View style={tailwind('flex flex-row items-center justify-between pb-2')}>
                                    <Text style={tailwind(`${isDark ? 'text-gray-50 mb-2' : 'text-gray-900 mb-2'} montserrat-bold`)}>
                                        {translate('Core.ExpenseScreen.reporter')}
                                    </Text>
                                    <Text style={tailwind(`${isDark ? 'text-white' : 'text-gray-800'} montserrat-medium`)}>{driver.getAttribute('name')}</Text>
                                </View>
                                <View style={tailwind('flex flex-row items-center justify-between pb-2')}>
                                    <Text style={tailwind(`${isDark ? 'text-gray-50 mb-2' : 'text-gray-900 mb-2'} montserrat-bold`)}>
                                        {translate('Core.ExpenseScreen.driver')}
                                    </Text>
                                    <Text style={tailwind(`${isDark ? 'text-white' : 'text-gray-800'} montserrat-medium`)}>{driver.getAttribute('name')}</Text>
                                </View>

                                {vehicleName && (
                                    <View style={tailwind('flex flex-row items-center justify-between pb-2')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`${isDark ? 'text-gray-50 mb-2' : 'text-gray-900 mb-2'} montserrat-bold`)}>
                                                {translate('Core.IssueScreen.vehicleName')}
                                            </Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium`)}>{vehicleName}</Text>
                                        </View>
                                    </View>
                                )}
                                {OrderId && (
                                    <View style={tailwind('flex flex-row items-center justify-between pb-2')}>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`${isDark ? 'text-gray-50 mb-2' : 'text-gray-900 mb-2'} montserrat-bold`)}>
                                                {"Order Id"}
                                            </Text>
                                        </View>
                                        <View style={tailwind('flex-1 flex-col items-end')}>
                                            <Text style={tailwind(`${isDark ? 'text-gray-100' : 'text-gray-800'} montserrat-medium`)}>{OrderId}</Text>
                                        </View>
                                    </View>
                                )}
                                {type === "Parking" && !isEdit.isEdit && (
                                    <View style={isEdit.isEdit ? tailwind('flex flex-row items-center justify-between pb-2') : {}}>
                                        <Text style={tailwind(`${isDark ? 'text-gray-50 mb-2' : 'text-gray-900 mb-2'} montserrat-bold`)}>
                                            {translate('Core.ExpenseScreen.location')}
                                        </Text>
                                        {isLoadingLocation ? (
                                            <ActivityIndicator color={getColorCode(isDark ? 'text-gray-50' : 'text-black')} style={tailwind('mr-2')} />
                                        ) : (
                                            <View style={tailwind('mb-4')}>
                                                <DropdownActionSheet
                                                    isLocation={true}
                                                    value={location}
                                                    items={parkingLocation.map(data => ({
                                                        label: data.name,
                                                        value: data,
                                                    }))}
                                                    onChange={(data) => {
                                                        setLocation(data.name);
                                                        setLatitude(data.location['coordinates'][1]);
                                                        setLongitude(data.location['coordinates'][0]);
                                                        setCoordinates(data.location);
                                                    }}
                                                    isDark={isDark}
                                                    title={translate('Core.ExpenseScreen.selectLocation')}
                                                />
                                            </View>
                                        )}
                                    </View>
                                )}
                                {type === "Parking" && coordinates && (
                                    <View style={tailwind('flex flex-row items-center justify-between pb-2')}>
                                        <View style={tailwind('mb-2 flex-1')}>
                                            <Text style={tailwind(`${isDark ? 'text-gray-50 mb-1' : 'text-gray-900 mb-1'} montserrat-bold`)}>
                                                {translate('Core.ExpenseScreen.latitude')}
                                            </Text>
                                            <View style={tailwind('flex-1')}>
                                                <Text style={tailwind(`${isDark ? 'text-gray-50 mb-1 py-2' : 'text-gray-900 mb-1 py-2'} montserrat-bold`)}>
                                                    {latitude}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={tailwind('mb-2 flex-1')}>
                                            <Text style={tailwind(`${isDark ? 'text-gray-50 mb-1' : 'text-gray-900 mb-1'} montserrat-bold`)}>
                                                {translate('Core.ExpenseScreen.longitude')}
                                            </Text>
                                            <View style={tailwind('flex-1')}>
                                                <Text style={tailwind(`${isDark ? 'text-gray-50 mb-1 py-2' : 'text-gray-900 mb-1 py-2'} montserrat-bold`)}>
                                                    {longitude}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                )}
                                {type === "Fuel" && (
                                    <View style={tailwind('flex flex-row items-center justify-between pb-4')}>
                                        <View style={tailwind('flex-1 mr-2')}>
                                            <Text style={[tailwind(`${isDark ? 'text-gray-50 mb-2' : 'text-gray-900 mb-2'} montserrat-bold`), {
                                                flex: 0,                // we don’t want this to grow to fill the whole row
                                                flexShrink: 1,          // but we do let it shrink if it’s too long
                                                maxWidth: screenWidth * 0.65,  // cap at 50% of screen width (tweak as needed)
                                            },]} numberOfLines={1}
                                                ellipsizeMode="tail">
                                                {translate('Core.ExpenseScreen.odometer')}
                                            </Text>
                                            <TextInput
                                                onChangeText={setOdometer}
                                                value={odometer}
                                                keyboardType={'phone-pad'}
                                                style={[tailwind('form-input flex flex-row'), tailwind(`form-input ${isDark ? 'text-white' : 'bg-gray-200 border-gray-200 text-gray-900'}`), { color: isDark ? 'white' : 'black' ,shadowColor: 'transparent', shadowOpacity: 0,shadowOffset: { width: 0, height: 0 },shadowRadius: 0,elevation: 0}]}
                                            />
                                        </View>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind(`${isDark ? 'text-gray-50 mb-2' : 'text-gray-900 mb-2'} montserrat-bold`)}>
                                                {translate('Core.ExpenseScreen.volume')}
                                            </Text>
                                            <View style={tailwind('flex flex-row items-center justify-between')}>
                                                <View style={tailwind('flex-1')}>
                                                    <TextInput
                                                        onChangeText={setVolume}
                                                        value={volume}
                                                        keyboardType={'phone-pad'}
                                                        style={[tailwind('form-input flex flex-row'), tailwind(`form-input ${isDark ? 'text-white' : 'bg-gray-200 border-gray-200 text-gray-900'}`), { color: isDark ? 'white' : 'black', shadowColor: 'transparent',shadowOpacity: 0,shadowOffset: { width: 0, height: 0 },shadowRadius: 0,elevation: 0}]}
                                                    />
                                                </View>
                                                <View>
                                                    <TouchableOpacity onPress={() => actionSheetRef.current?.setModalVisible()}>
                                                        <View style={[tailwind(`${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex flex-row items-center justify-between px-3`),{ paddingTop: 16, paddingBottom: 16, height: 52 }]}>
                                                            <Text style={tailwind(`${isDark ? 'text-gray-50 bg-gray-700 border border-gray-700 italic' : 'text-gray-900 bg-gray-300 border border-gray-300 italic'} montserrat-bold`)}>
                                                                {units}
                                                            </Text>
                                                            <FontAwesomeIcon icon={faAngleDown} style={tailwind(`${isDark ? 'text-gray-50' : 'text-gray-500'}`)} />
                                                        </View>
                                                    </TouchableOpacity>
                                                    <ActionSheet
                                                        gestureEnabled={true}
                                                        bounceOnOpen={true}
                                                        nestedScrollEnabled={true}
                                                        onMomentumScrollEnd={() => actionSheetRef.current?.handleChildScrollEnd()}
                                                        ref={actionSheetRef}
                                                        containerStyle={[tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'}`)]}
                                                        indicatorColor={getColorCode(isDark ? 'text-gray-900' : 'text-gray-600')}>
                                                        <View>
                                                            <View style={tailwind('px-5 py-2 flex flex-row items-center justify-between mb-2')}>
                                                                <View style={tailwind('flex flex-row items-center')}>
                                                                    <Text style={tailwind(`${isDark ? 'text-white' : 'text-black'} text-lg montserrat-bold`)}>{selectedUnits != null ? selectedUnits?.label : translate('Core.ExpenseScreen.volume')}</Text>
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
                                                                {volumeUnits?.map(item => (
                                                                    <TouchableOpacity key={item.units} onPress={() => handleItemSelection(item)}>
                                                                        <View style={tailwind(`flex flex-row items-center px-5 py-4 border-b ${isDark ? 'border-gray-900' : 'border-gray-300'}`)}>
                                                                            <Text style={tailwind(`text-lg ${isDark ? 'text-gray-100' : 'text-gray-800'} mr-2 montserrat-bold`)}>{item.label}</Text>
                                                                            <Text style={tailwind(`text-lg ${isDark ? 'text-gray-100' : 'text-gray-800'} italic montserrat-bold`)}>({item.units})</Text>
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                ))}
                                                                <View style={tailwind('w-full h-40')}></View>
                                                            </ScrollView>
                                                        </View>
                                                    </ActionSheet>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                <View style={tailwind('mb-4')}>
                                    <Text style={tailwind(`${isDark ? 'text-gray-50 mb-1' : 'text-gray-900 mb-1 montserrat-bold'}`)}>
                                        {translate('Core.ExpenseScreen.cost')}
                                    </Text>
                                    <View style={tailwind('flex flex-row items-center justify-between pb-2')}>
                                        <View style={{height: 52}}>
                                            <CurrencyPicker
                                                currencyPickerRef={(ref) => { currencyPickerRef = ref }}
                                                enable={true}
                                                darkMode={isDark}
                                                currencyCode={currencyCode}
                                                showFlag={false}
                                                showCurrencyName={false}
                                                showCurrencyCode={true}
                                                onSelectCurrency={(data) => {
                                                    console.log("DATA", data)
                                                    setCurrencyCode(data['code'])
                                                    setcurrencySymbol(data['symbol'])
                                                    currencyPickerRef.current?.close()
                                                }}
                                                onOpen={() => { console.log("Open") }}
                                                onClose={() => { console.log("Close") }}
                                                showNativeSymbol={false}
                                                showSymbol={true}
                                                containerStyle={{
                                                    container: {
                                                        ...tailwind(`${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex flex-row items-center justify-between px-3`),
                                                        paddingTop: 16,
                                                        paddingBottom: 16,
                                                        height: 52,
                                                    },
                                                    flagWidth: 25,
                                                    currencyCodeStyle: {},
                                                    currencyNameStyle: {},
                                                    symbolStyle: {},
                                                    symbolNativeStyle: {}
                                                }}
                                                modalStyle={{
                                                    container: {},
                                                    searchStyle: {},
                                                    tileStyle: {},
                                                    itemStyle: {
                                                        itemContainer: {},
                                                        flagWidth: 25,
                                                        currencyCodeStyle: {},
                                                        currencyNameStyle: {},
                                                        symbolStyle: {},
                                                        symbolNativeStyle: {}
                                                    }
                                                }}
                                                title={"Currency"}
                                                searchPlaceholder={"Search"}
                                                showCloseButton={true}
                                                showModalTitle={true}
                                                renderChildren={<CustomCurrencyPickerUI />}

                                            />

                                            {/* <CurrencyPicker
                                                currencyPickerRef={(ref) => {
                                                    currencyPickerRef.current = ref;
                                                }}
                                                enable={true}
                                                darkMode={isDark}
                                                currencyCode={currencyCode}
                                                showFlag={false}
                                                showCurrencyName={false}
                                                showCurrencyCode={true}
                                                onSelectCurrency={(data) => {
                                                    console.log("DATA", data)
                                                    setCurrencyCode(data['code'])
                                                    setcurrencySymbol(data['symbol'])
                                                    currencyPickerRef.current?.close()
                                                }}
                                                onOpen={() => {
                                                    console.log("Open")
                                                }}
                                                onClose={() => {
                                                    console.log("Close")
                                                }}
                                                showNativeSymbol={true}
                                                showSymbol={false}
                                                containerStyle={{
                                                    container: {
                                                        ...tailwind(`${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex flex-row items-center justify-between px-3`),
                                                        paddingTop: 16,
                                                        paddingBottom: 16
                                                    },
                                                    flagWidth: 25,
                                                    currencyCodeStyle: {},
                                                    currencyNameStyle: {},
                                                    symbolStyle: {},
                                                    symbolNativeStyle: {}
                                                }}
                                                modalStyle={{
                                                    container: {},
                                                    searchStyle: {},
                                                    tileStyle: {},
                                                    itemStyle: {
                                                        itemContainer: {},
                                                        flagWidth: 25,
                                                        currencyCodeStyle: {},
                                                        currencyNameStyle: {},
                                                        symbolStyle: {},
                                                        symbolNativeStyle: {}
                                                    }
                                                }}
                                                title={"Currency"}
                                                searchPlaceholder={"Search"}
                                                showCloseButton={true}
                                                showModalTitle={true}
                                                renderChildren={<CustomCurrencyPickerUI />}

                                            /> */}
                                        </View>
                                        <View style={tailwind('flex-1')}>

                                            <CurrencyInput
                                                value={cost}
                                                onChangeValue={setCost}
                                                renderTextInput={textInputProps => <TextInput {...textInputProps} variant='filled' style={[
                                                    tailwind(`form-input ${isDark ? 'text-white' : 'bg-gray-200 border-gray-200 text-gray-900'}`),
                                                    { color: isDark ? 'white' : 'black', textAlign: 'right',borderWidth: 0,shadowColor: 'transparent',shadowOpacity: 0,shadowOffset: { width: 0, height: 0 },shadowRadius: 0,elevation: 0}
                                                ]} />}
                                                renderText
                                                prefix={currencySymbol}
                                                delimiter=","
                                                separator="."
                                            />
                                        </View>
                                    </View>
                                </View>
                                <View style={tailwind('mb-4')}>
                                    <Text style={tailwind(`${isDark ? 'montserrat-bold text-gray-50 mb-2' : 'montserrat-bold text-gray-900 mb-2'}`)}>
                                        {translate('Core.ExpenseScreen.paymentMethod')}
                                    </Text>
                                    <DropdownActionSheet
                                        value={method}
                                        items={Object.keys(PaymentMethod).map(method => {
                                            return { label: PaymentMethod[method], value: method };
                                        })}
                                        onChange={setMethod}
                                        isDark={isDark}
                                        title={translate('Core.ExpenseScreen.selectPaymentMethod')}
                                    />
                                    {error && !type ? <Text style={tailwind('text-red-500 mb-2')}>{error}</Text> : null}
                                </View>
                                <View style={tailwind('mb-4')}>
                                    <View style={tailwind('mb-2')}>
                                        <ScrollView horizontal>
                                            <FlatList
                                                horizontal
                                                scrollEnabled={false}
                                                data={[{ content_type: 'upload' }, ...filesData]}
                                                renderItem={({ item, index }) => renderPhoto({ item, index, onDelete: handleDelete })}
                                                keyExtractor={(item, index) => index.toString()}
                                                contentContainerStyle={{
                                                    paddingHorizontal: 10,
                                                }}
                                                ItemSeparatorComponent={() => <View style={{ width: 5 }} />} // Space between items
                                                showsHorizontalScrollIndicator={true}
                                            />
                                        </ScrollView>
                                    </View>
                                    <ActionSheet
                                        gestureEnabled={true}
                                        bounceOnOpen={true}
                                        nestedScrollEnabled={true}
                                        onMomentumScrollEnd={() => actionImageUploadSheetRef.current?.handleChildScrollEnd()}
                                        ref={actionImageUploadSheetRef}
                                        containerStyle={[tailwind(`${isDark ? 'bg-gray-800' : 'bg-white'}`)]}
                                        indicatorColor={getColorCode(isDark ? 'text-gray-900' : 'text-gray-600')}>
                                        <View>
                                            <View style={tailwind('px-5 py-2 flex flex-row items-center justify-between mb-4')}>
                                                <View style={tailwind('flex flex-row items-center')}>
                                                    <Text style={tailwind(`${isDark ? 'text-white' : 'text-black'} text-lg montserrat-bold`)}>{translate('Core.ExpenseScreen.chooseFrom')}</Text>
                                                </View>
                                                <View>
                                                    <TouchableOpacity onPress={() => actionImageUploadSheetRef.current?.hide()}>
                                                        <View style={tailwind('rounded-full bg-red-700 w-8 h-8 flex items-center justify-center')}>
                                                            <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-100')} />
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
                                                <View style={tailwind(`flex flex-row items-center py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-300'}`)}>
                                                    <TouchableOpacity key={"Camera"} onPress={() => takeImage()}>
                                                        <View style={tailwind('flex flex-row items-center px-5 py-2')}>
                                                            <Text style={tailwind(`text-lg ${isDark ? 'text-gray-100' : 'text-gray-800'} mr-2 montserrat-bold`)}>{translate('Core.ExpenseScreen.camera')}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={tailwind(`flex flex-row items-center border-b ${isDark ? 'border-gray-800' : 'border-gray-300'}`)}>
                                                    <TouchableOpacity key={"gallery"} onPress={() => chooseFile()}>
                                                        <View style={tailwind('flex flex-row items-center px-5 py-4 border-b border-gray-300')}>
                                                            <Text style={tailwind(`text-lg ${isDark ? 'text-gray-100' : 'text-gray-800'} mr-2 montserrat-bold`)}>{translate('Core.ExpenseScreen.gallery')}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            </ScrollView>
                                        </View>
                                    </ActionSheet>
                                </View>
                                <TouchableOpacity onPress={saveReport} disabled={isLoading} style={tailwind('flex')}>
                                    <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'} border mt-4`)}>
                                        {isLoading && <ActivityIndicator color={getColorCode(isDark ? 'text-gray-50' : 'text-white')} style={tailwind('mr-2')} />}
                                        <Text style={tailwind(`text-lg ${isDark ? 'text-gray-50' : 'text-white'} montserrat-bold text-center`)}>
                                            {isEdit.isEdit ? translate('Core.ExpenseScreen.saveReport', { reportType: type }) : translate('Core.ExpenseScreen.createReport', { reportType: type })}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {isEdit.isEdit && (
                                    <TouchableOpacity onPress={deleteIssues} disabled={isDeleteLoading} style={tailwind('flex')}>
                                        <View style={tailwind(`btn ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-custom border-gray-300'} border mt-4`)}>
                                            {isDeleteLoading && <ActivityIndicator color={getColorCode(isDark ? 'text-gray-50' : 'text-white')} style={tailwind('mr-2')} />}
                                            <Text style={tailwind(`text-lg ${isDark ? 'text-gray-50' : 'text-white'} montserrat-bold text-center`)}>
                                                {translate('Core.ExpenseScreen.deleteReport', { reportType: type })}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </KeyboardAvoidingView>
                        </View>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ExpenseScreen;
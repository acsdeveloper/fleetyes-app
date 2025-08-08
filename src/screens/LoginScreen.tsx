import { toast } from '@backpackapp-io/react-native-toast';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Dimensions, Image, SafeAreaView, StyleSheet, TextInput } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, Stack, Text, YStack, useTheme } from 'tamagui';
import { AppleLoginButton, FacebookLoginButton, GoogleLoginButton } from '../components/Buttons';
import { useAuth } from '../contexts/AuthContext';
import useOAuth from '../hooks/use-oauth';
import { navigatorConfig } from '../utils';
import { titleize } from '../utils/format';

const LoginScreen = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const windowHeight = Dimensions.get('window').height;
    const { login, loginSupported, loading } = useOAuth();
    const { sendOtpToEmail, verifyOtpWithEmail, isSendingOtp, isVerifyingOtp } = useAuth();
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);

    const handleSendOtp = async () => {
        if (isSendingOtp) {
            return;
        }

        if (!email) {
            return toast.error('Please enter your email address.');
        }

        if (!isValidEmail(email)) {
            return toast.error('Please enter a valid email address.');
        }

        try {
            await sendOtpToEmail(email);
            setIsAwaitingVerification(true);
            toast.success('Verification code sent to your email.');
        } catch (error) {
            toast.error(error.message || 'Failed to send verification code.');
        }
    };

    const handleVerifyOtp = async () => {
        if (isVerifyingOtp) {
            return;
        }

        if (!otpCode) {
            return toast.error('Please enter the verification code.');
        }

        try {
            await verifyOtpWithEmail(email, otpCode);
            toast.success('Login successful!');
        } catch (error) {
            toast.error(error.message || 'Failed to verify code.');
        }
    };

    const handleRetry = () => {
        setEmail('');
        setOtpCode('');
        setIsAwaitingVerification(false);
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleOAuthLogin = async (provider) => {
        try {
            const response = await login(provider);
            toast.success(`Logged in with ${titleize(provider)}`);
        } catch (err) {
            console.warn('Error attempting OAuth login:', err);
        }
    };

    // Safe color access with fallbacks
    const getIconColor = () => '#6B7280'; // Gray-500 color

    return (
        <YStack flex={1} height='100%' width='100%' bg={navigatorConfig('colors.loginBackground')} position='relative'>
            <LinearGradient colors={['rgba(0, 0, 0, 0.0)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.8)']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            <YStack justifyContent='center' alignItems='center' paddingTop={insets.top} marginTop={windowHeight / 4}>
                <Image source={require('../../assets/navigator-icon-transparent.png')} style={{ width: 60, height: 60 }} />
            </YStack>
            <SafeAreaView style={{ flex: 1 }}>
                <YStack flex={1} justifyContent='flex-end' alignItems='center' space='$4' px='$5' pb='$6'>
                    <YStack space='$3' width='100%' mb='$4'>
                        <Text color='$gray-200' fontWeight='bold' fontSize='$6' textAlign='center' mb='$2'>
                            Welcome Back
                        </Text>
                        <Text color='$gray-400' fontSize='$3' textAlign='center' mb='$4'>
                            Sign in to your account
                        </Text>
                        
                        {!isAwaitingVerification ? (
                            // Email Input Step
                            <YStack space='$3' mb='$4'>
                                <Stack
                                    backgroundColor='$gray-800'
                                    borderColor='$gray-700'
                                    borderWidth={1}
                                    borderRadius='$3'
                                    paddingHorizontal='$3'
                                    paddingVertical='$2'
                                    flexDirection='row'
                                    alignItems='center'
                                >
                                    <FontAwesomeIcon icon={faEnvelope} color={getIconColor()} size={16} />
                                    <TextInput
                                        style={{ flex: 1, color: '#E5E7EB', fontSize: 16, paddingHorizontal: 12 }}
                                        placeholder="Email address"
                                        placeholderTextColor="#9CA3AF"
                                        onChangeText={setEmail}
                                        value={email}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </Stack>

                                <Button 
                                    size='$5' 
                                    onPress={handleSendOtp} 
                                    bg='$primary' 
                                    width='100%' 
                                    opacity={isSendingOtp ? 0.75 : 1} 
                                    disabled={isSendingOtp} 
                                    borderRadius='$3'
                                    mb='$3'
                                >
                                    <Button.Icon>
                                        {isSendingOtp ? <Spinner color='$white' /> : null}
                                    </Button.Icon>
                                    <Button.Text color='$white' fontWeight='bold'>
                                        {isSendingOtp ? 'Sending Code...' : 'Send Verification Code'}
                                    </Button.Text>
                                </Button>
                            </YStack>
                        ) : (
                            // OTP Verification Step
                            <YStack space='$3' mb='$4'>
                                <Text color='$gray-300' fontSize='$4' textAlign='center' mb='$2'>
                                    Code sent to {email}
                                </Text>
                                
                                <Stack
                                    backgroundColor='$gray-800'
                                    borderColor='$gray-700'
                                    borderWidth={1}
                                    borderRadius='$3'
                                    paddingHorizontal='$3'
                                    paddingVertical='$2'
                                    flexDirection='row'
                                    alignItems='center'
                                >
                                    <FontAwesomeIcon icon={faLock} color={getIconColor()} size={16} />
                                    <TextInput
                                        style={{ flex: 1, color: '#E5E7EB', fontSize: 16, paddingHorizontal: 12, textAlign: 'center' }}
                                        placeholder="Enter verification code"
                                        placeholderTextColor="#9CA3AF"
                                        onChangeText={setOtpCode}
                                        value={otpCode}
                                        keyboardType="phone-pad"
                                        autoFocus={true}
                                        maxLength={6}
                                    />
                                </Stack>

                                <Button 
                                    size='$5' 
                                    onPress={handleVerifyOtp} 
                                    bg='$primary' 
                                    width='100%' 
                                    opacity={isVerifyingOtp ? 0.75 : 1} 
                                    disabled={isVerifyingOtp} 
                                    borderRadius='$3'
                                    mb='$3'
                                >
                                    <Button.Icon>
                                        {isVerifyingOtp ? <Spinner color='$white' /> : null}
                                    </Button.Icon>
                                    <Button.Text color='$white' fontWeight='bold'>
                                        {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
                                    </Button.Text>
                                </Button>

                                <Button 
                                    size='$4' 
                                    onPress={handleRetry} 
                                    bg='transparent' 
                                    width='100%' 
                                    borderRadius='$3'
                                    borderWidth={1}
                                    borderColor='$gray-600'
                                >
                                    <Button.Text color='$gray-300' fontWeight='bold'>
                                        Try Again
                                    </Button.Text>
                                </Button>
                            </YStack>
                        )}

                        <Button 
                            size='$4' 
                            onPress={() => navigation.navigate('CreateAccount')} 
                            bg='transparent' 
                            width='100%' 
                            borderRadius='$3'
                            borderWidth={1}
                            borderColor='$gray-600'
                        >
                            <Button.Text color='$gray-300' fontWeight='bold'>
                                Create Account
                            </Button.Text>
                        </Button>
                    </YStack>

                    <YStack space='$3' width='100%'>
                        {loginSupported('apple') && (
                            <AppleLoginButton onPress={() => handleOAuthLogin('apple')} />
                        )}
                        {loginSupported('google') && (
                            <GoogleLoginButton onPress={() => handleOAuthLogin('google')} />
                        )}
                        {loginSupported('facebook') && (
                            <FacebookLoginButton onPress={() => handleOAuthLogin('facebook')} />
                        )}
                    </YStack>

                    <Text color='$textSecondary' fontSize='$2'>
                        v{DeviceInfo.getVersion()} #{DeviceInfo.getBuildNumber()}
                    </Text>
                </YStack>
            </SafeAreaView>
            {loading && (
                <YStack justifyContent='center' alignItems='center' bg='rgba(0, 0, 0, 0.6)' position='absolute' top={0} bottom={0} left={0} right={0}>
                    <Spinner size='large' color='white' />
                </YStack>
            )}
        </YStack>
    );
};

export default LoginScreen;

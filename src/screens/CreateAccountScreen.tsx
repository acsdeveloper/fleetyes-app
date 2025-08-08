import { toast } from '@backpackapp-io/react-native-toast';
import { faEnvelope, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Keyboard, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Button, Spinner, Text, XStack, YStack, useTheme } from 'tamagui';
import BackButton from '../components/BackButton';
import Input from '../components/Input';
import { useAuth } from '../contexts/AuthContext';

const CreateAccountScreen = ({ route }) => {
    const params = route.params || {};
    const navigation = useNavigation();
    const theme = useTheme();
    const { createAccountWithEmailOtp, verifyAccountCreationOtp, isCreatingAccount, isVerifyingOtp } = useAuth();
    const [email, setEmail] = useState(params.email || '');
    const [otpCode, setOtpCode] = useState('');
    const [name, setName] = useState(params.name || '');
    const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);

    const handleSendOtp = async () => {
        if (isCreatingAccount) {
            return;
        }

        if (!email || !name) {
            return toast.error('Please fill in all fields.');
        }

        if (!isValidEmail(email)) {
            return toast.error('Please enter a valid email address.');
        }

        try {
            await createAccountWithEmailOtp(email, { name });
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
            await verifyAccountCreationOtp(email, otpCode, { name });
            toast.success('Account created successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to verify code.');
        }
    };

    const handleRetry = () => {
        setEmail('');
        setOtpCode('');
        setName('');
        setIsAwaitingVerification(false);
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    // Safe color access with fallbacks
    const getIconColor = () => '#6B7280'; // Gray-500 color

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background.val }}>
            <LinearGradient colors={['rgba(0, 0, 0, 0.0)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.8)']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            <YStack flex={1} alignItems='center' space='$3'>
                <YStack width='100%' padding='$5'>
                    <XStack space='$3' alignItems='center' mb='$5'>
                        <BackButton size={40} />
                        <Text color='$textPrimary' fontWeight='bold' fontSize='$8'>
                            Create Account
                        </Text>
                    </XStack>

                    {!isAwaitingVerification ? (
                        // Account Creation Step
                        <YStack space='$3' mb='$4'>
                            <Input
                                value={name}
                                onChangeText={setName}
                                placeholder='Enter your name'
                                leftIcon={<FontAwesomeIcon icon={faUser} color={getIconColor()} />}
                            />
                            <Input
                                value={email}
                                onChangeText={setEmail}
                                placeholder='Enter your email'
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                leftIcon={<FontAwesomeIcon icon={faEnvelope} color={getIconColor()} />}
                            />

                            <Button
                                size='$5'
                                onPress={handleSendOtp}
                                bg='$primary'
                                width='100%'
                                opacity={isCreatingAccount ? 0.75 : 1}
                                disabled={isCreatingAccount}
                                borderRadius='$3'
                                mb='$3'
                            >
                                <Button.Icon>
                                    {isCreatingAccount ? <Spinner color='$white' /> : null}
                                </Button.Icon>
                                <Button.Text color='$white' fontWeight='bold'>
                                    {isCreatingAccount ? 'Sending Code...' : 'Send Verification Code'}
                                </Button.Text>
                            </Button>
                        </YStack>
                    ) : (
                        // OTP Verification Step
                        <YStack space='$3' mb='$4'>
                            <Text color='$gray-300' fontSize='$4' textAlign='center' mb='$2'>
                                Code sent to {email}
                            </Text>
                            
                            <Input
                                value={otpCode}
                                onChangeText={setOtpCode}
                                placeholder='Enter verification code'
                                keyboardType="phone-pad"
                                autoFocus={true}
                                maxLength={6}
                                leftIcon={<FontAwesomeIcon icon={faLock} color={getIconColor()} />}
                            />

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
                                    {isVerifyingOtp ? 'Creating Account...' : 'Create Account'}
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
                </YStack>

                <YStack flex={1} position='relative' width='100%'>
                    <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} pointerEvents='box-only' />
                </YStack>

                <YStack space='$3' width='100%' padding='$5'>
                    <Button
                        size='$5'
                        onPress={handleLogin}
                        bg='$secondary'
                        width='100%'
                        opacity={isCreatingAccount || isVerifyingOtp ? 0.75 : 1}
                        disabled={isCreatingAccount || isVerifyingOtp}
                        borderRadius='$3'
                    >
                        <Button.Text color='$textPrimary' fontWeight='bold'>
                            Have an account already? Login
                        </Button.Text>
                    </Button>
                </YStack>
            </YStack>
        </SafeAreaView>
    );
};

export default CreateAccountScreen;

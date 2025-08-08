import { useIsNotAuthenticated } from '../../contexts/AuthContext';
import CreateAccountScreen from '../../screens/CreateAccountScreen';
import LoginScreen from '../../screens/LoginScreen';

export const Login = {
    if: useIsNotAuthenticated,
    screen: LoginScreen,
    options: {
        headerShown: false,
        gestureEnabled: false,
        animation: 'none',
    },
};

export const CreateAccount = {
    if: useIsNotAuthenticated,
    screen: CreateAccountScreen,
    options: {
        headerShown: false,
    },
};

export default {
    Login,
    CreateAccount,
};

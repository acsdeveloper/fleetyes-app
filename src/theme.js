// ThemeContext.js
import React from 'react';
import { useColorScheme } from 'react-native';
import { View, Text } from 'react-native';

const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = React.useState(systemTheme === 'dark');

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {/* Root wrapper with dark/light class */}
      <View className={isDark ? 'dark' : 'light'}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
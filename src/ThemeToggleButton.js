// ThemeToggleButton.js
import React from 'react';
import { Switch, View, Text } from 'react-native';
import { useTheme } from './ThemeContext'; // Adjust the path to your ThemeContext

const ThemeToggleButton = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#10F651FF' }}
            thumbColor={isDark ? '#EFF2EFFF' : '#f4f3f4'}
        />
    );
};

export default ThemeToggleButton;
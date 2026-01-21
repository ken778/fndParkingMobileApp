import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import SignUpScreen from './pages/SignUpScreen';
import LoginScreen from './pages/LoginScreen';
import LandingScreen from './pages/LandingScreen';
import { auth } from './FirebaseConfig';
import React, { useState, useEffect } from 'react';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileScreen from './pages/ProfileScreen';
import SettingsScreen from './pages/SettingsScreen';
import HistoryScreen from './pages/HistoryScreen';
import * as SecureStore from 'expo-secure-store';
import AboutScreen from './pages/AboutScreen';
import HelpSupportScreen from './pages/HelpSupportScreen';
import PrivacyScreen from './pages/PrivacyScreen';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const Stack = createStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  

  const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading data:', e);
    return null;
  }
};

//for expo secure sore 
const getUserData = async (key) => {
  try {
    const jsonValue = await SecureStore.getItemAsync(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading data:', e);
    return null;
  }
};


  // Handle user auth state changes
useEffect(() => {
  const userLoggedin = getData('user');
  const currentUser = getUserData('user')
  
  if(currentUser) {
    console.log("User logged in:", userLoggedin); // Add this line
    setUser(currentUser);
    setInitializing(false);
  }
}, []);

  // Show loading indicator while checking auth state
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <ThemedAppNavigator />
    </ThemeProvider>
  );
}

function ThemedAppNavigator() {
  const { isDark } = useTheme();
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator>
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen} 
          options={{ 
            headerShown: false, animation:"fade"
          }} 
        />
         <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
          <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
           <Stack.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
  
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
        <Stack.Screen 
          name="AboutScreen" 
          component={AboutScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
        <Stack.Screen 
          name="HelpSupportScreen" 
          component={HelpSupportScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
        <Stack.Screen 
          name="PrivacyScreen" 
          component={PrivacyScreen} 
          options={{ headerShown: false, animation:"fade" }} 
        />
    
 
      </Stack.Navigator>
    </NavigationContainer>
  );
}
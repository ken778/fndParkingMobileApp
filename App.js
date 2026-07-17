import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import SignUpScreen from './pages/SignUpScreen';
import LoginScreen from './pages/LoginScreen';
import LandingScreen from './pages/LandingScreen';
import EditProfileScreen from './pages/EditProfileScreen';
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

  const getUserData = async (key) => {
    try {
      const jsonValue = await SecureStore.getItemAsync(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data:', e);
      return null;
    }
  };

  useEffect(() => {
  // Listen for Firebase Auth state changes
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      setUser(firebaseUser); // User logged in!
      // Optional: Save to SecureStore here if you still need it locally
      // SecureStore.setItemAsync('user', JSON.stringify(firebaseUser));
    } else {
      setUser(null); // User logged out
    }
    setInitializing(false);
  });

  // Cleanup listener on unmount
  return () => unsubscribe();
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
      {/* ✅ FIX 1: Pass the 'user' state down to the navigator as a prop! */}
      <ThemedAppNavigator user={user} />
    </ThemeProvider>
  );
}

// ✅ FIX 2: Accept 'user' as a prop in the function parameters
function ThemedAppNavigator({ user }) {
  const { isDark } = useTheme();
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  // ✅ FIX 3: Define screens in arrays. This prevents any React Navigation Fragment errors.
  const appScreens = [
    { name: "Landing", component: LandingScreen },
    { name: "Profile", component: ProfileScreen },
    { name: "Settings", component: SettingsScreen },
    { name: "History", component: HistoryScreen },
    { name: "AboutScreen", component: AboutScreen },
    { name: "HelpSupportScreen", component: HelpSupportScreen },
    { name: "PrivacyScreen", component: PrivacyScreen },
    { name: "EditProfileScreen", component: EditProfileScreen }
  ];

  const authScreens = [
    { name: "Login", component: LoginScreen },
    { name: "SignUp", component: SignUpScreen },
    { name: "ForgotPassword", component: ForgotPasswordScreen },
  ];

  // Choose which array to render based on the 'user' prop
  const screensToRender = user ? appScreens : authScreens;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* No need to check 'initializing' here because the App component 
          already handles the loading screen and won't render this until it's false! */}
      <Stack.Navigator>
        {/* Map over the array to render the screens safely */}
        {screensToRender.map((screen) => (
          <Stack.Screen 
            key={screen.name}
            name={screen.name} 
            component={screen.component} 
            options={{ headerShown: false, animation: "fade" }} 
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
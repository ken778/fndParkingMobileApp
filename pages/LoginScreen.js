import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Add Firestore imports
import React, { useState, useEffect } from 'react';
import { auth, db } from '../FirebaseConfig'; // Make sure to import db
import AsyncStorage from '@react-native-async-storage/async-storage';
import { increment } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(30))[0];
  const logoScale = useState(new Animated.Value(1))[0];

  // const storeData = async (key, value) => {
  //   try {
  //     const jsonValue = JSON.stringify(value);
  //     await AsyncStorage.setItem(key, jsonValue);
  //     console.log('Data saved successfully');
  //   } catch (e) {
  //     console.error('Error saving data:', e);
  //   }
  // };

  //const error messages 
  const authErrorMessages = {
  // User doesn't exist
  'auth/user-not-found': 'No account found with this email. Please check your email or sign up.',
  
  // Wrong password
  'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
  
  // Invalid email format
  'auth/invalid-email': 'Please enter a valid email address (e.g., name@example.com).',
  
  // User disabled
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  
  // Too many requests
  'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later or reset your password.',
  
  // Network errors
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  
  // Invalid credentials (generic)
  'auth/invalid-credential': 'Invalid login credentials. Please check your email and password.',
  
  // Default fallback
  'default': 'Unable to sign in. Please check your credentials and try again.',
};
  //for expo secure 
  const storeUserData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await SecureStore.setItemAsync(key, jsonValue);
    return true;
  } catch (e) {
    console.error('Error saving data:', e);
    return false;
  }
};

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, []);

 const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please enter both email and password");
    return;
  }

  setIsLoading(true);

  try {
    // 1. Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Firebase Auth successful for user:', user.uid);

    // 2. Check user status in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    console.log('User document exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data:', userData);
      
      // 3. Check if user is deactivated
      if (userData.status === 'deactivated') {
        console.log('User is deactivated, signing out...');
        // Sign out the user immediately
        await auth.signOut();
        Alert.alert(
          "Account Deactivated", 
          "Your account has been deactivated. Please contact support for assistance. kennethtumi18@gmail.com"
        );
        setIsLoading(false);
        return;
      }
      
      // 4. Update last login timestamp for active users
      console.log('User is active, updating last login...');
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Create user document if it doesn't exist (backward compatibility)
      console.log('Creating user document...');
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: user.email?.split('@')[0] || 'User',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        parkingSpotsCount: 0
      });
    }

    // 5. Store user data and navigate
    // await storeData('user', {
    //   uid: user.uid,
    //   email: user.email,
    //   name: userDoc.exists() ? userDoc.data().name : user.email?.split('@')[0],
    //   role: userDoc.exists() ? userDoc.data().role : 'user'
    // });
    //for expo secure data
     await storeUserData('user', {
      uid: user.uid,
      email: user.email,
      name: userDoc.exists() ? userDoc.data().name : user.email?.split('@')[0],
      role: userDoc.exists() ? userDoc.data().role : 'user'
    });


    console.log('Login successful, navigating to Landing...');
    setIsLoading(false);
    navigation.navigate('Landing');
    
  } catch (error) {
    console.error('Login error details:', error);
    setIsLoading(false);
    
    // let errorMessage = "Login failed. Please try again.";
    
    // switch(error.code) {
    //   case 'auth/invalid-email':
    //     errorMessage = "Invalid email address";
    //     break;
    //   case 'auth/user-disabled':
    //     errorMessage = "This account has been disabled by administrator";
    //     break;
    //   case 'auth/user-not-found':
    //     errorMessage = "No account found with this email";
    //     break;
    //   case 'auth/wrong-password':
    //     errorMessage = "Invalid email or password";
    //     break;
    //   case 'auth/network-request-failed':
    //     errorMessage = "Network error. Please check your connection.";
    //     break;
    //   default:
    //     errorMessage = error.message;
    // }
     const errorCode = error.code;
     const errorMessage = authErrorMessages[errorCode] || authErrorMessages.default;
    
    Alert.alert("Login Error", errorMessage);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[styles.innerContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
        >
          <Animated.Image
              source={require('../assets/logo.png')} 
            style={[styles.logo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          
        <View style={styles.inputContainer}>
  <TextInput
    style={styles.input}
    placeholder="Email"
    placeholderTextColor="#b5b5b5"
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
    autoComplete="email"
  />
  
  <View style={styles.passwordWrapper}>
    <TextInput
      style={[styles.input, styles.passwordInput]}
      placeholder="Password"
      placeholderTextColor="#b5b5b5"
      value={password}
      onChangeText={setPassword}
      secureTextEntry={!passwordVisible}
      autoComplete="password"
    />
    <TouchableOpacity
      style={styles.iconContainer}
      onPress={() => setPasswordVisible(!passwordVisible)}
    >
      <Ionicons
        name={passwordVisible ? "eye-off" : "eye"}
        size={22}
        color="#666"
      />
    </TouchableOpacity>
  </View>
</View>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={isLoading ? ['#ccc', '#aaa'] : ['#4a6da7', '#3b5998']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.6}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.6}
            >
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

// Your styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  innerContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    borderRadius:100
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50, // Make room for the eye icon
  },
  iconContainer: {
    position: 'absolute',
    right: 15,
    top: 16,
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  input: {
    height: 50,
    borderWidth: 0,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
  },
  button: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  forgotPassword: {
    marginTop: 20,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    marginRight: 5,
  },
  footerLink: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default LoginScreen;
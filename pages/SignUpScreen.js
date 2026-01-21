import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Add Firestore imports
import React, { useState, useEffect } from 'react';
import { auth, db } from '../FirebaseConfig'; // Make sure db is exported from FirebaseConfig
import { Ionicons } from '@expo/vector-icons';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(''); // Add name field
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(30))[0];
  const logoScale = useState(new Animated.Value(1))[0];

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

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setIsLoading(true);
    // Add button press animation
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name: name.trim(),
        role: 'user', // Default role for new users
        status: 'active', // Default status - active
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        parkingSpotsCount: 0, // Initialize count
        // You can add more fields as needed
      });

      setIsLoading(false);
      Alert.alert("Success", "Account created successfully!");
      navigation.replace('Landing');
      
    } catch (error) {
      setIsLoading(false);
      console.error('Signup error:', error);
      
      let errorMessage = "Signup failed. Please try again.";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection.";
          break;
        default:
          errorMessage = error.message;
      }
      
      Alert.alert("Signup Error", errorMessage);
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
          
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to get started</Text>
         <View style={styles.inputContainer}>
  {/* Add Name Input */}
  <TextInput
    style={styles.input}
    placeholder="Full Name"
    placeholderTextColor="#b5b5b5"
    value={name}
    onChangeText={setName}
    autoCapitalize="words"
    autoComplete="name"
  />
  
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
  
  {/* Password Input */}
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
      accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
    >
      <Ionicons
        name={passwordVisible ? "eye-off" : "eye"}
        size={22}
        color="#666"
      />
    </TouchableOpacity>
  </View>
  
  {/* Confirm Password Input */}
  <View style={styles.passwordWrapper}>
    <TextInput
      style={[styles.input, styles.passwordInput]}
      placeholder="Confirm Password"
      placeholderTextColor="#b5b5b5"
      value={confirmPassword}
      onChangeText={setConfirmPassword}
      secureTextEntry={!confirmPasswordVisible}
      autoComplete="password"
    />
    <TouchableOpacity
      style={styles.iconContainer}
      onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
      accessibilityLabel={confirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
    >
      <Ionicons
        name={confirmPasswordVisible ? "eye-off" : "eye"}
        size={22}
        color="#666"
      />
    </TouchableOpacity>
  </View>
</View>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSignup}
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
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.6}
            >
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

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
  passwordWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
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

export default SignUpScreen;
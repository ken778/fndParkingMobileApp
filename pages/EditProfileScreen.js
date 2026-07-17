import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { auth, db } from '../FirebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updateEmail } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';

const EditProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Set initial state from Auth
        setEmail(user.email || '');
        setFullName(user.displayName || '');

        // Override with Firestore data if it exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.name) setFullName(data.name);
          if (data.email) setEmail(data.email);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Could not load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const updatedName = fullName.trim();
      const updatedEmail = email.trim();

      // 1. Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        name: updatedName,
        email: updatedEmail,
      });

      // 2. Update Firebase Auth (Note: changing email requires recent login)
      if (updatedEmail !== user.email) {
        await updateEmail(user, updatedEmail);
      }
      if (updatedName !== user.displayName) {
        await updateProfile(user, { displayName: updatedName });
      }

      // 3. Update SecureStore to keep local cache in sync
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.name = updatedName;
        parsedUser.email = updatedEmail;
        await SecureStore.setItemAsync('user', JSON.stringify(parsedUser));
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Firebase specific security requirement for email changes
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Action Required', 
          'For security reasons, please log out and log back in before changing your email address.'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#4285F4" style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary || '#4285F4' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>

          {/* Full Name Input */}
          <View style={styles.inputItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#E8F0FE' }]}>
              <Icon name="person" size={20} color="#4285F4" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#E8F0FE' }]}>
              <Icon name="email" size={20} color="#4285F4" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={email}
                placeholder="Your email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>
        </View>

        <Text style={styles.hintText}>
          Note: Your email address is linked to your account and cannot be changed from this screen.
        </Text>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#4285F4',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  inputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  inputContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  disabledInput: {
    color: '#777',
    backgroundColor: '#F7F7F7',
  },
  hintText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#94B8FF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
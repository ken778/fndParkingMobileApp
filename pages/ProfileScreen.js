import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { auth, db } from '../FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import { parkingSpotsService } from '../services/firebaseService';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';




const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [initials, setInitials] = useState(null)
  const [spots, setSpots] = useState([]);
  const [error, setError] = useState('');
  const [fraudSpots, setfraudSpots] = useState('');



  // Generate dynamic color for avatar based on email
  const getAvatarColor = (email) => {
    if (!email) return '#4285F4';

    const colors = [
      '#4285F4', // Blue
      '#34A853', // Green
      '#FBBC05', // Yellow
      '#EA4335', // Red
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
    ];

    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const menuItems = [
    { icon: 'settings', label: 'Settings', color: '#4285F4' },
    { icon: 'security', label: 'Privacy', color: '#34A853' },
    { icon: 'help-outline', label: 'Help & Support', color: '#FBBC05' },
    { icon: 'info-outline', label: 'About', color: '#9C27B0' },
    { icon: 'logout', label: 'Logout', color: '#EA4335' },
  ];


  //extract initials
  // utils/avatarUtils.js
  const getInitialsFromEmail = (email) => {
    if (!email || typeof email !== 'string') {
      return '?';
    }

    try {
      // Extract the part before @
      const namePart = email.split('@')[0];

      // Split by common separators: numbers, dots, underscores, hyphens
      const parts = namePart.split(/[0-9._\-]/).filter(part => part.length > 0);

      if (parts.length === 0) {
        // If nothing after splitting, just get first character
        return namePart.charAt(0).toUpperCase() || '?';
      }

      if (parts.length === 1) {
        // Single part like "katlego" - just get first letter
        return parts[0].charAt(0).toUpperCase();
      }

      // Multiple parts like ["kenneth", "tumi"] - get first letter of first two parts
      return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
    } catch (error) {
      console.error('Error extracting initials:', error);
      return '?';
    }
  };

  useEffect(() => {
    fetchUserData();
    getUserData()



  }, []);
  //getting location count 
  const loadParkingSpots = async (uid) => {
    try {
      setLoading(true);
      setError('');


      const spotsData = await parkingSpotsService.getParkingSpots(uid);
      setSpots(spotsData);
    } catch (error) {
      setError(`Failed to load parking spots: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeData = async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing data:', e);
    }
  };

  //logout
  const logout = async () => {
    try {
      await signOut(auth);
      await removeData('user');

      // Use reset instead of navigate to completely replace the navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  //get fraud reported locations
  const getFraudReported = async (userId) => {
    const fraudData = await parkingSpotsService.getFraudReportedLocations(userId);
    setfraudSpots(fraudData)

  }



  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {

          // If no user document exists, use basic auth info
          setUserData({
            email: user.email,
            displayName: user.displayName || 'User',
            createdAt: user.metadata.creationTime,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Could not load profile data');
    } finally {
      setLoading(false);
    }
  };

  //getting user data from expo storage 
  const getUserData = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');

      if (userData) {
        // Parse the JSON string back to object
        const parsedData = JSON.parse(userData);
        setLoggedInUser(parsedData)
        loadParkingSpots(parsedData?.uid);
        getFraudReported(parsedData?.uid)


        return parsedData;
      }


      return null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonTitle} />
        </View>

        <View style={styles.skeletonProfile}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonName} />
          <View style={styles.skeletonEmail} />
        </View>

        <View style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
        </View>
      </View>
    );
  }



  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar,]}>
          <Text style={styles.initials}>{getInitialsFromEmail(loggedInUser?.email)}</Text>
        </View>



        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="directions-car" size={24} color="#4285F4" />
            <Text style={styles.statNumber}>{spots?.length}</Text>
            <Text style={styles.statLabel}>Reported Parkings</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Icon name="flag" size={24} color="#EA4335" />
            <Text style={styles.statNumber}>{fraudSpots.length}</Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </View>
        </View>
      </View>

      {/* Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>

        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: '#E8F0FE' }]}>
            <Icon name="person" size={20} color="#4285F4" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>
              {loggedInUser?.name || 'User Name'}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: '#E8F0FE' }]}>
            <Icon name="email" size={20} color="#4285F4" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{loggedInUser?.email}</Text>
          </View>
        </View>
        {userData?.phoneNumber && (
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#E8F0FE' }]}>
              <Icon name="phone" size={20} color="#4285F4" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{userData.phoneNumber}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Settings Menu */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Settings & More</Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              if (item.label === 'Logout') {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', style: 'destructive', onPress: () => logout() }
                  ]
                );
              }
              if (item.label === "Settings") {
                navigation.navigate('Settings');
              }
              if (item.label === "About") {
                navigation.navigate('AboutScreen');
              }
              if (item.label === "Help & Support") {
                navigation.navigate('HelpSupportScreen');
              }
              if (item.label === "Privacy") {
                navigation.navigate('PrivacyScreen');
              }
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
              <Icon name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Icon name="chevron-right" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={styles.editButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Icon name="edit" size={20} color="#fff" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>FndParking v1.0.0</Text>
      </View>
    </ScrollView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
    backgroundColor: '#4285F4',
  },
  initials: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4285F4',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 13,
    color: '#999',
  },
  header: {
    backgroundColor: '#4285F4',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  skeletonHeader: {
    backgroundColor: '#4285F4',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skeletonTitle: {
    width: 100,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    marginLeft: 15,
  },
  skeletonProfile: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  skeletonAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },
  skeletonName: {
    width: 180,
    height: 28,
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    marginBottom: 10,
  },
  skeletonEmail: {
    width: 220,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 15,
  },
  skeletonText: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },

});

export default ProfileScreen;
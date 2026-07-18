import { decode } from '@mapbox/polyline';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { auth, db } from '../FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';

// ✅ FIXED: Added 'increment' to the imports
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, doc, updateDoc, increment } from 'firebase/firestore';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCKtNejSn8b2ZOQq6hStVM6t2lXtj1j7mY'; 

const LandingScreen = ({ navigation }) => {
  // ✅ FIXED: Safe fallback for colors in case ThemeContext is still loading
  const theme = useTheme() || {};
  const isDark = theme.isDark || false;
  const colors = theme.colors || { primary: '#4285F4', background: '#F8F9FA' };

  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState({
    latitude: -25.95018768310547,
    longitude: 28.103607177734375,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const mapRef = useRef(null);
  const [parkingRadius, setParkingRadius] = useState(500);

  const [showArrivalPopup, setShowArrivalPopup] = useState(false);
  const [arrivalMarker, setArrivalMarker] = useState(null);
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const proximityCheckInterval = useRef(null);

  const showPopup = () => {
    setShowArrivalPopup(true);
    Animated.timing(popupOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const hidePopup = () => {
    if (isPopupClosing) return;
    setIsPopupClosing(true);
    Animated.timing(popupOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowArrivalPopup(false);
      setArrivalMarker(null);
      setIsPopupClosing(false);
    });
  };

  const handleConfirm = async () => {
    try {
      Alert.alert("Thank you!", "Your confirmation helps others.");
      hidePopup();
      if (arrivalMarker?.id) {
        await updateLocationSatatus(arrivalMarker.id, 'removed');
      }
      setSelectedMarker(null);
    } catch (error) {
      console.error('Error confirming arrival:', error);
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const handleReportFraud = () => {
    if (arrivalMarker) {
      hidePopup();
      setSelectedMarker(null);
      setTimeout(() => {
        reportFraud(arrivalMarker);
      }, 300);
    }
  };

  const handleNo = () => {
    hidePopup();
    setSelectedMarker(null);
    if (arrivalMarker && arrivalMarker.id) {
      updateLocationSatatus(arrivalMarker.id, 'available');
    }
  };

  const updateLocationSatatus = async (userId, status) => {
    try {
      const userRef = doc(db, 'parkingLocations', userId);
      const updateData = {
        status: status,
        updatedAt: new Date()
      };  
      if (status === 'deactivated') {
        updateData.deactivatedAt = new Date();
      } else if (status === 'active') {
        updateData.deactivatedAt = null;
      }
      await updateDoc(userRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('❌ SERVICE ERROR:', error);
      throw error;
    }
  };

  const removeData = async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing data:', e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await removeData('user');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -300, duration: 250, useNativeDriver: true }),
      ]).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleAddMarker = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to report parking');
        return;
      }
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const user = auth.currentUser;
      
      const newMarker = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        title: 'Available Parking',
        description: 'Tap for directions',
        createdAt: serverTimestamp(),
        reportedBy: user?.uid || 'anonymous',
        reportedByEmail: user?.email || 'anonymous@example.com',
        reportedByName: user?.displayName || 'Anonymous User',
        status: 'active'
      };

      await addDoc(collection(db, 'parkingLocations'), newMarker);
      Alert.alert('Success', 'Parking location reported at your current position!');
    } catch (error) {
      console.error('Error getting location or adding marker:', error);
      Alert.alert('Error', 'Could not get your location or save parking spot');
    }
  };

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    mapRef.current?.animateToRegion({
      ...marker.coordinate,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }, 1000);
  };

  const handleUserLocationChange = (e) => {
    const { coordinate } = e.nativeEvent;
    if (coordinate) {
      setUserLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });
    }
  };

  const fetchRoute = async (origin, destination) => {
    try {
      const response = await fetch(`https://routes.googleapis.com/directions/v2:computeRoutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
          destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE'
        })
      });

      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        setDistance(`${(route.distanceMeters / 1000).toFixed(1)} km`);
        setDuration(`${Math.round(parseInt(route.duration.replace('s', '')) / 60)} min`);

        const decodedCoordinates = decode(route.polyline.encodedPolyline);
        const decodedPath = decodedCoordinates.map(([latitude, longitude]) => ({ latitude, longitude }));
        setRouteCoordinates(decodedPath);

        mapRef.current?.fitToCoordinates(decodedPath, {
          edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  function getDistance(coord1, coord2) {
    const R = 6371e3;
    const φ1 = coord1.latitude * Math.PI/180;
    const φ2 = coord2.latitude * Math.PI/180;
    const Δφ = (coord2.latitude-coord1.latitude) * Math.PI/180;
    const Δλ = (coord2.longitude-coord1.longitude) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  useEffect(() => {
    const checkProximity = () => {
      if (!selectedMarker || !userLocation || showArrivalPopup) return;
      const dist = getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: selectedMarker.latitude, longitude: selectedMarker.longitude }
      );
      if (dist < 50 && !showArrivalPopup) {
        setArrivalMarker(selectedMarker);
        showPopup();
      }
    };

    if (proximityCheckInterval.current) clearInterval(proximityCheckInterval.current);
    proximityCheckInterval.current = setInterval(checkProximity, 5000);
    checkProximity();

    return () => {
      if (proximityCheckInterval.current) clearInterval(proximityCheckInterval.current);
    };
  }, [userLocation, selectedMarker, showArrivalPopup]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('parkingSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed?.parkingRadius) setParkingRadius(parsed.parkingRadius);
        }
      } catch (error) {
        console.error('Error loading parking settings:', error);
      }
    };
    loadSettings();
  }, []);

  const reportFraud = async (marker) => {
    try {    
      const reportedUserInfo = {
        userId: marker.reportedBy || 'unknown',
        userEmail: marker.reportedByEmail || 'unknown@example.com',
        userName: marker.reportedByName || 'Anonymous User'
      };
      const currentUser = auth.currentUser;
      const reporterInfo = {
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'anonymous@example.com',
        userName: currentUser?.displayName || 'Anonymous Reporter'
      };
      
      const obfuscateEmail = (email) => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        if (localPart.length <= 3) return `${localPart.charAt(0)}***@${domain}`;
        return `${localPart.substring(0, 3)}***@${domain}`;
      };

      Alert.alert(
        "Report Fraudulent Spot",
        `Are you sure this parking spot is not available?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            style: "destructive",
            onPress: async () => {
              try {
                const fraudReport = {
                  reportedUser: { userId: reportedUserInfo.userId, userEmail: reportedUserInfo.userEmail, userName: reportedUserInfo.userName, reportedAt: marker.createdAt },
                  reporterUser: { userId: reporterInfo.userId, userEmail: reporterInfo.userEmail, userName: reporterInfo.userName },
                  reportedMarkerId: marker.id,
                  markerLocation: { latitude: marker.latitude, longitude: marker.longitude },
                  markerTitle: marker.title,
                  markerDescription: marker.description,
                  markerStatus: marker.status,
                  markerCreatedAt: marker.createdAt,
                  reason: "Parking spot not available upon arrival",
                  timestamp: serverTimestamp(),
                  status: "pending",
                  severity: "medium",
                  appVersion: "1.0.0",
                  reportSource: "mobile_app",
                  coordinatesVerified: true
                };
                
                await addDoc(collection(db, 'fraudReports'), fraudReport); 
                
                try {
                  const markerRef = doc(db, 'parkingLocations', marker.id);
                  await updateDoc(markerRef, {
                    fraudReportCount: increment(1), // ✅ Now this works
                    lastReportedAt: serverTimestamp(),
                    status: "reported"
                  });
                } catch (updateError) {
                  console.warn('Marker update failed, but report was saved:', updateError);
                }

                Alert.alert("Report Submitted", `User ${obfuscateEmail(reportedUserInfo.userEmail)} has been reported.`);
                hidePopup();
              } catch (error) {
                console.error('❌ ERROR creating fraud report:', error);
                Alert.alert('Error', `Could not submit report: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ ERROR in reportFraud function:', error);
      Alert.alert('Error', 'Could not start report process.');
    }
  };

  useEffect(() => {
    let dismissTimeout;
    if (showArrivalPopup) {
      setIsPopupClosing(false);
      dismissTimeout = setTimeout(() => {
        setIsPopupClosing(true);
        setTimeout(() => hidePopup(), 300);
      }, 15000);
    }
    return () => { if (dismissTimeout) clearTimeout(dismissTimeout); };
  }, [showArrivalPopup]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'parkingLocations'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const markersData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const latitude = data.latitude || data.coordinate?.latitude;
        const longitude = data.longitude || data.coordinate?.longitude;
        if (latitude && longitude) {
          markersData.push({
            id: doc.id,
            latitude: Number(latitude),
            longitude: Number(longitude),
            title: data.title || 'Available Parking',
            description: data.description || 'Tap for directions',
            createdAt: data.createdAt,
            reportedBy: data.reportedBy || 'anonymous',
            reportedByEmail: data.reportedByEmail || 'anonymous@example.com',
            reportedByName: data.reportedByName || 'Anonymous User',
            status: data.status || 'active',
            fraudReportCount: data.fraudReportCount || 0,
            lastReportedAt: data.lastReportedAt
          });
        }
      });
      setMarkers(markersData);
    }, (error) => {
      console.error("❌ Firestore error:", error);
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (selectedMarker) {
      fetchRoute(userLocation, selectedMarker.coordinate);
    } else {
      setRouteCoordinates([]);
      setDistance('');
      setDuration('');
    }
  }, [selectedMarker, userLocation]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'light'} backgroundColor={colors.primary} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Profile')}>
            <Icon name="person" size={24} color="white" />
          </TouchableOpacity>

          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            style={styles.map}
            initialRegion={{ ...userLocation, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}
            showsUserLocation={true}
            followsUserLocation={true}
            onUserLocationChange={handleUserLocationChange}
          >
            {routeCoordinates.length > 1 && (
              <Polyline coordinates={routeCoordinates} strokeColor="#4285F4" strokeWidth={5} lineDashPattern={[1]} />
            )}
            {markers.filter(marker => {
              if (!userLocation) return true;
              const markerLat = Number(marker.latitude);
              const markerLng = Number(marker.longitude);
              if (Number.isNaN(markerLat) || Number.isNaN(markerLng)) return false;
              return getDistance({ latitude: userLocation.latitude, longitude: userLocation.longitude }, { latitude: markerLat, longitude: markerLng }) <= parkingRadius;
            }).map(marker => (
              <Marker
                key={marker.id}
                coordinate={{ latitude: Number(marker.latitude), longitude: Number(marker.longitude) }}
                onPress={() => {
                  if (showArrivalPopup) hidePopup();
                  const completeMarker = { ...marker, coordinate: { latitude: Number(marker.latitude), longitude: Number(marker.longitude) } };
                  setSelectedMarker(prev => prev?.id === marker.id ? null : completeMarker);
                }}
              >
                <View style={[styles.marker, selectedMarker?.id === marker.id && styles.selectedMarker]}>
                  <Icon name="local-parking" size={20} color="white" />
                </View>
              </Marker>
            ))}
          </MapView>

          {selectedMarker && (
            <View style={styles.navigationControls}>
              <View style={styles.routeInfo}>
                <Text style={styles.routeText}>Distance: {distance}</Text>
                <Text style={styles.routeText}>Duration: {duration}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.fab} onPress={handleAddMarker}>
            <Icon name="add-location" size={24} color="white" />
            <Text style={styles.fabText}>Report Parking</Text>
          </TouchableOpacity>
        </View>

        {showArrivalPopup && (
          <Animated.View style={[styles.arrivalPopup, { opacity: popupOpacity }]}>
            <Text style={styles.arrivalPopupText}>Is the parking spot still available?</Text>
            <View style={styles.arrivalPopupButtons}>
              <TouchableOpacity style={[styles.arrivalPopupButton, styles.confirmButton]} onPress={handleConfirm} disabled={isPopupClosing}>
                {isPopupClosing ? <ActivityIndicator color="white" /> : <Text style={styles.arrivalPopupButtonText}>Yes</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.arrivalPopupButton, styles.reportButton]} onPress={handleReportFraud} disabled={isPopupClosing}>
                <Text style={styles.arrivalPopupButtonText}>Report Fraud</Text>
              </TouchableOpacity>
              
              {/* ✅ FIXED: Changed from handleConfirm to handleNo */}
              <TouchableOpacity style={[styles.arrivalPopupButton, styles.noButton]} onPress={handleNo} disabled={isPopupClosing}>
                <Text style={styles.arrivalPopupButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>

      <Modal visible={menuVisible} transparent animationType="none" onRequestClose={toggleMenu}>
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); navigation.navigate('Profile'); }}>
            <Icon name="person" size={24} color="#4285F4" />
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); navigation.navigate('History'); }}>
            <Icon name="history" size={24} color="#4285F4" />
            <Text style={styles.menuText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); navigation.navigate('Settings'); }}>
            <Icon name="settings" size={24} color="#4285F4" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="help" size={24} color="#4285F4" />
            <Text style={styles.menuText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={logout}>
            <Icon name="logout" size={24} color="#ff4444" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  map: { width: '100%', height: '100%' },
  fab: {
    position: 'absolute', bottom: 30, right: 20, backgroundColor: '#4285F4', borderRadius: 30,
    paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, zIndex: 100, marginBottom: 35,
  },
  fabText: { color: 'white', marginLeft: 5, fontWeight: 'bold' },
  marker: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white' },
  selectedMarker: { backgroundColor: '#FF5722', transform: [{ scale: 1.2 }] },
  navigationControls: { position: 'absolute', bottom: 80, left: 20, right: 20, alignItems: 'center' },
  routeInfo: {
    backgroundColor: 'white', padding: 10, borderRadius: 30, paddingVertical10: 10,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, width: '60%', marginBottom: 40,
  },
  routeText: { fontSize: 16, marginVertical: 2, textAlign: 'center' },
  menuButton: {
    position: 'absolute', top: 10, left: 10, backgroundColor: '#4285F4', borderRadius: 20,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center', elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, zIndex: 100,
  },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuContainer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '75%', backgroundColor: 'white', paddingTop: 60, paddingHorizontal: 20 },
  menuHeader: { paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 20 },
  menuTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuText: { marginLeft: 15, fontSize: 16, color: '#333' },
  logoutButton: { marginTop: 30, borderBottomWidth: 0 },
  logoutText: { color: '#ff4444' },
  arrivalPopup: {
    position: 'absolute', bottom: 150, left: 20, right: 20, backgroundColor: 'white',
    borderRadius: 15, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
  },
  arrivalPopupText: { fontSize: 16, marginBottom: 15, textAlign: 'center', fontWeight: '500' },
  arrivalPopupButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  arrivalPopupButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 50, alignItems: 'center', justifyContent: 'center', height: 44 },
  confirmButton: { backgroundColor: '#4CAF50' },
  reportButton: { backgroundColor: '#ff4444' },
  noButton: { backgroundColor: '#9E9E9E' }, // ✅ Added style for No button
  arrivalPopupButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});

export default LandingScreen;
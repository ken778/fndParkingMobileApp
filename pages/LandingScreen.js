import { decode } from '@mapbox/polyline';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';





import { collection, addDoc, serverTimestamp, onSnapshot, query,where,doc,updateDoc } from 'firebase/firestore';


const GOOGLE_MAPS_API_KEY = 'AIzaSyCKtNejSn8b2ZOQq6hStVM6t2lXtj1j7mY'; // Replace with your actual key

const LandingScreen = ({ navigation }) => {
  const { isDark, colors } = useTheme();
  // Menu state
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
  const [parkingRadius, setParkingRadius] = useState(500); // meters

  //for popup
const [showArrivalPopup, setShowArrivalPopup] = useState(false);
const [arrivalMarker, setArrivalMarker] = useState(null);
const popupOpacity = useRef(new Animated.Value(0)).current;
const [isPopupClosing, setIsPopupClosing] = useState(false);
const [timeLeft, setTimeLeft] = useState(15);
const proximityCheckInterval = useRef(null);

  //for poup
  const showPopup = () => {
  setShowArrivalPopup(true);
  Animated.timing(popupOpacity, {
    toValue: 1,
    duration: 500,
    useNativeDriver: true,
  }).start();
};

const hidePopup = () => {
  // If already closing, do nothing
  if (isPopupClosing) return;
  
  setIsPopupClosing(true);
  Animated.timing(popupOpacity, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start(() => {
    // This callback runs when animation completes
    setShowArrivalPopup(false);
    setArrivalMarker(null);
    setIsPopupClosing(false); // Reset closing state
  });
};

//handle confirm function
// In your handleConfirm function - REMOVE the setShowArrivalPopup(false)
const handleConfirm = async () => {
  try {
    Alert.alert("Thank you!", "Your confirmation helps others.");
    
    // ONLY call hidePopup - it handles everything
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

//handle fraud function 
const handleReportFraud = () => {
  if (arrivalMarker) {
    hidePopup(); // Hide popup first
    setSelectedMarker(null);
    setTimeout(() => {
      reportFraud(arrivalMarker); // Then show fraud report
    }, 300);
  }
};

//handle NO function 
const handleNo = () => {
  hidePopup();
  setSelectedMarker(null); // Clear selected marker
  // Optionally update status to something else
  if (arrivalMarker && arrivalMarker.id) {
    updateLocationSatatus(arrivalMarker.id, 'available');
  }
};

//resetArrivalState
const resetArrivalState = () => {
  setSelectedMarker(null);
  setArrivalMarker(null);
  setShowArrivalPopup(false);
  setIsPopupClosing(false);
  setTimeLeft(15);
  
  // Clear any existing interval
  if (proximityCheckInterval.current) {
    clearInterval(proximityCheckInterval.current);
    proximityCheckInterval.current = null;
  }
};


//update park location
const updateLocationSatatus =  async (userId, status) => {
  try {
    const userRef = doc(db, 'parkingLocations', userId);
    // Create the update data
    const updateData = {
      status: status,
      updatedAt: new Date()
    };  
    // Add deactivatedAt only when deactivating
    if (status === 'deactivated') {
      updateData.deactivatedAt = new Date();
    } else if (status === 'active') {
      // Clear deactivatedAt when reactivating
      updateData.deactivatedAt = null;
    }
    
    // Perform the update
    await updateDoc(userRef, updateData);
    
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ SERVICE ERROR:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
}

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
  // Menu toggle function
  const toggleMenu = () => {
    if (menuVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

 const handleAddMarker = async () => {
  try {
    // Get current location
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
      status: 'active' // active, removed, reported
    };

    // Add to Firestore
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
          origin: {
            location: {
              latLng: {
                latitude: origin.latitude,
                longitude: origin.longitude
              }
            }
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.latitude,
                longitude: destination.longitude
              }
            }
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE'
        })
      });

      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        // Convert distance to kilometers
        const distanceKm = (route.distanceMeters / 1000).toFixed(1);
        setDistance(`${distanceKm} km`);

        // Convert duration to minutes
        const durationMinutes = Math.floor(parseInt(route.duration.replace('s', ''))) / 60;
        setDuration(`${Math.round(durationMinutes)} min`);

        // Decode the polyline
        const decodedCoordinates = decode(route.polyline.encodedPolyline);
        const decodedPath = decodedCoordinates.map(([latitude, longitude]) => ({
          latitude,
          longitude
        }));
        setRouteCoordinates(decodedPath);

        // Zoom to fit the route
        mapRef.current?.fitToCoordinates(decodedPath, {
          edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Could not fetch route directions');
      console.log('Ensure your Google Maps API key is valid and Routes API is enabled');
    }
  };

  //for popup

  // Helper function to calculate distance between two coordinates in meters
function getDistance(coord1, coord2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = coord1.latitude * Math.PI/180;
  const φ2 = coord2.latitude * Math.PI/180;
  const Δφ = (coord2.latitude-coord1.latitude) * Math.PI/180;
  const Δλ = (coord2.longitude-coord1.longitude) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

useEffect(() => {
  const checkProximity = () => {
    if (!selectedMarker || !userLocation || showArrivalPopup) return; // ✅ Don't check if popup already showing

    const distance = getDistance(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      },
      {
        latitude: selectedMarker.latitude,
        longitude: selectedMarker.longitude
      }
    );

    // Show popup when within 50 meters and not already showing
    if (distance < 50 && !showArrivalPopup) { // ✅ Add extra check
      setArrivalMarker(selectedMarker);
      showPopup();
    }
  };

  // Clear any existing interval
  if (proximityCheckInterval.current) {
    clearInterval(proximityCheckInterval.current);
  }

  // Start new interval (check every 5 seconds)
  proximityCheckInterval.current = setInterval(checkProximity, 5000);

  // Initial check
  checkProximity();

  return () => {
    if (proximityCheckInterval.current) {
      clearInterval(proximityCheckInterval.current);
    }
  };
}, [userLocation, selectedMarker, showArrivalPopup]); // ✅ Add showArrivalPopup dependency

// Load user settings (parking radius) from AsyncStorage
useEffect(() => {
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('parkingSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed?.parkingRadius) {
          setParkingRadius(parsed.parkingRadius);
        }
      }
    } catch (error) {
      console.error('Error loading parking settings on landing screen:', error);
    }
  };

  loadSettings();
}, []);
//my fraud function 
const reportFraud = async (marker) => {
  try {    
    // Extract user info directly from marker
    const reportedUserInfo = {
      userId: marker.reportedBy || 'unknown',
      userEmail: marker.reportedByEmail || 'unknown@example.com',
      userName: marker.reportedByName || 'Anonymous User'
    };
    
    // Get current user info (reporter)
    const currentUser = auth.currentUser;
    const reporterInfo = {
      userId: currentUser?.uid || 'anonymous',
      userEmail: currentUser?.email || 'anonymous@example.com',
      userName: currentUser?.displayName || 'Anonymous Reporter'
    };
    
    const obfuscateEmail = (email) => {
  if (!email) return '';
  
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 3) {
    // If email is very short, just show first character
    return `${localPart.charAt(0)}***@${domain}`;
  }
  
  // Show first 3 characters, then stars, then domain
  return `${localPart.substring(0, 3)}***@${domain}`;
};

// Usage
const message = `User ${obfuscateEmail(reportedUserInfo.userEmail)} has been reported for fraudulent parking spot.\n\nOur admin will review this case.`;
    
    Alert.alert(
      "Report Fraudulent Spot",
      `Are you sure this parking spot is not available?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log('❌ User cancelled fraud report')
        },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              // Create fraud report with ALL user information
              const fraudReport = {
                // Reported user (who created the parking spot)
                reportedUser: {
                  userId: reportedUserInfo.userId,
                  userEmail: reportedUserInfo.userEmail,
                  userName: reportedUserInfo.userName,
                  // Add any other user info you have
                  reportedAt: marker.createdAt
                },
                
                // Reporter (who is reporting the fraud)
                reporterUser: {
                  userId: reporterInfo.userId,
                  userEmail: reporterInfo.userEmail,
                  userName: reporterInfo.userName
                },
                
                // Marker information
                reportedMarkerId: marker.id,
                markerLocation: {
                  latitude: marker.latitude,
                  longitude: marker.longitude
                },
                markerTitle: marker.title,
                markerDescription: marker.description,
                markerStatus: marker.status,
                markerCreatedAt: marker.createdAt,
                
                // Report details
                reason: "Parking spot not available upon arrival",
                timestamp: serverTimestamp(),
                status: "pending",
                severity: "medium",
                additionalNotes: "",
                
                // Metadata
                appVersion: "1.0.0",
                reportSource: "mobile_app",
                coordinatesVerified: true
              };
              
              // Add to Firestore
              const docRef = await addDoc(collection(db, 'fraudReports'), fraudReport); 
              // Update the marker's fraud report count
              try {
                const markerRef = doc(db, 'parkingLocations', marker.id);
                await updateDoc(markerRef, {
                  fraudReportCount: increment(1),
                  lastReportedAt: serverTimestamp(),
                  status: "reported"
                });
              } catch (updateError) {
                // Continue anyway - the report was created successfully
              }

              Alert.alert(
                "Report Submitted", 
                `User ${obfuscateEmail(reportedUserInfo.userEmail)} has been reported for fraudulent parking spot.\n\nOur admin will review this case.`
              );
              
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
    // Reset closing state when popup shows
    setIsPopupClosing(false);
    
    // Auto-dismiss timeout (15 seconds)
    dismissTimeout = setTimeout(() => {
      setIsPopupClosing(true);
      // Add a small delay for closing animation
      setTimeout(() => {
        hidePopup();
      }, 300);
    }, 15000);
  }

  // Cleanup function
  return () => {
    if (dismissTimeout) clearTimeout(dismissTimeout);
  };
}, [showArrivalPopup]);



useEffect(() => {
  if (!db) {
    return;
  }

  const q = query(
          collection(db, 'parkingLocations'),
          where('status', '==', 'active')  // ✅ 'where' is now imported
        );
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const markersData = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const latitude = data.latitude || data.coordinate?.latitude;
      const longitude = data.longitude || data.coordinate?.longitude;
      
      if (latitude && longitude) {
        // Create marker object with ALL fields from Firestore
        const marker = {
          id: doc.id,
          latitude: Number(latitude),
          longitude: Number(longitude),
          title: data.title || 'Available Parking',
          description: data.description || 'Tap for directions',
          createdAt: data.createdAt,
          // CRITICAL: Include ALL user fields exactly as stored
          reportedBy: data.reportedBy || 'anonymous',
          reportedByEmail: data.reportedByEmail || 'anonymous@example.com',
          reportedByName: data.reportedByName || 'Anonymous User',
          status: data.status || 'active',
          // Include any other fields you might need
          fraudReportCount: data.fraudReportCount || 0,
          lastReportedAt: data.lastReportedAt
        };
        
        markersData.push(marker);
      }
    });
    
    // Verify first marker has cor  
    setMarkers(markersData);
  }, (error) => {
    console.error("❌ Firestore error:", error);
  });

  return () => unsubscribe();
 
}, [db]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to report parking');
        return;
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedMarker) {
      fetchRoute(userLocation, selectedMarker.coordinate);
    } else {
      setRouteCoordinates([]);
      setDistance('');
      setDuration('');
    }
  }, [selectedMarker, userLocation]);

  // Test the API key by making a simple request
useEffect(() => {
  const testApiKey = async () => {
    try {
      const testResponse = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: -25.95, longitude: 28.10 } } },
            destination: { location: { latLng: { latitude: -25.96, longitude: 28.11 } } },
            travelMode: 'DRIVE'
          })
        }
      );
      
      if (testResponse.status === 200) {
      } else {
        console.error('API key error:', testResponse.status);
      }
    } catch (error) {
      console.error('API key test failed:', error);
    }
  };
  
  testApiKey();
}, []);

  return (
    <>
      {/* Match other screens: primary-colored header / status bar area */}
      <StatusBar style={isDark ? 'light' : 'light'} backgroundColor={colors.primary} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.menuButton}
             onPress={() => {
   
    navigation.navigate('Profile'); // Then navigate to profile
  }}
          >
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
            initialRegion={{
              ...userLocation,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
            followsUserLocation={true}
            onUserLocationChange={handleUserLocationChange}
          >
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#4285F4"
                strokeWidth={5}
                lineDashPattern={[1]}
              />
            )}

           {markers
  .filter(marker => {
    // If we don't have a user location yet, don't filter
    if (!userLocation) return true;

    // Ensure we have numeric coordinates
    const markerLat = Number(marker.latitude);
    const markerLng = Number(marker.longitude);
    if (Number.isNaN(markerLat) || Number.isNaN(markerLng)) return false;

    const d = getDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: markerLat, longitude: markerLng }
    );

    // Keep markers within the selected radius (in meters)
    return d <= parkingRadius;
  })
  .map(marker => (
  <Marker
    key={marker.id}
    coordinate={{
      latitude: Number(marker.latitude),
      longitude: Number(marker.longitude)
    }}
    onPress={() => {
    // Reset any existing popup state
     if (showArrivalPopup) {
    hidePopup();
  }
  
      
      // Create a complete marker object with ALL data
      const completeMarker = {
        ...marker, // Spread ALL marker properties
        coordinate: {
          latitude: Number(marker.latitude),
          longitude: Number(marker.longitude)
        }
      };
      
      setSelectedMarker(prev => 
        prev?.id === marker.id ? null : completeMarker
      );
    }}
  >
    <View style={[
      styles.marker,
      selectedMarker?.id === marker.id && styles.selectedMarker
    ]}>
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
    <Text style={styles.arrivalPopupText}>
      Is the parking spot still available?
    </Text>
    
    <View style={styles.arrivalPopupButtons}>
      {/* Yes Button */}
      <TouchableOpacity 
        style={[styles.arrivalPopupButton, styles.confirmButton]}
        onPress={handleConfirm} // ✅ Use the new function
        disabled={isPopupClosing}
      >
        {isPopupClosing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.arrivalPopupButtonText}>
            Yes 
          </Text>
        )}
      </TouchableOpacity>
      
      {/* Report Fraud Button */}
      <TouchableOpacity 
        style={[styles.arrivalPopupButton, styles.reportButton]}
        onPress={handleReportFraud} // ✅ Use the new function
        disabled={isPopupClosing}
      >
        <Text style={styles.arrivalPopupButtonText}>
          Report Fraud
        </Text>
      </TouchableOpacity>
      
      {/* No Button */}
      <TouchableOpacity 
        style={[styles.arrivalPopupButton, styles.reportButton]}
        onPress={handleConfirm} // ✅ Use the new function
        disabled={isPopupClosing}
      >
        <Text style={styles.arrivalPopupButtonText}>
          No
        </Text>
      </TouchableOpacity>
    </View>
  </Animated.View>
)}
      </SafeAreaView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>
          </View>

         <TouchableOpacity 
  style={styles.menuItem}
  onPress={() => {
    toggleMenu(); // Close the menu first
    navigation.navigate('Profile'); // Then navigate to profile
  }}
>
  <Icon name="person" size={24} color="#4285F4" />
  <Text style={styles.menuText}>Profile</Text>
</TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}
            onPress={() => {
    toggleMenu();
    navigation.navigate('History');
  }}>
            <Icon name="history" size={24} color="#4285F4" />
            <Text style={styles.menuText}>History</Text>
          </TouchableOpacity>

         <TouchableOpacity 
  style={styles.menuItem}
  onPress={() => {
    toggleMenu();
    navigation.navigate('Settings');
  }}
>
  <Icon name="settings" size={24} color="#4285F4" />
  <Text style={styles.menuText}>Settings</Text>
</TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="help" size={24} color="#4285F4" />
            <Text style={styles.menuText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutButton]}
            onPress={() => logout()}
          >
            <Icon name="logout" size={24} color="#ff4444" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
};

// ... (keep all your StyleSheet code exactly the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#4285F4',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,

    marginBottom: 35,
  },
  fabText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  marker: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  selectedMarker: {
    backgroundColor: '#FF5722',
    transform: [{ scale: 1.2 }],
  },
  navigationControls: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  navigateButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  navigateButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  routeInfo: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 30,
    paddingVertical: 10,



    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: '60%',
    marginBottom: 40,
  },
  routeText: {
    fontSize: 16,
    marginVertical: 2,
    textAlign: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#4285F4',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },

  //menu
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '75%',
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  menuHeader: {
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    marginTop: 30,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#ff4444',
  },
  arrivalPopup: {
  position: 'absolute',
  bottom: 150,
  left: 20,
  right: 20,
  backgroundColor: 'white',
  borderRadius: 15,
  padding: 20,
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
arrivalPopupText: {
  fontSize: 16,
  marginBottom: 15,
  textAlign: 'center',
},
arrivalPopupButtons: {
  flexDirection: 'row',
  justifyContent: 'space-around',
},
arrivalPopupButton: {
  backgroundColor: '#4285F4',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
},
arrivalPopupButtonText: {
  color: 'white',
  fontWeight: 'bold',
},
arrivalPopupButton: {
  backgroundColor: '#4285F4',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
  minWidth: 80,
  alignItems: 'center',
  justifyContent: 'center',
  height: 40,
},
  arrivalPopup: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  arrivalPopupText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  arrivalPopupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  arrivalPopupButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  confirmButton: {
    backgroundColor: '#4CAF50', // Green for confirm
  },
  reportButton: {
    backgroundColor: '#ff4444', // Red for report
  },
  arrivalPopupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Add to styles
reportedByText: {
  fontSize: 14,
  color: '#666',
  textAlign: 'center',
  marginBottom: 10,
  fontStyle: 'italic'
}
});

export default LandingScreen;
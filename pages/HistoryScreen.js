import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../FirebaseConfig';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import MapView, { Marker } from 'react-native-maps';

const HistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [parkingHistory, setParkingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadParkingHistory();
  }, []);

  const loadParkingHistory = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login to view history');
        navigation.navigate('Login');
        return;
      }

      // Try to load from Firestore first
      const historyRef = collection(db, 'parkingHistory');
      const q = query(
        historyRef,
        where('userId', '==', user.uid),
        orderBy('parkingTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const historyData = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        // Get parking spot details if available
        let parkingSpotDetails = null;
        if (data.parkingSpotId) {
          const spotDoc = await getDoc(doc(db, 'parkingSpots', data.parkingSpotId));
          if (spotDoc.exists()) {
            parkingSpotDetails = spotDoc.data();
          }
        }

        historyData.push({
          id: doc.id,
          ...data,
          parkingSpot: parkingSpotDetails,
          parkingTime: data.parkingTime?.toDate() || new Date(),
          departureTime: data.departureTime?.toDate()
        });
      }

      // If no Firestore data, check AsyncStorage as fallback
      if (historyData.length === 0) {
        const localHistory = await AsyncStorage.getItem('localParkingHistory');
        if (localHistory) {
          const parsedHistory = JSON.parse(localHistory);
          setParkingHistory(parsedHistory.filter(item => item.userId === user.uid));
        }
      } else {
        setParkingHistory(historyData);
      }

    } catch (error) {
      console.error('Error loading parking history:', error);
      // Fallback to local storage
      try {
        const localHistory = await AsyncStorage.getItem('localParkingHistory');
        if (localHistory) {
          setParkingHistory(JSON.parse(localHistory));
        }
      } catch (localError) {
        console.error('Error loading local history:', localError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadParkingHistory();
  };

  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'Still parked';
    
    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (departureTime) => {
    return departureTime ? '#4CAF50' : '#FF5722'; // Green for completed, orange for active
  };

  const getStatusText = (departureTime) => {
    return departureTime ? 'Completed' : 'Active';
  };

  const ParkingSessionCard = ({ session }) => (
    <TouchableOpacity 
      style={styles.sessionCard}
      onPress={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.locationText}>
            {session.parkingSpot?.title || session.locationName || 'Unknown Location'}
          </Text>
          <Text style={styles.timeText}>
            {formatDate(session.parkingTime)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(session.departureTime) }]} />
          <Text style={styles.statusText}>
            {getStatusText(session.departureTime)}
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.detailText}>
            Duration: {formatDuration(session.parkingTime, session.departureTime)}
          </Text>
        </View>

        {session.cost && (
          <View style={styles.detailRow}>
            <Icon name="attach-money" size={16} color="#666" />
            <Text style={styles.detailText}>Cost: ${session.cost.toFixed(2)}</Text>
          </View>
        )}

        {session.vehicleType && (
          <View style={styles.detailRow}>
            <Icon name="directions-car" size={16} color="#666" />
            <Text style={styles.detailText}>Vehicle: {session.vehicleType}</Text>
          </View>
        )}
      </View>

      {selectedSession?.id === session.id && session.latitude && session.longitude && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: session.latitude,
              longitude: session.longitude,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: session.latitude,
                longitude: session.longitude
              }}
            >
              <Icon name="local-parking" size={24} color="#4285F4" />
            </Marker>
          </MapView>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading parking history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking History</Text>
        <TouchableOpacity onPress={loadParkingHistory} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {parkingHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No parking history yet</Text>
            <Text style={styles.emptyStateText}>
              Your parking sessions will appear here after you park your vehicle
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {parkingHistory.map((session) => (
              <ParkingSessionCard key={session.id} session={session} />
            ))}
          </View>
        )}

        {/* Statistics Summary */}
        {parkingHistory.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Parking Statistics</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{parkingHistory.length}</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {parkingHistory.filter(s => s.cost).reduce((sum, s) => sum + (s.cost || 0), 0).toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {parkingHistory.filter(s => !s.departureTime).length}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4285F4',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  historyList: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sessionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default HistoryScreen;
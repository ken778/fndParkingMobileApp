import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';

export const parkingSpotsService = {
  // Get all parking spots
  getParkingSpots: async (userId) => {
    try {
      // const spotsRef = collection(db, 'parkingLocations');

        const spotsRef = query(
                collection(db, 'parkingLocations'),
                where('reportedBy', '==', userId)  // ✅ 'where' is now imported
              );
      const q = query(spotsRef);
      const snapshot = await getDocs(q);
      
      const spots = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      return spots;
    } catch (error) {
      console.error('Error getting parking spots:', error);
      
      // If ordering fails, try without order
      if (error.code === 'failed-precondition') {
        const spotsRef = collection(db, 'parkingLocations');
        const snapshot = await getDocs(spotsRef);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      throw error;
    }
  },




  // Get real-time updates
  subscribeToParkingSpots: (callback) => {
    try {
      const spotsRef = collection(db, 'parkingLocations');
      const q = query(spotsRef, orderBy('createdAt', 'desc'));
      
      return onSnapshot(q, (snapshot) => {
        const spots = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(spots);
      }, (error) => {
        console.error('Real-time subscription error:', error);
      });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      // Fallback without ordering
      const spotsRef = collection(db, 'parkingLocations');
      return onSnapshot(spotsRef, (snapshot) => {
        const spots = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(spots);
      });
    }
  },

  //get fraud data
    getFraudReportedLocations: async (userId) => {
    try {
       const spotsRef = query(
          collection(db, 'fraudReports'),
          where('reportedUser.userId', '==', userId)  // ✅ Query nested field
        );
      const snapshot = await getDocs(spotsRef);
      const spots = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      return spots;
    } catch (error) {
      console.error('Error getting fraudReports spots:', error);
      
      // If ordering fails, try without order
      if (error.code === 'failed-precondition') {
        const spotsRef = collection(db, 'fraudReports');
        const snapshot = await getDocs(spotsRef);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      throw error;
    }
  }

};
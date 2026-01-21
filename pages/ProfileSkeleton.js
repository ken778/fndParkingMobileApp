import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert,
  Linking
} from 'react-native';
import { useTheme } from '../context/ThemeContext';


const ProfileSkeleton = () => {

      const { colors } = useTheme();
 
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
 
}

const styles = StyleSheet.create({

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

export default ProfileSkeleton;
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Linking,
  Image 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFA from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';

const AboutScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [lastUpdated, setLastUpdated] = useState('January 2024');

  // Load version info
  useEffect(() => {
    // In a real app, you might fetch this from your app config
    setAppVersion('1.0.0');
    setLastUpdated('January 2024');
  }, []);

  const openLink = (url) => {
    Linking.openURL(url).catch(err => 
      console.error('Failed to open URL:', err)
    );
  };

  const contactInfo = {
    support: 'support@fndparking.com',
    partnerships: 'partnerships@fndparking.com',
    general: 'hello@fndparking.com',
    twitter: 'https://twitter.com/FndParkingApp',
    instagram: 'https://instagram.com/FndParking'
  };

  const AboutSection = ({ title, children }) => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const FeatureItem = ({ icon, title, description }) => (
    <View style={styles.featureItem}>
      <Icon name={icon} size={24} color={colors.primary} style={styles.featureIcon} />
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.subtext }]}>{description}</Text>
      </View>
    </View>
  );

  const StatItem = ({ value, label }) => (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.subtext }]}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About FndParking</Text>
      </View>

      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: colors.surface }]}>
        <View style={styles.logoContainer}>
        
          <Text style={[styles.appName, { color: colors.text }]}>FndParking</Text>
          <Text style={[styles.appTagline, { color: colors.subtext }]}>Your Community Parking Solution</Text>
        </View>
        <Text style={[styles.heroText, { color: colors.subtext }]}>
          A community-driven parking solution that connects drivers with available 
          parking spots in real-time. Making parking stress-free through innovation 
          and community collaboration.
        </Text>
      </View>

      {/* What We Do Section */}
      <AboutSection title="What We Do">
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="directions-car"
            title="For Drivers"
            description="Find available parking spots near your destination instantly with real-time updates"
          />
          <FeatureItem
            icon="home"
            title="For Spot Owners"
            description="Share your unused parking space and earn extra income with full control"
          />
        </View>
      </AboutSection>

      {/* How It Works */}
      <AboutSection title="How It Works">
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Find or List</Text>
            <Text style={styles.stepDescription}>
              Search for spots or list your unused space
            </Text>
          </View>
          <View style={styles.stepDivider}>
            <Icon name="arrow-forward" size={20} color="#4285F4" />
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Connect & Reserve</Text>
            <Text style={styles.stepDescription}>
              Book instantly through our secure platform
            </Text>
          </View>
          <View style={styles.stepDivider}>
            <Icon name="arrow-forward" size={20} color="#4285F4" />
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Park & Confirm</Text>
            <Text style={styles.stepDescription}>
              Arrive and park with verification system
            </Text>
          </View>
        </View>
      </AboutSection>

      {/* Safety & Reliability */}
      <AboutSection title="Safety & Reliability">
        <View style={styles.safetyContainer}>
          <View style={styles.safetyItem}>
            <Icon name="verified-user" size={20} color="#4CAF50" />
            <Text style={styles.safetyText}>User Verification</Text>
          </View>
          <View style={styles.safetyItem}>
            <Icon name="location-on" size={20} color="#4CAF50" />
            <Text style={styles.safetyText}>Spot Validation</Text>
          </View>
          <View style={styles.safetyItem}>
            <Icon name="update" size={20} color="#4CAF50" />
            <Text style={styles.safetyText}>Real-Time Updates</Text>
          </View>
          <View style={styles.safetyItem}>
            <Icon name="report" size={20} color="#4CAF50" />
            <Text style={styles.safetyText}>Community Reporting</Text>
          </View>
          <View style={styles.safetyItem}>
            <Icon name="star" size={20} color="#4CAF50" />
            <Text style={styles.safetyText}>User Ratings</Text>
          </View>
        </View>
      </AboutSection>

      {/* Statistics */}
      <AboutSection title="Our Impact">
        <View style={styles.statsContainer}>
          <StatItem value="1000+" label="Parking Spots" />
          <StatItem value="15 min" label="Time Saved" />
          <StatItem value="95%" label="User Satisfaction" />
          <StatItem value="24/7" label="Availability" />
        </View>
      </AboutSection>

      {/* Our Values */}
      <AboutSection title="Our Values">
        <View style={styles.valuesContainer}>
          <View style={styles.valueItem}>
            <Icon name="people" size={24} color="#4285F4" />
            <Text style={styles.valueTitle}>Community First</Text>
            <Text style={styles.valueDescription}>
              Every user contributes to making parking better for everyone
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Icon name="visibility" size={24} color="#4285F4" />
            <Text style={styles.valueTitle}>Transparency</Text>
            <Text style={styles.valueDescription}>
              Clear pricing and honest user reviews create trust
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Icon name="emoji-objects" size={24} color="#4285F4" />
            <Text style={styles.valueTitle}>Innovation</Text>
            <Text style={styles.valueDescription}>
              Continuously improving technology for better parking experience
            </Text>
          </View>
        </View>
      </AboutSection>

      {/* Contact Section */}
      <AboutSection title="Contact Us">
        <View style={styles.contactContainer}>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL(`mailto:${contactInfo.support}`)}
          >
            <Icon name="support-agent" size={20} color="#4285F4" />
            <Text style={styles.contactText}>Support</Text>
            <Text style={styles.contactDetail}>{contactInfo.support}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL(`mailto:${contactInfo.partnerships}`)}
          >
            <Icon name="handshake" size={20} color="#4285F4" />
            <Text style={styles.contactText}>Partnerships</Text>
            <Text style={styles.contactDetail}>{contactInfo.partnerships}</Text>
          </TouchableOpacity>

          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(contactInfo.twitter)}
            >
              <IconFA name="twitter" size={20} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(contactInfo.instagram)}
            >
              <IconFA name="instagram" size={20} color="#E4405F" />
            </TouchableOpacity>
          </View>
        </View>
      </AboutSection>

      {/* App Info */}
      <View style={styles.appInfoSection}>
        <View style={styles.appInfoRow}>
          <Icon name="info" size={16} color="#666" />
          <Text style={styles.appInfoText}>Version {appVersion}</Text>
        </View>
        <View style={styles.appInfoRow}>
          <Icon name="update" size={16} color="#666" />
          <Text style={styles.appInfoText}>Updated {lastUpdated}</Text>
        </View>
        <View style={styles.appInfoRow}>
          <Icon name="devices" size={16} color="#666" />
          <Text style={styles.appInfoText}>Available on iOS & Android</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Together, we're parking smarter, not harder.
        </Text>
        <Text style={styles.footerSubtext}>
          FndParking - Your Community Parking Solution
        </Text>
      </View>
    </ScrollView>
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
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  appTagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  heroText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  stepDivider: {
    paddingHorizontal: 8,
  },
  safetyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  safetyText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  valuesContainer: {
    marginTop: 8,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  valueDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
    flex: 1,
  },
  contactContainer: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  contactDetail: {
    fontSize: 14,
    color: '#4285F4',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  appInfoSection: {
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
  appInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AboutScreen;
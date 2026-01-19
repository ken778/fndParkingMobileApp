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
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrivacyScreen = ({ navigation }) => {
  const [privacySettings, setPrivacySettings] = useState({
    locationTracking: true,
    dataCollection: true,
    personalizedAds: false,
    shareAnalytics: true,
    shareWithPartners: false,
    showProfile: true
  });

  const [expandedSections, setExpandedSections] = useState({});

  const toggleSetting = (key) => {
    const newSettings = { ...privacySettings, [key]: !privacySettings[key] };
    savePrivacySettings(newSettings);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your personal data will be prepared and sent to your email. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // In a real app, this would trigger data export
            Alert.alert(
              'Export Started',
              'Your data export has been initiated. You will receive an email with your data within 24 hours.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone.\n\nAll your data, including parking history and listings, will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            // In a real app, this would trigger account deletion
            Alert.alert(
              'Account Deletion Requested',
              'Your account deletion request has been received. You will receive a confirmation email within 24 hours.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const PrivacySection = ({ 
    id, 
    title, 
    description, 
    children,
    isExpandable = true 
  }) => {
    const isExpanded = expandedSections[id] || !isExpandable;

    return (
      <View style={styles.privacySection}>
        {isExpandable ? (
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection(id)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionDescription}>{description}</Text>
            </View>
            <Icon 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionDescription}>{description}</Text>
            </View>
          </View>
        )}
        
        {isExpanded && children}
      </View>
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    settingKey,
    requiresRestart = false 
  }) => (
    <View style={styles.settingItem}>
      <Icon name={icon} size={24} color="#4285F4" style={styles.settingIcon} />
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>
          {description}
          {requiresRestart && (
            <Text style={styles.restartText}> (Requires app restart)</Text>
          )}
        </Text>
      </View>
      <Switch
        value={privacySettings[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: '#ddd', true: '#4285F4' }}
        thumbColor={privacySettings[settingKey] ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const InfoItem = ({ icon, title, content }) => (
    <View style={styles.infoItem}>
      <Icon name={icon} size={20} color="#666" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{content}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>

      {/* Last Updated */}
      <View style={styles.lastUpdated}>
        <Icon name="update" size={16} color="#666" />
        <Text style={styles.lastUpdatedText}>Last updated: January 15, 2024</Text>
      </View>

      {/* Introduction */}
      <View style={styles.section}>
        <Text style={styles.introText}>
          At FndParking, we take your privacy seriously. This page explains how we collect, 
          use, and protect your personal information. You have control over your data.
        </Text>
      </View>

    

      {/* Data Collection & Usage */}
      <View style={styles.section}>
        <PrivacySection
          id="dataCollection"
          title="Data We Collect"
          description="Information we gather to provide our services"
        >
          <View style={styles.infoContainer}>
            <InfoItem
              icon="person"
              title="Personal Information"
              content="Name, email, phone number, and profile information you provide"
            />
            <InfoItem
              icon="location-history"
              title="Location Data"
              content="GPS coordinates and location history for parking recommendations"
            />
            <InfoItem
              icon="history"
              title="Usage Data"
              content="App interactions, searches, bookings, and preferences"
            />
            <InfoItem
              icon="payment"
              title="Payment Information"
              content="Processed securely through our payment partners (we don't store full card details)"
            />
            <InfoItem
              icon="device"
              title="Device Information"
              content="Device type, OS version, app version, and unique device identifiers"
            />
          </View>
        </PrivacySection>

        <PrivacySection
          id="dataUsage"
          title="How We Use Your Data"
          description="Purposes for processing your information"
        >
          <View style={styles.usageList}>
            <View style={styles.usageItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.usageText}>Provide and improve our parking services</Text>
            </View>
            <View style={styles.usageItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.usageText}>Process payments and prevent fraud</Text>
            </View>
            <View style={styles.usageItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.usageText}>Communicate with you about your account</Text>
            </View>
            <View style={styles.usageItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.usageText}>Personalize your experience</Text>
            </View>
            <View style={styles.usageItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.usageText}>Ensure safety and security</Text>
            </View>
            <View style={styles.usageItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.usageText}>Comply with legal obligations</Text>
            </View>
          </View>
        </PrivacySection>

        <PrivacySection
          id="dataSharing"
          title="Data Sharing"
          description="When and with whom we share your information"
        >
          <View style={styles.sharingContainer}>
            <View style={styles.sharingItem}>
              <Text style={styles.sharingTitle}>Service Providers</Text>
              <Text style={styles.sharingDescription}>
                Trusted partners who help us operate our services (payment processors, cloud hosting)
              </Text>
            </View>
            <View style={styles.sharingItem}>
              <Text style={styles.sharingTitle}>Legal Requirements</Text>
              <Text style={styles.sharingDescription}>
                When required by law, regulation, or legal process
              </Text>
            </View>
            <View style={styles.sharingItem}>
              <Text style={styles.sharingTitle}>Business Transfers</Text>
              <Text style={styles.sharingDescription}>
                In connection with a merger, acquisition, or sale of assets
              </Text>
            </View>
            <View style={styles.sharingItem}>
              <Text style={styles.sharingTitle}>With Your Consent</Text>
              <Text style={styles.sharingDescription}>
                When you explicitly agree to share information
              </Text>
            </View>
          </View>
        </PrivacySection>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <PrivacySection
          id="security"
          title="Security Measures"
          description="How we protect your information"
          isExpandable={false}
        >
          <View style={styles.securityGrid}>
            <View style={styles.securityItem}>
              <Icon name="lock" size={24} color="#4285F4" />
              <Text style={styles.securityTitle}>Encryption</Text>
              <Text style={styles.securityDescription}>
                All data transmitted is encrypted using TLS/SSL
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Icon name="security" size={24} color="#4285F4" />
              <Text style={styles.securityTitle}>Access Control</Text>
              <Text style={styles.securityDescription}>
                Strict access controls and authentication
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Icon name="verified-user" size={24} color="#4285F4" />
              <Text style={styles.securityTitle}>Regular Audits</Text>
              <Text style={styles.securityDescription}>
                Security audits and vulnerability testing
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Icon name="backup" size={24} color="#4285F4" />
              <Text style={styles.securityTitle}>Data Backup</Text>
              <Text style={styles.securityDescription}>
                Regular backups and disaster recovery
              </Text>
            </View>
          </View>
        </PrivacySection>
      </View>

      {/* Data Management Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionMainTitle}>Data Management</Text>
        <TouchableOpacity 
          style={[styles.dataActionButton, styles.deleteButton]}
          onPress={handleDeleteAccount}
        >
          <Icon name="delete" size={24} color="#ff4444" />
          <View style={styles.dataActionText}>
            <Text style={[styles.dataActionTitle, styles.deleteTitle]}>
              Delete My Account
            </Text>
            <Text style={[styles.dataActionDescription, styles.deleteDescription]}>
              Permanently delete account and all data
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#ff4444" />
        </TouchableOpacity>
      </View>


      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          For questions about our privacy practices, contact us at:
        </Text>
        <Text style={styles.footerEmail}>privacy@fndparking.com</Text>
        <Text style={styles.footerVersion}>FndParking Privacy v1.2</Text>
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
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  lastUpdatedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  introText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  privacySection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  restartText: {
    color: '#ff9800',
    fontWeight: '500',
  },
  infoContainer: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  usageList: {
    marginTop: 8,
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  usageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  sharingContainer: {
    marginTop: 8,
  },
  sharingItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  sharingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sharingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  securityItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  securityDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  rightsList: {
    marginTop: 8,
  },
  rightItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  rightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dataActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  deleteButton: {
    backgroundColor: '#fff0f0',
    borderColor: '#ffcccc',
  },
  dataActionText: {
    flex: 1,
    marginLeft: 12,
  },
  dataActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dataActionDescription: {
    fontSize: 14,
    color: '#666',
  },
  deleteTitle: {
    color: '#ff4444',
  },
  deleteDescription: {
    color: '#ff6666',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#4285F4',
    marginLeft: 12,
    fontWeight: '500',
  },
  linkIcon: {
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerEmail: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '500',
    marginBottom: 12,
  },
  footerVersion: {
    fontSize: 12,
    color: '#999',
  },
});

export default PrivacyScreen;
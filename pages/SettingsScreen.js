import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_SETTINGS = {
  parkingRadius: 500, // meters
  maxWalkingDistance: 1000, // meters
  parkingTypes: {
    street: true,
    garage: true,
    lot: true,
    free: true,
    paid: true,
  },
  notifications: true,
  trafficLayer: true,
};

const SettingsScreen = ({ navigation }) => {
  const { isDark, colors, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('parkingSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to avoid missing or invalid values
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          parkingRadius: Number(parsed.parkingRadius) || DEFAULT_SETTINGS.parkingRadius,
          maxWalkingDistance:
            Number(parsed.maxWalkingDistance) || DEFAULT_SETTINGS.maxWalkingDistance,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      // Ensure we always persist a complete, numeric settings object
      const safeSettings = {
        ...DEFAULT_SETTINGS,
        ...newSettings,
        parkingRadius: Number(newSettings.parkingRadius) || DEFAULT_SETTINGS.parkingRadius,
        maxWalkingDistance:
          Number(newSettings.maxWalkingDistance) || DEFAULT_SETTINGS.maxWalkingDistance,
      };
      await AsyncStorage.setItem('parkingSettings', JSON.stringify(safeSettings));
      setSettings(safeSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateParkingRadius = (radius) => {
    const newSettings = { ...settings, parkingRadius: Math.round(radius) };
    saveSettings(newSettings);
  };

  const updateWalkingDistance = (distance) => {
    const newSettings = { ...settings, maxWalkingDistance: Math.round(distance) };
    saveSettings(newSettings);
  };

  const toggleParkingType = (type) => {
    const newSettings = {
      ...settings,
      parkingTypes: {
        ...settings.parkingTypes,
        [type]: !settings.parkingTypes[type]
      }
    };
    saveSettings(newSettings);
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const SettingsItem = ({ icon, title, description, children }) => (
    <View style={styles.settingsItem}>
      <View style={styles.settingsHeader}>
        <Icon name={icon} size={24} color={colors.primary} style={styles.settingsIcon} />
        <View style={styles.settingsText}>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.settingsDescription, { color: colors.subtext }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );

  const ParkingTypeButton = ({ type, label, icon }) => (
    <TouchableOpacity
      style={[
        styles.parkingTypeButton,
        settings.parkingTypes[type] && styles.parkingTypeButtonActive
      ]}
      onPress={() => toggleParkingType(type)}
    >
      <Icon 
        name={icon} 
        size={20} 
        color={settings.parkingTypes[type] ? '#fff' : '#4285F4'} 
      />
      <Text style={[
        styles.parkingTypeText,
        settings.parkingTypes[type] && styles.parkingTypeTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Parking Radius Setting */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.border }]}>
          Parking Preferences
        </Text>
        
        <SettingsItem
          icon="my-location"
          title="Parking Radius"
          description={`${Number(settings.parkingRadius) || DEFAULT_SETTINGS.parkingRadius}m from destination`}
        >
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={100}
              maximumValue={2000}
              step={50}
              value={Number(settings.parkingRadius) || DEFAULT_SETTINGS.parkingRadius}
              onValueChange={updateParkingRadius}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="#ddd"
              thumbTintColor={colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: colors.subtext }]}>100m</Text>
              <Text style={[styles.sliderLabel, { color: colors.subtext }]}>2km</Text>
            </View>
          </View>
        </SettingsItem>

        {/* Maximum Walking Distance */}
        <SettingsItem
          icon="directions-walk"
          title="Maximum Walking Distance"
          description={`${settings.maxWalkingDistance}m from parking spot`}
        >
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={100}
              maximumValue={3000}
              step={50}
              value={settings.maxWalkingDistance}
              onValueChange={updateWalkingDistance}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="#ddd"
              thumbTintColor={colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: colors.subtext }]}>100m</Text>
              <Text style={[styles.sliderLabel, { color: colors.subtext }]}>3km</Text>
            </View>
          </View>
        </SettingsItem>
      </View>

      {/* General Settings */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.border }]}>
          General Settings
        </Text>

        <SettingsItem
          icon="map"
          title="Dark Mode"
          description={isDark ? 'On (dark)' : 'Off (light)'}
        >
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ddd', true: colors.primary }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </SettingsItem>
      </View>

      {/* Reset Settings */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={() => {
            Alert.alert(
              "Reset Settings",
              "Are you sure you want to reset all settings to default?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Reset", 
                  style: "destructive",
                  onPress: () => {
                    const defaultSettings = {
                      parkingRadius: 500,
                      maxWalkingDistance: 1000,
                      parkingTypes: {
                        street: true,
                        garage: true,
                        lot: true,
                        free: true,
                        paid: true
                      },
                      notifications: true,
                      trafficLayer: true
                    };
                    saveSettings(defaultSettings);
                  }
                }
              ]
            );
          }}
        >
          <Icon name="restart-alt" size={20} color={colors.danger} />
          <Text style={[styles.resetButtonText, { color: colors.danger }]}>Reset to Default Settings</Text>
        </TouchableOpacity>
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
  settingsItem: {
    marginBottom: 24,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsIcon: {
    marginRight: 12,
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingsDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  parkingTypesContainer: {
    marginTop: 8,
  },
  parkingTypesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  parkingTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4285F4',
    backgroundColor: '#fff',
  },
  parkingTypeButtonActive: {
    backgroundColor: '#4285F4',
  },
  parkingTypeText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '500',
  },
  parkingTypeTextActive: {
    color: '#fff',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  resetButtonText: {
    marginLeft: 8,
    color: '#ff4444',
    fontWeight: '600',
  },
});

export default SettingsScreen;
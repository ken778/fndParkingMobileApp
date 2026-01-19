import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Linking,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFA from 'react-native-vector-icons/FontAwesome';

const HelpSupportScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const contactInfo = {
    supportEmail: 'support@fndparking.com',
    emergencyPhone: '0769524833',
    twitter: 'https://twitter.com/FndParkingApp',
    instagram: 'https://instagram.com/FndParking'
  };

  const faqData = [
    {
      id: 1,
      question: "How do I find available parking spots?",
      answer: "Open the app and allow location access. Available parking spots will appear on the map as blue markers. Tap on any marker to get directions or reserve the spot.",
      category: 'general'
    },
    {
      id: 2,
      question: "How do I report a fraudulent or unavailable parking spot?",
      answer: "Tap the red 'Report' button on the spot details screen. Select a reason and provide any additional details. Our team will review the report within 24 hours.",
      category: 'reporting'
    },
    {
      id: 3,
      question: "How do I list my parking spot?",
      answer: "Go to the 'My Spots' section, tap the '+' button, fill in your spot details, set your availability schedule and pricing, then publish your listing.",
      category: 'listings'
    },
    {
      id: 4,
      question: "What happens if a spot isn't available when I arrive?",
      answer: "Report the issue immediately through the app. We'll refund your reservation and investigate the listing. Repeat offenders may be suspended.",
      category: 'issues'
    },
    {
      id: 5,
      question: "How are payments processed?",
      answer: "All payments are processed securely through our platform. We accept major credit cards and digital wallets. Spot owners receive payment after successful reservations.",
      category: 'payments'
    },
    {
      id: 6,
      question: "Can I cancel a reservation?",
      answer: "Yes, you can cancel up to 1 hour before your reservation time for a full refund. Cancellations within 1 hour may incur a small fee.",
      category: 'reservations'
    }
  ];

  const categories = [
    { id: 'general', label: 'General', icon: 'help' },
    { id: 'reporting', label: 'Reporting', icon: 'report' },
    { id: 'listings', label: 'Listings', icon: 'list' },
    { id: 'issues', label: 'Issues', icon: 'error' },
    { id: 'payments', label: 'Payments', icon: 'payment' },
    { id: 'reservations', label: 'Reservations', icon: 'book' }
  ];

  const openLink = (url) => {
    Linking.openURL(url).catch(err => 
      console.error('Failed to open URL:', err)
    );
  };

  const sendSupportMessage = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    Alert.alert(
      'Send Support Request',
      'Are you sure you want to send this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => {
            // In a real app, you would send this to your backend
            console.log('Support message:', { 
              category: selectedCategory, 
              message, 
              email: userEmail 
            });
            Alert.alert(
              'Message Sent',
              'Our support team will get back to you within 24 hours.',
              [{ text: 'OK', onPress: () => {
                setMessage('');
                setUserEmail('');
              }}]
            );
          }
        }
      ]
    );
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Support',
      `Call ${contactInfo.emergencyPhone} for immediate assistance?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${contactInfo.emergencyPhone}`)
        }
      ]
    );
  };

  const FAQItem = ({ question, answer }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <TouchableOpacity 
        style={styles.faqItem}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{question}</Text>
          <Icon 
            name={expanded ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#666" 
          />
        </View>
        {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={handleEmergencyCall}
          >
            <Icon name="phone-in-talk" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Emergency Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => Linking.openURL(`mailto:${contactInfo.supportEmail}`)}
          >
            <Icon name="email" size={24} color="#4285F4" />
            <Text style={styles.quickActionText}>Email Support</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* FAQ List */}
      <View style={styles.section}>
        <View style={styles.faqHeader}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.faqCount}>
            {faqData.filter(faq => faq.category === selectedCategory).length} questions
          </Text>
        </View>
        
        <View style={styles.faqList}>
          {faqData
            .filter(faq => faq.category === selectedCategory)
            .map(faq => (
              <FAQItem 
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
       <Text style={styles.sectionTitle}>Contact Support</Text>
        
        <TouchableOpacity 
          style={styles.contactItem}
          onPress={() => Linking.openURL(`mailto:${contactInfo.supportEmail}`)}
        >
          <Icon name="email" size={20} color="#4285F4" />
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactDetail}>{contactInfo.supportEmail}</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.contactItem}
          onPress={handleEmergencyCall}
        >
          <Icon name="phone" size={20} color="#4CAF50" />
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactLabel}>Emergency Phone</Text>
            <Text style={styles.contactDetail}>{contactInfo.emergencyPhone}</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <View style={styles.socialContainer}>
          <Text style={styles.socialTitle}>Follow us on social media:</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(contactInfo.twitter)}
            >
              <IconFA name="twitter" size={20} color="#1DA1F2" />
              <Text style={styles.socialButtonText}>Twitter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(contactInfo.instagram)}
            >
              <IconFA name="instagram" size={20} color="#E4405F" />
              <Text style={styles.socialButtonText}>Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Support Hours */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Icon name="access-time" size={16} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Support Hours</Text>
            <Text style={styles.infoDescription}>
              Monday - Friday: 8 AM - 8 PM (Local Time){'\n'}
              Saturday - Sunday: 9 AM - 5 PM (Local Time)
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Icon name="verified-user" size={16} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Response Time</Text>
            <Text style={styles.infoDescription}>
              Email: Within 24 hours{'\n'}
              Emergency Calls: Immediate response
            </Text>
          </View>
        </View>
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
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4285F4',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    backgroundColor: '#4285F4',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  faqCount: {
    fontSize: 14,
    color: '#666',
  },
  faqList: {
    marginTop: 8,
  },
  faqItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categorySelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  categoryOptionActive: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#666',
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0c1f8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 14,
    color: '#4285F4',
  },
  socialContainer: {
    marginTop: 16,
  },
  socialTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialButton: {
    alignItems: 'center',
    padding: 12,
    flex: 1,
  },
  socialButtonText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  infoSection: {
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HelpSupportScreen;
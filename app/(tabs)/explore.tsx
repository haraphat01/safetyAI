import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { aiSafetyMonitor, SafetySettings } from '@/services/AISafetyMonitor';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SafetyScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [settings, setSettings] = useState<SafetySettings>({
    fallDetectionEnabled: true,
    impactDetectionEnabled: true,
    suspiciousActivityEnabled: true,
    sensitivity: 'medium',
    autoSOS: false,
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [tipsModalVisible, setTipsModalVisible] = useState(false);

  useEffect(() => {
    loadSettings();
    checkMonitoringStatus();
  }, []);

  const loadSettings = () => {
    const currentSettings = aiSafetyMonitor.getSettings();
    setSettings(currentSettings);
  };

  const checkMonitoringStatus = () => {
    setIsMonitoring(aiSafetyMonitor.isMonitoringActive());
  };

  const handleSettingChange = (key: keyof SafetySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    aiSafetyMonitor.setSettings(newSettings);
  };

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        aiSafetyMonitor.stopMonitoring();
        setIsMonitoring(false);
      } else {
        await aiSafetyMonitor.startMonitoring();
        setIsMonitoring(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle monitoring. Please check permissions.');
    }
  };

  const safetyTips = [
    {
      title: 'Stay Aware of Your Surroundings',
      description: 'Always be conscious of your environment and trust your instincts if something feels wrong.',
      icon: 'eye-outline',
    },
    {
      title: 'Share Your Location',
      description: 'Let trusted friends or family know where you\'re going and when you expect to arrive.',
      icon: 'location-outline',
    },
    {
      title: 'Keep Your Phone Charged',
      description: 'Ensure your phone has enough battery life for emergency situations.',
      icon: 'battery-charging-outline',
    },
    {
      title: 'Use Well-Lit Paths',
      description: 'When walking at night, stick to well-lit areas and avoid shortcuts through dark alleys.',
      icon: 'bulb-outline',
    },
    {
      title: 'Trust Your Instincts',
      description: 'If a situation feels unsafe, remove yourself from it immediately.',
      icon: 'heart-outline',
    },
    {
      title: 'Have Emergency Contacts Ready',
      description: 'Keep important emergency numbers easily accessible on your phone.',
      icon: 'call-outline',
    },
  ];

  const renderSettingItem = (
    title: string,
    description: string,
    type: 'switch' | 'select',
    value: any,
    onValueChange: (value: any) => void,
    options?: { label: string; value: any }[]
  ) => (
    <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: colors.tabIconDefault }]}>
          {description}
        </Text>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.tint }}
          thumbColor={value ? 'white' : colors.tabIconDefault}
        />
      ) : (
        <View style={styles.selectContainer}>
          {options?.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.selectOption,
                {
                  backgroundColor: value === option.value ? colors.tint : colors.border,
                },
              ]}
              onPress={() => onValueChange(option.value)}
            >
              <Text
                style={[
                  styles.selectOptionText,
                  { color: value === option.value ? 'white' : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Safety Settings</Text>
          <TouchableOpacity
            style={[styles.monitoringButton, { backgroundColor: isMonitoring ? '#4CAF50' : '#FF6B6B' }]}
            onPress={toggleMonitoring}
          >
            <Ionicons name={isMonitoring ? 'shield-checkmark' : 'shield-outline'} size={20} color="white" />
            <Text style={styles.monitoringButtonText}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Monitoring Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Safety Monitor</Text>
          
          {renderSettingItem(
            'Fall Detection',
            'Detect potential falls and accidents',
            'switch',
            settings.fallDetectionEnabled,
            (value) => handleSettingChange('fallDetectionEnabled', value)
          )}

          {renderSettingItem(
            'Impact Detection',
            'Detect sudden impacts or collisions',
            'switch',
            settings.impactDetectionEnabled,
            (value) => handleSettingChange('impactDetectionEnabled', value)
          )}

          {renderSettingItem(
            'Suspicious Activity',
            'Monitor for unusual movement patterns',
            'switch',
            settings.suspiciousActivityEnabled,
            (value) => handleSettingChange('suspiciousActivityEnabled', value)
          )}

          {renderSettingItem(
            'Sensitivity Level',
            'Adjust detection sensitivity',
            'select',
            settings.sensitivity,
            (value) => handleSettingChange('sensitivity', value),
            [
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
            ]
          )}

          {renderSettingItem(
            'Auto SOS',
            'Automatically send SOS for high-confidence threats',
            'switch',
            settings.autoSOS,
            (value) => handleSettingChange('autoSOS', value)
          )}
        </View>

        {/* Safety Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Features</Text>
          
          <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="location" size={24} color={colors.tint} />
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Location Tracking</Text>
              <Text style={[styles.featureDescription, { color: colors.tabIconDefault }]}>
                Share your location with emergency contacts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="notifications" size={24} color={colors.tint} />
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Smart Notifications</Text>
              <Text style={[styles.featureDescription, { color: colors.tabIconDefault }]}>
                Get alerts for nearby safety concerns
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="mic" size={24} color={colors.tint} />
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Voice SOS</Text>
              <Text style={[styles.featureDescription, { color: colors.tabIconDefault }]}>
                Activate SOS with voice commands
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
          </TouchableOpacity>
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Tips</Text>
            <TouchableOpacity onPress={() => setTipsModalVisible(true)}>
              <Text style={[styles.viewAllText, { color: colors.tint }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {safetyTips.slice(0, 3).map((tip, index) => (
            <View key={index} style={[styles.tipCard, { backgroundColor: colors.card }]}>
              <Ionicons name={tip.icon as any} size={20} color={colors.tint} />
              <View style={styles.tipInfo}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
                <Text style={[styles.tipDescription, { color: colors.tabIconDefault }]}>
                  {tip.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Emergency Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Information</Text>
          
          <View style={[styles.emergencyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle" size={24} color={colors.tint} />
            <View style={styles.emergencyInfo}>
              <Text style={[styles.emergencyTitle, { color: colors.text }]}>Emergency Services</Text>
              <Text style={[styles.emergencyDescription, { color: colors.tabIconDefault }]}>
                In case of emergency, call your local emergency number immediately
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Safety Tips Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={tipsModalVisible}
        onRequestClose={() => setTipsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Safety Tips</Text>
              <TouchableOpacity onPress={() => setTipsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.tabIconDefault} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.tipsList}>
              {safetyTips.map((tip, index) => (
                <View key={index} style={[styles.tipCard, { backgroundColor: colors.card }]}>
                  <Ionicons name={tip.icon as any} size={24} color={colors.tint} />
                  <View style={styles.tipInfo}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
                    <Text style={[styles.tipDescription, { color: colors.tabIconDefault }]}>
                      {tip.description}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  monitoringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  monitoringButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  selectOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureInfo: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipInfo: {
    flex: 1,
    marginLeft: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tipsList: {
    flex: 1,
  },
});

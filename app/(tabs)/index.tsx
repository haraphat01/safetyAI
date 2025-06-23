import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { aiSafetyMonitor, ThreatDetection } from '@/services/AISafetyMonitor';
import { CrimeometerService } from '@/services/CrimeometerService';
import { emergencyService } from '@/services/EmergencyService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [recentThreats, setRecentThreats] = useState<ThreatDetection[]>([]);
  const [crimeAlerts, setCrimeAlerts] = useState<CrimeAlert[]>([]);
  const [sosButtonScale] = useState(new Animated.Value(1));
  const [monitoringPulse] = useState(new Animated.Value(1));

  useEffect(() => {
    // Initialize AI monitoring
    initializeAIMonitoring();
    
    // Check for active SOS alerts
    checkActiveSOS();

    // Load crime alerts
    loadCrimeAlerts();

    // Set up threat callback
    aiSafetyMonitor.setThreatCallback((threat) => {
      setRecentThreats(prev => [threat, ...prev.slice(0, 4)]);
      handleThreatDetected(threat);
    });

    // Start monitoring pulse animation
    startMonitoringPulse();

    return () => {
      aiSafetyMonitor.stopMonitoring();
    };
  }, []);

  const initializeAIMonitoring = async () => {
    try {
      await aiSafetyMonitor.startMonitoring();
      setIsMonitoring(true);
      startMonitoringPulse();
    } catch (error) {
      console.error('Failed to initialize AI monitoring:', error);
    }
  };

  const loadCrimeAlerts = async () => {
    try {
      const location = await emergencyService.getCurrentLocation();
      if (location) {
        const alerts = await CrimeometerService.getCrimeAlerts(location.latitude, location.longitude);
        setCrimeAlerts(alerts);
      }
    } catch (error) {
      console.error('Failed to load crime alerts:', error);
    }
  };

  const checkActiveSOS = async () => {
    if (!user) return;
    
    try {
      const activeAlerts = await emergencyService.getActiveSOSAlerts(user.id);
      setIsSOSActive(activeAlerts.length > 0);
    } catch (error) {
      console.error('Error checking SOS status:', error);
    }
  };

  const startMonitoringPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(monitoringPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(monitoringPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleThreatDetected = (threat: ThreatDetection) => {
    const threatMessages = {
      fall: 'Potential fall detected! Are you okay?',
      impact: 'Impact detected! Check if you need help.',
      suspicious_activity: 'Unusual movement detected. Stay alert!',
    };

    Alert.alert(
      'Safety Alert',
      threatMessages[threat.type] || 'Safety alert detected!',
      [
        { text: 'I\'m OK', style: 'default' },
        { text: 'Send SOS', style: 'destructive', onPress: () => handleSOS() },
      ]
    );
  };

  const handleSOS = async () => {
    if (!user) return;

    // Animate SOS button
    Animated.sequence([
      Animated.timing(sosButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sosButtonScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sosButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await emergencyService.sendSOS(user.id, 'manual');
      setIsSOSActive(true);
      Alert.alert(
        'SOS Sent!',
        'Emergency contacts have been notified with your location.',
        [
          {
            text: 'Resolve SOS',
            onPress: () => resolveSOS(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send SOS. Please try again.');
    }
  };

  const resolveSOS = async () => {
    if (!user) return;

    try {
      const activeAlerts = await emergencyService.getActiveSOSAlerts(user.id);
      for (const alert of activeAlerts) {
        await emergencyService.resolveSOS(alert.id);
      }
      setIsSOSActive(false);
    } catch (error) {
      console.error('Error resolving SOS:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Welcome back, {user?.user_metadata?.full_name || 'User'}!
            </Text>
            <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
              Your safety is our priority
            </Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>

        {/* AI Monitoring Status */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusHeader}>
            <Animated.View style={[styles.monitoringIndicator, { transform: [{ scale: monitoringPulse }] }]}>
              <Ionicons 
                name={isMonitoring ? "shield-checkmark" : "shield-outline"} 
                size={24} 
                color={isMonitoring ? "#4CAF50" : colors.tabIconDefault} 
              />
            </Animated.View>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              AI Safety Monitor
            </Text>
          </View>
          <Text style={[styles.statusText, { color: colors.tabIconDefault }]}>
            {isMonitoring 
              ? "Active - Monitoring for threats" 
              : "Inactive - Please enable permissions"
            }
          </Text>
        </View>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Animated.View style={[styles.sosButtonContainer, { transform: [{ scale: sosButtonScale }] }]}>
            <TouchableOpacity
              style={[
                styles.sosButton,
                { 
                  backgroundColor: isSOSActive ? '#FF6B6B' : colors.tint,
                  borderColor: isSOSActive ? '#FF6B6B' : colors.tint,
                }
              ]}
              onPress={handleSOS}
              disabled={isSOSActive}
            >
              <Ionicons name="warning" size={32} color="white" />
              <Text style={[styles.sosButtonText, { color: colors.buttonText }]}>
                {isSOSActive ? 'SOS Active' : 'SOS'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.sosDescription, { color: colors.tabIconDefault }]}>
            Tap to send emergency alert to your contacts
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="location" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="people" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Contacts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="settings" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="shield" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Safety Tips</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Alerts */}
        {recentThreats.length > 0 && (
          <View style={styles.recentAlerts}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Alerts</Text>
            {recentThreats.map((threat, index) => (
              <View key={index} style={[styles.alertItem, { backgroundColor: colors.card }]}>
                <Ionicons 
                  name={threat.type === 'fall' ? 'warning' : 'alert-circle'} 
                  size={20} 
                  color="#FF6B6B" 
                />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    {threat.type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={[styles.alertTime, { color: colors.tabIconDefault }]}>
                    {new Date(threat.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={[styles.alertConfidence, { color: colors.tint }]}>
                  {Math.round(threat.confidence * 100)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Crime Alerts */}
        {crimeAlerts.length > 0 && (
          <View style={styles.recentAlerts}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Warnings</Text>
            {crimeAlerts.map((alert, index) => (
              <View key={index} style={[styles.alertItem, { backgroundColor: colors.card }]}>
                <Ionicons 
                  name={alert.severity === 'high' ? 'warning' : 'alert-circle'} 
                  size={20} 
                  color={alert.severity === 'high' ? '#F44336' : '#FF9800'} 
                />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={[styles.alertTime, { color: colors.tabIconDefault }]}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: alert.severity === 'high' ? '#F44336' : '#FF9800' }]}>
                  <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  signOutButton: {
    padding: 8,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  monitoringIndicator: {
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sosButtonContainer: {
    marginBottom: 12,
  },
  sosButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sosDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  recentAlerts: {
    marginBottom: 24,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 12,
    marginTop: 2,
  },
  alertConfidence: {
    fontSize: 12,
    fontWeight: '600',
  },
  severityBadge: {
    padding: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

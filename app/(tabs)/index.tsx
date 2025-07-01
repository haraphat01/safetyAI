import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSOSRecording } from '@/hooks/useSOSRecording';
import { supabase } from '@/lib/supabase';
import { aiSafetyMonitor, ThreatDetection } from '@/services/AISafetyMonitor';
import { emergencyService } from '@/services/EmergencyService';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import components
import AIMonitoringStatus from '@/components/AIMonitoringStatus';
import CheckInCard from '@/components/CheckInCard';
import CheckInModal from '@/components/CheckInModal';

import HomeHeader from '@/components/HomeHeader';
import QuickActions from '@/components/QuickActions';
import RecentAlerts from '@/components/RecentAlerts';
import RecordingStatus from '@/components/RecordingStatus';
import SOSButton from '@/components/SOSButton';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // State management
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [recentThreats, setRecentThreats] = useState<ThreatDetection[]>([]);

  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));
  const [isScheduling, setIsScheduling] = useState(false);

  // Animation values
  const [sosButtonScale] = useState(new Animated.Value(1));
  const [monitoringPulse] = useState(new Animated.Value(1));
  const [modalScale] = useState(new Animated.Value(0.8));
  const [modalOpacity] = useState(new Animated.Value(0));

  // Custom hooks
  const { activeCheckIn, timer, handleStopCheckIn, scheduleCheckIn } = useCheckIn();
  const {
    recording,
    recordingTimer,
    startSosLoop,
    stopSosLoop,
    sendSosData,
    stopRecording,
    stopRecordingTimer,
  } = useSOSRecording();

  // Refs
  const staleAlertsResolvedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize AI monitoring
    initializeAIMonitoring();
    // Check for active SOS alerts (only resolve stale alerts once per session)
    checkActiveSOS();



    // Set up threat callback
    aiSafetyMonitor.setThreatCallback((threat) => {
      setRecentThreats(prev => [threat, ...prev.slice(0, 4)]);
      handleThreatDetected(threat);
    });

    // Start monitoring pulse animation
    startMonitoringPulse();

    // Poll for overdue check-ins every minute
    if (user) {
      const interval = setInterval(async () => {
        try {
          const pending = await emergencyService.getPendingCheckIns(user.id);
          const now = new Date();
          for (const check of pending) {
            if (new Date(check.scheduled_time) < now && check.status === 'pending') {
              // Mark as overdue and notify contacts
              await supabase
                .from('safety_checks')
                .update({ status: 'overdue' })
                .eq('id', check.id);
              // Note: Emergency contacts will be notified by the backend when SOS is triggered
            }
          }
        } catch (e) {
          // Optionally log error
        }
      }, 60000);
      return () => clearInterval(interval);
    }

    return () => {
      aiSafetyMonitor.stopMonitoring();
    };
  }, [user]);

  // Reset stale alerts flag when user changes
  useEffect(() => {
    if (user) {
      staleAlertsResolvedRef.current = false;
    }
  }, [user?.id]);

  // Add a useEffect to handle the 1-minute timer completion
  useEffect(() => {
    if (isSOSActive && recording && recordingTimer >= 60) {
      // Reset timer and send the recording
      const sendCurrentRecording = async () => {
        stopRecordingTimer();
        const audioUri = await stopRecording();
        if (audioUri) {
          await sendSosData(audioUri);
        }
        // Start new recording if SOS is still active
        if (isSOSActive) {
          await startSosLoop();
        }
      };
      sendCurrentRecording();
    }
  }, [recordingTimer, isSOSActive, recording]);

  const initializeAIMonitoring = async () => {
    try {
      await aiSafetyMonitor.startMonitoring();
      setIsMonitoring(true);
      startMonitoringPulse();
    } catch (error) {
      console.error('Failed to initialize AI monitoring:', error);
    }
  };



  const checkActiveSOS = async () => {
    if (!user) return;
    try {
      // Only resolve stale SOS alerts once per session to prevent duplicate logs
      if (!staleAlertsResolvedRef.current) {
        await emergencyService.resolveStaleSOSAlerts(user.id, 1);
        staleAlertsResolvedRef.current = true;
      }
      
      // Then check for any remaining active alerts
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
      sudden_movement: 'Sudden movement detected. Are you safe?',
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
      setIsSOSActive(true);
      await startSosLoop(); // Start recording and sending every 1 minute
    } catch (error) {
      Alert.alert('Error', 'Failed to start SOS. Please try again.');
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

  const handleCheckIn = () => {
    setScheduledTime(new Date(Date.now() + 30 * 60 * 1000));
    setCheckInModalVisible(true);
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animate modal in
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animate modal out
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCheckInModalVisible(false);
    });
  };

  const confirmCheckIn = async () => {
    if (!user) return;
    setIsScheduling(true);
    try {
      await scheduleCheckIn(scheduledTime);
      closeModal();
    } catch (e) {
      // Error already handled in the hook
    } finally {
      setIsScheduling(false);
    }
  };

  const resolveSOS = async () => {
    if (!user) return;
    
    try {
      // Stop the SOS loop and recording
      await stopSosLoop();
      
      // Resolve all active SOS alerts for this user
      await emergencyService.resolveAllActiveSOSAlerts(user.id);
      
      // Update UI state
      setIsSOSActive(false);
      
      // Animate the button
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
      
      // Show confirmation to user
      Alert.alert('SOS Stopped', 'Emergency alert has been stopped and resolved.');
    } catch (error) {
      console.error('Error resolving SOS:', error);
      Alert.alert('Error', 'Failed to stop SOS. Please try again.');
    }
  };

  const handleStopAndSend = async () => {
    stopRecordingTimer();
    const audioUri = await stopRecording();
    if (audioUri) {
      await sendSosData(audioUri);
    }
    // Stop SOS completely when manually stopping recording
    await resolveSOS();
  };

  const handleContacts = () => {
    router.push('/(tabs)/contacts');
  };

  const handleSettings = () => {
    router.push('/(tabs)/profile');
  };

  const handleSafetyTips = () => {
    router.push('/(tabs)/safety-tips');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <HomeHeader onSignOut={handleSignOut} />

        {/* AI Monitoring Status */}
        <AIMonitoringStatus 
          isMonitoring={isMonitoring} 
          monitoringPulse={monitoringPulse} 
        />

        {/* SOS Button */}
        <SOSButton
          isSOSActive={isSOSActive}
          sosButtonScale={sosButtonScale}
          onSOSPress={handleSOS}
          onStopSOS={resolveSOS}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {isSOSActive && recording && (
            <RecordingStatus
              recordingTimer={recordingTimer}
              onStopAndSend={handleStopAndSend}
            />
          )}
          
          {activeCheckIn && (
            <CheckInCard
              timer={timer}
              onStopCheckIn={handleStopCheckIn}
            />
          )}
          
          <QuickActions
            onCheckIn={handleCheckIn}
            onContacts={handleContacts}
            onSettings={handleSettings}
            onSafetyTips={handleSafetyTips}
            hasActiveCheckIn={!!activeCheckIn}
          />
        </View>

        {/* Recent Alerts */}
        <RecentAlerts recentThreats={recentThreats} />


      </ScrollView>

      {/* Check-In Modal */}
      <CheckInModal
        visible={checkInModalVisible}
        scheduledTime={scheduledTime}
        isScheduling={isScheduling}
        onClose={closeModal}
        onConfirm={confirmCheckIn}
        onTimeChange={setScheduledTime}
        modalScale={modalScale}
        modalOpacity={modalOpacity}
      />
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
  quickActions: {
    marginBottom: 24,
  },
});
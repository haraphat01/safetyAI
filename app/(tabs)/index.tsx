import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { aiSafetyMonitor, ThreatDetection } from '@/services/AISafetyMonitor';
import CrimeometerService from '@/services/CrimeometerService';
import { emergencyService } from '@/services/EmergencyService';
import { locationService } from '@/services/LocationService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import * as Battery from 'expo-battery';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
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
  const router = useRouter();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [recentThreats, setRecentThreats] = useState<ThreatDetection[]>([]);
  const [crimeAlerts, setCrimeAlerts] = useState<any[]>([]);
  const [sosButtonScale] = useState(new Animated.Value(1));
  const [monitoringPulse] = useState(new Animated.Value(1));
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));
  const [isScheduling, setIsScheduling] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState<any>(null);
  const [timer, setTimer] = useState<number>(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sosIntervalId, setSosIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingsSent, setRecordingsSent] = useState<number>(0);
  const [modalScale] = useState(new Animated.Value(0.8));
  const [modalOpacity] = useState(new Animated.Value(0));
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
  // Load active check-in on mount
  useEffect(() => {
    if (!user) return;
    const loadActiveCheckIn = async () => {
      const pending = await emergencyService.getPendingCheckIns(user.id);
      if (pending.length > 0) {
        setActiveCheckIn(pending[0]);
        setTimer(Math.max(0, Math.floor((new Date(pending[0].scheduled_time).getTime() - Date.now()) / 1000)));
      }
    };
    loadActiveCheckIn();
  }, [user]);
  // Timer countdown effect
  useEffect(() => {
    if (!activeCheckIn) return;
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval.current!);
          handleTimerElapsed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as any;
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [activeCheckIn]);
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
          await startRecording();
          startRecordingTimer();
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
      // First, resolve any stale SOS alerts (older than 1 hour)
      await emergencyService.resolveStaleSOSAlerts(user.id, 1);
      
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
      const checkIn = await emergencyService.scheduleCheckIn(user.id, scheduledTime);
      closeModal();
      setActiveCheckIn(checkIn);
      setTimer(Math.max(0, Math.floor((new Date(checkIn.scheduled_time).getTime() - Date.now()) / 1000)));
      Alert.alert('Check-In Scheduled', 'Your safety check-in has been scheduled.');
    } catch (e) {
      Alert.alert('Error', 'Failed to schedule check-in.');
    } finally {
      setIsScheduling(false);
    }
  };
  const handleStopCheckIn = async () => {
    if (!activeCheckIn) return;
    try {
      await emergencyService.deleteCheckIn(activeCheckIn.id);
      setActiveCheckIn(null);
      setTimer(0);
      Alert.alert('Check-In Cancelled', 'Your safety check-in has been cancelled.');
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel check-in.');
    }
  };
  const handleTimerElapsed = async () => {
    if (!activeCheckIn || !user) return;
    // Mark as overdue and trigger SOS
    await supabase
      .from('safety_checks')
      .update({ status: 'overdue' })
      .eq('id', activeCheckIn.id);
    await emergencyService.sendSOS(user.id, 'ai');
    setActiveCheckIn(null);
    Alert.alert('SOS Triggered', 'No check-in received. Emergency contacts have been notified.');
  };
  const handleContacts = () => {
    router.push('/(tabs)/contacts');
  };
  const handleSettings = () => {
    router.push('/(tabs)/explore');
  };
  const handleSafetyTips = () => {
    router.push('/(tabs)/safety-tips');
  };

  function formatTimerDHMS(seconds: number) {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    return parts.join(', ');
  }

  const checkInStyles = {
    checkInCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center' as const,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    checkInTitle: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.text,
      marginBottom: 8,
    },
    timerCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.tint + '22',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 4,
      borderColor: colors.tint,
    },
    timerText: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      color: colors.tint,
    },
    stopButton: {
      marginTop: 12,
      backgroundColor: colors.error,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 8,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    stopButtonText: {
      color: colors.buttonText,
      fontWeight: 'bold' as const,
      fontSize: 16,
      letterSpacing: 1,
    },
  };

  // Helper to start audio recording
  const startRecording = async () => {
    try {
      if (recording) {
        // Already recording, do not start another
        return recording;
      }
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Audio recording permission is required.');
        return null;
      }
      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      return rec;
    } catch (err) {
      console.error('Failed to start recording', err);
      return null;
    }
  };

  // Helper to stop audio recording
  const stopRecording = async () => {
    try {
      if (!recording) return null;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecording(null);
      return null;
    }
  };

  // Helper to get battery percentage
  const getBatteryPercent = async () => {
    try {
      const level = await Battery.getBatteryLevelAsync();
      return Math.round(level * 100);
    } catch (err) {
      console.error('Failed to get battery level', err);
      return null;
    }
  };

  // Helper to send data to backend with audio URL for contacts to listen
  const sendSosData = async (audioUri: string | null) => {
    if (!user) return;
    setIsSending(true);
    try {
      // Get detailed location and network information
      const { location, network } = await locationService.getDetailedLocationInfo();
      const battery = await getBatteryPercent();
      if (!location) {
        throw new Error('Unable to get location information');
      }

      // Upload audio to Supabase Storage and get the public URL
      let audioUrl = null;
      if (audioUri) {
        try {
          // Get the current user session for storage authorization
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            console.error('No active session for storage upload:', sessionError);
            throw new Error('Authentication required for audio upload');
          }

          // Create a unique filename with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `sos-audio-${user.id}-${timestamp}.m4a`;

          console.log('Attempting to upload audio file:', fileName);

          // Read the file as base64
          const base64Data = await FileSystem.readAsStringAsync(audioUri, {
            encoding: FileSystem.EncodingType.Base64
          });

          console.log('Audio file read, size:', Math.round(base64Data.length * 0.75 / 1024), 'KB');

          // Convert base64 to Uint8Array for upload
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Try multiple storage bucket names in case the bucket doesn't exist
          const bucketNames = ['sos-audio', 'audio', 'uploads', 'public'];
          let uploadSuccess = false;

          for (const bucketName of bucketNames) {
            try {
              console.log(`Trying to upload to bucket: ${bucketName}`);

              // Upload the audio file to Supabase Storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, bytes, {
                  contentType: 'audio/m4a',
                  upsert: true, // Allow overwriting
                  cacheControl: '3600', // Cache for 1 hour
                });

              if (uploadError) {
                console.error(`Upload to ${bucketName} failed:`, uploadError);
                continue; // Try next bucket
              }

              // Get the public URL for the uploaded file
              const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

              audioUrl = urlData.publicUrl;
              console.log(`Audio uploaded successfully to ${bucketName}:`, audioUrl);
              uploadSuccess = true;
              break; // Success, exit loop

            } catch (bucketError) {
              console.error(`Error with bucket ${bucketName}:`, bucketError);
              continue; // Try next bucket
            }
          }

          if (!uploadSuccess) {
            console.error('All storage bucket attempts failed');
            throw new Error('Unable to upload audio to any storage bucket');
          }

        } catch (uploadErr) {
          console.error('Error during audio upload process:', uploadErr);
          // Continue without audio URL but notify user
          Alert.alert(
            'Audio Upload Failed',
            'SOS will be sent without audio recording. Please check your connection.'
          );
        }
      }

      // Prepare the enhanced SOS data payload with all information
      const sosPayload = {
        userId: user.id,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country,
          postalCode: location.postalCode,
          formattedAddress: location.formattedAddress,
        },
        battery: battery,
        networkInfo: {
          isConnected: network.isConnected,
          isInternetReachable: network.isInternetReachable,
          type: network.type,
          isWifi: network.isWifi,
          isCellular: network.isCellular,
        },
        timestamp: new Date().toISOString(),
        audioUrl: audioUrl, // This is the URL contacts will use to listen to the audio
        hasAudio: !!audioUrl,
        deviceInfo: {
          platform: 'mobile',
          recordingDuration: recordingTimer,
        },
      };

      // Log the enhanced data being sent for debugging
      console.log('=== ENHANCED SOS DATA BEING SENT ===');
      console.log('userId:', sosPayload.userId);
      console.log('location:', sosPayload.location);
      console.log('battery:', sosPayload.battery);
      console.log('networkInfo:', sosPayload.networkInfo);
      console.log('timestamp:', sosPayload.timestamp);
      console.log('audioUrl:', sosPayload.audioUrl);
      console.log('hasAudio:', sosPayload.hasAudio);
      console.log('recordingDuration:', sosPayload.deviceInfo.recordingDuration);
      console.log('originalAudioUri:', audioUri);
      console.log('==========================');

      // Get the current session token for the API call
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('No authentication token available');
      }

      // Call backend with enhanced data including address, network info, and audio URL
      const response = await fetch('https://pytenwpowmbdpbtonase.supabase.co/functions/v1/sos-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(sosPayload),
      });

      const responseData = await response.json();
      console.log('=== EDGE FUNCTION RESPONSE ===');
      console.log('status:', response.status);
      console.log('response:', responseData);
      console.log('=============================');

      if (!response.ok) {
        console.error('Edge function failed:', responseData);
        throw new Error(`API call failed: ${response.status} - ${responseData.message || 'Unknown error'}`);
      }

      // Success feedback with enhanced information
      const locationInfo = location.formattedAddress || `${location.latitude}, ${location.longitude}`;
      Alert.alert(
        'SOS Sent Successfully',
        `Emergency alert sent to your contacts with your location: ${locationInfo}${audioUrl ? ' and audio recording link' : ''}.`
      );

    } catch (err: any) {
      console.error('Failed to send SOS data:', err);
      Alert.alert(
        'Error',
        `Failed to send emergency alert: ${err.message || 'Unknown error'}. Please try again.`
      );
    } finally {
      setIsSending(false);
    }
  };

  // Helper to start a visible timer for the recording
  const startRecordingTimer = () => {
    setRecordingTimer(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTimer(prev => prev + 1);
    }, 1000) as any;
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Update startSosLoop to use a more reliable approach
  const startSosLoop = async () => {
    let isFirstSend = true;
    // Start first recording
    let rec = await startRecording();
    startRecordingTimer();
    // Set up interval for every 1 minute (as backup)
    const intervalId = setInterval(async () => {
      if (isSOSActive && recording) {
        stopRecordingTimer();
        const audioUri = await stopRecording();
        if (audioUri) {
          if (isFirstSend && user) {
            await emergencyService.sendSOS(user.id, 'manual');
            isFirstSend = false;
          }
          await sendSosData(audioUri);
        }
        // Start new recording for next 1 minute if SOS is still active
        if (isSOSActive) {
          rec = await startRecording();
          startRecordingTimer();
        }
      }
    }, 1 * 60 * 1000); // every 1 minute
    setSosIntervalId(intervalId);
  };

  // Stop the SOS audio loop
  const stopSosLoop = async () => {
    if (sosIntervalId) {
      clearInterval(sosIntervalId);
      setSosIntervalId(null);
    }
    stopRecordingTimer();
    await stopRecording();
  };

  // Fix the SOS button to call resolveSOS when stopping
  const resolveSOS = async () => {
    await stopSosLoop();
    setIsSOSActive(false);
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
                },
              ]}
              onPress={isSOSActive ? resolveSOS : handleSOS}
            >
              <Ionicons name="warning" size={32} color="white" />
              <Text style={[styles.sosButtonText, { color: colors.buttonText }]}>
                {isSOSActive ? 'Stop SOS' : 'SOS'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.sosDescription, { color: colors.tabIconDefault }]}>
            Tap to {isSOSActive ? 'stop' : 'send'} emergency alert to your contacts
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {isSOSActive && recording && (
            <View style={{
              alignItems: 'center',
              marginBottom: 12,
              backgroundColor: colors.card,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600' as const,
                color: colors.tint,
                letterSpacing: 1,
              }}>
                Recording: {`${Math.floor(recordingTimer / 60).toString().padStart(2, '0')}:${(recordingTimer % 60).toString().padStart(2, '0')}`} / 01:00
              </Text>
              <Text style={{ fontSize: 13, color: colors.tabIconDefault, marginTop: 2 }}>
                Audio will be sent every minute
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 8,
                  backgroundColor: '#FF6B6B',
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderRadius: 6,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={async () => {
                  stopRecordingTimer();
                  const audioUri = await stopRecording();
                  if (audioUri) {
                    await sendSosData(audioUri);
                  }
                  // Stop SOS completely when manually stopping recording
                  await resolveSOS();
                }}
              >
                <Text style={{ color: colors.buttonText, fontWeight: 'bold' as const, fontSize: 15, letterSpacing: 1 }}>
                  Stop & Send Now
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {activeCheckIn && (
            <View style={checkInStyles.checkInCard}>
              <Text style={checkInStyles.checkInTitle}>Safety Check-In Active</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.tint, marginBottom: 8 }}>
                {formatTimerDHMS(timer)} left
              </Text>
              <TouchableOpacity onPress={handleStopCheckIn} style={checkInStyles.stopButton}>
                <Text style={checkInStyles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="actionGrid" style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={handleCheckIn}
              disabled={!!activeCheckIn}
            >
              <Ionicons name="location" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={handleContacts}
            >
              <Ionicons name="people" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Contacts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={handleSettings}
            >
              <Ionicons name="settings" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={handleSafetyTips}
            >
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
      <Modal
        visible={checkInModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              }
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="location" size={24} color={colors.tint} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Schedule Safety Check-In
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.tabIconDefault }]}>
                Set a time for your safety check-in. If you don't respond, emergency contacts will be notified.
              </Text>
            </View>

            {/* DateTime Picker Container */}
            <View style={[styles.dateTimeContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.dateTimeLabel, { color: colors.text }]}>
                Check-in Time
              </Text>
              <DateTimePicker
                value={scheduledTime}
                mode="datetime"
                display="default"
                minimumDate={new Date()}
                onChange={(_, date) => date && setScheduledTime(date)}
                style={styles.dateTimePicker}
              />
              <Text style={[styles.dateTimeInfo, { color: colors.tabIconDefault }]}>
                {scheduledTime.toLocaleDateString()} at {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={closeModal}
                disabled={isScheduling}
              >
                <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.tint }]}
                onPress={confirmCheckIn}
                disabled={isScheduling}
              >
                {isScheduling ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="hourglass-outline" size={16} color={colors.buttonText} />
                    <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>
                      Scheduling...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>
                    Schedule Check-In
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  dateTimeContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateTimePicker: {
    width: '100%',
    height: 120,
  },
  dateTimeInfo: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    // No additional styles needed
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
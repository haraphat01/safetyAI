import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CustomContact, fakeCallService, ScheduledFakeCall } from '@/services/FakeCallService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ContactManagementModal from './ContactManagementModal';

interface FakeCallModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FakeCallModal({ visible, onClose }: FakeCallModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [scheduledCalls, setScheduledCalls] = useState<ScheduledFakeCall[]>([]);
  const [activeCall, setActiveCall] = useState<ScheduledFakeCall | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showContactManagement, setShowContactManagement] = useState(false);
  const [contacts, setContacts] = useState<CustomContact[]>([]);

  useEffect(() => {
    if (visible) {
      updateCallStatus();
      loadContacts();
      const interval = setInterval(updateCallStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadContacts = async () => {
    const allContacts = await fakeCallService.getAllContacts();
    setContacts(allContacts);
  };

  const updateCallStatus = () => {
    setScheduledCalls(fakeCallService.getScheduledCalls());
    setActiveCall(fakeCallService.getActiveCall());
  };

  const handleQuickCall = async (callerName?: string) => {
    try {
      setIsScheduling(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const callId = await fakeCallService.scheduleQuickFakeCall(callerName);
      
      Alert.alert(
        'Fake Call Scheduled',
        `A call from ${callerName || 'a contact'} will ring in 30 seconds.`,
        [{ text: 'OK', onPress: onClose }]
      );
      
      updateCallStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule fake call. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleEmergencyCall = async () => {
    try {
      setIsScheduling(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      const callId = await fakeCallService.scheduleEmergencyFakeCall();
      
      Alert.alert(
        'Emergency Fake Call Scheduled',
        'An emergency call will ring in 5 seconds to help you exit immediately.',
        [{ text: 'OK', onPress: onClose }]
      );
      
      updateCallStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule emergency fake call. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleAnswerCall = async () => {
    if (activeCall) {
      await fakeCallService.answerCall();
      updateCallStatus();
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      await fakeCallService.endCall();
      updateCallStatus();
    }
  };

  const handleCancelCall = (callId: string) => {
    const success = fakeCallService.cancelFakeCall(callId);
    if (success) {
      updateCallStatus();
      Alert.alert('Call Cancelled', 'The scheduled fake call has been cancelled.');
    }
  };

  const formatTimeRemaining = (scheduledTime: Date): string => {
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    const seconds = Math.max(0, Math.floor(diff / 1000));
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Fake Call</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Active Call Section */}
          {activeCall && (
            <View style={[styles.activeCallSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Incoming Call</Text>
              <View style={styles.callInfo}>
                <Ionicons name="call" size={32} color={colors.tint} />
                <View style={styles.callDetails}>
                  <Text style={[styles.callerName, { color: colors.text }]}>
                    {activeCall.config.callerName}
                  </Text>
                  <Text style={[styles.callerNumber, { color: colors.tabIconDefault }]}>
                    {activeCall.config.callerNumber}
                  </Text>
                </View>
              </View>
              <View style={styles.callActions}>
                <TouchableOpacity
                  style={[styles.callButton, styles.answerButton]}
                  onPress={handleAnswerCall}
                >
                  <Ionicons name="call" size={24} color="white" />
                  <Text style={styles.callButtonText}>Answer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.callButton, styles.endButton]}
                  onPress={handleEndCall}
                >
                  <Ionicons name="call-outline" size={24} color="white" />
                  <Text style={styles.callButtonText}>End</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            
            {/* Emergency Call Button */}
            <TouchableOpacity
              style={[styles.emergencyButton, { backgroundColor: colors.tint }]}
              onPress={handleEmergencyCall}
              disabled={isScheduling}
            >
              <Ionicons name="warning" size={24} color="white" />
              <Text style={styles.emergencyButtonText}>Emergency Exit Call (5s)</Text>
            </TouchableOpacity>

            {/* Quick Call Button */}
            <TouchableOpacity
              style={[styles.quickCallButton, { backgroundColor: colors.card }]}
              onPress={() => handleQuickCall()}
              disabled={isScheduling}
            >
              <Ionicons name="call" size={24} color={colors.tint} />
              <Text style={[styles.quickCallButtonText, { color: colors.text }]}>
                Quick Fake Call (30s)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Caller Options Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Caller</Text>
              <TouchableOpacity
                style={[styles.manageButton, { backgroundColor: colors.tint }]}
                onPress={() => setShowContactManagement(true)}
              >
                <Ionicons name="settings" size={16} color="white" />
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.callerGrid}>
              {contacts.map((contact, index) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.callerOption, { backgroundColor: colors.card }]}
                  onPress={() => handleQuickCall(contact.name)}
                  disabled={isScheduling}
                >
                  <Ionicons name="person" size={20} color={colors.tint} />
                  <Text style={[styles.callerOptionText, { color: colors.text }]}>
                    {contact.name}
                  </Text>
                  <Text style={[styles.callerOptionNumber, { color: colors.tabIconDefault }]}>
                    {contact.number}
                  </Text>
                  {contact.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.tint }]}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scheduled Calls Section */}
          {scheduledCalls.filter(call => call.status === 'scheduled').length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Scheduled Calls</Text>
              {scheduledCalls
                .filter(call => call.status === 'scheduled')
                .map((call) => (
                  <View key={call.id} style={[styles.scheduledCall, { backgroundColor: colors.card }]}>
                    <View style={styles.scheduledCallInfo}>
                      <Text style={[styles.scheduledCallName, { color: colors.text }]}>
                        {call.config.callerName}
                      </Text>
                      <Text style={[styles.scheduledCallTime, { color: colors.tabIconDefault }]}>
                        {formatTimeRemaining(call.scheduledTime)} remaining
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cancelButton, { backgroundColor: colors.notification }]}
                      onPress={() => handleCancelCall(call.id)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
            <View style={[styles.instructionsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                • Schedule a fake call to get out of uncomfortable situations{'\n'}
                • Choose from preset callers or use quick options{'\n'}
                • Your phone will ring with a realistic caller ID{'\n'}
                • Use the emergency option for immediate exit (5 seconds){'\n'}
                • Answer or let it ring to create a natural excuse
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Contact Management Modal */}
        <ContactManagementModal
          visible={showContactManagement}
          onClose={() => {
            setShowContactManagement(false);
            loadContacts(); // Refresh contacts when modal closes
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  activeCallSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  callDetails: {
    marginLeft: 12,
    flex: 1,
  },
  callerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  callerNumber: {
    fontSize: 14,
    marginTop: 2,
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
  },
  answerButton: {
    backgroundColor: '#4CAF50',
  },
  endButton: {
    backgroundColor: '#F44336',
  },
  callButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  quickCallButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  callerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  callerOption: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  callerOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  callerOptionNumber: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  manageButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  defaultBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
  },
  scheduledCall: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  scheduledCallInfo: {
    flex: 1,
  },
  scheduledCallName: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduledCallTime: {
    fontSize: 14,
    marginTop: 2,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 20,
  },
  instructionsCard: {
    padding: 16,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ScheduledFakeCall } from '@/services/FakeCallService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface IncomingCallScreenProps {
  visible: boolean;
  call: ScheduledFakeCall | null;
  onAnswer: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export default function IncomingCallScreen({
  visible,
  call,
  onAnswer,
  onDecline,
  onClose,
}: IncomingCallScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [callDuration, setCallDuration] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && call) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation for the phone icon
      startPulseAnimation();

      // Start haptic feedback
      startHapticFeedback();

      // Start call duration timer if answered
      if (isAnswered) {
        const interval = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
      }
    } else {
      // Reset animations
      slideAnim.setValue(height);
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      setCallDuration(0);
      setIsAnswered(false);
    }
  }, [visible, call, isAnswered]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startHapticFeedback = () => {
    const hapticInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 2000);

    return () => clearInterval(hapticInterval);
  };

  const handleAnswer = async () => {
    setIsAnswered(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onAnswer();
  };

  const handleDecline = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onDecline();
  };

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!call) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Caller Info Section */}
          <View style={styles.callerSection}>
            <Animated.View
              style={[
                styles.phoneIcon,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: colors.tint,
                },
              ]}
            >
              <Ionicons name="call" size={40} color="white" />
            </Animated.View>

            <Text style={[styles.callerName, { color: colors.text }]}>
              {call.config.callerName}
            </Text>
            
            <Text style={[styles.callerNumber, { color: colors.tabIconDefault }]}>
              {call.config.callerNumber}
            </Text>

            {isAnswered ? (
              <Text style={[styles.callStatus, { color: colors.text }]}>
                {formatCallDuration(callDuration)}
              </Text>
            ) : (
              <Text style={[styles.callStatus, { color: colors.text }]}>
                incoming call...
              </Text>
            )}
          </View>

          {/* Call Actions */}
          <View style={styles.actionsSection}>
            {!isAnswered ? (
              <>
                                 {/* Answer Button */}
                 <TouchableOpacity
                   style={[styles.actionButton, styles.answerButton]}
                   onPress={handleAnswer}
                   activeOpacity={0.8}
                 >
                   <View style={[styles.actionButtonInner, { backgroundColor: '#4CAF50' }]}>
                     <Ionicons name="call" size={32} color="white" />
                   </View>
                   <Text style={styles.actionButtonText}>Answer</Text>
                 </TouchableOpacity>

                 {/* Decline Button */}
                 <TouchableOpacity
                   style={[styles.actionButton, styles.declineButton]}
                   onPress={handleDecline}
                   activeOpacity={0.8}
                 >
                   <View style={[styles.actionButtonInner, { backgroundColor: '#F44336' }]}>
                     <Ionicons name="call-outline" size={32} color="white" />
                   </View>
                   <Text style={styles.actionButtonText}>Decline</Text>
                 </TouchableOpacity>
              </>
            ) : (
              <>
                                 {/* End Call Button */}
                 <TouchableOpacity
                   style={[styles.actionButton, styles.endButton]}
                   onPress={handleDecline}
                   activeOpacity={0.8}
                 >
                   <View style={[styles.actionButtonInner, { backgroundColor: '#F44336' }]}>
                     <Ionicons name="call" size={32} color="white" />
                   </View>
                   <Text style={styles.actionButtonText}>End Call</Text>
                 </TouchableOpacity>

                 {/* Mute Button */}
                 <TouchableOpacity
                   style={[styles.actionButton, styles.muteButton]}
                   onPress={() => {}}
                   activeOpacity={0.8}
                 >
                   <View style={[styles.actionButtonInner, { backgroundColor: '#9E9E9E' }]}>
                     <Ionicons name="mic-off" size={24} color="white" />
                   </View>
                   <Text style={styles.actionButtonText}>Mute</Text>
                 </TouchableOpacity>
              </>
            )}
          </View>

          {/* Additional Options */}
          <View style={styles.optionsSection}>
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.card }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  callerSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  phoneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  callerName: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerNumber: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  callStatus: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  actionButton: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  actionButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  answerButton: {
    // Green for answer
  },
  declineButton: {
    // Red for decline
  },
  endButton: {
    // Red for end call
  },
  muteButton: {
    // Gray for mute
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  optionsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 
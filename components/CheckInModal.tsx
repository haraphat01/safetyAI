import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CheckInModalProps {
  visible: boolean;
  scheduledTime: Date;
  isScheduling: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onTimeChange: (date: Date) => void;
  modalScale: Animated.Value;
  modalOpacity: Animated.Value;
}

export default function CheckInModal({
  visible,
  scheduledTime,
  isScheduling,
  onClose,
  onConfirm,
  onTimeChange,
  modalScale,
  modalOpacity,
}: CheckInModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
              onChange={(_, date) => date && onTimeChange(date)}
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
              onPress={onClose}
              disabled={isScheduling}
            >
              <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.tint }]}
              onPress={onConfirm}
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
  );
}

const styles = StyleSheet.create({
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
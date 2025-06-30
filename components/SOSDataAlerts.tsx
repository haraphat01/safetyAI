import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SOSData } from '@/lib/supabase';
import { sosDataService } from '@/services/SOSDataService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SOSDataAlertsProps {
  limit?: number;
}

export default function SOSDataAlerts({ limit = 10 }: SOSDataAlertsProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [sosData, setSosData] = useState<SOSData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSOSData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await sosDataService.getRecentSOSData(user.id, limit);
      setSosData(data);
    } catch (error) {
      console.error('Error loading SOS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSOSData();
    setRefreshing(false);
  };

  const handleDeleteAlert = async (id: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this SOS alert? This will also delete the associated audio file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await sosDataService.deleteSOSData(id, user.id);
              // Remove from local state
              setSosData(prev => prev.filter(item => item.id !== id));
              Alert.alert('Success', 'SOS alert deleted successfully');
            } catch (error) {
              console.error('Error deleting SOS data:', error);
              Alert.alert('Error', 'Failed to delete SOS alert');
            }
          },
        },
      ]
    );
  };

  const handlePlayAudio = async (audioUrl: string, recordingDuration: number) => {
    try {
      // Show confirmation dialog with audio duration
      const duration = formatDuration(recordingDuration);
      Alert.alert(
        'Play Audio Recording',
        `This audio recording is ${duration} long. Would you like to play it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Play Audio',
            onPress: async () => {
              try {
                await Linking.openURL(audioUrl);
              } catch (error) {
                console.error('Error opening audio URL:', error);
                Alert.alert('Error', 'Unable to play audio file. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error handling audio playback:', error);
      Alert.alert('Error', 'Unable to play audio file');
    }
  };

  const formatLocation = (location: SOSData['location']) => {
    if (location.formattedAddress) {
      return location.formattedAddress;
    }
    if (location.address) {
      return location.address;
    }
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadSOSData();
  }, [user]);

  if (sosData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent SOS Alerts</Text>
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Ionicons name="shield-checkmark" size={48} color={colors.tabIconDefault} />
          <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
            No SOS alerts yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
            Your SOS alerts will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent SOS Alerts</Text>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sosData.map((item) => (
          <View key={item.id} style={[styles.alertItem, { backgroundColor: colors.card }]}>
            <View style={styles.alertHeader}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={24} color="#FF6B6B" />
              </View>
              <View style={styles.alertInfo}>
                <Text style={[styles.alertTime, { color: colors.text }]}>
                  {new Date(item.sent_at).toLocaleString()}
                </Text>
                <Text style={[styles.alertLocation, { color: colors.tabIconDefault }]}>
                  {formatLocation(item.location)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteAlert(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.alertDetails}>
              {item.audio_url && (
                <TouchableOpacity
                  style={styles.audioRow}
                  onPress={() => handlePlayAudio(item.audio_url!, item.recording_duration || 0)}
                >
                  <Ionicons name="play-circle" size={18} color={colors.tint} />
                  <Text style={[styles.detailText, { color: colors.tint }]}>
                    Play Audio ({formatDuration(item.recording_duration || 0)})
                  </Text>
                  <Ionicons name="open-outline" size={14} color={colors.tint} />
                </TouchableOpacity>
              )}
              
              {item.battery_level && (
                <View style={styles.detailRow}>
                  <Ionicons name="battery-charging" size={16} color={colors.tint} />
                  <Text style={[styles.detailText, { color: colors.tabIconDefault }]}>
                    Battery: {item.battery_level}%
                  </Text>
                </View>
              )}
              
              {item.network_info && (
                <View style={styles.detailRow}>
                  <Ionicons 
                    name={item.network_info.isWifi ? "wifi" : "cellular"} 
                    size={16} 
                    color={colors.tint} 
                  />
                  <Text style={[styles.detailText, { color: colors.tabIconDefault }]}>
                    Network: {item.network_info.type}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  scrollView: {
    maxHeight: 400,
  },
  alertItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  alertDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SOSData } from '@/lib/supabase';
import { sosDataService } from '@/services/SOSDataService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SOSHistoryScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [sosData, setSosData] = useState<SOSData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSOSData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await sosDataService.getRecentSOSData(user.id, 50);
      setSosData(data);
    } catch (error) {
      console.error('Error loading SOS data:', error);
      Alert.alert('Error', 'Failed to load SOS history');
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
      'Delete SOS Alert',
      'Are you sure you want to delete this SOS alert? This will also delete the associated audio file permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await sosDataService.deleteSOSData(id, user.id);
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

  const handlePlayAudio = async (audioUrl: string) => {
    try {
      await Linking.openURL(audioUrl);
    } catch (error) {
      console.error('Error opening audio URL:', error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  useEffect(() => {
    loadSOSData();
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading SOS history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>SOS History</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          {sosData.length} alert{sosData.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sosData.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No SOS Alerts
            </Text>
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              Your SOS alerts will appear here when you send emergency alerts
            </Text>
          </View>
        ) : (
          sosData.map((item) => (
            <View key={item.id} style={[styles.alertCard, { backgroundColor: colors.card }]}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIcon}>
                  <Ionicons name="warning" size={28} color="#FF6B6B" />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={[styles.alertDate, { color: colors.text }]}>
                    {formatDate(item.sent_at)}
                  </Text>
                  <Text style={[styles.alertLocation, { color: colors.tabIconDefault }]}>
                    {formatLocation(item.location)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAlert(item.id)}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>

              <View style={styles.alertDetails}>
                {item.audio_url && (
                  <TouchableOpacity
                    style={styles.audioRow}
                    onPress={() => handlePlayAudio(item.audio_url!)}
                  >
                    <Ionicons name="play-circle" size={20} color={colors.tint} />
                    <Text style={[styles.detailText, { color: colors.tint }]}>
                      Play Audio ({formatDuration(item.recording_duration || 0)})
                    </Text>
                    <Ionicons name="open-outline" size={16} color={colors.tint} />
                  </TouchableOpacity>
                )}

                {item.battery_level && (
                  <View style={styles.detailRow}>
                    <Ionicons name="battery-charging" size={18} color={colors.tabIconDefault} />
                    <Text style={[styles.detailText, { color: colors.tabIconDefault }]}>
                      Battery: {item.battery_level}%
                    </Text>
                  </View>
                )}

                {item.network_info && (
                  <View style={styles.detailRow}>
                    <Ionicons 
                      name={item.network_info.isWifi ? "wifi" : "cellular"} 
                      size={18} 
                      color={colors.tabIconDefault} 
                    />
                    <Text style={[styles.detailText, { color: colors.tabIconDefault }]}>
                      Network: {item.network_info.type}
                      {item.network_info.isConnected ? ' (Connected)' : ' (Disconnected)'}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="location" size={18} color={colors.tabIconDefault} />
                  <Text style={[styles.detailText, { color: colors.tabIconDefault }]}>
                    Coordinates: {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
                  </Text>
                </View>

                {item.location.accuracy && (
                  <View style={styles.detailRow}>
                    <Ionicons name="locate" size={18} color={colors.tabIconDefault} />
                    <Text style={[styles.detailText, { color: colors.tabIconDefault }]}>
                      Accuracy: ±{Math.round(item.location.accuracy)}m
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  alertCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 16,
  },
  alertInfo: {
    flex: 1,
  },
  alertDate: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 16,
    lineHeight: 22,
  },
  deleteButton: {
    padding: 8,
  },
  alertDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 16,
    flex: 1,
  },
}); 
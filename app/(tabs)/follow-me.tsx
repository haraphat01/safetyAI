import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { EmergencyContact } from '@/lib/supabase';
import { emergencyService } from '@/services/EmergencyService';
import { CreateSessionData, FollowMeParticipant, followMeService, FollowMeSession } from '@/services/FollowMeService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FollowMeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [activeSession, setActiveSession] = useState<FollowMeSession | null>(null);
  const [sessions, setSessions] = useState<FollowMeSession[]>([]);
  const [participants, setParticipants] = useState<FollowMeParticipant[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    session_name: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [activeSessionData, sessionsData, contactsData] = await Promise.all([
        followMeService.getActiveSession(user.id),
        followMeService.getUserSessions(user.id),
        emergencyService.getEmergencyContacts(user.id),
      ]);

      setActiveSession(activeSessionData);
      setSessions(sessionsData);
      setContacts(contactsData);

      if (activeSessionData) {
        const participantsData = await followMeService.getSessionParticipants(activeSessionData.id);
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error('Error loading follow me data:', error);
      Alert.alert('Error', 'Failed to load follow me data');
    } finally {
      setLoading(false);
    }
  };

  const openCreateSessionModal = () => {
    setFormData({
      session_name: '',
      description: '',
    });
    setSessionModalVisible(true);
  };



  const handleCreateSession = async () => {
    if (!user || !formData.session_name.trim()) {
      Alert.alert('Error', 'Please enter a session name');
      return;
    }

    try {
      const sessionData: CreateSessionData = {
        session_name: formData.session_name.trim(),
        description: formData.description.trim() || undefined,
      };

      const newSession = await followMeService.createSession(user.id, sessionData);
      
      // Start location tracking for the new session
      await followMeService.startLocationTracking(newSession.id);
      
      // Automatically invite all emergency contacts
      const invitedParticipants = await followMeService.inviteAllEmergencyContacts(newSession.id, user.id);
      
      setSessionModalVisible(false);
      setActiveSession(newSession);
      
      // Update participants list with the invited contacts
      setParticipants(invitedParticipants);
      
      // Update sessions list
      setSessions(prevSessions => [newSession, ...prevSessions]);
      
      const contactCount = invitedParticipants.length;
      const message = contactCount > 0 
        ? `Follow Me session started! Invitations sent to ${contactCount} emergency contact${contactCount > 1 ? 's' : ''}.`
        : 'Follow Me session started! No emergency contacts found to invite.';
      
      Alert.alert('Success', message);
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session');
    }
  };

  const handleEndSession = (session: FollowMeSession) => {
    Alert.alert(
      'End Session',
      `Are you sure you want to end "${session.session_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              await followMeService.endSession(session.id);
              
              // Update state directly instead of reloading all data
              setActiveSession(null);
              setParticipants([]);
              setSessions(prevSessions => 
                prevSessions.map(s => 
                  s.id === session.id 
                    ? { ...s, is_active: false, ended_at: new Date().toISOString() }
                    : s
                )
              );
              
              Alert.alert('Success', 'Session ended successfully');
            } catch (error) {
              console.error('Error ending session:', error);
              Alert.alert('Error', 'Failed to end session');
            }
          },
        },
      ]
    );
  };



  const handleRemoveParticipant = (participant: FollowMeParticipant) => {
    Alert.alert(
      'Remove Participant',
      `Are you sure you want to remove ${participant.contact?.name || 'this participant'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await followMeService.removeParticipant(participant.id);
              
              // Update state directly instead of reloading all data
              setParticipants(prevParticipants => 
                prevParticipants.filter(p => p.id !== participant.id)
              );
              
              Alert.alert('Success', 'Participant removed successfully');
            } catch (error) {
              console.error('Error removing participant:', error);
              Alert.alert('Error', 'Failed to remove participant');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSession = (session: FollowMeSession) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${session.session_name}"? This action cannot be undone and will remove all session data including participants and location history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await followMeService.deleteSession(session.id);
              
              // Update state directly instead of reloading all data
              setSessions(prevSessions => prevSessions.filter(s => s.id !== session.id));
              
              // If this was the active session, clear it
              if (activeSession?.id === session.id) {
                setActiveSession(null);
                setParticipants([]);
              }
              
              Alert.alert('Success', 'Session deleted successfully');
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  const renderSession = ({ item }: { item: FollowMeSession }) => (
    <View style={[styles.sessionCard, { backgroundColor: colors.card }]}>
      <View style={styles.sessionInfo}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionName, { color: colors.text }]}>{item.session_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.statusText}>
              {item.is_active ? 'Active' : 'Ended'}
            </Text>
          </View>
        </View>
        {item.description && (
          <Text style={[styles.sessionDescription, { color: colors.tabIconDefault }]}>
            {item.description}
          </Text>
        )}
        <Text style={[styles.sessionTime, { color: colors.tabIconDefault }]}>
          Started: {new Date(item.started_at).toLocaleString()}
        </Text>
        {item.ended_at && (
          <Text style={[styles.sessionTime, { color: colors.tabIconDefault }]}>
            Ended: {new Date(item.ended_at).toLocaleString()}
          </Text>
        )}
      </View>
      <View style={styles.sessionActions}>
        {item.is_active ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
            onPress={() => handleEndSession(item)}
          >
            <Ionicons name="stop" size={16} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#FF6B6B' }]}
            onPress={() => handleDeleteSession(item)}
          >
            <Ionicons name="trash" size={14} color="white" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderParticipant = ({ item }: { item: FollowMeParticipant }) => (
    <View style={[styles.participantCard, { backgroundColor: colors.card }]}>
      <View style={styles.participantInfo}>
        <Text style={[styles.participantName, { color: colors.text }]}>
          {item.contact?.name || 'Unknown'}
        </Text>
        <Text style={[styles.participantStatus, { color: colors.tabIconDefault }]}>
          Status: {item.status}
        </Text>
        {item.joined_at && (
          <Text style={[styles.participantTime, { color: colors.tabIconDefault }]}>
            Joined: {new Date(item.joined_at).toLocaleString()}
          </Text>
        )}
      </View>
      {item.status === 'accepted' && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
          onPress={() => handleRemoveParticipant(item)}
        >
          <Ionicons name="person-remove" size={16} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Follow Me</Text>
        {!activeSession && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={openCreateSessionModal}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
              Loading...
            </Text>
          </View>
        ) : (
          <>
            {/* Active Session */}
            {activeSession && (
              <View style={[styles.activeSessionCard, { backgroundColor: colors.tint }]}>
                <View style={styles.activeSessionHeader}>
                  <Ionicons name="location" size={24} color="white" />
                  <Text style={styles.activeSessionTitle}>Active Session</Text>
                </View>
                <Text style={styles.activeSessionName}>{activeSession.session_name}</Text>
                {activeSession.description && (
                  <Text style={styles.activeSessionDescription}>{activeSession.description}</Text>
                )}
                <Text style={styles.activeSessionTime}>
                  Started: {new Date(activeSession.started_at).toLocaleString()}
                </Text>
                <View style={styles.activeSessionActions}>
                  <TouchableOpacity
                    style={[styles.activeActionButton, { backgroundColor: '#FF6B6B' }]}
                    onPress={() => handleEndSession(activeSession)}
                  >
                    <Ionicons name="stop" size={16} color="white" />
                    <Text style={[styles.activeActionText, { color: 'white' }]}>End Session</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Participants */}
            {activeSession && participants.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Participants</Text>
                <FlatList
                  data={participants}
                  renderItem={renderParticipant}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Past Sessions */}
            {sessions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {activeSession ? 'Past Sessions' : 'All Sessions'}
                </Text>
                <FlatList
                  data={sessions.filter(s => !s.is_active)}
                  renderItem={renderSession}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Empty State */}
            {!activeSession && sessions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={64} color={colors.tabIconDefault} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Follow Me Sessions</Text>
                <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
                  Start a session to let friends and family join your journey virtually
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.tint }]}
                  onPress={openCreateSessionModal}
                >
                  <Text style={[styles.emptyButtonText, { color: colors.buttonText }]}>
                    Start Your First Session
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Session Modal */}
      <Modal
        visible={sessionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSessionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Start Follow Me Session</Text>
              <TouchableOpacity onPress={() => setSessionModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Session name (e.g., 'Walking home')"
              placeholderTextColor={colors.tabIconDefault}
              value={formData.session_name}
              onChangeText={(text) => setFormData({ ...formData, session_name: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.tabIconDefault}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.tint }]}
              onPress={handleCreateSession}
            >
              <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Start Session</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  activeSessionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeSessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  activeSessionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  activeSessionDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  activeSessionTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  activeSessionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  activeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  activeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  sessionDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  sessionTime: {
    fontSize: 12,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  participantCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  participantStatus: {
    fontSize: 14,
    marginBottom: 2,
  },
  participantTime: {
    fontSize: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

}); 
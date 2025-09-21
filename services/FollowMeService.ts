import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { locationService } from './LocationService';

export interface FollowMeSession {
  id: string;
  user_id: string;
  session_name: string;
  description?: string;
  is_active: boolean;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FollowMeParticipant {
  id: string;
  session_id: string;
  contact_id: string;
  invited_by: string;
  status: 'invited' | 'accepted' | 'declined' | 'left';
  joined_at?: string;
  left_at?: string;
  created_at: string;
  updated_at: string;
  contact?: {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  };
}

export interface FollowMeLocation {
  id: string;
  session_id: string;
  user_id: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    formattedAddress?: string;
  };
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  timestamp: string;
  created_at: string;
}

export interface CreateSessionData {
  session_name: string;
  description?: string;
}

export interface InviteParticipantData {
  session_id: string;
  contact_id: string;
}

class FollowMeService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private activeSessionId: string | null = null;
  private isTracking = false;

  constructor() {
    this.setupRealtimeSubscription();
  }

  private setupRealtimeSubscription() {
    // Subscribe to real-time updates for active sessions
    supabase
      .channel('follow_me_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'follow_me_locations',
      }, (payload) => {
        console.log('New location update:', payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'follow_me_sessions',
      }, (payload) => {
        console.log('Session updated:', payload.new);
      })
      .subscribe();
  }

  // Session Management
  public async createSession(userId: string, data: CreateSessionData): Promise<FollowMeSession> {
    try {
      const { data: session, error } = await supabase
        .from('follow_me_sessions')
        .insert({
          user_id: userId,
          session_name: data.session_name,
          description: data.description,
        })
        .select()
        .single();

      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error creating follow me session:', error);
      throw error;
    }
  }

  public async getActiveSession(userId: string): Promise<FollowMeSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('follow_me_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return session;
    } catch (error) {
      console.error('Error getting active session:', error);
      throw error;
    }
  }

  public async getSession(sessionId: string): Promise<FollowMeSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('follow_me_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  public async getUserSessions(userId: string): Promise<FollowMeSession[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('follow_me_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return sessions || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  public async endSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('follow_me_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Stop location tracking if this was the active session
      if (this.activeSessionId === sessionId) {
        this.stopLocationTracking();
        this.activeSessionId = null;
      }
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    try {
      // First delete all related data
      const { error: participantsError } = await supabase
        .from('follow_me_participants')
        .delete()
        .eq('session_id', sessionId);

      if (participantsError) throw participantsError;

      const { error: locationsError } = await supabase
        .from('follow_me_locations')
        .delete()
        .eq('session_id', sessionId);

      if (locationsError) throw locationsError;

      // Finally delete the session
      const { error: sessionError } = await supabase
        .from('follow_me_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Stop location tracking if this was the active session
      if (this.activeSessionId === sessionId) {
        this.stopLocationTracking();
        this.activeSessionId = null;
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // Participant Management
  public async inviteParticipant(data: InviteParticipantData): Promise<FollowMeParticipant> {
    try {
      const { data: participant, error } = await supabase
        .from('follow_me_participants')
        .insert({
          session_id: data.session_id,
          contact_id: data.contact_id,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send email invite to the participant
      try {
        await this.sendFollowMeInvite({
          participant_id: participant.id,
          session_id: data.session_id,
          contact_id: data.contact_id,
          invited_by: participant.invited_by,
        });
      } catch (emailError) {
        console.error('Failed to send email invite:', emailError);
        // Don't throw error here - the participant was still added successfully
      }

      return participant;
    } catch (error) {
      console.error('Error inviting participant:', error);
      throw error;
    }
  }

  public async inviteAllEmergencyContacts(sessionId: string, userId: string): Promise<FollowMeParticipant[]> {
    try {
      // Get all emergency contacts for the user
      const { data: contacts, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId);

      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        console.log('No emergency contacts found to invite');
        return [];
      }

      const participants: FollowMeParticipant[] = [];

      // Invite each contact
      for (const contact of contacts) {
        try {
          const participant = await this.inviteParticipant({
            session_id: sessionId,
            contact_id: contact.id,
          });
          participants.push(participant);
          console.log(`Invited ${contact.name} to session`);
        } catch (error) {
          console.error(`Failed to invite ${contact.name}:`, error);
          // Continue with other contacts even if one fails
        }
      }

      console.log(`Successfully invited ${participants.length} out of ${contacts.length} contacts`);
      return participants;
    } catch (error) {
      console.error('Error inviting all emergency contacts:', error);
      throw error;
    }
  }

  private async sendFollowMeInvite(inviteData: {
    participant_id: string;
    session_id: string;
    contact_id: string;
    invited_by: string;
  }): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`https://pytenwpowmbdpbtonase.supabase.co/functions/v1/FollowMeService`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Email invite failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Follow Me invite sent successfully:', result);
    } catch (error) {
      console.error('Error sending Follow Me invite:', error);
      throw error;
    }
  }

  public async getSessionParticipants(sessionId: string): Promise<FollowMeParticipant[]> {
    try {
      const { data: participants, error } = await supabase
        .from('follow_me_participants')
        .select(`
          *,
          contact:emergency_contacts(name, email, whatsapp, relationship)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return participants || [];
    } catch (error) {
      console.error('Error getting session participants:', error);
      throw error;
    }
  }

  public async removeParticipant(participantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('follow_me_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  // Location Tracking
  public async startLocationTracking(sessionId: string): Promise<void> {
    if (this.isTracking) {
      console.log('Location tracking already active');
      return;
    }

    try {
      this.activeSessionId = sessionId;
      this.isTracking = true;

      // Start location tracking with high accuracy
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          await this.updateLocation(sessionId, location);
        }
      );

      console.log('Follow Me location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
      this.activeSessionId = null;
      throw error;
    }
  }

  public stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    this.activeSessionId = null;
    console.log('Follow Me location tracking stopped');
  }

  private async updateLocation(sessionId: string, location: Location.LocationObject): Promise<void> {
    try {
      // Get detailed location info with address
      const locationInfo = await locationService.getCurrentLocation();
      
      const locationData = {
        session_id: sessionId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          address: locationInfo?.address,
          city: locationInfo?.city,
          state: locationInfo?.state,
          country: locationInfo?.country,
          formattedAddress: locationInfo?.formattedAddress,
        },
        speed: location.coords.speed || null,
        heading: location.coords.heading || null,
        altitude: location.coords.altitude || null,
        accuracy: location.coords.accuracy || null,
      };

      const { error } = await supabase
        .from('follow_me_locations')
        .insert(locationData);

      if (error) {
        console.error('Error updating location:', error);
      }
    } catch (error) {
      console.error('Error in location update:', error);
    }
  }

  public async getSessionLocations(sessionId: string, limit: number = 50): Promise<FollowMeLocation[]> {
    try {
      const { data: locations, error } = await supabase
        .from('follow_me_locations')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return locations || [];
    } catch (error) {
      console.error('Error getting session locations:', error);
      throw error;
    }
  }

  public async getLatestLocation(sessionId: string): Promise<FollowMeLocation | null> {
    try {
      const { data: location, error } = await supabase
        .from('follow_me_locations')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return location;
    } catch (error) {
      console.error('Error getting latest location:', error);
      throw error;
    }
  }

  // Utility Methods
  public isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  public getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  public async cleanupOldData(): Promise<void> {
    try {
      // This would typically be handled by database functions
      // but we can call them manually if needed
      await supabase.rpc('cleanup_old_follow_me_locations');
      await supabase.rpc('end_inactive_follow_me_sessions');
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}

export const followMeService = new FollowMeService(); 
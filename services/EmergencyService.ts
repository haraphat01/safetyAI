import { EmergencyContact, SOSAlert, supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface EmergencyMessage {
  type: 'sos' | 'check_in' | 'check_in_overdue';
  location: LocationData;
  message?: string;
  userId: string;
}

class EmergencyService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private currentLocation: LocationData | null = null;

  constructor() {
    this.requestPermissions();
  }

  private async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return;
    }

    const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus.status !== 'granted') {
      console.log('Background location permission denied');
    }
  }

  public async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  public async startLocationTracking() {
    if (this.isTracking) return;

    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  public stopLocationTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  public async sendSOS(userId: string, alertType: 'manual' | 'voice' | 'ai' = 'manual') {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location');
      }

      // Trigger haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Create SOS alert in database
      const { data: sosAlert, error } = await supabase
        .from('sos_alerts')
        .insert({
          user_id: userId,
          location: location,
          alert_type: alertType,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Send real-time notification to emergency contacts
      await this.notifyEmergencyContacts(userId, {
        type: 'sos',
        location,
        userId,
        message: 'SOS Alert: Immediate assistance needed!',
      });

      // Send to Supabase Realtime
      await supabase.channel('emergency').send({
        type: 'broadcast',
        event: 'sos_alert',
        payload: {
          alert: sosAlert,
          location,
          timestamp: Date.now(),
        },
      });

      return sosAlert;
    } catch (error) {
      console.error('Error sending SOS:', error);
      throw error;
    }
  }

  public async resolveSOS(alertId: string) {
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      console.log('SOS alert resolved');
    } catch (error) {
      console.error('Error resolving SOS:', error);
      throw error;
    }
  }

  public async resolveAllActiveSOSAlerts(userId: string) {
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      console.log('All active SOS alerts resolved for user:', userId);
    } catch (error) {
      console.error('Error resolving all active SOS alerts:', error);
      throw error;
    }
  }

  public async resolveStaleSOSAlerts(userId: string, hoursOld: number = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
      
      // First, get the count of stale alerts
      const { data: staleAlerts, error: countError } = await supabase
        .from('sos_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lt('triggered_at', cutoffTime.toISOString());

      if (countError) throw countError;

      // If no stale alerts, return early
      if (!staleAlerts || staleAlerts.length === 0) {
        return;
      }

      // Resolve the stale alerts
      const { error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active')
        .lt('triggered_at', cutoffTime.toISOString());

      if (error) throw error;

      console.log(`${staleAlerts.length} stale SOS alerts (older than ${hoursOld} hours) resolved for user:`, userId);
    } catch (error) {
      console.error('Error resolving stale SOS alerts:', error);
      throw error;
    }
  }

  public async scheduleCheckIn(userId: string, scheduledTime: Date) {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location');
      }

      const { data: checkIn, error } = await supabase
        .from('safety_checks')
        .insert({
          user_id: userId,
          location: location,
          scheduled_time: scheduledTime.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return checkIn;
    } catch (error) {
      console.error('Error scheduling check-in:', error);
      throw error;
    }
  }

  public async completeCheckIn(checkInId: string) {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location');
      }

      const { error } = await supabase
        .from('safety_checks')
        .update({
          status: 'completed',
          completed_time: new Date().toISOString(),
          location: location,
        })
        .eq('id', checkInId);

      if (error) throw error;

      console.log('Check-in completed');
    } catch (error) {
      console.error('Error completing check-in:', error);
      throw error;
    }
  }

  public async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const { data: contacts, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return contacts || [];
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      throw error;
    }
  }

  public async addEmergencyContact(
    userId: string,
    contact: Omit<EmergencyContact, 'id' | 'user_id' | 'created_at'>
  ): Promise<EmergencyContact> {
    try {
      // Ensure user profile exists before adding contact
      await this.ensureUserProfile(userId);

      const { data: newContact, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: userId,
          ...contact,
        })
        .select()
        .single();

      if (error) throw error;

      return newContact;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  private async ensureUserProfile(userId: string): Promise<void> {
    try {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // Get user info from auth
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            throw new Error('Failed to create user profile');
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  }

  public async updateEmergencyContact(
    contactId: string,
    updates: Partial<Omit<EmergencyContact, 'id' | 'user_id' | 'created_at'>>
  ): Promise<EmergencyContact> {
    try {
      const { data: updatedContact, error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      return updatedContact;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  }

  public async deleteEmergencyContact(contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      throw error;
    }
  }

  private async notifyEmergencyContacts(userId: string, message: EmergencyMessage) {
    try {
      const contacts = await this.getEmergencyContacts(userId);
      
      // In a real app, this would send SMS/email notifications
      // For now, we'll just log the notification
      console.log('Notifying emergency contacts:', {
        contacts: contacts.map(c => ({ name: c.name, phone: c.phone })),
        message,
      });

      // Send to Supabase Realtime for real-time notifications
      await supabase.channel('emergency').send({
        type: 'broadcast',
        event: 'emergency_notification',
        payload: {
          contacts,
          message,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  }

  public async getActiveSOSAlerts(userId: string): Promise<SOSAlert[]> {
    try {
      const { data: alerts, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('triggered_at', { ascending: false });

      if (error) throw error;

      return alerts || [];
    } catch (error) {
      console.error('Error fetching active SOS alerts:', error);
      throw error;
    }
  }

  public async getPendingCheckIns(userId: string): Promise<any[]> {
    try {
      const { data: checkIns, error } = await supabase
        .from('safety_checks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      return checkIns || [];
    } catch (error) {
      console.error('Error fetching pending check-ins:', error);
      throw error;
    }
  }

  public isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  public getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }

  public async deleteCheckIn(checkInId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('safety_checks')
        .delete()
        .eq('id', checkInId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting check-in:', error);
      throw error;
    }
  }
}

export const emergencyService = new EmergencyService(); 
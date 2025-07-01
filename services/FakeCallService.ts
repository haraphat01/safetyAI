import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

export interface FakeCallConfig {
  callerName: string;
  callerNumber: string;
  delaySeconds: number;
  ringDuration: number;
  autoAnswer: boolean;
  customMessage?: string;
}

export interface ScheduledFakeCall {
  id: string;
  config: FakeCallConfig;
  scheduledTime: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface CustomContact {
  id: string;
  name: string;
  number: string;
  isDefault?: boolean;
}

class FakeCallService {
  private sound: Audio.Sound | null = null;
  private scheduledCalls: Map<string, ScheduledFakeCall> = new Map();
  private isPlaying = false;
  private currentCall: ScheduledFakeCall | null = null;
  private onCallTriggered?: (call: ScheduledFakeCall) => void;
  private customContacts: CustomContact[] = [];

  // Default fake caller configurations
  private defaultCallers = [
    { name: 'Mom', number: '+1 (555) 123-4567' },
    { name: 'Dad', number: '+1 (555) 234-5678' },
    { name: 'Work', number: '+1 (555) 345-6789' },
    { name: 'Emergency Contact', number: '+1 (555) 456-7890' },
    { name: 'Roommate', number: '+1 (555) 567-8901' },
    { name: 'Boss', number: '+1 (555) 678-9012' },
    { name: 'Doctor', number: '+1 (555) 789-0123' },
    { name: 'Uber', number: '+1 (555) 890-1234' },
  ];

  constructor() {
    this.setupNotifications();
    this.loadCustomContacts();
  }

  private async setupNotifications() {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted for fake calls');
    }

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  /**
   * Schedule a fake call with the given configuration
   */
  public async scheduleFakeCall(config: FakeCallConfig): Promise<string> {
    const callId = `fake_call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledTime = new Date(Date.now() + config.delaySeconds * 1000);

    const scheduledCall: ScheduledFakeCall = {
      id: callId,
      config,
      scheduledTime,
      status: 'scheduled',
    };

    this.scheduledCalls.set(callId, scheduledCall);

    // Schedule the call
    setTimeout(() => {
      this.triggerFakeCall(callId);
    }, config.delaySeconds * 1000);

    // Schedule notification
    await this.scheduleNotification(callId, config, scheduledTime);

    console.log(`Fake call scheduled for ${scheduledTime.toLocaleTimeString()}`);
    return callId;
  }

  /**
   * Schedule a quick fake call (30 seconds delay)
   */
  public async scheduleQuickFakeCall(callerName?: string): Promise<string> {
    let caller;
    
    if (callerName) {
      // Try to find in all contacts (default + custom)
      const allContacts = this.getAllContacts();
      caller = allContacts.find(c => c.name === callerName);
    }
    
    // Fallback to random default caller
    if (!caller) {
      const randomIndex = Math.floor(Math.random() * this.defaultCallers.length);
      caller = {
        id: `default_${randomIndex}`,
        name: this.defaultCallers[randomIndex].name,
        number: this.defaultCallers[randomIndex].number,
        isDefault: true,
      };
    }

    const config: FakeCallConfig = {
      callerName: caller.name,
      callerNumber: caller.number,
      delaySeconds: 30,
      ringDuration: 15,
      autoAnswer: false,
    };

    return this.scheduleFakeCall(config);
  }

  /**
   * Schedule an emergency fake call (5 seconds delay)
   */
  public async scheduleEmergencyFakeCall(): Promise<string> {
    const config: FakeCallConfig = {
      callerName: 'Emergency Contact',
      callerNumber: '+1 (555) 911-0000',
      delaySeconds: 5,
      ringDuration: 20,
      autoAnswer: false,
      customMessage: 'Emergency situation - need to leave immediately',
    };

    return this.scheduleFakeCall(config);
  }

  /**
   * Trigger the fake call
   */
  private async triggerFakeCall(callId: string) {
    const scheduledCall = this.scheduledCalls.get(callId);
    if (!scheduledCall || scheduledCall.status !== 'scheduled') {
      return;
    }

    scheduledCall.status = 'active';
    this.currentCall = scheduledCall;

    try {
      // Play ringtone
      await this.playRingtone();
      
      // Show incoming call notification
      await this.showIncomingCallNotification(scheduledCall.config);

      // Trigger full-screen call interface
      this.onCallTriggered?.(scheduledCall);

      // Auto-answer after ring duration if enabled
      if (scheduledCall.config.autoAnswer) {
        setTimeout(() => {
          this.answerCall();
        }, scheduledCall.config.ringDuration * 1000);
      }

      // Auto-end call after total duration
      setTimeout(() => {
        this.endCall();
      }, (scheduledCall.config.ringDuration + 30) * 1000);

    } catch (error) {
      console.error('Error triggering fake call:', error);
      scheduledCall.status = 'cancelled';
    }
  }

  /**
   * Play ringtone sound
   */
  private async playRingtone() {
    if (this.isPlaying) return;

    try {
      // Set audio mode for phone calls first
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Try to load and play ringtone
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/ringtone.mp3'),
          { shouldPlay: true, isLooping: true }
        );
        
        this.sound = sound;
        this.isPlaying = true;
      } catch (audioError) {
        console.log('Ringtone file not found, using fallback:', audioError);
        // Fallback: create a simple beep sound
        await this.createFallbackRingtone();
      }

    } catch (error) {
      console.error('Error playing ringtone:', error);
      // Final fallback: create a simple beep sound
      await this.createFallbackRingtone();
    }
  }

  /**
   * Create a fallback ringtone if the audio file is not available
   */
  private async createFallbackRingtone() {
    try {
      // Create a simple beep pattern
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT' },
        { shouldPlay: true, isLooping: true }
      );
      
      this.sound = sound;
      this.isPlaying = true;
    } catch (error) {
      console.error('Error creating fallback ringtone:', error);
    }
  }

  /**
   * Show incoming call notification
   */
  private async showIncomingCallNotification(config: FakeCallConfig) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Incoming Call`,
          body: `${config.callerName} (${config.callerNumber})`,
          data: { type: 'fake_call', config },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing incoming call notification:', error);
    }
  }

  /**
   * Answer the fake call
   */
  public async answerCall() {
    if (!this.currentCall || this.currentCall.status !== 'active') {
      return;
    }

    try {
      // Stop ringtone
      await this.stopRingtone();

      // Show answered call notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Call Connected`,
          body: `Talking with ${this.currentCall.config.callerName}`,
          data: { type: 'fake_call_answered' },
        },
        trigger: null,
      });

      // Play a brief "connected" sound (optional)
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/fake-voice.mp3'),
          { shouldPlay: true }
        );
      } catch (audioError) {
        console.log('Fake voice file not found, skipping audio:', audioError);
      }

      // Auto-end call after 30 seconds
      setTimeout(() => {
        this.endCall();
      }, 30000);

    } catch (error) {
      console.error('Error answering call:', error);
    }
  }

  /**
   * End the fake call
   */
  public async endCall() {
    if (!this.currentCall) return;

    try {
      // Stop any playing sounds
      await this.stopRingtone();

      // Update call status
      this.currentCall.status = 'completed';
      this.scheduledCalls.set(this.currentCall.id, this.currentCall);

      // Show call ended notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Call Ended`,
          body: `Call with ${this.currentCall.config.callerName} ended`,
          data: { type: 'fake_call_ended' },
        },
        trigger: null,
      });

      this.currentCall = null;

    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  /**
   * Stop the ringtone
   */
  private async stopRingtone() {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.isPlaying = false;
    
    // Reset audio mode to default
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error resetting audio mode:', error);
    }
  }

  /**
   * Cancel a scheduled fake call
   */
  public cancelFakeCall(callId: string): boolean {
    const scheduledCall = this.scheduledCalls.get(callId);
    if (scheduledCall && scheduledCall.status === 'scheduled') {
      scheduledCall.status = 'cancelled';
      this.scheduledCalls.set(callId, scheduledCall);
      return true;
    }
    return false;
  }

  /**
   * Get all scheduled calls
   */
  public getScheduledCalls(): ScheduledFakeCall[] {
    return Array.from(this.scheduledCalls.values());
  }

  /**
   * Get active call
   */
  public getActiveCall(): ScheduledFakeCall | null {
    return this.currentCall;
  }

  /**
   * Set callback for when a call is triggered
   */
  public setCallTriggeredCallback(callback: (call: ScheduledFakeCall) => void) {
    this.onCallTriggered = callback;
  }

  /**
   * Check if there's an active call
   */
  public isCallActive(): boolean {
    return this.currentCall?.status === 'active';
  }

  /**
   * Get default caller options
   */
  public getDefaultCallers() {
    return this.defaultCallers;
  }

  /**
   * Get all contacts (default + custom)
   */
  public async getAllContacts(): Promise<CustomContact[]> {
    const deletedDefaults = await this.getDeletedDefaults();
    
    const defaultContacts: CustomContact[] = this.defaultCallers
      .filter(caller => !deletedDefaults.includes(caller.name))
      .map((caller, index) => ({
        id: `default_${index}`,
        name: caller.name,
        number: caller.number,
        isDefault: true,
      }));
    
    return [...defaultContacts, ...this.customContacts];
  }

  /**
   * Delete any contact (default or custom)
   */
  public async deleteContact(id: string): Promise<boolean> {
    try {
      // Check if it's a default contact
      if (id.startsWith('default_')) {
        // For default contacts, we'll add them to a "deleted defaults" list
        // so they don't show up again
        const deletedDefaults = await this.getDeletedDefaults();
        const contact = await this.getContactById(id);
        if (contact) {
          deletedDefaults.push(contact.name);
          await this.saveDeletedDefaults(deletedDefaults);
          return true;
        }
        return false;
      } else {
        // For custom contacts, delete from storage
        return await this.deleteCustomContact(id);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
  }

  /**
   * Get list of deleted default contacts
   */
  private async getDeletedDefaults(): Promise<string[]> {
    try {
      const deleted = await AsyncStorage.getItem('@fake_call_deleted_defaults');
      return deleted ? JSON.parse(deleted) : [];
    } catch (error) {
      console.error('Error loading deleted defaults:', error);
      return [];
    }
  }

  /**
   * Save list of deleted default contacts
   */
  private async saveDeletedDefaults(deletedDefaults: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem('@fake_call_deleted_defaults', JSON.stringify(deletedDefaults));
    } catch (error) {
      console.error('Error saving deleted defaults:', error);
    }
  }

  /**
   * Restore all deleted default contacts
   */
  public async restoreDefaultContacts(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@fake_call_deleted_defaults');
    } catch (error) {
      console.error('Error restoring default contacts:', error);
    }
  }

  /**
   * Get list of deleted default contact names
   */
  public async getDeletedDefaultNames(): Promise<string[]> {
    return this.getDeletedDefaults();
  }

  /**
   * Get custom contacts only
   */
  public getCustomContacts(): CustomContact[] {
    return this.customContacts;
  }

  /**
   * Add a custom contact
   */
  public async addCustomContact(name: string, number: string): Promise<CustomContact> {
    const newContact: CustomContact = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      number: number.trim(),
      isDefault: false,
    };

    this.customContacts.push(newContact);
    await this.saveCustomContacts();
    return newContact;
  }

  /**
   * Update a custom contact
   */
  public async updateCustomContact(id: string, name: string, number: string): Promise<boolean> {
    const contactIndex = this.customContacts.findIndex(contact => contact.id === id);
    if (contactIndex === -1) return false;

    this.customContacts[contactIndex] = {
      ...this.customContacts[contactIndex],
      name: name.trim(),
      number: number.trim(),
    };

    await this.saveCustomContacts();
    return true;
  }

  /**
   * Delete a custom contact
   */
  public async deleteCustomContact(id: string): Promise<boolean> {
    const contactIndex = this.customContacts.findIndex(contact => contact.id === id);
    if (contactIndex === -1) return false;

    this.customContacts.splice(contactIndex, 1);
    await this.saveCustomContacts();
    return true;
  }

  /**
   * Get contact by ID
   */
  public async getContactById(id: string): Promise<CustomContact | null> {
    const allContacts = await this.getAllContacts();
    return allContacts.find(contact => contact.id === id) || null;
  }

  /**
   * Save custom contacts to storage
   */
  private async saveCustomContacts() {
    try {
      await AsyncStorage.setItem('@fake_call_contacts', JSON.stringify(this.customContacts));
    } catch (error) {
      console.error('Error saving custom contacts:', error);
    }
  }

  /**
   * Schedule a notification for the fake call
   */
  private async scheduleNotification(callId: string, config: FakeCallConfig, scheduledTime: Date) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Fake Call Scheduled',
          body: `${config.callerName} will call in ${config.delaySeconds} seconds`,
          data: { callId, type: 'fake_call_scheduled' },
        },
        trigger: {
          date: new Date(scheduledTime.getTime() - 5000), // 5 seconds before
        },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup() {
    await this.stopRingtone();
    this.scheduledCalls.clear();
    this.currentCall = null;
    
    // Cancel all scheduled notifications
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  private async loadCustomContacts() {
    try {
      const contacts = await AsyncStorage.getItem('@fake_call_contacts');
      if (contacts) {
        this.customContacts = JSON.parse(contacts);
      }
    } catch (error) {
      console.error('Error loading custom contacts:', error);
    }
  }
}

export const fakeCallService = new FakeCallService(); 
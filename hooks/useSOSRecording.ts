import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { emergencyService } from '@/services/EmergencyService';
import { locationService } from '@/services/LocationService';
import { sosDataService } from '@/services/SOSDataService';
import { Audio } from 'expo-av';
import * as Battery from 'expo-battery';
import * as FileSystem from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

export function useSOSRecording() {
  const { user } = useAuth();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sosIntervalId, setSosIntervalId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingsSent, setRecordingsSent] = useState<number>(0);
  const isFirstSendRef = useRef<boolean>(true);
  const isSOSLoopActiveRef = useRef<boolean>(false);
  const currentRecordingRef = useRef<Audio.Recording | null>(null);

  // Helper to start audio recording
  const startRecording = async () => {
    try {
      // Check the ref instead of state to avoid closure issues
      if (currentRecordingRef.current) {
        console.log('Warning: Recording already exists, cleaning up first...');
        try {
          await currentRecordingRef.current.stopAndUnloadAsync();
        } catch (cleanupErr) {
          console.error('Error cleaning up existing recording:', cleanupErr);
        }
        currentRecordingRef.current = null;
        setRecording(null);
        // Wait a bit to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 300));
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
      
      // Update both state and ref
      setRecording(rec);
      currentRecordingRef.current = rec;
      console.log('New recording started successfully');
      return rec;
    } catch (err) {
      console.error('Failed to start recording', err);
      // Make sure recording state is cleared on error
      setRecording(null);
      currentRecordingRef.current = null;
      return null;
    }
  };

  // Helper to stop audio recording
  const stopRecording = async () => {
    try {
      const recordingToStop = currentRecordingRef.current || recording;
      if (!recordingToStop) {
        console.log('No recording to stop');
        return null;
      }
      
      console.log('Stopping and unloading recording...');
      await recordingToStop.stopAndUnloadAsync();
      const uri = recordingToStop.getURI();
      
      // Clear both state and ref immediately
      setRecording(null);
      currentRecordingRef.current = null;
      console.log('Recording stopped successfully, URI:', uri);
      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
      // Always clear the recording state even on error
      setRecording(null);
      currentRecordingRef.current = null;
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

      // --- Fix: Always define fileName ---
      let fileName: string | null = null;

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
          fileName = `sos-audio-${user.id}-${timestamp}.m4a`;

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

      // --- INSERT SOS DATA INTO THE DATABASE ---
      try {
        await sosDataService.createSOSData({
          user_id: user.id,
          sos_alert_id: null, // If you have an alert id, use it
          audio_url: audioUrl,
          audio_filename: audioUrl ? fileName : null,
          location: sosPayload.location,
          battery_level: battery,
          network_info: sosPayload.networkInfo,
          device_info: sosPayload.deviceInfo,
          recording_duration: recordingTimer,
          sent_at: new Date().toISOString(),
        });
        console.log('SOS data saved to sos_data table.');
      } catch (dbErr) {
        console.error('Failed to save SOS data to sos_data table:', dbErr);
        Alert.alert('Warning', 'SOS sent, but failed to save data for history.');
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

  // Start continuous SOS recording loop - records for 1 minute, sends, then starts next recording
  const startSosLoop = async () => {
    console.log('=== STARTING CONTINUOUS SOS LOOP ===');
    
    // Mark SOS loop as active
    isSOSLoopActiveRef.current = true;
    
    // Send initial SOS alert to create the emergency record
    if (isFirstSendRef.current && user) {
      await emergencyService.sendSOS(user.id, 'manual');
      isFirstSendRef.current = false;
    }
    
    // Start the continuous recording cycle
    const startRecordingCycle = async () => {
      // Check if loop is still active before starting new cycle
      if (!isSOSLoopActiveRef.current) {
        console.log('SOS loop no longer active, stopping cycle');
        return;
      }
      
      console.log('Starting new recording cycle...');
      
      // Ensure no existing recording before starting new one
      if (currentRecordingRef.current) {
        console.log('Cleaning up existing recording before starting new cycle...');
        await stopRecording();
        // Wait a bit more to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Start recording
      const rec = await startRecording();
      if (!rec) {
        console.error('Failed to start recording, retrying in 2 seconds...');
        if (isSOSLoopActiveRef.current) {
          setTimeout(() => startRecordingCycle(), 2000);
        }
        return;
      }
      
      // Start timer
      startRecordingTimer();
      
      // Set timeout for 1 minute to automatically send and start next cycle
      const timeoutId = setTimeout(async () => {
        console.log('1 minute completed, stopping recording and sending...');
        
        try {
          // Stop current recording and timer
          stopRecordingTimer();
          const audioUri = await stopRecording();
          
          // Ensure recording is fully cleaned up
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (audioUri) {
            // Send the recording and wait for completion
            await sendSosData(audioUri);
            console.log('Recording sent successfully');
          }
          
          // Start next cycle if SOS is still active
          if (isSOSLoopActiveRef.current) {
            console.log('Starting next recording cycle...');
            // Use setTimeout to ensure this runs in next event loop
            setTimeout(() => startRecordingCycle(), 100);
          }
        } catch (error) {
          console.error('Error in recording cycle:', error);
          // Ensure recording is cleaned up even on error
          if (recording) {
            try {
              await stopRecording();
            } catch (cleanupError) {
              console.error('Error during cleanup:', cleanupError);
              // Force clear the recording state
              setRecording(null);
            }
          }
          
          // Try to start next cycle anyway if SOS is still active
          if (isSOSLoopActiveRef.current) {
            console.log('Retrying next recording cycle after error...');
            setTimeout(() => startRecordingCycle(), 2000); // Retry after 2 seconds
          }
        }
      }, 60 * 1000); // 60 seconds
      
      // Store the timeout ID so we can clear it when stopping
      setSosIntervalId(timeoutId);
    };
    
    // Start the first recording cycle
    startRecordingCycle();
  };

  // Stop the SOS audio loop
  const stopSosLoop = async () => {
    console.log('=== STOPPING SOS LOOP ===');
    
    // Mark SOS loop as inactive to stop any pending cycles
    isSOSLoopActiveRef.current = false;
    
    if (sosIntervalId) {
      clearTimeout(sosIntervalId); // Changed from clearInterval to clearTimeout
      setSosIntervalId(null);
    }
    
    stopRecordingTimer();
    await stopRecording();
    
    // Reset the first send flag for next SOS session
    isFirstSendRef.current = true;
    
    console.log('SOS loop stopped successfully');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSosLoop();
    };
  }, []);

  return {
    recording,
    isSending,
    recordingTimer,
    startRecording,
    stopRecording,
    sendSosData,
    startRecordingTimer,
    stopRecordingTimer,
    startSosLoop,
    stopSosLoop,
    isFirstSendRef,
  };
} 
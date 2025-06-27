import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { emergencyService } from '@/services/EmergencyService';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

export function useCheckIn() {
  const { user } = useAuth();
  const [activeCheckIn, setActiveCheckIn] = useState<any>(null);
  const [timer, setTimer] = useState<number>(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Load active check-in on mount
  useEffect(() => {
    if (!user) return;
    const loadActiveCheckIn = async () => {
      const pending = await emergencyService.getPendingCheckIns(user.id);
      if (pending.length > 0) {
        setActiveCheckIn(pending[0]);
        setTimer(Math.max(0, Math.floor((new Date(pending[0].scheduled_time).getTime() - Date.now()) / 1000)));
      }
    };
    loadActiveCheckIn();
  }, [user]);

  // Timer countdown effect
  useEffect(() => {
    if (!activeCheckIn) return;
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval.current!);
          handleTimerElapsed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as any;
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [activeCheckIn]);

  const handleTimerElapsed = async () => {
    if (!activeCheckIn || !user) return;
    // Mark as overdue and trigger SOS
    await supabase
      .from('safety_checks')
      .update({ status: 'overdue' })
      .eq('id', activeCheckIn.id);
    await emergencyService.sendSOS(user.id, 'ai');
    setActiveCheckIn(null);
    Alert.alert('SOS Triggered', 'No check-in received. Emergency contacts have been notified.');
  };

  const handleStopCheckIn = async () => {
    if (!activeCheckIn) return;
    try {
      await emergencyService.deleteCheckIn(activeCheckIn.id);
      setActiveCheckIn(null);
      setTimer(0);
      Alert.alert('Check-In Cancelled', 'Your safety check-in has been cancelled.');
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel check-in.');
    }
  };

  const scheduleCheckIn = async (scheduledTime: Date) => {
    if (!user) return;
    try {
      const checkIn = await emergencyService.scheduleCheckIn(user.id, scheduledTime);
      setActiveCheckIn(checkIn);
      setTimer(Math.max(0, Math.floor((new Date(checkIn.scheduled_time).getTime() - Date.now()) / 1000)));
      Alert.alert('Check-In Scheduled', 'Your safety check-in has been scheduled.');
      return checkIn;
    } catch (e) {
      Alert.alert('Error', 'Failed to schedule check-in.');
      throw e;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return {
    activeCheckIn,
    timer,
    handleStopCheckIn,
    scheduleCheckIn,
  };
} 
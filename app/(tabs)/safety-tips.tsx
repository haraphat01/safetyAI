import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function SafetyTipsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const safetyTips = [
    {
      title: 'Stay Aware of Your Surroundings',
      description: 'Always be conscious of your environment and trust your instincts if something feels wrong. Pay attention to people around you and avoid distractions like headphones in unfamiliar areas.',
      icon: 'eye-outline',
      category: 'Awareness',
    },
    {
      title: 'Share Your Location',
      description: 'Let trusted friends or family know where you\'re going and when you expect to arrive. Use location sharing apps to keep them updated on your whereabouts.',
      icon: 'location-outline',
      category: 'Communication',
    },
    {
      title: 'Keep Your Phone Charged',
      description: 'Ensure your phone has enough battery life for emergency situations. Carry a portable charger and keep emergency contacts easily accessible.',
      icon: 'battery-charging-outline',
      category: 'Preparation',
    },
    {
      title: 'Use Well-Lit Paths',
      description: 'When walking at night, stick to well-lit areas and avoid shortcuts through dark alleys. Walk confidently and maintain awareness of your surroundings.',
      icon: 'bulb-outline',
      category: 'Navigation',
    },
    {
      title: 'Trust Your Instincts',
      description: 'If a situation feels unsafe, remove yourself from it immediately. Your intuition is often your best defense mechanism.',
      icon: 'heart-outline',
      category: 'Intuition',
    },
    {
      title: 'Have Emergency Contacts Ready',
      description: 'Keep important emergency numbers easily accessible on your phone. Program them as speed dial contacts for quick access.',
      icon: 'call-outline',
      category: 'Preparation',
    },
    {
      title: 'Learn Self-Defense Basics',
      description: 'Consider taking a self-defense class to learn basic techniques. Knowledge and confidence can help you feel safer.',
      icon: 'fitness-outline',
      category: 'Skills',
    },
    {
      title: 'Avoid Walking Alone at Night',
      description: 'Whenever possible, walk with a friend or in groups, especially at night. There\'s safety in numbers.',
      icon: 'people-outline',
      category: 'Social',
    },
    {
      title: 'Keep Valuables Hidden',
      description: 'Don\'t display expensive items like phones or jewelry in public. Keep them out of sight to avoid becoming a target.',
      icon: 'lock-closed-outline',
      category: 'Security',
    },
    {
      title: 'Know Your Escape Routes',
      description: 'Always be aware of multiple ways to exit any location. Plan your route and have backup options.',
      icon: 'map-outline',
      category: 'Planning',
    },
    {
      title: 'Stay Sober and Alert',
      description: 'Avoid excessive alcohol consumption when out alone. Stay alert and aware of your surroundings at all times.',
      icon: 'medical-outline',
      category: 'Health',
    },
    {
      title: 'Report Suspicious Activity',
      description: 'If you see something suspicious, report it to authorities. Your vigilance can help keep everyone safe.',
      icon: 'alert-circle-outline',
      category: 'Community',
    },
  ];

  const emergencyNumbers = [
    { name: 'Emergency Services', number: '911', icon: 'call' },
    { name: 'Police (Non-Emergency)', number: '311', icon: 'shield' },
    { name: 'Poison Control', number: '1-800-222-1222', icon: 'medical' },
    { name: 'Suicide Prevention', number: '988', icon: 'heart' },
  ];

  const renderSafetyTip = (tip: any, index: number) => (
    <View key={index} style={[styles.tipCard, { backgroundColor: colors.card }]}>
      <View style={styles.tipHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
          <Ionicons name={tip.icon as any} size={24} color="white" />
        </View>
        <View style={styles.tipInfo}>
          <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
          <Text style={[styles.tipCategory, { color: colors.tint }]}>{tip.category}</Text>
        </View>
      </View>
      <Text style={[styles.tipDescription, { color: colors.tabIconDefault }]}>
        {tip.description}
      </Text>
    </View>
  );

  const renderEmergencyNumber = (emergency: any, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={[styles.emergencyCard, { backgroundColor: colors.card }]}
      onPress={() => {
        // In a real app, this would initiate a call
        console.log(`Calling ${emergency.number}`);
      }}
    >
      <Ionicons name={emergency.icon as any} size={24} color={colors.tint} />
      <View style={styles.emergencyInfo}>
        <Text style={[styles.emergencyName, { color: colors.text }]}>{emergency.name}</Text>
        <Text style={[styles.emergencyNumber, { color: colors.tint }]}>{emergency.number}</Text>
      </View>
      <Ionicons name="call" size={20} color={colors.tint} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Safety Tips</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Stay safe with these essential tips
          </Text>
        </View>

        {/* Emergency Numbers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Numbers</Text>
          <Text style={[styles.sectionDescription, { color: colors.tabIconDefault }]}>
            Keep these numbers handy for emergencies
          </Text>
          {emergencyNumbers.map(renderEmergencyNumber)}
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Safety Tips</Text>
          <Text style={[styles.sectionDescription, { color: colors.tabIconDefault }]}>
            Essential tips to help you stay safe in any situation
          </Text>
          {safetyTips.map(renderSafetyTip)}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.tint }]}>
              <Ionicons name="shield-checkmark" size={24} color="white" />
              <Text style={[styles.quickActionText, { color: colors.buttonText }]}>Enable SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.tint }]}>
              <Ionicons name="location" size={24} color="white" />
              <Text style={[styles.quickActionText, { color: colors.buttonText }]}>Share Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  tipCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipInfo: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  emergencyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyName: {
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyNumber: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 
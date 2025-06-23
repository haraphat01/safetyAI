import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  });

  const profileSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Personal Information',
          subtitle: 'Update your profile details',
          action: () => setEditModalVisible(true),
        },
        {
          icon: 'card-outline',
          title: 'Subscription',
          subtitle: 'Free Plan - Upgrade to Premium',
          action: () => Alert.alert('Premium', 'Premium features coming soon!'),
        },
        {
          icon: 'shield-outline',
          title: 'Privacy & Security',
          subtitle: 'Manage your data and privacy',
          action: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: notificationsEnabled ? 'Enabled' : 'Disabled',
          action: () => setNotificationsEnabled(!notificationsEnabled),
          toggle: true,
          toggleValue: notificationsEnabled,
        },
        {
          icon: 'location-outline',
          title: 'Location Services',
          subtitle: locationEnabled ? 'Enabled' : 'Disabled',
          action: () => setLocationEnabled(!locationEnabled),
          toggle: true,
          toggleValue: locationEnabled,
        },
        {
          icon: 'moon-outline',
          title: 'Dark Mode',
          subtitle: colorScheme === 'dark' ? 'Enabled' : 'Disabled',
          action: () => Alert.alert('Theme', 'Theme settings coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          action: () => Alert.alert('Support', 'Support features coming soon!'),
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          subtitle: 'Read our terms and conditions',
          action: () => Alert.alert('Terms', 'Terms of service coming soon!'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacy Policy',
          subtitle: 'Read our privacy policy',
          action: () => Alert.alert('Privacy', 'Privacy policy coming soon!'),
        },
      ],
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      // In a real app, this would update the user profile in Supabase
      Alert.alert('Success', 'Profile updated successfully!');
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const renderProfileSection = (section: any) => (
    <View key={section.title} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      {section.items.map((item: any, index: number) => (
        <TouchableOpacity
          key={index}
          style={[styles.settingItem, { backgroundColor: colors.card }]}
          onPress={item.action}
        >
          <View style={styles.settingLeft}>
            <Ionicons name={item.icon as any} size={24} color={colors.tint} />
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.tabIconDefault }]}>
                {item.subtitle}
              </Text>
            </View>
          </View>
          {item.toggle ? (
            <Switch
              value={item.toggleValue}
              onValueChange={item.action}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={item.toggleValue ? 'white' : colors.tabIconDefault}
            />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.tint }]}>
            <Ionicons name="person" size={40} color="white" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.user_metadata?.full_name || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.tabIconDefault }]}>
              {user?.email}
            </Text>
            <View style={[styles.subscriptionBadge, { backgroundColor: colors.tint }]}>
              <Text style={styles.subscriptionText}>Free Plan</Text>
            </View>
          </View>
        </View>

        {/* Profile Sections */}
        {profileSections.map(renderProfileSection)}

        {/* Sign Out Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: '#FF6B6B' }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.tabIconDefault }]}>
            SafeGuard AI v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.tabIconDefault} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.tabIconDefault} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Full Name"
                  placeholderTextColor={colors.tabIconDefault}
                  value={editForm.fullName}
                  onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                />
              </View>

              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.tabIconDefault} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email"
                  placeholderTextColor={colors.tabIconDefault}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: 8,
  },
  subscriptionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
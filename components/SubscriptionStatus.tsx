import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionModal from './SubscriptionModal';

interface SubscriptionStatusProps {
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export default function SubscriptionStatus({ 
  showUpgradeButton = true, 
  compact = false 
}: SubscriptionStatusProps) {
  const colors = useColorScheme();
  const { subscriptionInfo, isLoading } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  const getStatusColor = () => {
    if (subscriptionInfo.isActive) {
      return subscriptionInfo.isTrial ? '#FF9500' : '#34C759';
    }
    return colors.tabIconDefault;
  };

  const getStatusText = () => {
    if (subscriptionInfo.isActive) {
      if (subscriptionInfo.isTrial) {
        return 'Trial Active';
      }
      return 'Premium Active';
    }
    return 'Free Plan';
  };

  const getStatusIcon = () => {
    if (subscriptionInfo.isActive) {
      return subscriptionInfo.isTrial ? 'time' : 'checkmark-circle';
    }
    return 'person';
  };

  const handleUpgradePress = () => {
    if (subscriptionInfo.isActive) {
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, please visit your device\'s subscription settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // This would typically open the device's subscription settings
            Alert.alert('Settings', 'Please go to your device settings to manage your subscription.');
          }},
        ]
      );
    } else {
      setShowModal(true);
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactStatus}>
          <Ionicons 
            name={getStatusIcon() as any} 
            size={16} 
            color={getStatusColor()} 
          />
          <Text style={[styles.compactStatusText, { color: colors.text }]}>
            {getStatusText()}
          </Text>
        </View>
        {showUpgradeButton && !subscriptionInfo.isActive && (
          <TouchableOpacity
            style={[styles.compactUpgradeButton, { backgroundColor: colors.tint }]}
            onPress={handleUpgradePress}
          >
            <Text style={styles.compactUpgradeText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={getStatusIcon() as any} 
              size={24} 
              color={getStatusColor()} 
            />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {getStatusText()}
              </Text>
              {subscriptionInfo.expiresAt && (
                <Text style={[styles.expiryText, { color: colors.tabIconDefault }]}>
                  Expires {subscriptionInfo.expiresAt.toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
          
          {subscriptionInfo.isTrial && (
            <View style={[styles.trialBadge, { backgroundColor: '#FF9500' }]}>
              <Text style={styles.trialText}>Trial</Text>
            </View>
          )}
        </View>

        {subscriptionInfo.isActive && (
          <View style={styles.featuresSection}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              Premium Features Active:
            </Text>
            <View style={styles.featuresList}>
              <FeatureItem text="Advanced AI Detection" />
              <FeatureItem text="Unlimited Contacts" />
              <FeatureItem text="Priority SOS Response" />
              <FeatureItem text="Family Safety Features" />
            </View>
          </View>
        )}

        {!subscriptionInfo.isActive && (
          <View style={styles.upgradeSection}>
            <Text style={[styles.upgradeTitle, { color: colors.text }]}>
              Unlock Premium Features
            </Text>
            <Text style={[styles.upgradeDescription, { color: colors.tabIconDefault }]}>
              Get advanced AI protection, unlimited emergency contacts, and priority response
            </Text>
            <View style={styles.upgradeFeatures}>
              <FeatureItem text="Advanced AI Threat Detection" />
              <FeatureItem text="Unlimited Emergency Contacts" />
              <FeatureItem text="Priority SOS Response" />
              <FeatureItem text="Family Safety Features" />
            </View>
          </View>
        )}

        {showUpgradeButton && (
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              {
                backgroundColor: subscriptionInfo.isActive ? colors.border : colors.tint,
              },
            ]}
            onPress={handleUpgradePress}
            disabled={isLoading}
          >
            <Text style={[
              styles.upgradeButtonText,
              { color: subscriptionInfo.isActive ? colors.text : 'white' }
            ]}>
              {subscriptionInfo.isActive ? 'Manage Subscription' : 'Upgrade to Premium'}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={subscriptionInfo.isActive ? colors.text : 'white'} 
            />
          </TouchableOpacity>
        )}
      </View>

      <SubscriptionModal 
        visible={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}

const FeatureItem = ({ text }: { text: string }) => (
  <View style={styles.featureItem}>
    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  compactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  compactUpgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactUpgradeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  expiryText: {
    fontSize: 14,
    marginTop: 2,
  },
  trialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trialText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  upgradeSection: {
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  upgradeFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 
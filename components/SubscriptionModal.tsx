import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PurchasesPackage } from 'react-native-purchases';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
  const colors = useColorScheme();
  const {
    subscriptionInfo,
    isLoading,
    purchasePackage,
    restorePurchases,
    getSubscriptionPackages,
    formatPrice,
    getPackageTitle,
    getPackageDescription,
  } = useSubscription();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      const availablePackages = await getSubscriptionPackages();
      setPackages(availablePackages);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      await purchasePackage(packageToPurchase);
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      onClose();
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  const renderPackage = (packageToRender: PurchasesPackage, index: number) => {
    const isPopular = index === 1; // Make yearly plan popular
    const title = getPackageTitle(packageToRender);
    const description = getPackageDescription(packageToRender);
    const price = formatPrice(packageToRender);

    return (
      <View
        key={packageToRender.identifier}
        style={[
          styles.packageContainer,
          {
            backgroundColor: colors.background,
            borderColor: isPopular ? colors.tint : colors.border,
          },
        ]}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: colors.tint }]}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.packageHeader}>
          <Text style={[styles.packageTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.packagePrice, { color: colors.tint }]}>{price}</Text>
        </View>
        
        <Text style={[styles.packageDescription, { color: colors.tabIconDefault }]}>
          {description}
        </Text>
        
        <View style={styles.featuresList}>
          <FeatureItem text="Advanced AI Threat Detection" />
          <FeatureItem text="Unlimited Emergency Contacts" />
          <FeatureItem text="Priority SOS Response" />
          <FeatureItem text="Family Safety Features" />
          <FeatureItem text="Incident History & Analytics" />
          <FeatureItem text="Premium Support" />
        </View>
        
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            {
              backgroundColor: isPopular ? colors.tint : colors.border,
            },
          ]}
          onPress={() => handlePurchase(packageToRender)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              {subscriptionInfo.isActive ? 'Change Plan' : 'Start Free Trial'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const FeatureItem = ({ text }: { text: string }) => (
    <View style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={16} color={colors.tint} />
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Upgrade to Premium
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
              <Ionicons name="shield-checkmark" size={40} color="white" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Unlock Premium Safety
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.tabIconDefault }]}>
              Get advanced AI protection, unlimited contacts, and priority emergency response
            </Text>
          </View>

          {/* Current Plan Status */}
          {subscriptionInfo.isActive && (
            <View style={[styles.currentPlanContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
              <Text style={[styles.currentPlanText, { color: colors.text }]}>
                {subscriptionInfo.isTrial ? 'Trial Active' : 'Premium Active'}
                {subscriptionInfo.expiresAt && 
                  ` - Expires ${subscriptionInfo.expiresAt.toLocaleDateString()}`
                }
              </Text>
            </View>
          )}

          {/* Subscription Packages */}
          {loadingPackages ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
                Loading subscription plans...
              </Text>
            </View>
          ) : (
            <View style={styles.packagesContainer}>
              {packages.map(renderPackage)}
            </View>
          )}

          {/* Restore Purchases */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isLoading}
          >
            <Text style={[styles.restoreText, { color: colors.tint }]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={[styles.termsText, { color: colors.tabIconDefault }]}>
              By subscribing, you agree to our Terms of Service and Privacy Policy. 
              Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  currentPlanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
  },
  currentPlanText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  packagesContainer: {
    marginVertical: 20,
  },
  packageContainer: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  packageDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
  },
  purchaseButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 15,
    marginVertical: 20,
  },
  restoreText: {
    fontSize: 16,
    fontWeight: '500',
  },
  termsContainer: {
    paddingVertical: 20,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
}); 
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { revenueCatService, SubscriptionInfo, PurchasesPackage } from '@/services/RevenueCatService';
import { supabase } from '@/lib/supabase';

interface SubscriptionContextType {
  subscriptionInfo: SubscriptionInfo;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  getSubscriptionPackages: () => Promise<PurchasesPackage[]>;
  formatPrice: (packageToFormat: PurchasesPackage) => string;
  getPackageTitle: (packageToFormat: PurchasesPackage) => string;
  getPackageDescription: (packageToFormat: PurchasesPackage) => string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    tier: 'free',
    status: 'inactive',
    isTrial: false,
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize RevenueCat when user changes
  useEffect(() => {
    if (user) {
      initializeRevenueCat();
    } else {
      setSubscriptionInfo({
        tier: 'free',
        status: 'inactive',
        isTrial: false,
        isActive: false,
      });
      setIsLoading(false);
    }
  }, [user]);

  const initializeRevenueCat = async () => {
    try {
      setIsLoading(true);
      
      // Initialize RevenueCat
      await revenueCatService.initialize(user?.id);
      
      // Set user in RevenueCat
      if (user?.id) {
        await revenueCatService.setUser(user.id);
      }
      
      // Get initial subscription info
      await refreshSubscription();
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      setSubscriptionInfo({
        tier: 'free',
        status: 'inactive',
        isTrial: false,
        isActive: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    try {
      const info = await revenueCatService.getSubscriptionInfo();
      setSubscriptionInfo(info);
      
      // Update user's subscription status in Supabase
      if (user?.id) {
        await updateUserSubscriptionInDatabase(info);
      }
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  };

  const updateUserSubscriptionInDatabase = async (info: SubscriptionInfo) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: info.tier,
          subscription_status: info.status,
        })
        .eq('id', user?.id);

      if (error) {
        console.error('Failed to update subscription in database:', error);
      }
    } catch (error) {
      console.error('Error updating subscription in database:', error);
    }
  };

  const purchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsLoading(true);
      
      const customerInfo = await revenueCatService.purchasePackage(packageToPurchase);
      
      // Refresh subscription info after purchase
      await refreshSubscription();
      
      Alert.alert(
        'Purchase Successful!',
        'Welcome to SafeGuard Premium! You now have access to all premium features.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // Handle specific error cases
      if (error.code === 'USER_CANCELLED') {
        // User cancelled the purchase, no need to show error
        return;
      }
      
      Alert.alert(
        'Purchase Failed',
        error.message || 'Unable to complete purchase. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      
      const customerInfo = await revenueCatService.restorePurchases();
      
      // Refresh subscription info after restore
      await refreshSubscription();
      
      if (customerInfo.entitlements.active['premium']) {
        Alert.alert(
          'Purchases Restored!',
          'Your premium subscription has been restored successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No active premium subscription was found to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Failed to restore purchases:', error);
      Alert.alert(
        'Restore Failed',
        error.message || 'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionPackages = async (): Promise<PurchasesPackage[]> => {
    try {
      return await revenueCatService.getSubscriptionPackages();
    } catch (error) {
      console.error('Failed to get subscription packages:', error);
      return [];
    }
  };

  const formatPrice = (packageToFormat: PurchasesPackage): string => {
    return revenueCatService.formatPrice(packageToFormat);
  };

  const getPackageTitle = (packageToFormat: PurchasesPackage): string => {
    return revenueCatService.getPackageTitle(packageToFormat);
  };

  const getPackageDescription = (packageToFormat: PurchasesPackage): string => {
    return revenueCatService.getPackageDescription(packageToFormat);
  };

  const value = {
    subscriptionInfo,
    isLoading,
    refreshSubscription,
    purchasePackage,
    restorePurchases,
    getSubscriptionPackages,
    formatPrice,
    getPackageTitle,
    getPackageDescription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
} 
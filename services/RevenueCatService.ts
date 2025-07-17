import Purchases, { PurchasesOffering, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// RevenueCat API Keys - Use expo-constants to access them from app.json
const REVENUECAT_API_KEYS = {
  ios: Constants.expoConfig?.extra?.REVENUECAT_IOS_API_KEY,
  android: Constants.expoConfig?.extra?.REVENUECAT_ANDROID_API_KEY,
};

// Subscription Product IDs
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'safetyai_monthly_premium',
  YEARLY: 'safetyai_yearly_premium',
};

// Subscription Tiers
export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'trial';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt?: Date;
  isTrial: boolean;
  isActive: boolean;
}

class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  public async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
      
      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  public async setUser(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log('RevenueCat user set:', userId);
    } catch (error) {
      console.error('Failed to set RevenueCat user:', error);
      throw error;
    }
  }

  public async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  public async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  public async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('Purchase successful:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  public async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('Purchases restored:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  public async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) {
        return {
          tier: 'free',
          status: 'inactive',
          isTrial: false,
          isActive: false,
        };
      }

      // Check for active entitlements
      const hasActiveEntitlement = customerInfo.entitlements.active['premium'];
      
      if (hasActiveEntitlement) {
        const entitlement = customerInfo.entitlements.active['premium'];
        const isTrial = entitlement.periodType === 'trial';
        const expiresAt = entitlement.expirationDate ? new Date(entitlement.expirationDate) : undefined;
        
        return {
          tier: 'premium',
          status: isTrial ? 'trial' : 'active',
          expiresAt,
          isTrial,
          isActive: true,
        };
      }

      return {
        tier: 'free',
        status: 'inactive',
        isTrial: false,
        isActive: false,
      };
    } catch (error) {
      console.error('Failed to get subscription info:', error);
      return {
        tier: 'free',
        status: 'inactive',
        isTrial: false,
        isActive: false,
      };
    }
  }

  public async checkTrialEligibility(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return true;

      // Check if user has ever had a trial
      const hasHadTrial = customerInfo.originalPurchaseDate !== null;
      return !hasHadTrial;
    } catch (error) {
      console.error('Failed to check trial eligibility:', error);
      return true; // Default to eligible if we can't determine
    }
  }

  public async getSubscriptionPackages(): Promise<PurchasesPackage[]> {
    try {
      const offering = await this.getOfferings();
      if (!offering) return [];

      const packages = [];
      
      // Add monthly package if available
      if (offering.monthly) {
        packages.push(offering.monthly);
      }
      
      // Add yearly package if available
      if (offering.annual) {
        packages.push(offering.annual);
      }

      return packages;
    } catch (error) {
      console.error('Failed to get subscription packages:', error);
      return [];
    }
  }

  public formatPrice(packageToFormat: PurchasesPackage): string {
    try {
      const product = packageToFormat.product;
      return product.priceString;
    } catch (error) {
      console.error('Failed to format price:', error);
      return 'N/A';
    }
  }

  public getPackageTitle(packageToFormat: PurchasesPackage): string {
    try {
      const product = packageToFormat.product;
      const identifier = product.identifier;
      
      if (identifier.includes('monthly')) {
        return 'Monthly Premium';
      } else if (identifier.includes('yearly') || identifier.includes('annual')) {
        return 'Yearly Premium';
      }
      
      return product.title;
    } catch (error) {
      console.error('Failed to get package title:', error);
      return 'Premium';
    }
  }

  public getPackageDescription(packageToFormat: PurchasesPackage): string {
    try {
      const product = packageToFormat.product;
      const identifier = product.identifier;
      
      if (identifier.includes('monthly')) {
        return '$5/month after 7-day free trial';
      } else if (identifier.includes('yearly') || identifier.includes('annual')) {
        return '$55/year after 7-day free trial';
      }
      
      return product.description;
    } catch (error) {
      console.error('Failed to get package description:', error);
      return 'Premium features with 7-day free trial';
    }
  }
}

export const revenueCatService = RevenueCatService.getInstance(); 
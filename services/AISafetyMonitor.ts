import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { DeviceMotion } from 'expo-sensors';
import { Subscription } from 'expo-sensors/build/DeviceMotion';

export interface ThreatDetection {
  type: 'fall' | 'sudden_movement' | 'impact' | 'suspicious_activity';
  confidence: number;
  timestamp: number;
  data: any;
}

export interface SafetySettings {
  fallDetectionEnabled: boolean;
  impactDetectionEnabled: boolean;
  suspiciousActivityEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  autoSOS: boolean;
}

class AISafetyMonitor {
  private motionSubscription: Subscription | null = null;
  private isMonitoring = false;
  private settings: SafetySettings = {
    fallDetectionEnabled: true,
    impactDetectionEnabled: true,
    suspiciousActivityEnabled: true,
    sensitivity: 'medium',
    autoSOS: false,
  };

  private thresholds = {
    low: {
      fall: 15,
      impact: 20,
      movement: 8,
    },
    medium: {
      fall: 12,
      impact: 15,
      movement: 6,
    },
    high: {
      fall: 8,
      impact: 10,
      movement: 4,
    },
  };

  private onThreatDetected?: (threat: ThreatDetection) => void;
  private onSettingsChanged?: (settings: SafetySettings) => void;

  constructor() {
    this.setupNotifications();
  }

  private async setupNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  public setSettings(settings: Partial<SafetySettings>) {
    this.settings = { ...this.settings, ...settings };
    this.onSettingsChanged?.(this.settings);
  }

  public getSettings(): SafetySettings {
    return { ...this.settings };
  }

  public setThreatCallback(callback: (threat: ThreatDetection) => void) {
    this.onThreatDetected = callback;
  }

  public setSettingsCallback(callback: (settings: SafetySettings) => void) {
    this.onSettingsChanged = callback;
  }

  public async startMonitoring() {
    if (this.isMonitoring) {
      console.log('AI Safety Monitor already running');
      return;
    }

    try {
      const { available } = await DeviceMotion.getPermissionsAsync();
      if (!available) {
        const { granted } = await DeviceMotion.requestPermissionsAsync();
        if (!granted) {
          throw new Error('Motion sensor permissions not granted');
        }
      }

      this.motionSubscription = DeviceMotion.addListener((motionData) => {
        this.analyzeMotionData(motionData);
      });

      this.isMonitoring = true;
      console.log('AI Safety Monitor started');
    } catch (error) {
      console.error('Failed to start AI Safety Monitor:', error);
      throw error;
    }
  }

  public stopMonitoring() {
    if (this.motionSubscription) {
      this.motionSubscription.remove();
      this.motionSubscription = null;
    }
    this.isMonitoring = false;
    console.log('AI Safety Monitor stopped');
  }

  private analyzeMotionData(motionData: any) {
    const { acceleration, rotationRate } = motionData;
    
    if (!acceleration || !rotationRate) return;

    const currentThresholds = this.thresholds[this.settings.sensitivity];

    // Fall detection
    if (this.settings.fallDetectionEnabled) {
      const fallScore = this.detectFall(acceleration, rotationRate);
      if (fallScore > currentThresholds.fall) {
        this.handleThreat({
          type: 'fall',
          confidence: Math.min(fallScore / 20, 1),
          timestamp: Date.now(),
          data: { acceleration, rotationRate, fallScore },
        });
      }
    }

    // Impact detection
    if (this.settings.impactDetectionEnabled) {
      const impactScore = this.detectImpact(acceleration);
      if (impactScore > currentThresholds.impact) {
        this.handleThreat({
          type: 'impact',
          confidence: Math.min(impactScore / 25, 1),
          timestamp: Date.now(),
          data: { acceleration, impactScore },
        });
      }
    }

    // Suspicious activity detection
    if (this.settings.suspiciousActivityEnabled) {
      const suspiciousScore = this.detectSuspiciousActivity(acceleration, rotationRate);
      if (suspiciousScore > currentThresholds.movement) {
        this.handleThreat({
          type: 'suspicious_activity',
          confidence: Math.min(suspiciousScore / 15, 1),
          timestamp: Date.now(),
          data: { acceleration, rotationRate, suspiciousScore },
        });
      }
    }
  }

  private detectFall(acceleration: any, rotationRate: any): number {
    const { x: ax, y: ay, z: az } = acceleration;
    const { x: rx, y: ry, z: rz } = rotationRate;

    // Calculate magnitude of acceleration
    const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    
    // Calculate magnitude of rotation
    const rotationMagnitude = Math.sqrt(rx * rx + ry * ry + rz * rz);

    // Fall detection algorithm
    let fallScore = 0;

    // Sudden drop in acceleration (free fall)
    if (accelMagnitude < 5) {
      fallScore += 10;
    }

    // High rotation during fall
    if (rotationMagnitude > 3) {
      fallScore += 5;
    }

    // Sudden change in z-axis (device orientation change)
    if (Math.abs(az) > 15) {
      fallScore += 8;
    }

    return fallScore;
  }

  private detectImpact(acceleration: any): number {
    const { x: ax, y: ay, z: az } = acceleration;
    
    // Calculate magnitude of acceleration
    const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    
    // Impact detection based on sudden high acceleration
    if (accelMagnitude > 20) {
      return accelMagnitude;
    }

    return 0;
  }

  private detectSuspiciousActivity(acceleration: any, rotationRate: any): number {
    const { x: ax, y: ay, z: az } = acceleration;
    const { x: rx, y: ry, z: rz } = rotationRate;

    // Calculate magnitudes
    const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    const rotationMagnitude = Math.sqrt(rx * rx + ry * ry + rz * rz);

    let suspiciousScore = 0;

    // Erratic movement patterns
    if (accelMagnitude > 12 && rotationMagnitude > 2) {
      suspiciousScore += 6;
    }

    // Sudden jerky movements
    if (accelMagnitude > 15) {
      suspiciousScore += 4;
    }

    // Unusual rotation patterns
    if (rotationMagnitude > 4) {
      suspiciousScore += 3;
    }

    return suspiciousScore;
  }

  private async handleThreat(threat: ThreatDetection) {
    console.log('Threat detected:', threat);

    // Trigger haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Send notification
    await this.sendThreatNotification(threat);

    // Call callback
    this.onThreatDetected?.(threat);

    // Auto SOS if enabled
    if (this.settings.autoSOS && threat.confidence > 0.7) {
      // This would trigger the SOS system
      console.log('Auto SOS triggered due to high confidence threat');
    }
  }

  private async sendThreatNotification(threat: ThreatDetection) {
    const threatMessages = {
      fall: 'Potential fall detected! Are you okay?',
      impact: 'Impact detected! Check if you need help.',
      suspicious_activity: 'Unusual movement detected. Stay alert!',
    };

    const message = threatMessages[threat.type] || 'Safety alert!';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'SafeGuard Alert',
        body: message,
        data: { threat },
      },
      trigger: null, // Send immediately
    });
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

export const aiSafetyMonitor = new AISafetyMonitor(); 
 
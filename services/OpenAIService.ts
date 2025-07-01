import { supabase } from '@/lib/supabase';

export interface EmergencyAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  incidentType: string;
  summary: string;
  recommendedActions: string[];
  medicalContext?: string;
  locationContext?: string;
  confidence: number;
  emergencyServices?: boolean;
  estimatedResponseTime?: string;
  additionalResources?: string[];
}

export interface FirstAidGuidance {
  steps: string[];
  warnings: string[];
  estimatedTime: string;
  whenToCall911: boolean;
  additionalNotes?: string;
  emergencyContacts?: string[];
  nearestHospitals?: string[];
}

export interface VisionAnalysis {
  injuries: string[];
  severity: 'minor' | 'moderate' | 'severe';
  recommendations: string[];
  confidence: number;
  emergencyActions?: string[];
  medicalPriority?: 'immediate' | 'urgent' | 'routine';
}

class OpenAIService {
  private isInitialized = false;

  constructor() {
    this.initializeOpenAI();
  }

  private async initializeOpenAI() {
    try {
      // Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session for OpenAI initialization');
        return;
      }

      // For now, we'll assume the service is available if we have a session
      // In production, you might want to test the connection
      this.isInitialized = true;
      console.log('OpenAI service initialized');
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
    }
  }

  public async analyzeEmergencySituation(
    userDescription: string,
    location?: string,
    medicalHistory?: string
  ): Promise<EmergencyAnalysis> {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type: 'emergency_analysis',
          data: {
            userDescription,
            location,
            medicalHistory,
          },
        },
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      return data as EmergencyAnalysis;
    } catch (error) {
      console.error('Error analyzing emergency situation:', error);
      throw new Error('Failed to analyze emergency situation');
    }
  }

  public async getFirstAidGuidance(
    emergencyType: string,
    specificInjury?: string,
    userLocation?: string
  ): Promise<FirstAidGuidance> {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type: 'first_aid_guidance',
          data: {
            emergencyType,
            specificInjury,
            userLocation,
          },
        },
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      return data as FirstAidGuidance;
    } catch (error) {
      console.error('Error getting first aid guidance:', error);
      throw new Error('Failed to get first aid guidance');
    }
  }

  public async analyzeInjuryImage(imageBase64: string): Promise<VisionAnalysis> {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type: 'vision_analysis',
          data: {
            imageBase64,
          },
        },
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      return data as VisionAnalysis;
    } catch (error) {
      console.error('Error analyzing injury image:', error);
      throw new Error('Failed to analyze injury image');
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public async reinitialize(): Promise<void> {
    await this.initializeOpenAI();
  }
}

export const openAIService = new OpenAIService(); 
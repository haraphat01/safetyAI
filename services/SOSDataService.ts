import { SOSData, supabase } from '@/lib/supabase';

class SOSDataService {
  /**
   * Create a new SOS data entry
   */
  async createSOSData(data: Omit<SOSData, 'id' | 'created_at' | 'updated_at'>): Promise<SOSData> {
    try {
      const { data: sosData, error } = await supabase
        .from('sos_data')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return sosData;
    } catch (error) {
      console.error('Error creating SOS data:', error);
      throw error;
    }
  }

  /**
   * Get recent SOS data for a user
   */
  async getRecentSOSData(userId: string, limit: number = 20): Promise<SOSData[]> {
    try {
      const { data: sosData, error } = await supabase
        .from('sos_data')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return sosData || [];
    } catch (error) {
      console.error('Error fetching SOS data:', error);
      throw error;
    }
  }

  /**
   * Delete a specific SOS data entry
   */
  async deleteSOSData(id: string, userId: string): Promise<void> {
    try {
      // First get the SOS data to check if it has an audio file
      const { data: sosData, error: fetchError } = await supabase
        .from('sos_data')
        .select('audio_filename')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the SOS data entry
      const { error: deleteError } = await supabase
        .from('sos_data')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // If there was an audio file, delete it from storage
      if (sosData?.audio_filename) {
        await this.deleteAudioFile(sosData.audio_filename);
      }
    } catch (error) {
      console.error('Error deleting SOS data:', error);
      throw error;
    }
  }

  /**
   * Delete audio file from storage
   */
  private async deleteAudioFile(filename: string): Promise<void> {
    try {
      // Try multiple bucket names in case the bucket doesn't exist
      const bucketNames = ['sos-audio', 'audio', 'uploads', 'public'];
      
      for (const bucketName of bucketNames) {
        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([filename]);

          if (!error) {
            console.log(`Audio file deleted from ${bucketName}:`, filename);
            return; // Success, exit loop
          }
        } catch (bucketError) {
          console.error(`Error deleting from bucket ${bucketName}:`, bucketError);
          continue; // Try next bucket
        }
      }
    } catch (error) {
      console.error('Error deleting audio file:', error);
      // Don't throw error here as the SOS data was already deleted
    }
  }

  /**
   * Get SOS data by ID
   */
  async getSOSDataById(id: string, userId: string): Promise<SOSData | null> {
    try {
      const { data: sosData, error } = await supabase
        .from('sos_data')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return sosData;
    } catch (error) {
      console.error('Error fetching SOS data by ID:', error);
      throw error;
    }
  }

  /**
   * Get SOS data count for a user
   */
  async getSOSDataCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('sos_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting SOS data count:', error);
      throw error;
    }
  }

  /**
   * Delete all SOS data for a user (useful for account deletion)
   */
  async deleteAllSOSData(userId: string): Promise<void> {
    try {
      // First get all audio filenames
      const { data: sosData, error: fetchError } = await supabase
        .from('sos_data')
        .select('audio_filename')
        .eq('user_id', userId)
        .not('audio_filename', 'is', null);

      if (fetchError) throw fetchError;

      // Delete all SOS data entries
      const { error: deleteError } = await supabase
        .from('sos_data')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Delete all audio files
      if (sosData && sosData.length > 0) {
        const filenames = sosData.map(item => item.audio_filename).filter(Boolean);
        await this.deleteMultipleAudioFiles(filenames);
      }
    } catch (error) {
      console.error('Error deleting all SOS data:', error);
      throw error;
    }
  }

  /**
   * Delete multiple audio files from storage
   */
  private async deleteMultipleAudioFiles(filenames: string[]): Promise<void> {
    try {
      const bucketNames = ['sos-audio', 'audio', 'uploads', 'public'];
      
      for (const bucketName of bucketNames) {
        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove(filenames);

          if (!error) {
            console.log(`Audio files deleted from ${bucketName}:`, filenames);
            return; // Success, exit loop
          }
        } catch (bucketError) {
          console.error(`Error deleting from bucket ${bucketName}:`, bucketError);
          continue; // Try next bucket
        }
      }
    } catch (error) {
      console.error('Error deleting multiple audio files:', error);
    }
  }
}

export const sosDataService = new SOSDataService(); 
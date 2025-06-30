-- SOS Data Table Schema
-- This table captures each SOS alert with audio file information

-- Create the sos_data table
CREATE TABLE IF NOT EXISTS public.sos_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sos_alert_id UUID REFERENCES public.sos_alerts(id) ON DELETE CASCADE,
  audio_url TEXT,
  audio_filename TEXT,
  location JSONB NOT NULL,
  battery_level INTEGER,
  network_info JSONB,
  device_info JSONB,
  recording_duration INTEGER, -- in seconds
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sos_data_user_id ON public.sos_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_data_sent_at ON public.sos_data(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_data_sos_alert_id ON public.sos_data(sos_alert_id);

-- Enable Row Level Security
ALTER TABLE public.sos_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own SOS data
CREATE POLICY "Users can view their own SOS data" ON public.sos_data
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own SOS data
CREATE POLICY "Users can insert their own SOS data" ON public.sos_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own SOS data
CREATE POLICY "Users can update their own SOS data" ON public.sos_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own SOS data
CREATE POLICY "Users can delete their own SOS data" ON public.sos_data
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sos_data_updated_at
  BEFORE UPDATE ON public.sos_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.sos_data IS 'Stores individual SOS data entries with audio file information';
COMMENT ON COLUMN public.sos_data.audio_url IS 'Public URL to the audio file in storage';
COMMENT ON COLUMN public.sos_data.audio_filename IS 'Original filename of the audio file';
COMMENT ON COLUMN public.sos_data.recording_duration IS 'Duration of the audio recording in seconds'; 
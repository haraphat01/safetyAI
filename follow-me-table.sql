-- Follow Me Feature Database Schema
-- This table enables friends and family to join your journey virtually via live GPS tracking

-- Create the follow_me_sessions table
CREATE TABLE IF NOT EXISTS public.follow_me_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the follow_me_participants table
CREATE TABLE IF NOT EXISTS public.follow_me_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.follow_me_sessions(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.emergency_contacts(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'left')),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, contact_id)
);

-- Create the follow_me_locations table for tracking location updates
CREATE TABLE IF NOT EXISTS public.follow_me_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.follow_me_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location JSONB NOT NULL,
  speed REAL,
  heading REAL,
  altitude REAL,
  accuracy REAL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follow_me_sessions_user_id ON public.follow_me_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_me_sessions_active ON public.follow_me_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_follow_me_participants_session_id ON public.follow_me_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_follow_me_participants_contact_id ON public.follow_me_participants(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_me_locations_session_id ON public.follow_me_locations(session_id);
CREATE INDEX IF NOT EXISTS idx_follow_me_locations_timestamp ON public.follow_me_locations(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.follow_me_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_me_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_me_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follow_me_sessions
-- Users can view their own sessions
CREATE POLICY "Users can view their own follow me sessions" ON public.follow_me_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own follow me sessions" ON public.follow_me_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own follow me sessions" ON public.follow_me_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own follow me sessions" ON public.follow_me_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for follow_me_participants
-- Users can view participants of their sessions
CREATE POLICY "Users can view participants of their sessions" ON public.follow_me_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.follow_me_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can insert participants to their sessions
CREATE POLICY "Users can insert participants to their sessions" ON public.follow_me_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.follow_me_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can update participants of their sessions
CREATE POLICY "Users can update participants of their sessions" ON public.follow_me_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.follow_me_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can delete participants of their sessions
CREATE POLICY "Users can delete participants of their sessions" ON public.follow_me_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.follow_me_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for follow_me_locations
-- Users can view locations of their sessions
CREATE POLICY "Users can view locations of their sessions" ON public.follow_me_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.follow_me_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can insert locations to their sessions
CREATE POLICY "Users can insert locations to their sessions" ON public.follow_me_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.follow_me_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can update locations of their sessions
CREATE POLICY "Users can update locations of their sessions" ON public.follow_me_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.follow_me_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can delete locations of their sessions
CREATE POLICY "Users can delete locations of their sessions" ON public.follow_me_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.follow_me_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_follow_me_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_follow_me_sessions_updated_at
  BEFORE UPDATE ON public.follow_me_sessions
  FOR EACH ROW EXECUTE FUNCTION update_follow_me_updated_at_column();

CREATE TRIGGER update_follow_me_participants_updated_at
  BEFORE UPDATE ON public.follow_me_participants
  FOR EACH ROW EXECUTE FUNCTION update_follow_me_updated_at_column();

-- Create a function to clean up old location data
CREATE OR REPLACE FUNCTION cleanup_old_follow_me_locations()
RETURNS void AS $$
BEGIN
  -- Delete location data older than 24 hours for inactive sessions
  DELETE FROM public.follow_me_locations 
  WHERE session_id IN (
    SELECT id FROM public.follow_me_sessions 
    WHERE is_active = false AND ended_at < NOW() - INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to end inactive sessions
CREATE OR REPLACE FUNCTION end_inactive_follow_me_sessions()
RETURNS void AS $$
BEGIN
  -- End sessions that have been inactive for more than 6 hours
  UPDATE public.follow_me_sessions 
  SET is_active = false, ended_at = NOW()
  WHERE is_active = true 
    AND updated_at < NOW() - INTERVAL '6 hours';
END;
$$ LANGUAGE plpgsql; 
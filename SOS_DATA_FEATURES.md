# SOS Data Features

This document describes the new SOS data capture and management features added to the SafetyAI app.

## Overview

The app now captures detailed information about each SOS alert sent, including:
- Audio recordings
- Location data
- Device information (battery, network status)
- Timestamps
- Recording duration

## Database Schema

### SOS Data Table (`sos_data`)

The `sos_data` table stores individual SOS alert entries with the following structure:

```sql
CREATE TABLE public.sos_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sos_alert_id UUID REFERENCES public.sos_alerts(id) ON DELETE CASCADE,
  audio_url TEXT,
  audio_filename TEXT,
  location JSONB NOT NULL,
  battery_level INTEGER,
  network_info JSONB,
  device_info JSONB,
  recording_duration INTEGER,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Features

1. **Audio File Management**: Each SOS alert can include an audio recording
2. **Location Tracking**: Detailed location information including coordinates and address
3. **Device Context**: Battery level and network status at time of alert
4. **Recording Duration**: Length of audio recording in seconds
5. **Automatic Cleanup**: Audio files are deleted when SOS data is deleted

## Components

### SOSDataAlerts Component
- Displays recent SOS alerts on the home screen
- Shows basic information: time, location, audio status
- Allows deletion of individual alerts
- Pull-to-refresh functionality

### SOS History Screen
- Dedicated tab for viewing all SOS alerts
- Detailed view with all captured information
- Audio playback functionality
- Bulk management capabilities

## Services

### SOSDataService
Provides methods for:
- `createSOSData()`: Save new SOS data entry
- `getRecentSOSData()`: Fetch recent alerts for a user
- `deleteSOSData()`: Delete alert and associated audio file
- `getSOSDataCount()`: Get total count of alerts
- `deleteAllSOSData()`: Delete all alerts for a user

## Integration

### useSOSRecording Hook
Updated to automatically save SOS data after sending alerts:
- Captures all relevant information
- Saves to database after successful SOS transmission
- Handles audio file upload and URL generation

### Home Screen
- Shows recent SOS alerts in a compact format
- Integrates with existing SOS functionality
- Maintains user experience consistency

## Security

### Row Level Security (RLS)
- Users can only access their own SOS data
- Proper authentication required for all operations
- Secure audio file access through Supabase Storage

### Data Privacy
- Audio files are stored securely in Supabase Storage
- Automatic cleanup when data is deleted
- User-controlled data management

## Usage

### For Users
1. **View Recent Alerts**: See recent SOS alerts on the home screen
2. **Access Full History**: Navigate to SOS History tab for detailed view
3. **Delete Alerts**: Remove unwanted alerts and associated audio files
4. **Play Audio**: Listen to recorded audio from SOS alerts

### For Developers
1. **Database Migration**: Run `sos-data-table.sql` in Supabase SQL Editor
2. **Service Integration**: Use `sosDataService` for data operations
3. **Component Usage**: Import and use `SOSDataAlerts` component
4. **Customization**: Extend functionality as needed

## File Structure

```
├── sos-data-table.sql          # Database schema
├── run-sos-data-migration.sql  # Migration script
├── services/
│   └── SOSDataService.ts       # Data service
├── components/
│   ├── SOSDataAlerts.tsx       # Home screen component
│   └── SOSHistoryScreen.tsx    # History screen
├── app/(tabs)/
│   └── sos-history.tsx         # History tab
└── hooks/
    └── useSOSRecording.ts      # Updated hook
```

## Migration Steps

1. **Run Database Migration**:
   ```sql
   -- In Supabase SQL Editor
   \i sos-data-table.sql
   ```

2. **Verify Installation**:
   ```sql
   -- Check table creation
   SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'sos_data';
   
   -- Check RLS policies
   SELECT COUNT(*) FROM pg_policies WHERE tablename = 'sos_data';
   ```

3. **Test Functionality**:
   - Send a test SOS alert
   - Verify data appears in SOS History
   - Test audio playback
   - Test delete functionality

## Future Enhancements

- **Export Functionality**: Allow users to export SOS data
- **Analytics**: Provide insights on SOS usage patterns
- **Backup**: Automatic backup of important SOS data
- **Sharing**: Share SOS data with emergency contacts
- **Advanced Filtering**: Filter alerts by date, location, or type 
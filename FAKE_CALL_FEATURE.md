# Fake Call Feature

## Overview
The Fake Call feature allows users to schedule fake incoming calls to help them exit uncomfortable or threatening situations safely. This feature provides a realistic phone call experience with customizable timing and caller information.

## Features

### Quick Actions
- **Emergency Exit Call (5s)**: Immediate fake call for urgent situations
- **Quick Fake Call (30s)**: Standard fake call with 30-second delay
- **Custom Caller Selection**: Choose from preset callers (Mom, Dad, Work, etc.)

### Caller Options
**Default Contacts:**
- Mom: +1 (555) 123-4567
- Dad: +1 (555) 234-5678
- Work: +1 (555) 345-6789
- Emergency Contact: +1 (555) 456-7890
- Roommate: +1 (555) 567-8901
- Boss: +1 (555) 678-9012
- Doctor: +1 (555) 789-0123
- Uber: +1 (555) 890-1234

**Custom Contacts:**
- Add your own contacts with custom names and numbers
- Edit and delete custom contacts as needed
- Delete default contacts to hide them from your list
- Restore deleted default contacts anytime
- All contacts appear in the fake call options

### How It Works

1. **Schedule a Call**: Select a caller and timing option
2. **Full-Screen Call Interface**: Your phone displays a realistic incoming call screen
3. **Phone Rings**: Audio ringtone plays with haptic feedback
4. **Answer or Decline**: Use the native-style call buttons
5. **Call Duration**: Track call time and manage the conversation
6. **Natural Exit**: Use the call as an excuse to leave the situation

### Technical Implementation

#### FakeCallService
- Manages scheduled calls and timing
- Handles audio playback and notifications
- Provides fallback options for missing audio files
- Supports call cancellation and status tracking

#### FakeCallModal
- User interface for scheduling calls
- Real-time call status updates
- Caller selection interface (default + custom contacts)
- Contact management integration
- Instructions and help text

#### ContactManagementModal
- Add, edit, and delete any contacts (default or custom)
- Delete default contacts to hide them from the list
- Restore deleted default contacts with one click
- Form validation and error handling
- Persistent storage using AsyncStorage
- Visual distinction between default and custom contacts

#### IncomingCallScreen
- Full-screen incoming call interface
- Realistic call animations and haptics
- Answer/decline/end call functionality
- Call duration tracking
- Native phone app-like experience

#### Integration
- Added to QuickActions component
- Integrated into main home screen
- Uses existing notification system
- Compatible with existing audio infrastructure

### Audio Files
The feature expects the following audio files in the `assets/` directory:
- `ringtone.mp3`: Standard phone ringtone
- `fake-voice.mp3`: Brief voice message for answered calls

If these files are missing, the service will use fallback audio or skip audio playback gracefully.

### Safety Features
- **Emergency Option**: 5-second delay for immediate exit
- **Full-Screen Interface**: Looks exactly like a real incoming call
- **Realistic Timing**: Natural call durations and ring patterns
- **Haptic Feedback**: Phone vibrates like a real call
- **Customizable**: Different caller options for various situations
- **Discreet**: No obvious indicators that it's a fake call

### Usage Scenarios
- **Uncomfortable Dates**: Use a "work emergency" call to exit
- **Pressure Situations**: "Family emergency" to leave quickly
- **Safety Concerns**: Emergency contact call for immediate exit
- **Social Situations**: Any caller to create a natural excuse
- **Custom Scenarios**: Add specific contacts for your unique situations

### Privacy & Security
- All calls are simulated locally on the device
- No actual phone calls are made
- No data is transmitted to external services
- Caller information is fictional and safe to use

## Future Enhancements
- Voice message customization
- Integration with real contacts (with permission)
- Advanced scheduling options
- Call history and analytics
- Contact categories and tags
- Import/export contact lists 
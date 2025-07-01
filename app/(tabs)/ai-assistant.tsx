import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { locationService } from '@/services/LocationService';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any; // For AI responses with additional data
  messageType?: 'text' | 'emergency-analysis' | 'first-aid' | 'injury-analysis';
}

export default function AIAssistantScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, session } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize messages based on authentication status
  useEffect(() => {
    if (user && session) {
      setMessages([
        {
          id: '1',
          type: 'ai',
          content: 'Hello! I\'m your AI safety assistant. I\'m here to help you with any emergency situation or safety concern you might have.\n\nYou can tell me about:\n• Medical emergencies or injuries\n• Safety threats or dangerous situations\n• Mental health concerns\n• Any other emergency situation\n\nI\'ll provide personalized guidance based on your specific situation. For immediate life-threatening emergencies, always call 911 first.\n\nWhat\'s happening?',
          timestamp: new Date(),
          messageType: 'text'
        }
      ]);
    } else {
      setMessages([
        {
          id: '1',
          type: 'ai',
          content: '🔐 **AI Safety Assistant**\n\nTo use the AI assistant, please sign in from the Profile tab.\n\nOnce signed in, I can help you with any emergency situation by providing personalized guidance and support.\n\n**For immediate emergencies, call 911.**',
          timestamp: new Date(),
          messageType: 'text'
        }
      ]);
    }
  }, [user, session]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const cameraRef = useRef<Camera>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestPermissions();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    setHasCameraPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startListening = () => {
    setIsListening(true);
    // Simulate voice input for now - in production, this would use actual speech recognition
    setTimeout(() => {
      setIsListening(false);
      // Natural conversational emergency scenarios
      const conversationalScenarios = [
        'I just fell down the stairs and hit my head really hard. I feel dizzy and confused.',
        'My friend is having trouble breathing and says their chest feels tight. They look really pale.',
        'I cut my hand really badly while cooking. It\'s bleeding a lot and I\'m not sure what to do.',
        'There\'s been an accident on the road. Someone is trapped in their car and not responding.',
        'I feel really lightheaded and my vision is blurry. I think I might pass out.',
        'My child swallowed something small and is coughing. They seem to be having trouble breathing.',
        'There\'s a fire in my building and the smoke is getting thick. I don\'t know if I should stay or leave.',
        'I found someone unconscious on the sidewalk. They\'re not responding when I try to wake them up.'
      ];
      
      const randomScenario = conversationalScenarios[Math.floor(Math.random() * conversationalScenarios.length)];
      setInputText(randomScenario);
      
      // Auto-process the conversational input
      setTimeout(() => {
        processUserInput(randomScenario);
      }, 500);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const speakMessage = (text: string) => {
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setCapturedImage(photo.uri);
      setShowCamera(false);
      await MediaLibrary.saveToLibraryAsync(photo.uri);

      // Add image message
      addMessage({
        type: 'user',
        content: '📸 Injury photo captured',
        messageType: 'injury-analysis',
        data: { imageUri: photo.uri }
      });

      // Analyze the image
      await analyzeInjuryImage(photo.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const analyzeInjuryImage = async (imageUri: string) => {
    // Check if user is authenticated
    if (!user || !session) {
      addMessage({
        type: 'ai',
        content: '🔐 Please sign in to use emergency AI features. You can sign in from the Profile tab.',
        messageType: 'text'
      });
      return;
    }

    setIsTyping(true);
    
    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      // Get current location for context
      let location = '';
      try {
        const currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          location = `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`;
        }
      } catch (error) {
        console.log('Could not get location');
      }

      // Analyze the injury image
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type: 'vision_analysis',
          data: {
            image: base64,
            location: location,
            prompt: 'Analyze this injury image and provide emergency medical guidance. Assess severity and provide immediate first aid steps.'
          },
        },
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      // Add AI response
      addMessage({
        type: 'ai',
        content: data.response || 'I can see the injury in the image. Please tell me more about how this happened and any symptoms you\'re experiencing.',
        messageType: 'injury-analysis',
        data: data
      });

      // Speak response if it's critical
      if (data.severity === 'critical' || data.requiresImmediateAction) {
        speakMessage(data.response);
      }

    } catch (error) {
      console.error('Error analyzing image:', error);
      addMessage({
        type: 'ai',
        content: '❌ Sorry, I encountered an error analyzing the image. Please try again or describe the injury in detail.\n\n**For immediate emergencies, call 911.**',
        messageType: 'text'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const processUserInput = async (input: string) => {
    if (!input.trim()) return;

    // Check if user is authenticated
    if (!user || !session) {
      addMessage({
        type: 'ai',
        content: '🔐 Please sign in to use emergency AI features. You can sign in from the Profile tab.',
        messageType: 'text'
      });
      return;
    }

    // Add user message
    addMessage({
      type: 'user',
      content: input,
      messageType: 'text'
    });

    setInputText('');
    setIsTyping(true);

    try {
      // Get current location for context
      let location = '';
      try {
        const currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          location = `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`;
        }
      } catch (error) {
        console.log('Could not get location');
      }

      // Direct conversation with OpenAI
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type: 'emergency_conversation',
          data: {
            userMessage: input,
            location: location,
            conversationHistory: messages.slice(-10).map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
          },
        },
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      // Add AI response
      addMessage({
        type: 'ai',
        content: data.response || 'I understand your situation. Please tell me more about what happened.',
        messageType: 'text',
        data: data
      });

      // Speak response if it's critical
      if (data.severity === 'critical' || data.requiresImmediateAction) {
        speakMessage(data.response);
      }

    } catch (error) {
      console.error('Error processing input:', error);
      addMessage({
        type: 'ai',
        content: '❌ Sorry, I encountered an error. Please try again or check your internet connection.\n\n**For immediate emergencies, call 911.**',
        messageType: 'text'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (inputText.trim() && !isTyping) {
      processUserInput(inputText);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderColor: colors.border,
          }
        ]}>
          {message.messageType === 'injury-analysis' && message.data?.imageUri && (
            <Image 
              source={{ uri: message.data.imageUri }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          
          <Text style={[
            styles.messageText,
            { color: isUser ? 'white' : colors.text }
          ]}>
            {message.content}
          </Text>
          
          {message.type === 'ai' && message.data && (
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => speakMessage(message.content)}
                disabled={isSpeaking}
              >
                <Ionicons 
                  name={isSpeaking ? "volume-high" : "volume-medium"} 
                  size={16} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Text style={[styles.timestamp, { color: colors.tabIconDefault }]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={20} color="white" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AI Safety Assistant
          </Text>
        </View>
        <View style={styles.headerStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: user && session ? colors.success : colors.warning }
          ]} />
          <Text style={[styles.statusText, { color: colors.tabIconDefault }]}>
            {user && session ? 'Ready' : 'Sign In Required'}
          </Text>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        
        {isTyping && (
          <View key="typing-indicator" style={[styles.messageContainer, styles.aiMessage]}>
            <View style={[styles.messageBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.typingText, { color: colors.tabIconDefault }]}>
                  AI is analyzing...
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Camera View */}
      {showCamera && (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type="back"
            ratio="4:3"
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </Camera>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.voiceButton, { backgroundColor: colors.primary }]}
            onPress={isListening ? stopListening : startListening}
            disabled={isTyping}
          >
            <Ionicons
              name={isListening ? "mic" : "mic-outline"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cameraButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowCamera(true)}
            disabled={isTyping}
          >
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            }]}
            placeholder="Tell me what's happening..."
            placeholderTextColor={colors.tabIconDefault}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isTyping}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: inputText.trim() && !isTyping ? colors.primary : colors.tabIconDefault,
                opacity: inputText.trim() && !isTyping ? 1 : 0.5,
              }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 20,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
    marginHorizontal: 16,
    fontWeight: '400',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  cameraControls: {
    alignItems: 'flex-end',
  },
  cameraButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E0E0E0',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF4444',
  },
  inputContainer: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    fontWeight: '400',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
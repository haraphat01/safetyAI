import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { EmergencyContact } from '@/lib/supabase';
import { emergencyService } from '@/services/EmergencyService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedContacts = await emergencyService.getEmergencyContacts(user.id);
      setContacts(fetchedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      relationship: contact.relationship,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }

    try {
      if (editingContact) {
        await emergencyService.updateEmergencyContact(editingContact.id, formData);
      } else {
        await emergencyService.addEmergencyContact(user.id, formData);
      }
      
      setModalVisible(false);
      loadContacts();
      Alert.alert('Success', editingContact ? 'Contact updated successfully' : 'Contact added successfully');
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyService.deleteEmergencyContact(contact.id);
              loadContacts();
              Alert.alert('Success', 'Contact deleted successfully');
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.contactRelationship, { color: colors.tabIconDefault }]}>
            {item.relationship}
          </Text>
        </View>
        <Text style={[styles.contactPhone, { color: colors.text }]}>{item.phone}</Text>
        {item.email && (
          <Text style={[styles.contactEmail, { color: colors.tabIconDefault }]}>{item.email}</Text>
        )}
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Emergency Contacts</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
              Loading contacts...
            </Text>
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Emergency Contacts</Text>
            <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
              Add emergency contacts to receive help when you need it most
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.tint }]}
              onPress={openAddModal}
            >
              <Text style={[styles.emptyButtonText, { color: colors.buttonText }]}>Add Your First Contact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>

      {/* Add/Edit Contact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.tabIconDefault} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.tabIconDefault} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Full Name"
                  placeholderTextColor={colors.tabIconDefault}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Ionicons name="call-outline" size={20} color={colors.tabIconDefault} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Phone Number"
                  placeholderTextColor={colors.tabIconDefault}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.tabIconDefault} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email (Optional)"
                  placeholderTextColor={colors.tabIconDefault}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Ionicons name="heart-outline" size={20} color={colors.tabIconDefault} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Relationship"
                  placeholderTextColor={colors.tabIconDefault}
                  value={formData.relationship}
                  onChangeText={(text) => setFormData({ ...formData, relationship: text })}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleSave}
              >
                <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contactCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  contactRelationship: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  contactPhone: {
    fontSize: 14,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
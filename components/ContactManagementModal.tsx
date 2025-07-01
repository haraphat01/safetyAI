import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CustomContact, fakeCallService } from '@/services/FakeCallService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContactManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ContactFormData {
  name: string;
  number: string;
}

export default function ContactManagementModal({ visible, onClose }: ContactManagementModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [contacts, setContacts] = useState<CustomContact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({ name: '', number: '' });
  const [deletedDefaults, setDeletedDefaults] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    const allContacts = await fakeCallService.getAllContacts();
    const deletedNames = await fakeCallService.getDeletedDefaultNames();
    setContacts(allContacts);
    setDeletedDefaults(deletedNames);
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setFormData({ name: '', number: '' });
    setShowAddForm(true);
  };

  const handleEditContact = (contact: CustomContact) => {
    if (contact.isDefault) {
      Alert.alert('Cannot Edit', 'Default contacts cannot be edited. You can add custom contacts instead.');
      return;
    }
    setEditingContact(contact);
    setFormData({ name: contact.name, number: contact.number });
    setShowAddForm(true);
  };

  const handleDeleteContact = async (contact: CustomContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete "${contact.name}"?${contact.isDefault ? '\n\nThis will hide the default contact from your list.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const success = await fakeCallService.deleteContact(contact.id);
              if (success) {
                await loadContacts();
                Alert.alert('Success', 'Contact deleted successfully.');
              } else {
                Alert.alert('Error', 'Failed to delete contact. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveContact = async () => {
    if (!formData.name.trim() || !formData.number.trim()) {
      Alert.alert('Error', 'Please enter both name and number.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (editingContact) {
        // Update existing contact
        const success = await fakeCallService.updateCustomContact(
          editingContact.id,
          formData.name,
          formData.number
        );
        if (success) {
          Alert.alert('Success', 'Contact updated successfully.');
        } else {
          Alert.alert('Error', 'Failed to update contact. Please try again.');
          return;
        }
      } else {
        // Add new contact
        await fakeCallService.addCustomContact(formData.name, formData.number);
        Alert.alert('Success', 'Contact added successfully.');
      }
      
      setShowAddForm(false);
      setEditingContact(null);
      setFormData({ name: '', number: '' });
      await loadContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingContact(null);
    setFormData({ name: '', number: '' });
  };

  const handleRestoreDefaults = async () => {
    if (deletedDefaults.length === 0) {
      Alert.alert('No Deleted Contacts', 'No default contacts have been deleted to restore.');
      return;
    }

    Alert.alert(
      'Restore Default Contacts',
      `This will restore all ${deletedDefaults.length} deleted default contacts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await fakeCallService.restoreDefaultContacts();
              await loadContacts();
              Alert.alert('Success', 'Default contacts restored successfully.');
            } catch (error) {
              console.error('Error restoring defaults:', error);
              Alert.alert('Error', 'Failed to restore default contacts. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderContact = ({ item }: { item: CustomContact }) => (
    <View style={[styles.contactItem, { backgroundColor: colors.card }]}>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.contactNumber, { color: colors.tabIconDefault }]}>
          {item.number}
        </Text>
        {item.isDefault && (
          <View style={[styles.defaultBadge, { backgroundColor: colors.tint }]}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>
      
      <View style={styles.contactActions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={() => handleEditContact(item)}
          >
            <Ionicons name="pencil" size={16} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.notification }]}
          onPress={() => handleDeleteContact(item)}
        >
          <Ionicons name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddForm = () => (
    <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.formTitle, { color: colors.text }]}>
        {editingContact ? 'Edit Contact' : 'Add New Contact'}
      </Text>
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.background,
          color: colors.text,
          borderColor: colors.border,
        }]}
        placeholder="Contact Name"
        placeholderTextColor={colors.tabIconDefault}
        value={formData.name}
        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        autoFocus
      />
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.background,
          color: colors.text,
          borderColor: colors.border,
        }]}
        placeholder="Phone Number"
        placeholderTextColor={colors.tabIconDefault}
        value={formData.number}
        onChangeText={(text) => setFormData(prev => ({ ...prev, number: text }))}
        keyboardType="phone-pad"
      />
      
      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.formButton, { backgroundColor: colors.tabIconDefault }]}
          onPress={handleCancelForm}
        >
          <Text style={styles.formButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formButton, { backgroundColor: colors.tint }]}
          onPress={handleSaveContact}
        >
          <Text style={styles.formButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Manage Contacts</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint }]}
              onPress={handleAddContact}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Custom Contact</Text>
            </TouchableOpacity>

            {deletedDefaults.length > 0 && (
              <TouchableOpacity
                style={[styles.restoreButton, { backgroundColor: colors.tabIconDefault }]}
                onPress={handleRestoreDefaults}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.restoreButtonText}>Restore Defaults ({deletedDefaults.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Add/Edit Form */}
          {showAddForm && renderAddForm()}

          {/* Contacts List */}
          <View style={styles.contactsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Available Contacts ({contacts.length})
            </Text>
            
            <FlatList
              data={contacts}
              renderItem={renderContact}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contactsList}
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>
              How to Use Custom Contacts
            </Text>
            <Text style={[styles.instructionsText, { color: colors.tabIconDefault }]}>
              • Add your own contacts with custom names and numbers{'\n'}
              • Delete any contact (default or custom) to hide it{'\n'}
              • Restore deleted default contacts anytime{'\n'}
              • Custom contacts will appear in the fake call options{'\n'}
              • Use realistic names and numbers for better believability
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  actionButtons: {
    marginVertical: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  restoreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  formButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contactsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  contactsList: {
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  instructionsSection: {
    marginTop: 20,
    paddingBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 
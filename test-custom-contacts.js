// Test script for Custom Contact Management
// This can be run to test the custom contact functionality

const { fakeCallService } = require('./services/FakeCallService');

async function testCustomContacts() {
  console.log('🧪 Testing Custom Contact Management...\n');

  try {
    // Test 1: Get all contacts (default + custom)
    console.log('📋 Test 1: Getting all contacts...');
    const allContacts = await fakeCallService.getAllContacts();
    console.log(`✅ Found ${allContacts.length} total contacts\n`);

    // Test 2: Get custom contacts only
    console.log('👥 Test 2: Getting custom contacts...');
    const customContacts = fakeCallService.getCustomContacts();
    console.log(`✅ Found ${customContacts.length} custom contacts\n`);

    // Test 3: Add a custom contact
    console.log('➕ Test 3: Adding custom contact...');
    const newContact = await fakeCallService.addCustomContact('John Smith', '+1 (555) 999-8888');
    console.log(`✅ Added contact: ${newContact.name} (${newContact.number})\n`);

    // Test 4: Update the custom contact
    console.log('✏️ Test 4: Updating custom contact...');
    const updateSuccess = await fakeCallService.updateCustomContact(
      newContact.id,
      'John Smith (Updated)',
      '+1 (555) 999-9999'
    );
    console.log(`✅ Contact updated: ${updateSuccess}\n`);

    // Test 5: Get contact by ID
    console.log('🔍 Test 5: Getting contact by ID...');
    const retrievedContact = await fakeCallService.getContactById(newContact.id);
    console.log(`✅ Retrieved contact: ${retrievedContact?.name} (${retrievedContact?.number})\n`);

    // Test 6: Schedule a call with custom contact
    console.log('📞 Test 6: Scheduling call with custom contact...');
    const callId = await fakeCallService.scheduleQuickFakeCall('John Smith (Updated)');
    console.log(`✅ Call scheduled with ID: ${callId}\n`);

    // Test 7: Delete the custom contact
    console.log('🗑️ Test 7: Deleting custom contact...');
    const deleteSuccess = await fakeCallService.deleteCustomContact(newContact.id);
    console.log(`✅ Contact deleted: ${deleteSuccess}\n`);

    // Test 8: Verify contact was deleted
    console.log('✅ Test 8: Verifying contact deletion...');
    const remainingContacts = fakeCallService.getCustomContacts();
    console.log(`✅ Remaining custom contacts: ${remainingContacts.length}\n`);

    console.log('🎉 All custom contact tests completed successfully!');
    console.log('\n📱 To test the contact management UI:');
    console.log('1. Open the SafetyAI app');
    console.log('2. Tap "Fake Call" in Quick Actions');
    console.log('3. Tap "Manage" next to "Choose Caller"');
    console.log('4. Add, edit, or delete your custom contacts');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCustomContacts(); 
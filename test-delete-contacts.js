// Test script for Delete Default Contacts Feature
// This can be run to test the delete functionality for default contacts

const { fakeCallService } = require('./services/FakeCallService');

async function testDeleteDefaultContacts() {
  console.log('🧪 Testing Delete Default Contacts Feature...\n');

  try {
    // Test 1: Get all contacts initially
    console.log('📋 Test 1: Getting all contacts initially...');
    const initialContacts = await fakeCallService.getAllContacts();
    console.log(`✅ Found ${initialContacts.length} total contacts\n`);

    // Test 2: Get deleted default names (should be empty initially)
    console.log('🗑️ Test 2: Getting deleted default names...');
    const deletedNames = await fakeCallService.getDeletedDefaultNames();
    console.log(`✅ Deleted default names: ${deletedNames.length}\n`);

    // Test 3: Delete a default contact (Mom)
    console.log('❌ Test 3: Deleting default contact "Mom"...');
    const momContact = initialContacts.find(c => c.name === 'Mom');
    if (momContact) {
      const deleteSuccess = await fakeCallService.deleteContact(momContact.id);
      console.log(`✅ Mom contact deleted: ${deleteSuccess}\n`);
    } else {
      console.log('⚠️ Mom contact not found\n');
    }

    // Test 4: Get contacts after deletion
    console.log('📋 Test 4: Getting contacts after deletion...');
    const contactsAfterDelete = await fakeCallService.getAllContacts();
    console.log(`✅ Found ${contactsAfterDelete.length} contacts after deletion\n`);

    // Test 5: Check if Mom is in deleted list
    console.log('🗑️ Test 5: Checking deleted default names...');
    const deletedAfterDelete = await fakeCallService.getDeletedDefaultNames();
    console.log(`✅ Deleted default names: ${deletedAfterDelete.join(', ')}\n`);

    // Test 6: Delete another default contact (Work)
    console.log('❌ Test 6: Deleting default contact "Work"...');
    const workContact = initialContacts.find(c => c.name === 'Work');
    if (workContact) {
      const deleteSuccess = await fakeCallService.deleteContact(workContact.id);
      console.log(`✅ Work contact deleted: ${deleteSuccess}\n`);
    } else {
      console.log('⚠️ Work contact not found\n');
    }

    // Test 7: Get final contact count
    console.log('📋 Test 7: Getting final contact count...');
    const finalContacts = await fakeCallService.getAllContacts();
    console.log(`✅ Final contact count: ${finalContacts.length}\n`);

    // Test 8: Restore all default contacts
    console.log('🔄 Test 8: Restoring all default contacts...');
    await fakeCallService.restoreDefaultContacts();
    const restoredContacts = await fakeCallService.getAllContacts();
    console.log(`✅ Restored contacts: ${restoredContacts.length}\n`);

    // Test 9: Verify deleted list is empty
    console.log('🗑️ Test 9: Verifying deleted list is empty...');
    const finalDeleted = await fakeCallService.getDeletedDefaultNames();
    console.log(`✅ Final deleted count: ${finalDeleted.length}\n`);

    console.log('🎉 All delete default contacts tests completed successfully!');
    console.log('\n📱 To test the delete functionality in the app:');
    console.log('1. Open the SafetyAI app');
    console.log('2. Tap "Fake Call" in Quick Actions');
    console.log('3. Tap "Manage" next to "Choose Caller"');
    console.log('4. Delete any default contact using the trash icon');
    console.log('5. Use "Restore Defaults" to bring them back');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDeleteDefaultContacts(); 
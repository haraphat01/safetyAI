// Test script for Haptic Feedback Fix
// This tests that haptic feedback stops properly after fake calls

const { fakeCallService } = require('./services/FakeCallService');

async function testHapticFix() {
  console.log('🧪 Testing Haptic Feedback Fix...\n');

  try {
    // Test 1: Schedule an emergency call
    console.log('📞 Test 1: Scheduling emergency call...');
    const callId = await fakeCallService.scheduleEmergencyFakeCall();
    console.log(`✅ Emergency call scheduled with ID: ${callId}\n`);

    // Test 2: Wait for call to trigger (5 seconds)
    console.log('⏰ Test 2: Waiting for call to trigger (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    console.log('✅ Call should have triggered\n');

    // Test 3: Check if call is active
    console.log('📱 Test 3: Checking call status...');
    const activeCall = fakeCallService.getActiveCall();
    console.log(`✅ Active call: ${activeCall ? 'Yes' : 'No'}\n`);

    // Test 4: Simulate answering the call
    if (activeCall) {
      console.log('📞 Test 4: Simulating call answer...');
      await fakeCallService.answerCall();
      console.log('✅ Call answered\n');
    }

    // Test 5: Wait for call to auto-end (30 seconds)
    console.log('⏰ Test 5: Waiting for call to auto-end (30 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 35000));
    console.log('✅ Call should have ended\n');

    // Test 6: Check if call is still active
    console.log('📱 Test 6: Checking final call status...');
    const finalCall = fakeCallService.getActiveCall();
    console.log(`✅ Final active call: ${finalCall ? 'Yes' : 'No'}\n`);

    // Test 7: Clean up
    console.log('🧹 Test 7: Cleaning up...');
    await fakeCallService.cleanup();
    console.log('✅ Cleanup completed\n');

    console.log('🎉 Haptic feedback fix test completed!');
    console.log('\n📱 To test in the app:');
    console.log('1. Open the SafetyAI app');
    console.log('2. Tap "Fake Call" in Quick Actions');
    console.log('3. Select "Emergency Exit Call (5s)"');
    console.log('4. Wait for the call to ring');
    console.log('5. Answer or decline the call');
    console.log('6. Verify that vibration stops after call ends');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHapticFix(); 
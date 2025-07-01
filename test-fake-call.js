// Test script for Fake Call Feature
// This can be run to test the fake call functionality

const { fakeCallService } = require('./services/FakeCallService');

async function testFakeCall() {
  console.log('🧪 Testing Fake Call Feature...\n');

  try {
    // Test 1: Schedule a quick fake call
    console.log('📞 Test 1: Scheduling quick fake call...');
    const callId1 = await fakeCallService.scheduleQuickFakeCall('Mom');
    console.log(`✅ Quick call scheduled with ID: ${callId1}\n`);

    // Test 2: Schedule an emergency call
    console.log('🚨 Test 2: Scheduling emergency fake call...');
    const callId2 = await fakeCallService.scheduleEmergencyFakeCall();
    console.log(`✅ Emergency call scheduled with ID: ${callId2}\n`);

    // Test 3: Get scheduled calls
    console.log('📋 Test 3: Getting scheduled calls...');
    const scheduledCalls = fakeCallService.getScheduledCalls();
    console.log(`✅ Found ${scheduledCalls.length} scheduled calls\n`);

    // Test 4: Get default callers
    console.log('👥 Test 4: Getting default callers...');
    const defaultCallers = fakeCallService.getDefaultCallers();
    console.log(`✅ Found ${defaultCallers.length} default callers:`);
    defaultCallers.forEach(caller => {
      console.log(`   - ${caller.name}: ${caller.number}`);
    });
    console.log('');

    // Test 5: Cancel a call
    console.log('❌ Test 5: Cancelling a call...');
    const cancelled = fakeCallService.cancelFakeCall(callId1);
    console.log(`✅ Call cancelled: ${cancelled}\n`);

    // Test 6: Check active call status
    console.log('🔍 Test 6: Checking active call status...');
    const isActive = fakeCallService.isCallActive();
    const activeCall = fakeCallService.getActiveCall();
    console.log(`✅ Call active: ${isActive}`);
    console.log(`✅ Active call: ${activeCall ? 'Yes' : 'No'}\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('\n📱 To test the full-screen interface:');
    console.log('1. Open the SafetyAI app');
    console.log('2. Tap "Fake Call" in Quick Actions');
    console.log('3. Select "Emergency Exit Call (5s)"');
    console.log('4. Wait 5 seconds for the full-screen call interface');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFakeCall(); 
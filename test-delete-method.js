// Simple test to verify deleteSession method exists
console.log('🧪 Testing deleteSession method availability...\n');

// Check if the method exists in the service
const { followMeService } = require('./services/FollowMeService.ts');

console.log('FollowMeService methods:');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(followMeService)));

console.log('\nChecking specific methods:');
console.log('deleteSession exists:', typeof followMeService.deleteSession === 'function');
console.log('endSession exists:', typeof followMeService.endSession === 'function');
console.log('createSession exists:', typeof followMeService.createSession === 'function');

if (typeof followMeService.deleteSession === 'function') {
  console.log('✅ deleteSession method is properly exported!');
} else {
  console.log('❌ deleteSession method is missing!');
} 
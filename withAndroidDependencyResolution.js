// withAndroidDependencyResolution.js
const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidDependencyResolution(config) {
  return withProjectBuildGradle(config, (config) => {
    // Only add if not already present
    if (!config.modResults.contents.includes('resolutionStrategy')) {
      const resolutionBlock = `
        configurations.all {
            resolutionStrategy {
                force 'androidx.core:core:1.13.1'
                force 'androidx.versionedparcelable:versionedparcelable:1.1.1'
                force 'androidx.lifecycle:lifecycle-common:2.6.2'
                force 'androidx.lifecycle:lifecycle-runtime:2.6.2'
            }
            exclude group: 'com.android.support', module: 'support-compat'
            exclude group: 'com.android.support', module: 'support-v4'
            exclude group: 'com.android.support', module: 'animated-vector-drawable'
            exclude group: 'com.android.support', module: 'support-vector-drawable'
            exclude group: 'com.android.support', module: 'versionedparcelable'
            exclude group: 'com.android.support'
        }
`;
      // Insert before the last closing brace
      const idx = config.modResults.contents.lastIndexOf('}');
      if (idx !== -1) {
        config.modResults.contents =
          config.modResults.contents.slice(0, idx) +
          resolutionBlock +
          config.modResults.contents.slice(idx);
      }
    }
    return config;
  });
}; 
// withAndroidAppComponentFactory.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidAppComponentFactory(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // Ensure the tools namespace is present
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    // Ensure the application tag exists
    if (!Array.isArray(manifest.application)) {
      manifest.application = [manifest.application];
    }
    if (!manifest.application[0].$) {
      manifest.application[0].$ = {};
    }

    // Add the tools:replace attribute
    manifest.application[0].$['tools:replace'] = 'android:appComponentFactory';
    // Explicitly set the appComponentFactory to use AndroidX
    manifest.application[0].$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';

    return config;
  });
}; 
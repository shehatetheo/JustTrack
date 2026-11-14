const { withEntitlementsPlist, withFinalizedMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * JustTrack only schedules reminders on the device; it never registers for
 * push. Expo applies the expo-notifications plugin automatically, and that
 * plugin always adds the `aps-environment` (Push Notifications) entitlement,
 * which the app's provisioning profile doesn't carry. This removes it again:
 * once in the entitlements mod, and once more on the written file in case
 * the other plugin ran afterwards.
 */
module.exports = function withoutPushEntitlement(config) {
  config = withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });

  return withFinalizedMod(config, [
    'ios',
    (mod) => {
      const iosRoot = mod.modRequest.platformProjectRoot;
      for (const folder of fs.readdirSync(iosRoot, { withFileTypes: true })) {
        if (!folder.isDirectory()) continue;
        for (const file of fs.readdirSync(path.join(iosRoot, folder.name))) {
          if (!file.endsWith('.entitlements')) continue;
          const target = path.join(iosRoot, folder.name, file);
          const before = fs.readFileSync(target, 'utf8');
          const after = before.replace(/\s*<key>aps-environment<\/key>\s*<string>[^<]*<\/string>/g, '');
          if (after !== before) fs.writeFileSync(target, after);
        }
      }
      return mod;
    },
  ]);
};

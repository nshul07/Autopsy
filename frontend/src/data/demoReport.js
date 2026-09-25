// Mock data used only by "Try demo scan" and when the backend is unreachable.
// Shape mirrors the report object returned by POST /api/v1/apk/analyze.

export const demoReports = {
  red: {
    isDemo: true,
    appName: 'Super Flashlight (DEMO)',
    packageName: 'com.fake.superflash.demo',
    version: '1.0 (build 4)',
    sha256: '3f0a1c9e7b2d4e6f18a9c2b5d0e7f4a1b8c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5',
    category: 'Flashlight',
    categoryConfidence: 'Medium',
    score: 88,
    band: 'high',
    verdictSummary: 'This app asks for access that is unusual for a flashlight.',
    reasons: [
      {
        key: 'sms',
        label: 'SMS access',
        status: 'unexpected',
        body: "A flashlight normally doesn't need access to your SMS messages.",
      },
      {
        key: 'contacts',
        label: 'Contacts',
        status: 'unexpected',
        body: "This app requests access to your contacts even though that isn't required for its advertised purpose.",
      },
      {
        key: 'location',
        label: 'Location',
        status: 'unexpected',
        body: 'Location access is unusual for a flashlight app.',
      },
      {
        key: 'accessibility',
        label: 'Accessibility',
        status: 'unexpected',
        body: 'Accessibility access can give an app extensive control over what happens on your device.',
      },
    ],
    permissions: [
      { permission: 'SMS', status: 'unexpected', why: 'Not normally required' },
      { permission: 'Contacts', status: 'unexpected', why: 'Not required' },
      { permission: 'Location', status: 'unexpected', why: 'Not required for this category' },
      { permission: 'Accessibility service', status: 'unexpected', why: 'Grants broad control over the device' },
      { permission: 'Camera', status: 'expected', why: 'Could be used for flashlight/camera functionality' },
    ],
    signals: [
      { label: 'Manifest inspected', ok: true },
      { label: 'Permission groups analyzed', ok: true },
      { label: 'Suspicious permission combination', ok: false },
      { label: 'Signer mismatch', ok: false },
    ],
    identity: {
      flagged: true,
      packageName: 'com.fake.superflash.demo',
      signingCert: 'A1:3B:9C… (self-signed, generated 2024-11)',
      expectedCert: 'Not on file — no known-good version to compare against',
      result: 'Possible signer mismatch',
    },
    playbook: [
      "Don't install the APK",
      'Delete the downloaded file',
      "If you already installed it, remove it from Settings → Apps",
      'Contact your bank immediately if you entered financial information',
      'Report suspected cybercrime at cybercrime.gov.in or call 1930',
    ],
    calibration: [
      "The app's category was estimated from its name and icon, not confirmed.",
      'Some permissions may have legitimate uses we cannot determine from the manifest alone.',
      'Optional reputation checks may not have been available.',
    ],
  },

  yellow: {
    isDemo: true,
    appName: 'Bright Torch',
    packageName: 'com.brighttorch.app',
    version: '2.3.1',
    sha256: '7c2e9a4f1d6b3e8c5a0f7d2b9e4c1a6f3d8b5e0c7a2f9d4b1e6c3a0f7d2b9e4c',
    category: 'Flashlight',
    categoryConfidence: 'High',
    score: 48,
    band: 'medium',
    verdictSummary: 'Some requested access is unusual for this app. Review the permissions before continuing.',
    reasons: [
      {
        key: 'camera',
        label: 'Camera',
        status: 'expected',
        body: 'Used to control the flash — expected for this category.',
      },
      {
        key: 'location',
        label: 'Location',
        status: 'unexpected',
        body: 'Location access is unusual for a flashlight app, though some apps use it for weather widgets.',
      },
      {
        key: 'overlay',
        label: 'Draw over other apps',
        status: 'unexpected',
        body: 'This permission can be used to show ads, or in rare cases to overlay fake screens.',
      },
    ],
    permissions: [
      { permission: 'Camera', status: 'expected', why: 'Needed to control the flash' },
      { permission: 'Location', status: 'unexpected', why: 'Not required for this category' },
      { permission: 'Draw over other apps', status: 'unexpected', why: 'Often used for ads; can be misused' },
      { permission: 'Storage', status: 'expected', why: 'Used to save settings' },
    ],
    signals: [
      { label: 'Manifest inspected', ok: true },
      { label: 'Permission groups analyzed', ok: true },
      { label: 'Suspicious permission combination', ok: true },
      { label: 'Signer mismatch', ok: true },
    ],
    identity: {
      flagged: false,
      packageName: 'com.brighttorch.app',
      signingCert: 'D4:8E:12… (release, 2023-02)',
      expectedCert: 'D4:8E:12… (matches known version)',
      result: 'No mismatch detected',
    },
    playbook: [
      'Review the location and overlay permissions before installing',
      'Only grant permissions the app actually asks to use',
      'Keep an eye on unexpected pop-ups or ads after installing',
    ],
    calibration: [
      "The app's category was estimated with high confidence.",
      'Location and overlay access sometimes have legitimate uses (widgets, ad display) we cannot fully confirm from the manifest.',
    ],
  },

  green: {
    isDemo: true,
    appName: 'Maps Demo',
    packageName: 'com.example.mapsdemo',
    version: '4.1.0',
    sha256: '9b3f6c0a2e7d4b1f8c5a0e3d7b2f9c4a1e6d3b0f7c2a9e4d1b6f3c0a7e2d9b4f',
    category: 'Navigation',
    categoryConfidence: 'High',
    score: 12,
    band: 'low',
    verdictSummary: 'Most of the sensitive access requested by this app matches its detected purpose.',
    reasons: [
      {
        key: 'location',
        label: 'Location',
        status: 'expected',
        body: 'Required for turn-by-turn navigation — expected for this category.',
      },
    ],
    permissions: [
      { permission: 'Location (fine)', status: 'expected', why: 'Required for navigation' },
      { permission: 'Storage', status: 'expected', why: 'Used to cache offline maps' },
      { permission: 'SMS', status: 'not_checked', why: 'Not requested by this app' },
    ],
    signals: [
      { label: 'Manifest inspected', ok: true },
      { label: 'Permission groups analyzed', ok: true },
      { label: 'Suspicious permission combination', ok: true },
      { label: 'Signer mismatch', ok: true },
    ],
    identity: {
      flagged: false,
      packageName: 'com.example.mapsdemo',
      signingCert: '2F:AA:71… (release, 2022-09)',
      expectedCert: '2F:AA:71… (matches known version)',
      result: 'No mismatch detected',
    },
    playbook: [],
    calibration: [
      "The app's category was estimated with high confidence.",
      'A low score means no major red flags in the checks we ran — not a guarantee of safety.',
    ],
  },
}

export const demoLinkReport = {
  isDemo: true,
  url: 'https://sbi-rewards-claim.info/apk/download.php?id=48213',
  finalDestination: 'https://sbi-rewards-claim.info/apk/download.php?id=48213',
  redirectCount: 2,
  https: true,
  directApk: true,
  lookalikeDomain: true,
  reputation: 'not_checked',
  score: 81,
  band: 'high',
  verdictSummary: 'This link uses a name that looks like a bank, but is not an official banking domain.',
  reasons: [
    {
      key: 'lookalike',
      label: 'Look-alike domain',
      status: 'unexpected',
      body: "This link uses a name that looks like a bank, but it is not the bank's official website.",
    },
    {
      key: 'directApk',
      label: 'Direct APK download',
      status: 'unexpected',
      body: 'This link downloads an installable app file directly, bypassing the Play Store.',
    },
  ],
}

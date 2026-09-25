import type { Lang } from '../types'

export const translations = {
  en: {
    appName: 'AppAutopsy',
    tagline: 'An offline Android phishing guard.',
    noCloud: 'No cloud',
    noAccounts: 'No accounts',
    noTelemetry: 'No telemetry',
    getStarted: 'Get Started',

    // Dashboard
    totalChecked: 'Total checked',
    flaggedRed: 'Flagged red',
    warnedYellow: 'Warned yellow',
    lookedClean: 'Looked clean',
    recentActivity: 'Recent activity',

    // Nav
    home: 'Home',
    scan: 'Scan',
    history: 'History',

    // Scan Hub
    scanTitle: 'Scan a link, message or APK',
    scanSub: 'AppAutopsy analyzes it on your device and gives a verdict with reasons.',
    scanLink: 'Scan Link',
    scanLinkSub: 'Check a URL for risky patterns',
    scanMessage: 'Scan Message',
    scanMessageSub: 'Analyze a message for suspicious content',
    scanApk: 'Scan APK',
    scanApkSub: 'Analyze an APK file (no installation)',

    // Results
    scanResult: 'Scan Result',
    riskScore: 'Risk score',
    red: 'RED',
    yellow: 'YELLOW',
    green: 'GREEN',
    highRisk: 'High risk',
    mediumRisk: 'Medium risk',
    lowRisk: 'No suspicious patterns detected',
    scannedLink: 'Scanned link',
    scannedMessage: 'Scanned message',
    scannedFile: 'Scanned file',
    whyFlagged: 'Why this was flagged',
    noRiskyFound: 'No risky patterns found in this link.',
    disclaimerWarning: 'This tool flags risky patterns; it cannot guarantee any link or app is safe.',
    disclaimerClean: 'A green result means nothing suspicious detected, not a guarantee that the link is safe.',

    // Modal
    selectLanguage: 'Select language',
    enterUrlPlaceholder: 'Enter link (e.g. microsoft-secure-login.xyz)...',
    enterMsgPlaceholder: 'Paste suspicious SMS or WhatsApp message...',
    selectApkHint: 'Tap to pick .apk file for static inspection',
    runAnalysis: 'Run On-Device Analysis',
    back: 'Back',
  },
  hi: {
    appName: 'AppAutopsy',
    tagline: 'एक ऑफ़लाइन एंड्रॉइड फ़िशिंग गार्ड।',
    noCloud: 'कोई क्लाउड नहीं',
    noAccounts: 'कोई खाता नहीं',
    noTelemetry: 'कोई टेलीमेट्री नहीं',
    getStarted: 'शुरू करें',

    // Dashboard
    totalChecked: 'कुल जांचे गए',
    flaggedRed: 'खतरनाक लाल',
    warnedYellow: 'चेतावनी पीला',
    lookedClean: 'सुरक्षित हरा',
    recentActivity: 'हाल की गतिविधि',

    // Nav
    home: 'होम',
    scan: 'स्कैन',
    history: 'इतिहास',

    // Scan Hub
    scanTitle: 'लिंक, संदेश या APK स्कैन करें',
    scanSub: 'AppAutopsy आपके डिवाइस पर इसका विश्लेषण करता है और कारणों के साथ निर्णय देता है।',
    scanLink: 'लिंक स्कैन करें',
    scanLinkSub: 'जोखिम भरे पैटर्न के लिए URL जांचें',
    scanMessage: 'संदेश स्कैन करें',
    scanMessageSub: 'संदिग्ध सामग्री के लिए संदेश का विश्लेषण करें',
    scanApk: 'APK स्कैन करें',
    scanApkSub: 'APK फ़ाइल का विश्लेषण करें (कोई इंस्टॉलेशन नहीं)',

    // Results
    scanResult: 'स्कैन परिणाम',
    riskScore: 'जोखिम स्कोर',
    red: 'RED (लाल)',
    yellow: 'YELLOW (पीला)',
    green: 'GREEN (हरा)',
    highRisk: 'उच्च जोखिम',
    mediumRisk: 'मध्यम जोखिम',
    lowRisk: 'कोई संदिग्ध पैटर्न नहीं मिला',
    scannedLink: 'स्कैन किया गया लिंक',
    scannedMessage: 'स्कैन किया गया संदेश',
    scannedFile: 'स्कैन की गई फ़ाइल',
    whyFlagged: 'इसे क्यों चिह्नित किया गया',
    noRiskyFound: 'इस लिंक में कोई जोखिम भरा पैटर्न नहीं मिला।',
    disclaimerWarning: 'यह उपकरण केवल जोखिम भरे पैटर्न की पहचान करता है; यह किसी भी लिंक या ऐप के सुरक्षित होने की गारंटी नहीं देता।',
    disclaimerClean: 'हरे परिणाम का अर्थ है कोई संदिग्ध बात नहीं मिली, यह गारंटी नहीं है कि लिंक सुरक्षित है।',

    // Modal
    selectLanguage: 'भाषा चुनें',
    enterUrlPlaceholder: 'लिंक दर्ज करें...',
    enterMsgPlaceholder: 'संदिग्ध एसएमएस या संदेश पेस्ट करें...',
    selectApkHint: 'निरीक्षण के लिए .apk फ़ाइल चुनें',
    runAnalysis: 'डिवाइस पर विश्लेषण करें',
    back: 'वापस',
  },
  pa: {
    appName: 'AppAutopsy',
    tagline: 'ਇੱਕ ਔਫਲਾਈਨ ਐਂਡਰੌਇਡ ਫਿਸ਼ਿੰਗ ਗਾਰਡ।',
    noCloud: 'ਕੋਈ ਕਲਾਉਡ ਨਹੀਂ',
    noAccounts: 'ਕੋਈ ਖਾਤਾ ਨਹੀਂ',
    noTelemetry: 'ਕੋਈ ਟੈਲੀਮੈਟਰੀ ਨਹੀਂ',
    getStarted: 'ਸ਼ੁਰੂ ਕਰੋ',

    // Dashboard
    totalChecked: 'ਕੁੱਲ ਜਾਂਚੇ ਗਏ',
    flaggedRed: 'ਖ਼ਤਰਨਾਕ ਲਾਲ',
    warnedYellow: 'ਚੇਤਾਵਨੀ ਪੀਲਾ',
    lookedClean: 'ਸਾਫ਼ ਹਰਾ',
    recentActivity: 'ਤਾਜ਼ਾ ਗਤੀਵਿਧੀ',

    // Nav
    home: 'ਘਰ',
    scan: 'ਸਕੈਨ',
    history: 'ਇਤਿਹਾਸ',

    // Scan Hub
    scanTitle: 'ਲਿੰਕ, ਸੁਨੇਹਾ ਜਾਂ APK ਸਕੈਨ ਕਰੋ',
    scanSub: 'AppAutopsy ਤੁਹਾਡੀ ਡਿਵਾਈਸ ਤੇ ਇਸਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰਦਾ ਹੈ ਅਤੇ ਕਾਰਨਾਂ ਨਾਲ ਫੈਸਲਾ ਦਿੰਦਾ ਹੈ।',
    scanLink: 'ਲਿੰਕ ਸਕੈਨ ਕਰੋ',
    scanLinkSub: 'ਖ਼ਤਰਨਾਕ ਪੈਟਰਨਾਂ ਲਈ URL ਦੀ ਜਾਂਚ ਕਰੋ',
    scanMessage: 'ਸੁਨੇਹਾ ਸਕੈਨ ਕਰੋ',
    scanMessageSub: 'ਸ਼ੱਕੀ ਸਮੱਗਰੀ ਲਈ ਸੁਨੇਹੇ ਦੀ ਜਾਂਚ ਕਰੋ',
    scanApk: 'APK ਸਕੈਨ ਕਰੋ',
    scanApkSub: 'APK ਫ਼ਾਈਲ ਦੀ ਜਾਂਚ ਕਰੋ (ਬਿਨਾਂ ਇੰਸਟਾਲੇਸ਼ਨ)',

    // Results
    scanResult: 'ਸਕੈਨ ਨਤੀਜਾ',
    riskScore: 'ਜੋਖਮ ਸਕੋਰ',
    red: 'RED (ਲਾਲ)',
    yellow: 'YELLOW (ਪੀਲਾ)',
    green: 'GREEN (ਹਰਾ)',
    highRisk: 'ਉੱਚ ਖ਼ਤਰਾ',
    mediumRisk: 'ਮੱਧਮ ਖ਼ਤਰਾ',
    lowRisk: 'ਕੋਈ ਸ਼ੱਕੀ ਪੈਟਰਨ ਨਹੀਂ ਮਿਲਿਆ',
    scannedLink: 'ਸਕੈਨ ਕੀਤਾ ਲਿੰਕ',
    scannedMessage: 'ਸਕੈਨ ਕੀਤਾ ਸੁਨੇਹਾ',
    scannedFile: 'ਸਕੈਨ ਕੀਤੀ ਫ਼ਾਈਲ',
    whyFlagged: 'ਇਸਨੂੰ ਕਿਉਂ ਚਿੰਨ੍ਹਿਤ ਕੀਤਾ ਗਿਆ',
    noRiskyFound: 'ਇਸ ਲਿੰਕ ਵਿੱਚ ਕੋਈ ਜੋਖਮ ਭਰਿਆ ਪੈਟਰਨ ਨਹੀਂ ਮਿਲਿਆ।',
    disclaimerWarning: 'ਇਹ ਟੂਲ ਸਿਰਫ਼ ਜੋਖਮ ਭਰੇ ਪੈਟਰਨਾਂ ਦੀ ਪਛਾਣ ਕਰਦਾ ਹੈ; ਇਹ ਸੁਰੱਖਿਅਤ ਹੋਣ ਦੀ ਗਰੰਟੀ ਨਹੀਂ ਦਿੰਦਾ।',
    disclaimerClean: 'ਹਰੇ ਨਤੀਜੇ ਦਾ ਮਤਲਬ ਹੈ ਕਿ ਕੁਝ ਵੀ ਸ਼ੱਕੀ ਨਹੀਂ ਮਿਲਿਆ, ਇਹ ਗਰੰਟੀ ਨਹੀਂ ਹੈ ਕਿ ਲਿੰਕ ਸੁਰੱਖਿਅਤ ਹੈ।',

    // Modal
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    enterUrlPlaceholder: 'ਲਿੰਕ ਦਰਜ ਕਰੋ...',
    enterMsgPlaceholder: 'ਸ਼ੱਕੀ ਸੁਨੇਹਾ ਪੇਸਟ ਕਰੋ...',
    selectApkHint: 'ਜਾਂਚ ਲਈ .apk ਫ਼ਾਈਲ ਚੁਣੋ',
    runAnalysis: 'ਡਿਵਾਈਸ ਤੇ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ',
    back: 'ਵਾਪਸ',
  },
}

export type TranslationKey = keyof typeof translations.en

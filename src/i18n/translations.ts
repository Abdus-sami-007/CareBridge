import type { LanguageCode } from "./languages";

export const translations: Record<
  LanguageCode,
  Record<string, string>
> = {
  en: {
    appName: "CareBridge",
    login: "Login",
    logout: "Logout",
    victim: "Victim",
    official: "Official",
    dashboard: "Dashboard",
    language: "Language",

    welcome: "Welcome to CareBridge",
    victimLogin: "Victim Login",
    officialLogin: "Official Login",

    victimId: "Victim ID",
    password: "Password",

    chatbot: "AI Chatbot",
    send: "Send",
    sending: "Sending",
    typeMessage: "Type your message...",
    writePrivateCheckin: "Write a private check-in...",
    listening: "Listening… speak naturally",
    speakCheckin: "Speak your check-in",
    voiceUnavailable: "Voice input unavailable",
    readAloud: "Read latest response aloud",
    careBridgeCheckin: "CareBridge AI Check-in",
    privateConversationFor: "Private conversation for",

    stressScore: "AI-Estimated Stress Score",
    riskLevel: "Risk Level",
    history: "History",
    currentStatus: "Current Status",

    addVictim: "Add Victim",
    editVictim: "Edit Victim",
    save: "Save",
    cancel: "Cancel",
    closeCase: "Close Case",

    loading: "Loading...",
    error: "Something went wrong.",

    voiceInput: "Voice Input",
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",

    home: "Home",
    victimDashboard: "Victim Dashboard",
    officialsDashboard: "Officials Dashboard",
    mentalHealthMonitoring: "Mental Health Monitoring",
    isolationEnforced: "Isolation: Enforced",
  },

  as: {
    "Home": "গৃহ",
    "Victim Dashboard": "ভুক্তভোগী ডেচব'ৰ্ড",
    "Officials Dashboard": "বিষয়াসকলৰ ডেচব'ৰ্ড"
  },
  bn: {
    "Home": "হোম",
    "Victim Dashboard": "ভিকটিম ড্যাশবোর্ড",
    "Officials Dashboard": "অফিসিয়াল ড্যাশবোর্ড",
    "Mental Health Monitoring": "মানসিক স্বাস্থ্য পর্যবেক্ষণ",
    "AI-powered early intervention and victim support platform": "এআই-চালিত প্রাথমিক হস্তক্ষেপ এবং ভিকটিম সহায়তা প্ল্যাটফর্ম",
    "Service": "পরিষেবা",
    "Isolation: Enforced": "আইসোলেশন: বলবৎ",
    "Private Victim Access": "ব্যক্তিগত ভিকটিম অ্যাক্সেস",
    "Enter Victim Dashboard": "ভিকটিম ড্যাশবোর্ডে প্রবেশ করুন",
    "Officials Secure Login": "অফিসিয়াল সুরক্ষিত লগইন",
    "Enter Officials Dashboard": "অফিসিয়াল ড্যাশবোর্ডে প্রবেশ করুন"
  },
  brx: {},
  doi: {},
  gu: {
    "Home": "હોમ",
    "Victim Dashboard": "પીડિત ડેશબોર્ડ",
    "Officials Dashboard": "અધિકારી ડેશબોર્ડ",
    "Mental Health Monitoring": "માનસિક સ્વાસ્થ્ય દેખરેખ",
    "Service": "સેવા",
    "Isolation: Enforced": "અલગતા: અમલી",
    "Private Victim Access": "ખાનગી પીડિત એક્સેસ",
    "Enter Victim Dashboard": "પીડિત ડેશબોર્ડમાં પ્રવેશ કરો",
    "Officials Secure Login": "અધિકારી સુરક્ષિત લોગિન"
  },
  hi: {
    appName: "CareBridge",
    login: "लॉगिन",
    logout: "लॉगआउट",
    victim: "पीड़ित",
    official: "अधिकारी",
    dashboard: "डैशबोर्ड",
    language: "भाषा",

    welcome: "CareBridge में आपका स्वागत है",
    victimLogin: "पीड़ित लॉगिन",
    officialLogin: "अधिकारी लॉगिन",

    victimId: "पीड़ित आईडी",
    password: "पासवर्ड",

    chatbot: "एआई चैटबॉट",
    send: "भेजें",
    sending: "भेजा जा रहा है",
    typeMessage: "अपना संदेश लिखें...",
    writePrivateCheckin: "एक निजी चेक-इन लिखें...",

    stressScore: "एआई-अनुमानित तनाव स्कोर",
    riskLevel: "जोखिम स्तर",
    history: "इतिहास",
    currentStatus: "वर्तमान स्थिति",

    addVictim: "पीड़ित जोड़ें",
    editVictim: "पीड़ित संपादित करें",
    save: "सहेजें",
    cancel: "रद्द करें",
    closeCase: "मामला बंद करें",

    loading: "लोड हो रहा है...",
    error: "कुछ गलत हो गया।",

    voiceInput: "वॉयस इनपुट",
    startRecording: "रिकॉर्डिंग शुरू करें",
    stopRecording: "रिकॉर्डिंग रोकें",

    home: "मुख्य पृष्ठ",
    victimDashboard: "पीड़ित डैशबोर्ड",
    officialsDashboard: "अधिकारी डैशबोर्ड",

    "Home": "होम",
    "Victim Dashboard": "पीड़ित डैशबोर्ड",
    "Officials Dashboard": "अधिकारी डैशबोर्ड",
    "Mental Health Monitoring": "मानसिक स्वास्थ्य निगरानी",
    "AI-powered early intervention and victim support platform": "एआई-संचालित त्वरित सहायता एवं पीड़ित सहायता मंच",
    "Service": "सेवा",
    "Isolation: Enforced": "अलगाव: लागू",
    "Private Victim Access": "निजी पीड़ित पहुंच",
    "Enter your assigned case credentials to continue.": "जारी रखने के लिए अपने आवंटित केस क्रेडेंशियल दर्ज करें।",
    "Enter Victim Dashboard": "पीड़ित डैशबोर्ड में प्रवेश करें",
    "Officials Secure Login": "अधिकारी सुरक्षित लॉगिन",
    "Sign in with an official account stored in PostgreSQL.": "PostgreSQL में संग्रहीत आधिकारिक खाते से साइन इन करें।",
    "Sign in to Officials Dashboard": "अधिकारी डैशबोर्ड में साइन इन करें",
    "Enter Officials Dashboard": "अधिकारी डैशबोर्ड में प्रवेश करें",
    "Trauma-informed signals, routed to the people who can help.": "आघात-सूचित संकेत, उन लोगों तक पहुंचाए गए जो मदद कर सकते हैं।",
    "Choose the protected CareBridge dashboard that matches your role.": "अपनी भूमिका से मेल खाने वाला सुरक्षित CareBridge डैशबोर्ड चुनें।"
  },
  kn: {},
  ks: {},
  kok: {},
  mai: {},
  ml: {},
  mni: {},
  mr: {
    "Home": "होम",
    "Victim Dashboard": "पीड़ित डॅशबोर्ड",
    "Officials Dashboard": "अधिकारी डॅशबोर्ड",
    "Mental Health Monitoring": "मानसिक आरोग्य देखरेख",
    "Service": "सेवा",
    "Isolation: Enforced": "विलगीकरण: लागू",
    "Private Victim Access": "खाजगी पीड़ित प्रवेश",
    "Enter Victim Dashboard": "पीड़ित डॅशबोर्डवर जा",
    "Officials Secure Login": "अधिकारी सुरक्षित लॉगिन"
  },
  ne: {},
  or: {},
  pa: {},
  sa: {},
  sat: {},
  sd: {},
  ta: {
    "Home": "முகப்பு",
    "Victim Dashboard": "பாதிக்கப்பட்டவர் டேஷ்போர்டு",
    "Officials Dashboard": "அதிகாரிகள் டேஷ்போர்டு",
    "Mental Health Monitoring": "மனநல கண்காணிப்பு",
    "Service": "சேவை",
    "Private Victim Access": "தனியார் அணுகல்",
    "Enter Victim Dashboard": "டேஷ்போர்டில் நுழைக"
  },
  te: {
    "Home": "హోమ్",
    "Victim Dashboard": "బాధితుల డాష్‌బోర్డ్",
    "Officials Dashboard": "అధికారుల డాష్‌బోర్డ్",
    "Mental Health Monitoring": "మానసిక ఆరోగ్య పర్యవేక్షణ",
    "Service": "సేవ"
  },
  ur: {
    "Home": "ہوم",
    "Victim Dashboard": "متاثرہ ڈیش بورڈ",
    "Officials Dashboard": "حکام ڈیش بورڈ",
    "Mental Health Monitoring": "ذہنی صحت کی نگرانی",
    "Service": "سروس"
  }
};

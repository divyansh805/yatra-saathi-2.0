import type { LanguageCode } from '../types/travel';

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  mr: 'मराठी',
};

interface TranslationStrings {
  navHome: string;
  navTravelAssist: string;
  navExplorePlan: string;
  navStayReality: string;
  navLogin: string;
  navProfile: string;
  navLogout: string;
  heroHeadline: string;
  heroSupport: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  dashboardHeadline: string;
  dashboardSupport: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
}

const DICTIONARY: Record<LanguageCode, TranslationStrings> = {
  en: {
    navHome: 'Home',
    navTravelAssist: 'Travel Assist',
    navExplorePlan: 'Explore & Plan',
    navStayReality: 'Stay Reality',
    navLogin: 'Sign In',
    navProfile: 'Profile',
    navLogout: 'Log Out',
    heroHeadline: 'Travel beyond the ordinary.',
    heroSupport:
      'Discover destinations, compare your journeys and experience every place with confidence.',
    heroCtaPrimary: 'Get Started',
    heroCtaSecondary: 'Discover How It Works',
    dashboardHeadline: 'Where would you like to go next?',
    dashboardSupport: 'Your next journey begins with the right information.',
    greetingMorning: 'Good Morning',
    greetingAfternoon: 'Good Afternoon',
    greetingEvening: 'Good Evening',
  },
  hi: {
    navHome: 'होम',
    navTravelAssist: 'ट्रैवल असिस्ट',
    navExplorePlan: 'खोजें और योजना बनाएं',
    navStayReality: 'स्टे रियलिटी',
    navLogin: 'साइन इन',
    navProfile: 'प्रोफ़ाइल',
    navLogout: 'लॉग आउट',
    heroHeadline: 'साधारण से परे यात्रा करें।',
    heroSupport:
      'गंतव्यों को जानें, अपने पहले सफर की तुलना करें और हर स्थान को पूरे भरोसे के साथ अनुभव करें।',
    heroCtaPrimary: 'शुरू करें',
    heroCtaSecondary: 'जानें यह कैसे काम करता है',
    dashboardHeadline: 'आप आगे कहाँ जाना चाहेंगे?',
    dashboardSupport: 'आपकी अगली यात्रा सही जानकारी से शुरू होती है।',
    greetingMorning: 'सुप्रभात',
    greetingAfternoon: 'नमस्कार',
    greetingEvening: 'शुभ संध्या',
  },
  ta: {
    navHome: 'முகப்பு',
    navTravelAssist: 'பயண உதவி',
    navExplorePlan: 'ஆராய்ந்து திட்டமிடு',
    navStayReality: 'தங்குமிட உண்மை',
    navLogin: 'உள்நுழைக',
    navProfile: 'சுயவிவரம்',
    navLogout: 'வெளியேறு',
    heroHeadline: 'சாதாரணத்திற்கு அப்பால் பயணியுங்கள்.',
    heroSupport:
      'இடங்களைக் கண்டறிந்து, பயணங்களை ஒப்பிட்டு, நம்பிக்கையுடன் ஒவ்வொரு ஊரையும் அனுபவியுங்கள்.',
    heroCtaPrimary: 'தொடங்குங்கள்',
    heroCtaSecondary: 'எப்படி செயல்படுகிறது',
    dashboardHeadline: 'அடுத்து எங்கே செல்ல விரும்புகிறீர்கள்?',
    dashboardSupport: 'சரியான தகவலுடன் உங்கள் அடுத்த பயணம் தொடங்குகிறது.',
    greetingMorning: 'காலை வணக்கம்',
    greetingAfternoon: 'மதிய வணக்கம்',
    greetingEvening: 'மாலை வணக்கம்',
  },
  mr: {
    navHome: 'मुख्यपृष्ठ',
    navTravelAssist: 'प्रवास सहाय्य',
    navExplorePlan: 'शोधा आणि नियोजन करा',
    navStayReality: 'निवास वास्तव',
    navLogin: 'साइन इन',
    navProfile: 'प्रोफाइल',
    navLogout: 'लॉग आउट',
    heroHeadline: 'सामान्य पलीकडचा प्रवास करा.',
    heroSupport:
      'नवीन ठिकाणे शोधा, प्रवासाची तुलना करा आणि प्रत्येक ठिकाणाचा आत्मविश्वासाने अनुभव घ्या.',
    heroCtaPrimary: 'सुरू करा',
    heroCtaSecondary: 'हे कसे कार्य करते ते पहा',
    dashboardHeadline: 'पुढे कुठे जायला आवडेल?',
    dashboardSupport: 'तुमचा पुढील प्रवास अचूक माहितीपासून सुरू होतो.',
    greetingMorning: 'सुप्रभात',
    greetingAfternoon: 'शुभ दुपार',
    greetingEvening: 'शुभ संध्याकाळ',
  },
};

export function useTranslationStrings(lang: LanguageCode): TranslationStrings {
  return DICTIONARY[lang] || DICTIONARY.en;
}

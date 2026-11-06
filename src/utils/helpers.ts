// Helper utilities for date formatting, auto-replies, and media

export function formatTime(timestamp: number, lang: 'bn' | 'en' = 'bn'): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? (lang === 'bn' ? 'পিএম' : 'PM') : (lang === 'bn' ? 'এএম' : 'AM');
  const formattedHours = (hours % 12 || 12).toString();

  const toBnDigits = (str: string) => {
    if (lang !== 'bn') return str;
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.replace(/[0-9]/g, (w) => bnNums[+w]);
  };

  const timeStr = `${toBnDigits(formattedHours)}:${toBnDigits(minutes)} ${ampm}`;

  if (isToday) {
    return timeStr;
  }
  if (isYesterday) {
    return lang === 'bn' ? `গতকাল ${timeStr}` : `Yesterday ${timeStr}`;
  }

  // Older
  const day = toBnDigits(date.getDate().toString());
  const monthNamesBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = lang === 'bn' ? monthNamesBn[date.getMonth()] : monthNamesEn[date.getMonth()];

  return `${day} ${month}, ${timeStr}`;
}

export function formatMessageDate(timestamp: number, lang: 'bn' | 'en' = 'bn'): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return lang === 'bn' ? 'আজ' : 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return lang === 'bn' ? 'গতকাল' : 'Yesterday';
  }
  const day = date.getDate();
  const monthNamesBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = lang === 'bn' ? monthNamesBn[date.getMonth()] : monthNamesEn[date.getMonth()];
  return `${day} ${month} ${date.getFullYear()}`;
}

// Contextual simulated responses for contacts
export const SIMULATED_RESPONSES = [
  'হাঁ ভাই, ঠিক আছে! আমি বিষয়টি দেখছি।',
  'আলহামদুলিল্লাহ দারুণ হয়েছে! 👍',
  'একটু ব্যস্ত ছিলাম, এখনই চেক করে জানাচ্ছি।',
  'চলুন কাল বিকেলে একবার বসি তাহলে। ☕️',
  'অনেক অনেক ধন্যবাদ বার্তাটি শেয়ার করার জন্য! ❤️',
  'ইনবক্সে সব ডিটেইলস দিয়ে দিলাম, চোখ বুলিয়ে নিও।',
  'ওয়াও! এটা সত্যিই অনেক আকর্ষণীয় আইডিয়া 🔥',
  'হুম, আমিও একই কথা ভাবছিলাম।',
  'জরুরি কোনো দরকার থাকলে কল দিতে পারো! 📞',
  'একটু পরে ফ্রি হয়ে বিস্তারিত বলছি দোস্ত!'
];

export function getRandomSimulatedResponse(): string {
  const index = Math.floor(Math.random() * SIMULATED_RESPONSES.length);
  return SIMULATED_RESPONSES[index];
}

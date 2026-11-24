/**
 * Sylhet launch content: delivery zones, contact details, pilot copy, FAQ answer and
 * Bangla policy-page titles. Shared by the development seed and by `npm run launch:sylhet`,
 * which applies the same values to an existing (including production) database.
 */

export const contact = {
  phone: "01609347600",
  address: "Sylhet, Bangladesh",
  hours: "8 AM – 10 PM, every day",
};

export const sylhetZones = [
  {
    name: "Sylhet — Zindabazar, Chowhatta & Amberkhana",
    areas: ["Zindabazar", "Chowhatta", "Amberkhana", "Dargah Gate", "Subidbazar", "Mirboxtola", "Bondor Bazar"],
    fee: 50,
    freeThreshold: 2000,
  },
  {
    name: "Sylhet — Uposhohor, Shibganj & Tilagor",
    areas: ["Shahjalal Uposhohor", "Shibganj", "Tilagor", "Mirabazar", "Kumarpara", "Naiorpul"],
    fee: 50,
    freeThreshold: 2000,
  },
  {
    name: "Sylhet — Akhalia, Pathantula & Modina Market",
    areas: ["Akhalia", "Pathantula", "Modina Market", "Bagbari", "Housing Estate", "Electric Supply"],
    fee: 70,
    freeThreshold: 2500,
  },
].map((z) => ({ ...z, division: "Sylhet", district: "Sylhet" }));

export const heroSection = {
  key: "home.hero",
  eyebrow: "Now delivering across Sylhet city",
  eyebrowBn: "এখন সিলেট শহর জুড়ে ডেলিভারি",
  title: "Every product has a story.",
  titleBn: "প্রতিটি পণ্যের একটি গল্প আছে।",
  body: "Plan your household’s weekly market or monthly stock in minutes. Directly sourced, quality-checked in our Sylhet hub, traceable to the batch and delivered on your schedule.",
  bodyBn: "কয়েক মিনিটেই পরিবারের সাপ্তাহিক বাজার বা মাসিক মজুদ সাজান। সরাসরি সংগৃহীত, আমাদের সিলেট হাবে মান যাচাইকৃত, ব্যাচ পর্যন্ত ট্রেসযোগ্য, আর আপনার বেছে নেওয়া সময়ে ডেলিভারি।",
  ctaLabel: "Build Your Market",
  ctaLabelBn: "আপনার বাজার সাজান",
  ctaHref: "/market/weekly",
};

export const pilotSection = {
  key: "home.pilot",
  eyebrow: "Launching in Sylhet",
  eyebrowBn: "সিলেটে যাত্রা শুরু",
  title: "Now welcoming founding households in Sylhet",
  titleBn: "সিলেটে প্রথম পরিবারগুলোকে স্বাগত জানাচ্ছি",
  body: "We are starting with a limited number of households in Zindabazar, Amberkhana, Uposhohor, Shibganj, Tilagor and Akhalia, so we can get sourcing, quality and delivery right before we grow.",
  bodyBn: "জিন্দাবাজার, আম্বরখানা, উপশহর, শিবগঞ্জ, টিলাগড় ও আখালিয়ায় সীমিত সংখ্যক পরিবার নিয়ে শুরু করছি, যাতে বড় হওয়ার আগে সংগ্রহ, মান ও ডেলিভারি ঠিকঠাক করতে পারি।",
  ctaLabel: "Ask the concierge",
  ctaLabelBn: "কনসিয়ার্জকে জিজ্ঞেস করুন",
  ctaHref: "/concierge",
};

export const deliveryFaq = {
  question: "Where do you deliver?",
  questionBn: "কোথায় ডেলিভারি দেন?",
  answer: "We are launching in Sylhet city: Zindabazar, Chowhatta, Amberkhana, Uposhohor, Shibganj, Tilagor, Akhalia, Pathantula and nearby areas. Enter your area at checkout to see available slots.",
  answerBn: "আমরা সিলেট শহরে শুরু করছি: জিন্দাবাজার, চৌহাট্টা, আম্বরখানা, উপশহর, শিবগঞ্জ, টিলাগড়, আখালিয়া, পাঠানটুলা ও আশপাশের এলাকা। চেকআউটে আপনার এলাকা দিলে খালি স্লট দেখাবে।",
};

export const pageTitlesBn: Record<string, string> = {
  "delivery-policy": "ডেলিভারি নীতি",
  "refund-policy": "রিফান্ড ও রিপ্লেসমেন্ট",
  privacy: "গোপনীয়তা নীতি",
  terms: "ব্যবহারের শর্তাবলি",
};

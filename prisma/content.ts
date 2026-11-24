/**
 * Customer-facing catalogue and editorial copy (English + Bangla), written to
 * docs/CONTENT-STYLE-GUIDE.md. Used by the development seed and applied to existing
 * databases by `npm run launch:sylhet` (text fields only; prices, stock, flags and
 * relations are never touched). Edit later in the admin panel.
 *
 * Process descriptions state what is done; they are not test results or certifications.
 */
import type { PrismaClient } from "../src/generated/prisma/client.ts";

type Cat = { slug: string; description: string; descriptionBn: string; story: string; storyBn: string };
export const categoryCopy: Cat[] = [
  {
    slug: "rice-grains",
    description: "Rice and grains from named districts, milled in small batches and sorted by hand.",
    descriptionBn: "নির্দিষ্ট জেলার চাল ও শস্য, ছোট ব্যাচে ভাঙানো আর হাতে বাছাই করা।",
    story: "We buy paddy from growers we know, dry it properly and mill it in small batches, so each bag can be traced to its district and harvest.",
    storyBn: "চেনা চাষিদের কাছ থেকে ধান কিনে ভালোভাবে শুকিয়ে ছোট ব্যাচে ভাঙানো হয়, যাতে প্রতিটি বস্তার জেলা ও ফসলের মৌসুম জানা যায়।",
  },
  {
    slug: "fish-seafood",
    description: "Pond, river and haor fish, kept on ice from harvest and cleaned to order.",
    descriptionBn: "পুকুর, নদী ও হাওরের মাছ—ধরার পর থেকেই বরফে রাখা, অর্ডার অনুযায়ী পরিষ্কার ও কাটা।",
    story: "Most fresh fish is collected after you order and kept on ice from the pond or ghat. It is cleaned and cut on the day of delivery.",
    storyBn: "বেশিরভাগ তাজা মাছ অর্ডারের পর সংগ্রহ করা হয় এবং পুকুর বা ঘাট থেকেই বরফে রাখা হয়। ডেলিভারির দিন পরিষ্কার করে কাটা হয়।",
  },
  {
    slug: "dried-fish",
    description: "Shutki dried on raised coastal racks, with the drying method recorded for every batch.",
    descriptionBn: "উপকূলের উঁচু মাচায় শুকানো শুঁটকি; প্রতিটি ব্যাচে শুকানোর পদ্ধতি রেকর্ড করা থাকে।",
    story: "We work with drying yards that dry fish on raised, net-covered racks. How each batch was washed, salted and dried is written on its record.",
    storyBn: "যেসব শুঁটকি পল্লিতে জাল দিয়ে ঢাকা উঁচু মাচায় মাছ শুকানো হয়, আমরা তাদের সঙ্গে কাজ করি। প্রতিটি ব্যাচ কীভাবে ধোয়া, লবণ দেওয়া ও শুকানো হয়েছে, তা রেকর্ডে লেখা থাকে।",
  },
  {
    slug: "spices-herbs",
    description: "Sun-dried spices ground in small lots. Imported spices are clearly named as imported.",
    descriptionBn: "রোদে শুকানো মসলা, ছোট লটে গুঁড়া করা। আমদানি করা মসলা স্পষ্টভাবে আমদানি বলেই উল্লেখ থাকে।",
    story: "Most of our spices come from Bangladeshi growers. Where a spice is not grown here at scale, such as cumin, we say where it comes from.",
    storyBn: "আমাদের বেশিরভাগ মসলা দেশের চাষিদের কাছ থেকে আসে। জিরার মতো যে মসলা দেশে বড় পরিসরে হয় না, তার উৎস আমরা স্পষ্ট করে জানাই।",
  },
  {
    slug: "pulses-lentils",
    description: "Deshi lentils and pulses, cleaned and sorted by hand.",
    descriptionBn: "দেশি ডাল ও ছোলা, হাতে পরিষ্কার ও বাছাই করা।",
    story: "Deshi lentils are smaller than imported ones and cook to a thicker dal. We split, clean and sort them without polishing.",
    storyBn: "দেশি মসুর আমদানি করা ডালের চেয়ে ছোট, রান্নায় ঘন হয়। পলিশ না করে ভেঙে, পরিষ্কার ও বাছাই করা হয়।",
  },
  {
    slug: "oils-honey-ghee",
    description: "Ghani-pressed mustard oil, Sundarbans honey and slow-cooked ghee.",
    descriptionBn: "ঘানিতে ভাঙা সরিষার তেল, সুন্দরবনের মধু আর ধীরে জ্বাল দেওয়া ঘি।",
    story: "Slow methods shape the flavour: mustard seed pressed in a wooden ghani, honey strained without heating, ghee cooked from cultured butter.",
    storyBn: "ধীর পদ্ধতিতেই স্বাদ তৈরি হয়: কাঠের ঘানিতে সরিষা ভাঙানো, তাপ না দিয়ে ছাঁকা মধু, আর দই করা মাখন জ্বাল দিয়ে ঘি।",
  },
  {
    slug: "regional-seasonal",
    description: "Seasonal arrivals and foods that belong to particular regions.",
    descriptionBn: "মৌসুমের পণ্য আর নির্দিষ্ট অঞ্চলের পরিচয় বহন করা খাবার।",
    story: "Some foods have a short season or a particular home. We list them while they are in season and name the place they come from.",
    storyBn: "কিছু খাবারের মৌসুম ছোট, কিছু খাবার নির্দিষ্ট অঞ্চলের। মৌসুম চলাকালেই আমরা এগুলো রাখি, আর কোথা থেকে এসেছে তা জানিয়ে দিই।",
  },
];

type Prod = {
  slug: string; name?: string; nameBn?: string; summary: string; summaryBn: string; description: string; descriptionBn: string;
  processingInfo: string; processingInfoBn: string; packagingInfo: string; packagingInfoBn: string;
  storageInfo: string; storageInfoBn: string; handlingInfo?: string; handlingInfoBn?: string;
};
const FISH_PACK = ["Food-grade tray in an insulated ice box.", "খাদ্য-উপযোগী ট্রেতে, বরফসহ ইনসুলেটেড বাক্সে।"] as const;
const COLD = ["Keep below 4°C. Do not refreeze after thawing.", "৪°সে-এর নিচে রাখুন। বরফ গলানোর পর আবার জমাবেন না।"] as const;
const POUCH = ["Sealed food-grade pouch with batch label.", "ব্যাচ লেবেলসহ সিল করা খাদ্য-উপযোগী প্যাকেট।"] as const;
const FOIL = ["Foil-lined resealable pouch.", "ফয়েল-লাইনড, আবার আটকানো যায় এমন প্যাকেট।"] as const;
const DRY = ["Keep dry and airtight.", "শুকনো ও বায়ুরোধী পাত্রে রাখুন।"] as const;
const LIGHT = ["Keep airtight, away from light.", "বায়ুরোধী পাত্রে, আলো থেকে দূরে রাখুন।"] as const;

export const productCopy: Prod[] = [
  { slug: "miniket-rice", summary: "Fine everyday rice · lightly polished", summaryBn: "প্রতিদিনের সরু চাল · হালকা পলিশ",
    description: "A fine everyday rice that cooks soft and separate. Sun-dried paddy, milled in small batches and sorted by hand.",
    descriptionBn: "প্রতিদিনের ভাতের জন্য সরু চাল, রান্নায় নরম ও ঝরঝরে হয়। রোদে শুকানো ধান ছোট ব্যাচে ভাঙানো ও হাতে বাছাই করা।",
    processingInfo: "Sun-dried paddy, milled in small batches and hand-sorted.", processingInfoBn: "রোদে শুকানো ধান, ছোট ব্যাচে ভাঙানো ও হাতে বাছাই।",
    packagingInfo: "Food-grade inner bag in a woven outer sack, heat-sealed with batch label.", packagingInfoBn: "খাদ্য-উপযোগী ভেতরের ব্যাগ ও বোনা বস্তা, ব্যাচ লেবেলসহ তাপে সিল করা।",
    storageInfo: "Store in a cool, dry container away from sunlight.", storageInfoBn: "রোদ থেকে দূরে, ঠান্ডা ও শুকনো পাত্রে রাখুন।" },
  { slug: "premium-chinigura", summary: "Small aromatic grain for polao and payesh", summaryBn: "পোলাও ও পায়েসের সুগন্ধি ছোট দানা",
    description: "Small-grained aromatic rice, aged for six months to let its fragrance develop. Made for polao, khichuri and payesh.",
    descriptionBn: "ছোট দানার সুগন্ধি চাল, সুবাস পুরোপুরি ফোটাতে ছয় মাস রেখে দেওয়া। পোলাও, খিচুড়ি ও পায়েসের জন্য।",
    processingInfo: "Aged six months, hand-sorted.", processingInfoBn: "ছয় মাস রেখে দেওয়া, হাতে বাছাই।",
    packagingInfo: POUCH[0], packagingInfoBn: POUCH[1], storageInfo: "Keep airtight to preserve aroma.", storageInfoBn: "সুবাস ধরে রাখতে বায়ুরোধী পাত্রে রাখুন।" },
  { slug: "nazirshail-rice", summary: "Long, slender table rice", summaryBn: "লম্বা সরু দানার ভাতের চাল",
    description: "A long, slender table rice, lightly parboiled and milled in small batches. Cooks into separate, fluffy grains.",
    descriptionBn: "লম্বা ও সরু দানার চাল, হালকা সেদ্ধ করে ছোট ব্যাচে ভাঙানো। রান্নায় দানা আলাদা ও ঝরঝরে থাকে।",
    processingInfo: "Lightly parboiled, milled in small batches.", processingInfoBn: "হালকা সেদ্ধ, ছোট ব্যাচে ভাঙানো।",
    packagingInfo: "Food-grade inner bag in a woven outer sack.", packagingInfoBn: "খাদ্য-উপযোগী ভেতরের ব্যাগ ও বোনা বস্তা।",
    storageInfo: "Store in a cool, dry container.", storageInfoBn: "ঠান্ডা ও শুকনো পাত্রে রাখুন।" },
  { slug: "new-aman-chira", summary: "Flattened rice from this season’s aman", summaryBn: "এ মৌসুমের আমন ধানের চিড়া",
    description: "Flattened rice made from the new aman harvest. Good with doi and gur, or as a quick breakfast.",
    descriptionBn: "নতুন আমন ধান থেকে তৈরি চিড়া। দই-গুড়ের সঙ্গে বা সকালের হালকা নাশতায় ভালো।",
    processingInfo: "Roasted and hand-pounded.", processingInfoBn: "ভেজে ঢেঁকিতে কোটা।",
    packagingInfo: "Sealed pouch.", packagingInfoBn: "সিল করা প্যাকেট।", storageInfo: DRY[0], storageInfoBn: DRY[1] },
  { slug: "lal-atta", summary: "Stone-ground whole wheat flour", summaryBn: "পাথরে ভাঙা লাল আটা",
    description: "Whole wheat flour stone-ground every week, with the bran kept in. For ruti and paratha.",
    descriptionBn: "প্রতি সপ্তাহে পাথরে ভাঙা লাল আটা, ভুসি বাদ দেওয়া হয় না। রুটি ও পরোটার জন্য।",
    processingInfo: "Stone-ground weekly.", processingInfoBn: "প্রতি সপ্তাহে পাথরে ভাঙা।",
    packagingInfo: "Paper-lined sealed bag.", packagingInfoBn: "কাগজের আস্তরণসহ সিল করা ব্যাগ।",
    storageInfo: "Use within 8 weeks; keep cool and dry.", storageInfoBn: "৮ সপ্তাহের মধ্যে ব্যবহার করুন; ঠান্ডা ও শুকনো জায়গায় রাখুন।" },
  { slug: "rui-rohu", summary: "Pond rui · cleaned, curry cut", summaryBn: "পুকুরের রুই · পরিষ্কার, তরকারির কাটা",
    description: "Pond-raised rui, harvested after you order and kept on ice from the pond. Cleaned and cut for curry on the day of delivery.",
    descriptionBn: "পুকুরের রুই, অর্ডারের পর ধরা হয় এবং পুকুর থেকেই বরফে রাখা হয়। ডেলিভারির দিন তরকারির মাপে পরিষ্কার করে কাটা।",
    processingInfo: "Iced at harvest, cleaned and cut on the day of delivery.", processingInfoBn: "ধরার পরই বরফে, ডেলিভারির দিন পরিষ্কার ও কাটা।",
    packagingInfo: "Food-grade tray, vacuum film, insulated ice box.", packagingInfoBn: "খাদ্য-উপযোগী ট্রে, ভ্যাকুয়াম ফিল্ম, বরফসহ ইনসুলেটেড বাক্স।",
    storageInfo: "Refrigerate immediately; cook within 24 hours or freeze.", storageInfoBn: "সঙ্গে সঙ্গে ফ্রিজে রাখুন; ২৪ ঘণ্টার মধ্যে রান্না করুন বা ডিপ ফ্রিজে রাখুন।",
    handlingInfo: COLD[0], handlingInfoBn: COLD[1] },
  { slug: "katla", summary: "Large carp, rich flavour · curry cut", summaryBn: "বড় কার্প, ভরপুর স্বাদ · তরকারির কাটা",
    description: "Katla from slow-growing ponds, cleaned and cut to order. The head is prized for muri ghonto.",
    descriptionBn: "ধীরে বেড়ে ওঠা পুকুরের কাতলা, অর্ডার অনুযায়ী পরিষ্কার ও কাটা। মাথা মুড়িঘণ্টের জন্য বিশেষ প্রিয়।",
    processingInfo: "Iced at harvest, cleaned and cut to order.", processingInfoBn: "ধরার পরই বরফে, অর্ডার অনুযায়ী পরিষ্কার ও কাটা।",
    packagingInfo: FISH_PACK[0], packagingInfoBn: FISH_PACK[1],
    storageInfo: "Refrigerate immediately; cook within 24 hours or freeze.", storageInfoBn: "সঙ্গে সঙ্গে ফ্রিজে রাখুন; ২৪ ঘণ্টার মধ্যে রান্না করুন বা ডিপ ফ্রিজে রাখুন।",
    handlingInfo: "Keep below 4°C.", handlingInfoBn: "৪°সে-এর নিচে রাখুন।" },
  { slug: "tilapia", summary: "Mild and tender · whole, cleaned", summaryBn: "নরম ও হালকা স্বাদ · আস্ত, পরিষ্কার",
    description: "Pond-raised tilapia, scaled and cleaned whole. Mild enough for children, good fried or in a light jhol.",
    descriptionBn: "পুকুরের তেলাপিয়া, আঁশ ছাড়িয়ে আস্ত পরিষ্কার করা। হালকা স্বাদ, ভাজা বা পাতলা ঝোলে ভালো।",
    processingInfo: "Iced at harvest, scaled and cleaned.", processingInfoBn: "ধরার পরই বরফে, আঁশ ছাড়ানো ও পরিষ্কার।",
    packagingInfo: FISH_PACK[0], packagingInfoBn: FISH_PACK[1],
    storageInfo: "Refrigerate; cook within 24 hours.", storageInfoBn: "ফ্রিজে রাখুন; ২৪ ঘণ্টার মধ্যে রান্না করুন।",
    handlingInfo: "Keep below 4°C.", handlingInfoBn: "৪°সে-এর নিচে রাখুন।" },
  { slug: "haor-pabda", summary: "Soft pabda from the haor wetlands", summaryBn: "হাওরের নরম পাবদা",
    description: "Pabda netted at dawn in the haor wetlands of Sunamganj and iced on the boat. Delicate; best cooked the same day.",
    descriptionBn: "সুনামগঞ্জের হাওরে ভোরে জালে ধরা পাবদা, নৌকাতেই বরফে রাখা। নরম মাছ, একই দিনে রান্না করলে সবচেয়ে ভালো।",
    processingInfo: "Netted at dawn, iced on the boat.", processingInfoBn: "ভোরে জালে ধরা, নৌকাতেই বরফে।",
    packagingInfo: FISH_PACK[0], packagingInfoBn: FISH_PACK[1],
    storageInfo: "Refrigerate; cook the same day for best texture.", storageInfoBn: "ফ্রিজে রাখুন; ভালো স্বাদের জন্য একই দিনে রান্না করুন।",
    handlingInfo: "Keep below 4°C.", handlingInfoBn: "৪°সে-এর নিচে রাখুন।" },
  { slug: "golda-prawns", summary: "Freshwater golda · 12–15 per kg", summaryBn: "মিঠা পানির গলদা · কেজিতে ১২–১৫টি",
    description: "Golda prawns raised in rice fields, chilled in ice slurry and sold shell-on. For malaikari or bhuna.",
    descriptionBn: "ধানখেতে চাষ করা গলদা চিংড়ি, বরফ-পানিতে ঠান্ডা করা, খোসাসহ। মালাইকারি বা ভুনার জন্য।",
    processingInfo: "Chilled in ice slurry, shell-on.", processingInfoBn: "বরফ-পানিতে ঠান্ডা করা, খোসাসহ।",
    packagingInfo: FISH_PACK[0], packagingInfoBn: FISH_PACK[1],
    storageInfo: "Refrigerate; cook within 24 hours or freeze.", storageInfoBn: "ফ্রিজে রাখুন; ২৪ ঘণ্টার মধ্যে রান্না করুন বা ডিপ ফ্রিজে রাখুন।",
    handlingInfo: "Keep below 4°C.", handlingInfoBn: "৪°সে-এর নিচে রাখুন।" },
  { slug: "loitta-shutki", summary: "Bombay duck dried on raised racks", summaryBn: "উঁচু মাচায় শুকানো লইট্যা",
    description: "Bombay duck washed in sea water and dried for four days on raised, net-covered racks. For shutki bhuna and bhorta.",
    descriptionBn: "সাগরের পানিতে ধুয়ে জাল-ঢাকা উঁচু মাচায় চার দিন শুকানো লইট্যা। শুঁটকি ভুনা ও ভর্তার জন্য।",
    processingInfo: "Washed in sea water, dried 4 days on raised racks.", processingInfoBn: "সাগরের পানিতে ধোয়া, উঁচু মাচায় ৪ দিন শুকানো।",
    packagingInfo: "Double-sealed food-grade pouch.", packagingInfoBn: "দুই স্তরে সিল করা খাদ্য-উপযোগী প্যাকেট।",
    storageInfo: "Keep airtight in a cool place; refrigerate after opening.", storageInfoBn: "ঠান্ডা জায়গায় বায়ুরোধী পাত্রে রাখুন; খোলার পর ফ্রিজে রাখুন।" },
  { slug: "churi-shutki", summary: "Ribbonfish, lightly salted and sun-dried", summaryBn: "হালকা লবণে রোদে শুকানো ছুরি মাছ",
    description: "Ribbonfish lightly salted and sun-dried under nets. Cut into pieces for a spicy bhuna.",
    descriptionBn: "হালকা লবণ দিয়ে জালের নিচে রোদে শুকানো ছুরি মাছ। টুকরো করে ঝাল ভুনায় ভালো।",
    processingInfo: "Lightly salted, sun-dried under nets.", processingInfoBn: "হালকা লবণ, জালের নিচে রোদে শুকানো।",
    packagingInfo: "Double-sealed pouch.", packagingInfoBn: "দুই স্তরে সিল করা প্যাকেট।",
    storageInfo: "Keep airtight; refrigerate after opening.", storageInfoBn: "বায়ুরোধী পাত্রে রাখুন; খোলার পর ফ্রিজে রাখুন।" },
  { slug: "chingri-shutki", summary: "Small prawns, shelled and sun-dried", summaryBn: "খোসা ছাড়ানো ছোট চিংড়ি শুঁটকি",
    description: "Small prawns boiled briefly, shelled by hand and sun-dried. Adds depth to bhorta, shak and dal.",
    descriptionBn: "ছোট চিংড়ি অল্প সেদ্ধ করে হাতে খোসা ছাড়িয়ে রোদে শুকানো। ভর্তা, শাক ও ডালে স্বাদ বাড়ায়।",
    processingInfo: "Boiled briefly, shelled by hand, sun-dried.", processingInfoBn: "অল্প সেদ্ধ, হাতে খোসা ছাড়ানো, রোদে শুকানো।",
    packagingInfo: "Sealed pouch.", packagingInfoBn: "সিল করা প্যাকেট।", storageInfo: "Keep airtight.", storageInfoBn: "বায়ুরোধী পাত্রে রাখুন।" },
  { slug: "hill-turmeric", summary: "Hill-grown · stone-ground", summaryBn: "পাহাড়ে চাষ · পাথরে গুঁড়া",
    description: "Turmeric from the Chittagong Hill Tracts, boiled, sun-dried and stone-ground in small lots. Deep colour; a little goes a long way.",
    descriptionBn: "পার্বত্য চট্টগ্রামের হলুদ, সেদ্ধ করে রোদে শুকিয়ে ছোট লটে পাথরে গুঁড়া করা। রং গাঢ়, অল্পতেই কাজ হয়।",
    processingInfo: "Boiled, sun-dried and stone-ground in small lots.", processingInfoBn: "সেদ্ধ, রোদে শুকানো, ছোট লটে পাথরে গুঁড়া।",
    packagingInfo: FOIL[0], packagingInfoBn: FOIL[1], storageInfo: LIGHT[0], storageInfoBn: LIGHT[1] },
  { slug: "red-chili-powder", summary: "Char-grown chilies, sun-dried and ground", summaryBn: "চরের মরিচ, রোদে শুকিয়ে গুঁড়া",
    description: "Chilies grown on river char land, sun-dried and ground in small lots.",
    descriptionBn: "নদীর চরে চাষ করা মরিচ, রোদে শুকিয়ে ছোট লটে গুঁড়া করা।",
    processingInfo: "Sun-dried on the char, ground in small lots.", processingInfoBn: "চরেই রোদে শুকানো, ছোট লটে গুঁড়া।",
    packagingInfo: FOIL[0], packagingInfoBn: FOIL[1], storageInfo: LIGHT[0], storageInfoBn: LIGHT[1] },
  { slug: "coriander-powder", summary: "Lightly roasted before grinding", summaryBn: "গুঁড়ার আগে হালকা ভাজা",
    description: "Coriander seed cleaned, lightly roasted and stone-ground for a warmer aroma.",
    descriptionBn: "ধনিয়া পরিষ্কার করে হালকা ভেজে পাথরে গুঁড়া করা, তাই সুবাস বেশি।",
    processingInfo: "Cleaned, lightly roasted, stone-ground.", processingInfoBn: "পরিষ্কার, হালকা ভাজা, পাথরে গুঁড়া।",
    packagingInfo: FOIL[0], packagingInfoBn: FOIL[1], storageInfo: "Keep airtight.", storageInfoBn: "বায়ুরোধী পাত্রে রাখুন।" },
  { slug: "whole-cumin", summary: "Imported lot · cleaned and checked by us", summaryBn: "আমদানি করা লট · আমাদের এখানে পরিষ্কার ও যাচাই",
    description: "Cumin is not grown at scale in Bangladesh. This is an imported lot, cleaned three times and checked in our facility, and we name it as imported.",
    descriptionBn: "দেশে জিরা বড় পরিসরে চাষ হয় না। এটি আমদানি করা লট, আমাদের এখানে তিনবার পরিষ্কার ও যাচাই করা—তাই আমদানি বলেই উল্লেখ করছি।",
    processingInfo: "Imported whole, cleaned three times and checked in-house.", processingInfoBn: "গোটা অবস্থায় আমদানি, নিজেদের এখানে তিনবার পরিষ্কার ও যাচাই।",
    packagingInfo: FOIL[0], packagingInfoBn: FOIL[1], storageInfo: "Keep airtight.", storageInfoBn: "বায়ুরোধী পাত্রে রাখুন।" },
  { slug: "deshi-masoor-dal", summary: "Small red deshi lentils, unpolished", summaryBn: "ছোট দানার দেশি মসুর, পলিশ ছাড়া",
    description: "Small deshi red lentils, split and cleaned without polishing. Cooks to a thick, everyday dal.",
    descriptionBn: "ছোট দানার দেশি লাল মসুর, পলিশ ছাড়া ভাঙানো ও পরিষ্কার। রান্নায় ঘন, প্রতিদিনের ডাল।",
    processingInfo: "Split and cleaned without polishing.", processingInfoBn: "পলিশ ছাড়া ভাঙানো ও পরিষ্কার।",
    packagingInfo: POUCH[0], packagingInfoBn: POUCH[1], storageInfo: DRY[0], storageInfoBn: DRY[1] },
  { slug: "roasted-mug-dal", summary: "Golden mung, dry-roasted for aroma", summaryBn: "সুবাসের জন্য শুকনো ভাজা সোনালি মুগ",
    description: "Mung beans dry-roasted in small iron pans, split and sorted by hand. For bhuna khichuri and mug dal.",
    descriptionBn: "ছোট লোহার কড়াইয়ে শুকনো ভাজা মুগ, ভেঙে হাতে বাছাই করা। ভুনা খিচুড়ি ও মুগ ডালের জন্য।",
    processingInfo: "Dry-roasted, split and hand-sorted.", processingInfoBn: "শুকনো ভাজা, ভাঙানো ও হাতে বাছাই।",
    packagingInfo: POUCH[0], packagingInfoBn: POUCH[1], storageInfo: DRY[0], storageInfoBn: DRY[1] },
  { slug: "chola-chickpeas", summary: "Brown deshi chickpeas, hand-sorted", summaryBn: "হাতে বাছাই দেশি বাদামি ছোলা",
    description: "Deshi chickpeas, sun-dried and sorted by hand. Soak overnight for ghugni or chola bhuna.",
    descriptionBn: "রোদে শুকানো দেশি ছোলা, হাতে বাছাই করা। রাতভর ভিজিয়ে ঘুগনি বা ছোলা ভুনায়।",
    processingInfo: "Sun-dried and sorted by hand.", processingInfoBn: "রোদে শুকানো, হাতে বাছাই।",
    packagingInfo: POUCH[0], packagingInfoBn: POUCH[1], storageInfo: DRY[0], storageInfoBn: DRY[1] },
  { slug: "cold-pressed-mustard-oil", summary: "Pressed in a wooden ghani, unrefined", summaryBn: "কাঠের ঘানিতে ভাঙা, অপরিশোধিত",
    description: "Mustard oil pressed slowly in a wooden ghani and left to settle for seven days. Pungent, for bhorta, fish and everyday cooking.",
    descriptionBn: "কাঠের ঘানিতে ধীরে ভাঙা সরিষার তেল, সাত দিন থিতিয়ে রাখা। ঝাঁঝালো—ভর্তা, মাছ আর রোজকার রান্নায়।",
    processingInfo: "Pressed slowly in a wooden ghani, settled for 7 days.", processingInfoBn: "কাঠের ঘানিতে ধীরে ভাঙা, ৭ দিন থিতিয়ে রাখা।",
    packagingInfo: "Food-grade PET bottle with tamper seal.", packagingInfoBn: "খাদ্য-উপযোগী PET বোতল, নিরাপত্তা সিলসহ।",
    storageInfo: "Keep away from heat and light.", storageInfoBn: "তাপ ও আলো থেকে দূরে রাখুন।" },
  { slug: "sundarbans-khalisha-honey", summary: "Mangrove honey from the khalisha bloom", summaryBn: "খলিশা ফুলের সুন্দরবনের মধু",
    description: "Honey collected by licensed mowals during the khalisha bloom in the Sundarbans, strained without heating.",
    descriptionBn: "সুন্দরবনে খলিশা ফুলের মৌসুমে অনুমতিপ্রাপ্ত মৌয়ালদের সংগ্রহ করা মধু, তাপ না দিয়ে ছাঁকা।",
    processingInfo: "Collected from the wild, strained without heating.", processingInfoBn: "বন থেকে সংগ্রহ, তাপ না দিয়ে ছাঁকা।",
    packagingInfo: "Glass jar with tamper seal.", packagingInfoBn: "কাচের বয়াম, নিরাপত্তা সিলসহ।",
    storageInfo: "Store at room temperature; crystallisation is natural.", storageInfoBn: "স্বাভাবিক তাপমাত্রায় রাখুন; জমে দানা বাঁধা স্বাভাবিক।" },
  { slug: "pure-cow-ghee", name: "Cow’s Milk Ghee", nameBn: "গাওয়া ঘি", summary: "Slow-cooked from cultured butter", summaryBn: "দই করা মাখন থেকে ধীরে জ্বাল দেওয়া",
    description: "Ghee slow-cooked over a wood fire from cultured butter, which gives it its grain and aroma.",
    descriptionBn: "দই করা মাখন কাঠের আগুনে ধীরে জ্বাল দিয়ে তৈরি ঘি—এতেই দানা আর সুবাস আসে।",
    processingInfo: "Cultured butter slow-cooked over a wood fire.", processingInfoBn: "দই করা মাখন কাঠের আগুনে ধীরে জ্বাল।",
    packagingInfo: "Glass jar with tamper seal.", packagingInfoBn: "কাচের বয়াম, নিরাপত্তা সিলসহ।",
    storageInfo: "Store in a cool place; use a dry spoon.", storageInfoBn: "ঠান্ডা জায়গায় রাখুন; শুকনো চামচ ব্যবহার করুন।" },
  { slug: "khejur-patali-gur", summary: "Date-palm jaggery · winter tapping", summaryBn: "খেজুরের গুড় · শীতের রস",
    description: "Date-palm sap boiled the morning it is tapped and set in moulds. Available in winter, when the sap runs.",
    descriptionBn: "যে সকালে রস নামানো হয়, সেদিনই জ্বাল দিয়ে ছাঁচে বসানো পাটালি। রস পাওয়া যায় শীতে, তাই এটিও শীতের পণ্য।",
    processingInfo: "Sap boiled the same morning, set in moulds.", processingInfoBn: "একই সকালে রস জ্বাল, ছাঁচে বসানো।",
    packagingInfo: "Food-grade box with parchment.", packagingInfoBn: "পার্চমেন্ট কাগজসহ খাদ্য-উপযোগী বাক্স।",
    storageInfo: "Keep cool and airtight; refrigerate in warm weather.", storageInfoBn: "ঠান্ডা ও বায়ুরোধী পাত্রে রাখুন; গরমে ফ্রিজে রাখুন।" },
  { slug: "bogura-mishti-doi", summary: "Sweet yogurt set in clay pots", summaryBn: "মাটির হাঁড়িতে বসানো মিষ্টি দই",
    description: "Sweet yogurt from Bogura, set overnight in clay pots and delivered chilled.",
    descriptionBn: "বগুড়ার মিষ্টি দই, মাটির হাঁড়িতে সারারাত বসানো, ঠান্ডা অবস্থায় পৌঁছে দেওয়া হয়।",
    processingInfo: "Set overnight in clay pots.", processingInfoBn: "মাটির হাঁড়িতে সারারাত বসানো।",
    packagingInfo: "Clay pot, sealed lid, insulated box.", packagingInfoBn: "মাটির হাঁড়ি, সিল করা ঢাকনা, ইনসুলেটেড বাক্স।",
    storageInfo: "Refrigerate; best within 3 days.", storageInfoBn: "ফ্রিজে রাখুন; ৩ দিনের মধ্যে খেলে সবচেয়ে ভালো।",
    handlingInfo: "Keep chilled.", handlingInfoBn: "ঠান্ডায় রাখুন।" },
  { slug: "sylhet-shatkora", summary: "Aromatic citrus for meat and fish curries", summaryBn: "মাংস ও মাছের তরকারির সুগন্ধি সাতকরা",
    description: "Shatkora from Sylhet’s hill gardens, hand-picked and wrapped individually. A little rind perfumes a whole pot of curry.",
    descriptionBn: "সিলেটের পাহাড়ি বাগানের সাতকরা, হাতে তোলা ও আলাদা করে মোড়ানো। অল্প খোসাতেই পুরো হাঁড়ির তরকারি সুগন্ধি হয়।",
    processingInfo: "Hand-picked, wrapped individually.", processingInfoBn: "হাতে তোলা, আলাদা করে মোড়ানো।",
    packagingInfo: "Paper wrap in a ventilated box.", packagingInfoBn: "কাগজে মুড়ে বাতাস চলাচলের বাক্সে।",
    storageInfo: "Refrigerate for up to two weeks.", storageInfoBn: "ফ্রিজে দুই সপ্তাহ পর্যন্ত রাখা যায়।" },
];

/** Bangla craft labels for (demo) producer profiles; names and stories are not changed. */
export const producerCraftBn: Record<string, string> = {
  "abdul-karim": "ধানচাষি", "rafiqul-islam": "সুগন্ধি ধানের চাষি", "shahida-begum": "তৃতীয় প্রজন্মের ধানচাষি", "monjur-ali": "চিড়া প্রস্তুতকারক",
  "mosharraf-hossain": "গমচাষি ও আটা ভাঙানো কারিগর", "jamal-uddin": "পুকুরে মাছচাষি", "nurul-amin": "কার্প মাছচাষি", "selina-parvin": "মাছচাষি",
  "abul-kashem": "হাওরের জেলে", "sabina-khatun": "ধান-চিংড়ি চাষি", "nasima-akter": "শুঁটকি পল্লি", "mohammad-yunus": "জেলে ও শুঁটকি প্রস্তুতকারক",
  "ushaching-marma": "পাহাড়ি হলুদচাষি", "sirajul-haque": "চরের মরিচচাষি", "kamrul-hasan": "মসলাচাষি", "ataur-rahman": "ডালচাষি",
  "hasina-akter": "মুগচাষি", "golam-mostafa": "ছোলাচাষি", "belal-hossain": "ঘানির তেল ভাঙানো কারিগর", "gopal-mondal": "অনুমতিপ্রাপ্ত মৌয়াল",
  "rokeya-sultana": "ঘি প্রস্তুতকারক", "ismail-gachhi": "খেজুর রসের গাছি", "haripada-ghosh": "দই প্রস্তুতকারক", "anwar-chowdhury": "পাহাড়ি লেবুজাতীয় ফলচাষি",
  "fth-quality-team": "আমদানি লট পরিষ্কার ও যাচাই",
};

export const collectionCopy = [
  { slug: "winter-arrivals", title: "Winter arrivals", titleBn: "শীতের আয়োজন",
    description: "Date-palm gur, new aman chira, Sylhet shatkora and Bogura doi—foods that arrive with the cold months.",
    descriptionBn: "খেজুরের পাটালি, নতুন আমনের চিড়া, সিলেটের সাতকরা আর বগুড়ার দই—শীতের সঙ্গে যে খাবারগুলো আসে।" },
  { slug: "pantry-foundations", title: "Pantry foundations", titleBn: "ভাঁড়ারের প্রয়োজনীয়",
    description: "Rice, lentils, mustard oil, turmeric, chili and atta: the staples most households restock every month.",
    descriptionBn: "চাল, ডাল, সরিষার তেল, হলুদ, মরিচ আর আটা—যা বেশিরভাগ পরিবার প্রতি মাসে আবার কেনে।" },
  { slug: "a-bengali-fish-feast", title: "A Bengali fish table", titleBn: "বাঙালির মাছের আয়োজন",
    description: "Haor pabda, golda prawns, katla and loitta shutki for a weekend meal.",
    descriptionBn: "হাওরের পাবদা, গলদা চিংড়ি, কাতলা আর লইট্যা শুঁটকি—ছুটির দিনের খাবারের জন্য।" },
];

type Faq = { question: string; questionBn: string; answer: string; answerBn: string; match?: string[] };
export const faqCopy: Faq[] = [
  { question: "What is FarmToHome?", questionBn: "FarmToHome কী?",
    answer: "FarmToHome is a grocery concierge for planned household shopping. You build a weekly market or monthly stock from products we source from farmers, fishers and producers across Bangladesh, choose a delivery slot, and we prepare and deliver it.",
    answerBn: "FarmToHome পরিকল্পিত পারিবারিক বাজারের একটি গ্রোসারি কনসিয়ার্জ। দেশের বিভিন্ন অঞ্চলের কৃষক, জেলে ও উৎপাদকদের কাছ থেকে সংগ্রহ করা পণ্য দিয়ে আপনি সাপ্তাহিক বা মাসিক বাজার সাজান, ডেলিভারির সময় বেছে নিন—আমরা প্রস্তুত করে পৌঁছে দিই।",
    match: ["How is FarmToHome different from a grocery delivery app?"] },
  { question: "How is FarmToHome different from a delivery app?", questionBn: "সাধারণ ডেলিভারি অ্যাপ থেকে FarmToHome কীভাবে আলাদা?",
    answer: "We are built for planned shopping, not instant delivery. Knowing your order in advance lets us source directly, inspect properly and pack with care for a scheduled slot.",
    answerBn: "আমরা তাৎক্ষণিক ডেলিভারির জন্য নয়, পরিকল্পিত বাজারের জন্য। অর্ডার আগে থেকে জানলে আমরা সরাসরি সংগ্রহ, ঠিকমতো মান যাচাই আর যত্ন করে প্যাক করে নির্ধারিত সময়ে পৌঁছাতে পারি।" },
  { question: "How does FarmToHome source its products?", questionBn: "FarmToHome কীভাবে পণ্য সংগ্রহ করে?",
    answer: "We buy directly from farmers, fishers and producers in different districts. Each delivery from a producer becomes a batch, which is inspected, processed where needed and packed with its batch number. Our policy targets paying participating producers at least 30% above the conventional fair-market reference price.",
    answerBn: "বিভিন্ন জেলার কৃষক, জেলে ও উৎপাদকদের কাছ থেকে আমরা সরাসরি কিনি। উৎপাদকের কাছ থেকে আসা প্রতিটি চালান একটি ব্যাচ হয়—মান যাচাই, প্রয়োজনে প্রক্রিয়াকরণ শেষে ব্যাচ নম্বরসহ প্যাক করা হয়। অংশগ্রহণকারী উৎপাদকদের প্রচলিত ন্যায্য বাজারদরের চেয়ে অন্তত ৩০% বেশি দেওয়া আমাদের নীতির লক্ষ্য।" },
  { question: "How do Weekly Market and Monthly Stock differ?", questionBn: "সাপ্তাহিক বাজার আর মাসিক বাজারের পার্থক্য কী?",
    answer: "Weekly Market is for fresh fish, seasonal produce and everyday items you buy each week. Monthly Stock shows long-keeping pantry products—rice, oil, dal, spices—in larger packs. Fresh fish and other perishables appear only in the Weekly Market.",
    answerBn: "সাপ্তাহিক বাজার তাজা মাছ, মৌসুমি পণ্য আর প্রতি সপ্তাহে লাগে এমন জিনিসের জন্য। মাসিক বাজারে থাকে দীর্ঘদিন রাখা যায় এমন পণ্য—চাল, তেল, ডাল, মসলা—বড় প্যাকে। তাজা মাছ ও দ্রুত নষ্ট হয় এমন পণ্য শুধু সাপ্তাহিক বাজারে পাবেন।" },
  { question: "How do I check a product’s origin?", questionBn: "পণ্যের উৎস কীভাবে জানব?",
    answer: "Every product page shows its district, producer and current batch. On a pack, enter the batch number on the Know Your Origin page or scan the QR code to see that batch’s journey.",
    answerBn: "প্রতিটি পণ্যের পাতায় জেলা, উৎপাদক ও বর্তমান ব্যাচ দেখা যায়। হাতে প্যাক থাকলে “পণ্যের উৎস জানুন” পাতায় ব্যাচ নম্বর লিখুন বা QR কোড স্ক্যান করুন—সেই ব্যাচের পুরো যাত্রা দেখতে পাবেন।" },
  { question: "What does a batch number mean?", questionBn: "ব্যাচ নম্বর মানে কী?",
    answer: "A batch is one lot of a product from one producer, collected at one time. Its number links your pack to the record of where it came from, when it was collected, how it was inspected and processed, and when it was packed.",
    answerBn: "একজন উৎপাদকের কাছ থেকে একবারে আসা একটি পণ্যের লটকে বলে ব্যাচ। ব্যাচ নম্বর আপনার প্যাকটিকে সেই রেকর্ডের সঙ্গে যুক্ত করে—কোথা থেকে এসেছে, কবে সংগ্রহ হয়েছে, কীভাবে মান যাচাই ও প্রক্রিয়াকরণ হয়েছে, কবে প্যাক হয়েছে।" },
  { question: "How do I scan a product QR code?", questionBn: "পণ্যের QR কোড কীভাবে স্ক্যান করব?",
    answer: "Open your phone’s camera and point it at the QR code on the pack, then tap the link that appears. It opens the batch page on our website. No app is needed.",
    answerBn: "ফোনের ক্যামেরা খুলে প্যাকের QR কোডের দিকে ধরুন, তারপর যে লিংক দেখাবে সেটিতে চাপ দিন। আমাদের ওয়েবসাইটে ব্যাচের পাতা খুলে যাবে। কোনো অ্যাপ লাগবে না।" },
  { question: "Are all products laboratory-tested?", questionBn: "সব পণ্য কি ল্যাবে পরীক্ষা করা?",
    answer: "No. Every batch is inspected by our team, but laboratory tests are done only for some batches. When a batch has a test report, it is shown on the product and batch pages. When it doesn’t, the page says so. This preview uses clearly labelled demonstration summaries.",
    answerBn: "না। প্রতিটি ব্যাচ আমাদের টিম যাচাই করে, তবে ল্যাব পরীক্ষা হয় কিছু ব্যাচে। কোনো ব্যাচের পরীক্ষার রিপোর্ট থাকলে তা পণ্য ও ব্যাচের পাতায় দেখানো হয়; না থাকলে সেটাও লেখা থাকে। এই প্রিভিউতে ডেমো সারাংশ স্পষ্টভাবে চিহ্নিত।",
    match: ["Are your quality reports real?"] },
  { question: "How are prices set?", questionBn: "দাম কীভাবে ঠিক হয়?",
    answer: "Each pack has one price that includes sourcing, quality handling and packing. The delivery fee for your area is shown separately in the basket and at checkout, before you place the order.",
    answerBn: "প্রতিটি প্যাকের একটি দাম, যার মধ্যে সংগ্রহ, মান যাচাই ও প্যাকিংয়ের খরচ ধরা আছে। আপনার এলাকার ডেলিভারি চার্জ ঝুড়ি ও চেকআউটে আলাদা করে দেখানো হয়—অর্ডারের আগেই।" },
  { question: "How do I schedule a delivery?", questionBn: "ডেলিভারির সময় কীভাবে ঠিক করব?",
    answer: "At checkout, choose your area, then a delivery date and an available time slot. Slots are offered for the coming days; orders placed after the daily cut-off start from the next available day.",
    answerBn: "চেকআউটে আপনার এলাকা বেছে নিন, তারপর ডেলিভারির তারিখ ও খালি থাকা সময়। সামনের কয়েক দিনের সময় দেখানো হয়; প্রতিদিনের নির্ধারিত সময়ের পরে অর্ডার করলে পরের খালি দিন থেকে বেছে নিতে পারবেন।" },
  { question: "Can I change a saved market?", questionBn: "সংরক্ষিত বাজার কি বদলানো যায়?",
    answer: "Yes. In Account → Saved markets you can rename a market, change its items and their order, update it with your current basket, or delete it. Loading a saved market adds its items at today’s prices.",
    answerBn: "হ্যাঁ। অ্যাকাউন্ট → সংরক্ষিত বাজারে গিয়ে নাম বদলাতে, পণ্য ও তাদের ক্রম বদলাতে, বর্তমান ঝুড়ি দিয়ে হালনাগাদ করতে বা মুছে ফেলতে পারবেন। সংরক্ষিত বাজার আবার নিলে আজকের দামে পণ্য যোগ হয়।" },
  { question: "Can I change or cancel an order?", questionBn: "অর্ডার কি বদলানো বা বাতিল করা যায়?",
    answer: "You can cancel from your account or order page until the order is confirmed. After that, contact the concierge and we will help.",
    answerBn: "অর্ডার নিশ্চিত হওয়ার আগ পর্যন্ত আপনার অ্যাকাউন্ট বা অর্ডারের পাতা থেকে বাতিল করতে পারবেন। এরপর কনসিয়ার্জের সঙ্গে যোগাযোগ করুন, আমরা সাহায্য করব।" },
  { question: "How do I request a replacement or refund?", questionBn: "রিপ্লেসমেন্ট বা রিফান্ড কীভাবে চাইব?",
    answer: "If an item arrives below standard, tell the concierge within 24 hours with a photo. We will replace it or credit you. See Refunds & replacements for details.",
    answerBn: "কোনো পণ্য মানসম্মত না হলে ২৪ ঘণ্টার মধ্যে ছবিসহ কনসিয়ার্জকে জানান। আমরা পণ্যটি বদলে দেব বা মূল্য ফেরত (ক্রেডিট) দেব। বিস্তারিত “রিফান্ড ও রিপ্লেসমেন্ট” পাতায়।" },
  { question: "Is online payment available?", questionBn: "অনলাইনে পেমেন্ট করা যায়?",
    answer: "Cash on Delivery is available. Mobile and online payment are shown as simulated in this preview: no money moves and no card details are collected.",
    answerBn: "ক্যাশ অন ডেলিভারি চালু আছে। মোবাইল ও অনলাইন পেমেন্ট এই প্রিভিউতে পরীক্ষামূলক—কোনো টাকা লেনদেন হয় না, কার্ডের তথ্যও নেওয়া হয় না।" },
  { question: "What does “sourced after you order” mean?", questionBn: "“অর্ডারের পর সংগ্রহ” মানে কী?",
    answer: "Some fresh fish is collected only after your order is placed and cleaned on the day of delivery, so it reaches you as fresh as possible. Its batch details are added when it is collected.",
    answerBn: "কিছু তাজা মাছ আপনার অর্ডারের পরেই সংগ্রহ করা হয় এবং ডেলিভারির দিন পরিষ্কার করা হয়, যাতে যতটা সম্ভব তাজা অবস্থায় পৌঁছায়। সংগ্রহের সময় ব্যাচের তথ্য যুক্ত হয়।" },
  { question: "How can I contact the concierge?", questionBn: "কনসিয়ার্জের সঙ্গে কীভাবে যোগাযোগ করব?",
    answer: "Send a request from the Concierge page, or call the number in the footer. If you have an account, replies also appear under Account → Concierge requests.",
    answerBn: "কনসিয়ার্জ পাতা থেকে অনুরোধ পাঠান, অথবা ফুটারে দেওয়া নম্বরে কল করুন। অ্যাকাউন্ট থাকলে উত্তর অ্যাকাউন্ট → কনসিয়ার্জ অনুরোধেও দেখতে পাবেন।" },
];
/** FAQ display order; the delivery-area question (sylhet-launch.ts) sits after sourcing. */
export const faqOrder = (q: string) => {
  const i = faqCopy.findIndex((f) => f.question === q);
  return i < 0 ? 3 : i < 3 ? i : i + 1;
};

const DRAFT = "DRAFT — this policy is a placeholder and has not been legally reviewed. It will be replaced with approved text before launch.";
const DRAFT_BN = "খসড়া — এই নীতিটি অস্থায়ী এবং আইনগতভাবে পর্যালোচনা করা হয়নি। চালুর আগে অনুমোদিত লেখা দিয়ে বদলানো হবে।";
export const pageCopy = [
  { slug: "delivery-policy", title: "Delivery policy",
    body: `${DRAFT}\n\nWe deliver your order in the delivery slot you choose at checkout. The delivery fee for your area is shown before you place the order.\n\nFresh items are packed on ice on the day of delivery.\n\nIf we cannot deliver in your chosen slot, the concierge will call you to arrange a new time.`,
    bodyBn: `${DRAFT_BN}\n\nচেকআউটে আপনি যে ডেলিভারির সময় বেছে নেন, সেই সময়েই অর্ডার পৌঁছে দেওয়া হয়। আপনার এলাকার ডেলিভারি চার্জ অর্ডারের আগেই দেখানো হয়।\n\nতাজা পণ্য ডেলিভারির দিন বরফে প্যাক করা হয়।\n\nবেছে নেওয়া সময়ে ডেলিভারি দিতে না পারলে কনসিয়ার্জ আপনাকে ফোন করে নতুন সময় ঠিক করবেন।` },
  { slug: "refund-policy", title: "Refunds & replacements",
    body: `${DRAFT}\n\nIf any item arrives below standard, tell the concierge within 24 hours and include a photo.\n\nWe will replace the item or credit you.`,
    bodyBn: `${DRAFT_BN}\n\nকোনো পণ্য মানসম্মত অবস্থায় না পৌঁছালে ২৪ ঘণ্টার মধ্যে ছবিসহ কনসিয়ার্জকে জানান।\n\nআমরা পণ্যটি বদলে দেব অথবা মূল্য ক্রেডিট হিসেবে ফেরত দেব।` },
  { slug: "privacy", title: "Privacy",
    body: `${DRAFT}\n\nWe use your contact and address details only to fulfil and support your orders.\n\nWe do not sell personal data.`,
    bodyBn: `${DRAFT_BN}\n\nআপনার যোগাযোগ ও ঠিকানার তথ্য আমরা শুধু অর্ডার পৌঁছে দেওয়া ও অর্ডার-সংক্রান্ত সহায়তার জন্য ব্যবহার করি।\n\nআমরা কারও ব্যক্তিগত তথ্য বিক্রি করি না।` },
  { slug: "terms", title: "Terms of service",
    body: `${DRAFT}\n\nThe prices shown at checkout are final and include packing and quality handling.\n\nPromotions are subject to their stated conditions.`,
    bodyBn: `${DRAFT_BN}\n\nচেকআউটে দেখানো দামই চূড়ান্ত, এতে প্যাকিং ও মান যাচাইয়ের খরচ ধরা আছে।\n\nপ্রোমোশন তার উল্লেখিত শর্ত অনুযায়ী প্রযোজ্য।` },
];

/** Apply the copy above to an existing database. Only text fields are written. */
export async function applyContent(db: PrismaClient) {
  let n = 0;
  for (const { slug, ...data } of categoryCopy) n += (await db.category.updateMany({ where: { slug }, data })).count;
  for (const { slug, ...data } of productCopy) n += (await db.product.updateMany({ where: { slug }, data })).count;
  for (const [slug, craftBn] of Object.entries(producerCraftBn)) n += (await db.producer.updateMany({ where: { slug }, data: { craftBn } })).count;
  for (const { slug, ...data } of collectionCopy) n += (await db.collection.updateMany({ where: { slug }, data })).count;
  for (const { slug, ...data } of pageCopy) n += (await db.page.updateMany({ where: { slug }, data })).count;
  for (const { match = [], ...f } of faqCopy) {
    const existing = await db.faqItem.findFirst({ where: { question: { in: [f.question, ...match] } } });
    const data = { ...f, position: faqOrder(f.question) };
    if (existing) await db.faqItem.update({ where: { id: existing.id }, data });
    else await db.faqItem.create({ data });
    n++;
  }
  return n;
}

/**
 * PREVIEW STOCK PHOTOGRAPHY — illustrative only.
 *
 * Every image here is a licensed stock photograph (Unsplash License) stored in /public/images.
 * None of them shows FarmToHome's actual producers, facilities, products or customers.
 * Uploaded images (Product images, Category.imageUrl, Collection.imageUrl, Producer.photoUrl)
 * always take precedence; these are only fallbacks so the preview looks complete.
 * Replace before launch: upload real photography in the admin panel, then delete unused files.
 * Credits are listed at /credits (data below).
 */

export type Photo = { src: string; alt: string; altBn: string; credit: string };

const U = (id: string) => `https://unsplash.com/photos/${id}`;
const P = (src: string, alt: string, altBn: string, id: string): Photo => ({ src: `/images/${src}.jpg`, alt, altBn, credit: U(id) });

export const photos = {
  goldenField: P("landscape/golden-field-sunrise", "Golden field at sunrise", "সূর্যোদয়ে সোনালি খেত", "1500382017468-9049fed747ef"),
  cropRowsHills: P("landscape/crop-rows-hills", "Rows of young crops below green hills", "সবুজ পাহাড়ের নিচে সারি সারি ফসল", "1523741543316-beb7fc7023d8"),
  greenFieldEdge: P("landscape/green-field-edge", "Edge of a green field", "সবুজ খেতের কিনারা", "1592982537447-7440770cbfc9"),
  youngCrop: P("landscape/young-crop-rows", "Young crop growing in rows", "সারি করে বেড়ে ওঠা কচি ফসল", "1625246333195-78d9c38ad449"),
  rawRice: P("products/raw-white-rice", "Uncooked white rice grains", "রান্না না করা সাদা চাল", "1586201375761-83865001e31c"),
  steamedRice: P("products/steamed-rice-bowl", "A bowl of steamed rice", "এক বাটি সাদা ভাত", "1516684732162-798a0062be99"),
  wheat: P("products/wheat-grains", "Whole wheat grains", "গোটা গমের দানা", "1574323347407-f5e1ad6d020b"),
  flourSack: P("products/flour-sack", "Flour in a cloth sack", "কাপড়ের থলেতে আটা", "1610725664285-7c57e6eeac3f"),
  fish: P("products/fresh-whole-fish", "Fresh whole fish on ice", "বরফে রাখা তাজা আস্ত মাছ", "1498654200943-1088dd4438ae"),
  fishPlate: P("products/whole-fish-plate", "Two whole fish on a plate", "থালায় দুটি আস্ত মাছ", "1510130387422-82bed34b37e9"),
  prawns: P("products/prawns-bowl", "A bowl of fresh prawns", "এক বাটি তাজা চিংড়ি", "1565680018434-b513d5e5fd47"),
  spicesFlatlay: P("products/whole-spices-flatlay", "Whole spices laid out on a table", "টেবিলে সাজানো গোটা মসলা", "1596040033229-a9821ebd058d"),
  spiceSpoons: P("products/ground-spice-spoons", "Ground spices in spoons", "চামচে গুঁড়া মসলা", "1606914469633-bd39206ea739"),
  spiceBowls: P("products/spice-bowls-market", "Bowls of spices at a market", "বাজারে বাটিতে মসলা", "1532336414038-cf19250c5757"),
  chickpeas: P("products/chickpeas-bowl", "A bowl of chickpeas", "এক বাটি ছোলা", "1515543904379-3d757afe72e4"),
  oil: P("products/oil-in-glass-jar", "Oil in a glass bottle", "কাচের বোতলে তেল", "1474979266404-7eaacbcd87c5"),
  honey: P("products/honey-dipper-jar", "Honey dripping into a jar", "বয়ামে ঝরে পড়া মধু", "1558642452-9d2a7deb7f62"),
  honeyJar: P("products/honey-jar", "A jar of honey", "এক বয়াম মধু", "1471943311424-646960669fbc"),
  butter: P("products/fresh-butter", "Fresh butter on a board", "বোর্ডে তাজা মাখন", "1589985270826-4b7bb135bc9d"),
  yogurt: P("products/yogurt-bowl", "A bowl of thick yogurt", "এক বাটি ঘন দই", "1571212515416-fef01fc43637"),
  citrus: P("products/citrus-fruit", "Fresh citrus fruit", "তাজা লেবুজাতীয় ফল", "1590502593747-42a996133562"),
  riceCurries: P("lifestyle/rice-and-curries-table", "Rice and curries served at the table", "টেবিলে পরিবেশন করা ভাত ও তরকারি", "1536304993881-ff6e9eefa2a6"),
  curryPots: P("lifestyle/curries-in-pots", "Curries in serving pots", "পাত্রে পরিবেশন করা তরকারি", "1585937421612-70a008356fbe"),
  curryRice: P("lifestyle/curry-rice-copper", "Curry with rice in copper bowls", "তামার বাটিতে ভাত ও তরকারি", "1631452180519-c014fe946bc7"),
  thali: P("lifestyle/thali-spread", "A spread of small dishes around rice", "ভাত ঘিরে নানা পদ", "1626777552726-4a6b54c97e46"),
  curryPan: P("lifestyle/curry-in-pan", "A curry simmering in a pan", "কড়াইয়ে রান্না হচ্ছে তরকারি", "1596797038530-2c107229654b"),
  fishCurry: P("lifestyle/fish-curry-pan", "Fish curry in a pan", "কড়াইয়ে মাছের ঝোল", "1574484284002-952d92456975"),
  vegMarket: P("lifestyle/vegetable-market-stall", "A vegetable market stall", "বাজারে সবজির দোকান", "1488459716781-31db52582fe9"),
  vegBaskets: P("lifestyle/vegetable-baskets", "Vegetables in market baskets", "ঝুড়িতে বাজারের সবজি", "1557844352-761f2565b576"),
  seedlings: P("journey/seedlings-by-hand", "Planting seedlings by hand", "হাতে চারা রোপণ", "1530836369250-ef72a3f5cda8"),
  harvestWorkers: P("journey/harvest-workers-field", "Workers harvesting in a field", "খেতে ফসল তুলছেন শ্রমিকরা", "1605000797499-95a51c5269ae"),
  produceCrates: P("journey/produce-crates", "Fresh produce sorted into crates", "ক্রেটে বাছাই করা তাজা পণ্য", "1471193945509-9ad0617afabf"),
  greensChilies: P("journey/greens-chilies-carrots", "Greens, chilies and carrots sorted for market", "বাজারের জন্য বাছাই করা শাক, মরিচ ও গাজর", "1464226184884-fa280b87c399"),
  carrotsCrate: P("journey/carrots-crate", "Carrots packed in a wooden crate", "কাঠের ক্রেটে প্যাক করা গাজর", "1582515073490-39981397c445"),
  marketHall: P("journey/market-hall-crates", "A market hall stocked with crates", "ক্রেটে ভরা বাজার", "1533900298318-6b8da08a523e"),
} satisfies Record<string, Photo>;
export type PhotoKey = keyof typeof photos;

/**
 * Fallback photo per product illustration key. Products without an accurate stock photo
 * (shutki, gur, chira, lentils) keep their drawn illustration rather than a misleading picture.
 */
const byArt: Record<string, PhotoKey> = {
  "rice:0": "rawRice", "rice:1": "steamedRice", "rice:2": "rawRice", "grain:0": "flourSack",
  "fish:0": "fish", "fish:1": "fishPlate", "fish:2": "fishPlate", "fish:3": "fish", "prawn:0": "prawns",
  "spice:0": "spiceSpoons", "spice:1": "spiceSpoons", "spice:2": "spicesFlatlay", "seed:0": "spiceBowls",
  "chola:0": "chickpeas", "oil:0": "oil", "honey:0": "honey", "ghee:0": "butter", "doi:0": "yogurt", "citrus:0": "citrus",
};
export function photoForArt(artKey?: string | null): Photo | null {
  return artKey && byArt[artKey] ? photos[byArt[artKey]] : null;
}

export const categoryPhoto: Record<string, PhotoKey> = {
  "rice-grains": "rawRice", "fish-seafood": "fish", "spices-herbs": "spicesFlatlay",
  "pulses-lentils": "chickpeas", "oils-honey-ghee": "honeyJar", "regional-seasonal": "vegBaskets",
};
export const collectionPhoto: Record<string, PhotoKey> = {
  "winter-arrivals": "goldenField", "pantry-foundations": "spiceBowls", "a-bengali-fish-feast": "fishCurry",
};
/**
 * Illustrative scenes for producer cards, chosen by what the producer makes and varied by
 * slug so neighbouring cards differ. Never a portrait of the named person.
 */
const scenes: Record<string, PhotoKey[]> = {
  fish: ["fishPlate", "fish", "fishCurry", "prawns"],
  field: ["harvestWorkers", "cropRowsHills", "youngCrop", "goldenField", "seedlings", "greenFieldEdge"],
  spice: ["spiceBowls", "spicesFlatlay", "spiceSpoons"],
  honey: ["honeyJar", "honey"],
  kitchen: ["produceCrates", "butter", "yogurt", "curryPan", "oil"],
  other: ["cropRowsHills", "vegBaskets", "greensChilies", "citrus"],
};
export function producerScene(craft?: string | null, slug = ""): Photo {
  const c = (craft ?? "").toLowerCase();
  const group = /fish|haor|prawn|dryer|shutki/.test(c) ? "fish"
    : /spice|turmeric|chili|cumin|import/.test(c) ? "spice"
    : /honey|mowal/.test(c) ? "honey"
    : /oil|ghani|ghee|doi|gur|sap/.test(c) ? "kitchen"
    : /rice|wheat|chira|grower|farmer|lentil|mung|chickpea/.test(c) ? "field" : "other";
  const list = scenes[group];
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return photos[list[h % list.length]];
}
export const stagePhoto: Record<string, PhotoKey> = {
  source: "harvestWorkers", collection: "carrotsCrate", inspection: "greensChilies", processing: "rawRice",
  packaging: "produceCrates", farmtohome: "marketHall", delivery: "riceCurries",
};
export const altFor = (p: Photo, locale: string) => (locale === "bn" ? p.altBn : p.alt);

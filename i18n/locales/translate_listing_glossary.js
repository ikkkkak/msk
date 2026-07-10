/**
 * Glossary-based listing translations for keys still identical to EN.
 * Run after sync_screen_keys.js and patch_broker_locales.js
 */
const fs = require("fs");
const path = require("path");
const { flatten } = require("./localeUtils");

const dir = __dirname;
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
let fr = JSON.parse(fs.readFileSync(path.join(dir, "fr.json"), "utf8"));
let ar = JSON.parse(fs.readFileSync(path.join(dir, "ar.json"), "utf8"));

function setPath(obj, dotted, value) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

const PHRASES_FR = {
  "Let's list your property": "Mettons votre bien en vente",
  "Ready to sell?": "Prêt à vendre ?",
  "Creating a great listing takes just a few minutes.":
    "Créer une bonne annonce ne prend que quelques minutes.",
  "Give your property a title": "Donnez un titre à votre bien",
  "What type of property?": "Quel type de bien ?",
  "Set your asking price": "Fixez votre prix de vente",
  "How many bedrooms?": "Combien de chambres ?",
  "How many bathrooms?": "Combien de salles de bain ?",
  "Skip - Not applicable": "Passer — non applicable",
  "Optional - skip if not applicable": "Facultatif — passer si non applicable",
  "What's the total area?": "Quelle est la surface totale ?",
  "Which country?": "Quel pays ?",
  "Where is it located?": "Où se situe le bien ?",
  "Mark your location": "Indiquez l'emplacement sur la carte",
  "Add photos or video": "Ajoutez des photos ou une vidéo",
  "Review your listing": "Vérifiez votre annonce",
  "Describe your property": "Décrivez votre bien",
  "Which zone?": "Quelle zone ?",
  "Which quartier?": "Quel quartier ?",
  "Is this your plot?": "Est-ce votre parcelle ?",
  "Property papers": "Documents fonciers",
  "Plot number": "Numéro de parcelle",
  "List your land": "Mettez votre terrain en vente",
  "Let's get started": "Commençons",
  "Rent out your place": "Louez votre logement",
  "Add photos": "Ajouter des photos",
  "Publish": "Publier",
  "Next": "Suivant",
  "Back": "Retour",
  "Required": "Obligatoire",
  "Optional": "Facultatif",
  "Search": "Rechercher",
  "Not set": "Non renseigné",
  "Apartment": "Appartement",
  "House": "Maison",
  "Villa": "Villa",
  "Studio": "Studio",
  "Duplex": "Duplex",
  "Townhouse": "Maison de ville",
  "Property listed successfully!": "Bien mis en vente avec succès !",
  "Property": "Bien",
  "Location": "Emplacement",
  "Price": "Prix",
  "Area": "Surface",
  "Title": "Titre",
  "Type": "Type",
  "Media": "Médias",
  "Video": "Vidéo",
  "Added": "Ajouté",
  "Bedrooms": "Chambres",
  "Bathrooms": "Salles de bain",
  "City": "Ville",
  "Zone": "Zone",
  "Quartier": "Quartier",
  "Checking…": "Vérification…",
  "Upload failed": "Échec du téléversement",
  "Error": "Erreur",
  "Agency": "Agence",
  "Deactivate": "Désactiver",
  "Reactivate": "Réactiver",
  "Delete": "Supprimer",
  "Sold": "Vendu",
  "Pending": "En attente",
  "Approved": "Approuvé",
  "Rejected": "Refusé",
  "Published": "Publié",
  "Draft": "Brouillon",
  "Verified": "Vérifié",
  "Loading...": "Chargement…",
  "Create Agency": "Créer une agence",
  "Your Agency": "Votre agence",
  "Properties": "Biens",
  "Members": "Membres",
  "Invite": "Inviter",
  "Join": "Rejoindre",
  "Leave": "Quitter",
};

const PHRASES_AR = {
  "Let's list your property": "لنُدرج عقارك للبيع",
  "Ready to sell?": "هل أنت مستعد للبيع؟",
  "Creating a great listing takes just a few minutes.":
    "إنشاء إعلان جيد يستغرق دقائق فقط.",
  "Give your property a title": "أعطِ عقارك عنواناً",
  "What type of property?": "ما نوع العقار؟",
  "Set your asking price": "حدّد سعر البيع",
  "How many bedrooms?": "كم عدد غرف النوم؟",
  "How many bathrooms?": "كم عدد الحمامات؟",
  "Skip - Not applicable": "تخطّ — غير منطبق",
  "Optional - skip if not applicable": "اختياري — تخطّ إن لم ينطبق",
  "What's the total area?": "ما المساحة الإجمالية؟",
  "Which country?": "ما الدولة؟",
  "Where is it located?": "أين يقع العقار؟",
  "Mark your location": "حدّد الموقع على الخريطة",
  "Add photos or video": "أضف صوراً أو فيديو",
  "Review your listing": "راجع إعلانك",
  "Describe your property": "صف عقارك",
  "Which zone?": "ما المنطقة؟",
  "Which quartier?": "ما الحي؟",
  "Is this your plot?": "هل هذه قطعتك؟",
  "Property papers": "الوثائق العقارية",
  "Plot number": "رقم القطعة",
  "List your land": "اعرض أرضك للبيع",
  "Let's get started": "لنبدأ",
  "Rent out your place": "أجرِ مسكنك",
  "Add photos": "إضافة صور",
  "Publish": "نشر",
  "Next": "التالي",
  "Back": "رجوع",
  "Required": "مطلوب",
  "Optional": "اختياري",
  "Search": "بحث",
  "Not set": "غير محدد",
  "Apartment": "شقة",
  "House": "منزل",
  "Villa": "فيلا",
  "Studio": "استوديو",
  "Duplex": "دوبلكس",
  "Townhouse": "تاون هاوس",
  "Property listed successfully!": "تم إدراج العقار بنجاح!",
  "Property": "عقار",
  "Location": "الموقع",
  "Price": "السعر",
  "Area": "المساحة",
  "Title": "العنوان",
  "Type": "النوع",
  "Media": "الوسائط",
  "Video": "فيديو",
  "Added": "مُضاف",
  "Bedrooms": "غرف النوم",
  "Bathrooms": "الحمامات",
  "City": "المدينة",
  "Zone": "المنطقة",
  "Quartier": "الحي",
  "Checking…": "جاري التحقق…",
  "Upload failed": "فشل الرفع",
  "Error": "خطأ",
  "Agency": "الوكالة",
  "Deactivate": "إلغاء التفعيل",
  "Reactivate": "إعادة التفعيل",
  "Delete": "حذف",
  "Sold": "مباع",
  "Pending": "قيد الانتظار",
  "Approved": "موافق عليه",
  "Rejected": "مرفوض",
  "Published": "منشور",
  "Draft": "مسودة",
  "Verified": "موثّق",
  "Loading...": "جاري التحميل…",
  "Create Agency": "إنشاء وكالة",
  "Your Agency": "وكالتك",
  "Properties": "العقارات",
  "Members": "الأعضاء",
  "Invite": "دعوة",
  "Join": "انضمام",
  "Leave": "مغادرة",
};

const WORDS_FR = [
  ["properties", "biens"],
  ["property", "bien"],
  ["listing", "annonce"],
  ["listings", "annonces"],
  ["buyers", "acheteurs"],
  ["buyer", "acheteur"],
  ["photos", "photos"],
  ["photo", "photo"],
  ["optional", "facultatif"],
  ["required", "obligatoire"],
  ["location", "emplacement"],
  ["price", "prix"],
  ["area", "surface"],
  ["bedroom", "chambre"],
  ["bathroom", "salle de bain"],
  ["description", "description"],
  ["amenities", "équipements"],
  ["features", "caractéristiques"],
  ["outdoor", "extérieur"],
  ["indoor", "intérieur"],
  ["review", "vérification"],
  ["publish", "publier"],
  ["upload", "téléverser"],
  ["select", "sélectionnez"],
  ["choose", "choisissez"],
  ["enter", "saisissez"],
  ["skip", "passer"],
  ["country", "pays"],
  ["city", "ville"],
  ["zone", "zone"],
  ["quartier", "quartier"],
  ["plot", "parcelle"],
  ["land", "terrain"],
  ["sale", "vente"],
  ["rent", "location"],
];

const WORDS_AR = [
  ["properties", "العقارات"],
  ["property", "العقار"],
  ["listing", "الإعلان"],
  ["listings", "الإعلانات"],
  ["buyers", "المشترين"],
  ["buyer", "المشتري"],
  ["optional", "اختياري"],
  ["required", "مطلوب"],
  ["location", "الموقع"],
  ["price", "السعر"],
  ["area", "المساحة"],
  ["bedroom", "غرفة نوم"],
  ["bathroom", "حمام"],
  ["description", "الوصف"],
  ["amenities", "المرافق"],
  ["features", "الميزات"],
  ["outdoor", "خارجي"],
  ["indoor", "داخلي"],
  ["review", "مراجعة"],
  ["publish", "نشر"],
  ["upload", "رفع"],
  ["select", "اختر"],
  ["choose", "اختر"],
  ["enter", "أدخل"],
  ["skip", "تخطّ"],
  ["country", "الدولة"],
  ["city", "المدينة"],
  ["zone", "المنطقة"],
  ["quartier", "الحي"],
  ["plot", "القطعة"],
  ["land", "الأرض"],
  ["sale", "البيع"],
  ["rent", "الإيجار"],
  ["photos", "الصور"],
  ["photo", "صورة"],
  ["video", "فيديو"],
];

function gloss(text, words) {
  let out = text;
  for (const [en, loc] of words) {
    out = out.replace(new RegExp(`\\b${en}\\b`, "gi"), (m) =>
      m[0] === m[0].toUpperCase()
        ? loc.charAt(0).toUpperCase() + loc.slice(1)
        : loc,
    );
  }
  return out;
}

function translate(text, phrases, words) {
  if (phrases[text]) return phrases[text];
  return gloss(text, words);
}

const enFlat = flatten(en);
let frN = 0;
let arN = 0;

for (const [key, enText] of Object.entries(enFlat)) {
  if (
    !key.startsWith("listing.") &&
    !key.startsWith("listingAi.") &&
    !key.startsWith("organization.")
  )
    continue;
  if (typeof enText !== "string") continue;

  const frFlat = flatten(fr);
  if (frFlat[key] === enText) {
    setPath(fr, key, translate(enText, PHRASES_FR, WORDS_FR));
    frN++;
  }
  const arFlat = flatten(ar);
  if (arFlat[key] === enText) {
    setPath(ar, key, translate(enText, PHRASES_AR, WORDS_AR));
    arN++;
  }
}

fs.writeFileSync(path.join(dir, "fr.json"), JSON.stringify(fr, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "ar.json"), JSON.stringify(ar, null, 2) + "\n");

console.log("Glossary listing translations — FR:", frN, "AR:", arN);

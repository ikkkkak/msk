/**
 * Restore namespaces lost after locale git checkout.
 * Run: node patch_missing_namespaces.js
 */
const fs = require("fs");
const path = require("path");

const dir = __dirname;

const NAMESPACES = {
  hostOnboarding: {
    en: {
      cardEyebrow: "Hosting",
      cardTitle: "Become a host on Meskeny",
      cardCta: "Open host controls",
      cardA11y: "Open host controls — start hosting",
      sheetTitle: "What would you like to host?",
      sheetSubtitle: "Choose a listing type. You can change this later.",
      listingSale: "House for sale",
      listingSaleSub: "List a property for buyers",
      listingRent: "House for rent",
      listingRentSub: "List a home for tenants",
      listingLand: "Land for sale",
      listingLandSub: "List land or plots",
      back: "Back",
      agencyQuestion: "Are you an agency?",
      agencyQuestionSub:
        "Agencies can assign listings to their organization profile.",
      agencyYes: "Yes, I'm an agency",
      agencyNo: "No, personal listing",
      createAgencyTitle: "Create your agency",
      createAgencySub:
        "You don't have an agency profile yet. Create one to manage team listings.",
      createAgencyCta: "Create agency",
      personalInstead: "Continue as personal host",
      assignTitle: "Assign to your agency",
      agencyDefaultType: "Real estate agency",
      assignToAgency: "This listing will be published under {{name}}",
      termsLabel: "I agree to Meskeny hosting terms for agency listings",
      termsPersonal: "I agree to Meskeny hosting terms for personal listings",
      continue: "Continue",
      continueListing: "Continue to listing",
      personalTitle: "Personal listing",
      personalSub:
        "Your listing will be published under your personal host profile.",
    },
    fr: {
      cardEyebrow: "Hébergement",
      cardTitle: "Devenez hôte sur Meskeny",
      cardCta: "Ouvrir les contrôles hôte",
      cardA11y: "Ouvrir les contrôles hôte — commencer à héberger",
      sheetTitle: "Que souhaitez-vous proposer ?",
      sheetSubtitle:
        "Choisissez un type d'annonce. Vous pourrez le modifier plus tard.",
      listingSale: "Maison à vendre",
      listingSaleSub: "Publier un bien pour les acheteurs",
      listingRent: "Maison à louer",
      listingRentSub: "Publier un logement pour les locataires",
      listingLand: "Terrain à vendre",
      listingLandSub: "Publier un terrain ou des parcelles",
      back: "Retour",
      agencyQuestion: "Êtes-vous une agence ?",
      agencyQuestionSub:
        "Les agences peuvent attribuer les annonces à leur profil d'organisation.",
      agencyYes: "Oui, je suis une agence",
      agencyNo: "Non, annonce personnelle",
      createAgencyTitle: "Créer votre agence",
      createAgencySub:
        "Vous n'avez pas encore de profil d'agence. Créez-en un pour gérer les annonces de l'équipe.",
      createAgencyCta: "Créer l'agence",
      personalInstead: "Continuer en tant qu'hôte personnel",
      assignTitle: "Attribuer à votre agence",
      agencyDefaultType: "Agence immobilière",
      assignToAgency: "Cette annonce sera publiée sous {{name}}",
      termsLabel:
        "J'accepte les conditions d'hébergement Meskeny pour les annonces d'agence",
      termsPersonal:
        "J'accepte les conditions d'hébergement Meskeny pour les annonces personnelles",
      continue: "Continuer",
      continueListing: "Continuer vers l'annonce",
      personalTitle: "Annonce personnelle",
      personalSub:
        "Votre annonce sera publiée sous votre profil d'hôte personnel.",
    },
    ar: {
      cardEyebrow: "الاستضافة",
      cardTitle: "كن مضيفاً على مسكني",
      cardCta: "فتح لوحة تحكم المضيف",
      cardA11y: "فتح لوحة تحكم المضيف — ابدأ الاستضافة",
      sheetTitle: "ماذا تريد أن تستضيف؟",
      sheetSubtitle: "اختر نوع الإعلان. يمكنك تغييره لاحقاً.",
      listingSale: "منزل للبيع",
      listingSaleSub: "أدرج عقاراً للمشترين",
      listingRent: "منزل للإيجار",
      listingRentSub: "أدرج منزلاً للمستأجرين",
      listingLand: "أرض للبيع",
      listingLandSub: "أدرج أرضاً أو قطعاً",
      back: "رجوع",
      agencyQuestion: "هل أنت وكالة؟",
      agencyQuestionSub: "يمكن للوكالات إسناد الإعلانات إلى ملف منظمتها.",
      agencyYes: "نعم، أنا وكالة",
      agencyNo: "لا، إدراج شخصي",
      createAgencyTitle: "أنشئ وكالتك",
      createAgencySub:
        "ليس لديك ملف وكالة بعد. أنشئ واحداً لإدارة إعلانات الفريق.",
      createAgencyCta: "إنشاء وكالة",
      personalInstead: "المتابعة كمضيف شخصي",
      assignTitle: "إسناد إلى وكالتك",
      agencyDefaultType: "وكالة عقارية",
      assignToAgency: "سيُنشر هذا الإعلان تحت {{name}}",
      termsLabel: "أوافق على شروط الاستضافة في مسكني للإعلانات الوكالية",
      termsPersonal: "أوافق على شروط الاستضافة في مسكني للإعلانات الشخصية",
      continue: "متابعة",
      continueListing: "متابعة إلى الإدراج",
      personalTitle: "إدراج شخصي",
      personalSub: "سيُنشر إعلانك تحت ملفك الشخصي كمضيف.",
    },
  },
  habitatCadastre: {
    en: {
      mapChip: "Zone & quartier",
      sheetTitle: "Where should the map focus?",
      clearAll: "Clear selection",
      searchPlaceholder: "Search zone, quartier, or plot number",
      resultsCount: "{{count}} results",
      noResults: "No results",
      emptySearchHint:
        "Try a zone name, quartier, or plot number (2+ characters)",
      sectionLocation: "Location",
      zoneLabel: "Zone",
      quartierLabel: "Quartier",
      anyZone: "Any zone",
      anyQuartier: "Any quartier",
      pickZoneFirst: "Select a zone first",
      applyZone: "Show zone on map",
      applyQuartier: "Show quartier on map",
      pickZoneTitle: "Choose zone",
      pickQuartierTitle: "Choose quartier",
      searchZonePlaceholder: "Search by name or code…",
      searchQuartierPlaceholder: "Search quartier…",
      zoneCount: "{{count}} zones",
      quartierCount: "{{count}} quartiers",
      badgeZone: "Zone",
      badgeQuartier: "Quartier",
      badgePlot: "Plot",
      badgeForSale: "For sale",
      plotTitle: "Plot {{number}}",
      pickerEmpty: "No results",
      plotNumberLabel: "Plot number",
      plotNumberPlaceholder: "Type a plot number (within this area)…",
      plotNumberSearch: "Search plot",
      plotNumberHintSelectArea: "Select an area first to search by plot number.",
      plotNumberNotFound: "No plot with this number in this area.",
      levelMap: "Map",
      levelPlans: "{{count}} zones",
      levelSectors: "{{count}} areas",
      levelPlotsCount: "{{count}} plots",
      levelPlotsRange: "{{drawn}} / {{total}} plots",
      errorLoadSubdivision: "Could not load subdivision data",
      emptyPlotsForArea: "No plots for this area",
      emptyAreasForZone: "No areas for this zone",
      loadingZones: "Loading zones...",
      loadingPlotsInArea: "Loading area plots...",
      card: {
        zone: "Zone",
        area: "Area",
        areaSize: "Area size",
        dimensions: "Dimensions",
        frontHeight: "Front height",
        backHeight: "Back height",
        res: "RES",
        forSale: "For sale",
        plotNumber: "Plot number",
        viewAllDetails: "View all details",
      },
    },
    fr: {
      mapChip: "Zone et quartier",
      sheetTitle: "Où centrer la carte ?",
      clearAll: "Effacer la sélection",
      searchPlaceholder: "Zone, quartier ou numéro de parcelle",
      resultsCount: "{{count}} résultats",
      noResults: "Aucun résultat",
      emptySearchHint:
        "Essayez une zone, un quartier ou un numéro de parcelle (2 caractères min.)",
      sectionLocation: "Emplacement",
      zoneLabel: "Zone",
      quartierLabel: "Quartier",
      anyZone: "Toutes les zones",
      anyQuartier: "Tous les quartiers",
      pickZoneFirst: "Sélectionnez d'abord une zone",
      applyZone: "Afficher la zone sur la carte",
      applyQuartier: "Afficher le quartier sur la carte",
      pickZoneTitle: "Choisir une zone",
      pickQuartierTitle: "Choisir un quartier",
      searchZonePlaceholder: "Rechercher par nom ou code…",
      searchQuartierPlaceholder: "Rechercher un quartier…",
      zoneCount: "{{count}} zones",
      quartierCount: "{{count}} quartiers",
      badgeZone: "Zone",
      badgeQuartier: "Quartier",
      badgePlot: "Parcelle",
      badgeForSale: "À vendre",
      plotTitle: "Parcelle {{number}}",
      pickerEmpty: "Aucun résultat",
      plotNumberLabel: "Numéro de parcelle",
      plotNumberPlaceholder: "Saisir un numéro de parcelle (dans ce secteur)…",
      plotNumberSearch: "Rechercher",
      plotNumberHintSelectArea:
        "Sélectionnez d'abord un secteur pour rechercher par numéro.",
      plotNumberNotFound: "Aucune parcelle avec ce numéro dans ce secteur.",
      levelMap: "Carte",
      levelPlans: "{{count}} zones",
      levelSectors: "{{count}} secteurs",
      levelPlotsCount: "{{count}} parcelles",
      levelPlotsRange: "{{drawn}} / {{total}} parcelles",
      errorLoadSubdivision: "Impossible de charger les données cadastrales",
      emptyPlotsForArea: "Aucune parcelle pour ce secteur",
      emptyAreasForZone: "Aucun secteur pour cette zone",
      loadingZones: "Chargement des zones…",
      loadingPlotsInArea: "Chargement des parcelles…",
      card: {
        zone: "Zone",
        area: "Secteur",
        areaSize: "Superficie",
        dimensions: "Dimensions",
        frontHeight: "Hauteur façade",
        backHeight: "Hauteur arrière",
        res: "RES",
        forSale: "À vendre",
        plotNumber: "Numéro de parcelle",
        viewAllDetails: "Voir tous les détails",
      },
    },
    ar: {
      mapChip: "المنطقة والحي",
      sheetTitle: "أين تريد عرض الخريطة؟",
      clearAll: "إلغاء التحديد",
      searchPlaceholder: "ابحث عن منطقة، حي، أو رقم قطعة",
      resultsCount: "{{count}} نتيجة",
      noResults: "لا توجد نتائج",
      emptySearchHint: "جرّب اسم منطقة، حي، أو رقم قطعة (حرفان على الأقل)",
      sectionLocation: "الموقع",
      zoneLabel: "المنطقة",
      quartierLabel: "الحي",
      anyZone: "كل المناطق",
      anyQuartier: "كل الأحياء",
      pickZoneFirst: "اختر المنطقة أولاً",
      applyZone: "عرض المنطقة على الخريطة",
      applyQuartier: "عرض الحي على الخريطة",
      pickZoneTitle: "اختر المنطقة",
      pickQuartierTitle: "اختر الحي",
      searchZonePlaceholder: "ابحث بالاسم أو الرمز…",
      searchQuartierPlaceholder: "ابحث عن حي…",
      zoneCount: "{{count}} منطقة",
      quartierCount: "{{count}} حي",
      badgeZone: "منطقة",
      badgeQuartier: "حي",
      badgePlot: "قطعة",
      badgeForSale: "للبيع",
      plotTitle: "قطعة {{number}}",
      pickerEmpty: "لا توجد نتائج",
      plotNumberLabel: "رقم القطعة",
      plotNumberPlaceholder: "أدخل رقم قطعة (ضمن هذا الحي)…",
      plotNumberSearch: "بحث",
      plotNumberHintSelectArea: "اختر الحي أولاً للبحث برقم القطعة.",
      plotNumberNotFound: "لا توجد قطعة بهذا الرقم في هذا الحي.",
      levelMap: "خريطة",
      levelPlans: "{{count}} مناطق",
      levelSectors: "{{count}} أحياء",
      levelPlotsCount: "{{count}} قطع",
      levelPlotsRange: "{{drawn}} / {{total}} قطع",
      errorLoadSubdivision: "تعذّر تحميل بيانات التقسيم",
      emptyPlotsForArea: "لا توجد قطع في هذا الحي",
      emptyAreasForZone: "لا توجد أحياء في هذه المنطقة",
      loadingZones: "جاري تحميل المناطق…",
      loadingPlotsInArea: "جاري تحميل قطع الحي…",
      card: {
        zone: "المنطقة",
        area: "الحي",
        areaSize: "المساحة",
        dimensions: "الأبعاد",
        frontHeight: "ارتفاع الواجهة",
        backHeight: "الارتفاع الخلفي",
        res: "RES",
        forSale: "للبيع",
        plotNumber: "رقم القطعة",
        viewAllDetails: "عرض كل التفاصيل",
      },
    },
  },
};

const SUPPLEMENTAL = {
  en: {
    account: {
      brokerIdLine: "Broker ID · {{id}}",
      brokerVerifiedSub:
        "Your broker credentials are confirmed on Meskeny.",
      signUpOrSignIn: {
        title: "Create an account or sign in",
        subtitle:
          "Sign in to manage your listings, upload videos, and access host tools.",
      },
    },
    apiErrors: {
      AUTH_INVALID_CREDENTIALS: "Incorrect email/phone or password.",
      AUTH_UNAUTHORIZED: "You need to sign in again.",
      NET_DNS: "Unable to connect right now. Please try again later.",
      NET_NO_RESPONSE:
        "Unable to connect right now. Check your internet connection and try again.",
      NET_OFFLINE:
        "No internet connection. Connect to the internet and try again.",
      NET_SSL: "Secure connection failed. Please try again.",
      NET_TIMEOUT: "The request timed out. Please try again.",
      NET_UNKNOWN: "A network error occurred. Please try again.",
      SERVER_INTERNAL:
        "Something went wrong on our side. Please try again shortly.",
      SERVER_OK: "Server online",
      UNKNOWN: "Something went wrong. Please try again.",
      USER_CHECK_BOTH_IDENTIFIERS: "Use either email or phone, not both.",
      USER_CHECK_INVALID_BODY: "Invalid request. Please try again.",
      USER_CHECK_NO_IDENTIFIER: "Enter your email or phone number to continue.",
      VALIDATION_FAILED: "Please check your details and try again.",
      serverUnreachableTitle: "Connection problem",
    },
    auth: {
      error: {
        invalidCredentials: "Incorrect email/phone or password.",
      },
      validation: {
        phoneInvalid: "Please enter a valid 8-digit phone number",
      },
    },
    broker: {
      dashboard: {
        subtitle:
          "Build trust with buyers. Simple steps — profile photo, languages, and ID check.",
        pendingSub:
          "We usually respond within 24–48 hours. You'll get the verified badge once approved.",
        verifiedSub:
          "Your listings display verified status. Buyers can confirm your broker ID on each listing.",
      },
      sheet: {
        verifiedTitle: "You're verified",
        verifiedLead:
          "Meskeny confirmed your identity. Buyers see your verified status on listings.",
        bulletListings:
          "Verified badge on sale, rent, and landmark listings",
        bulletSearch: "Higher visibility in search results",
        bulletPrivacy:
          "Control photo and name visibility in Account settings",
      },
      status: {
        verifiedTitle: "You're verified",
        verifiedBody:
          "Your broker ID is active on your listings. Manage how your name and photo appear in Account settings.",
        pendingBody:
          "We usually finish reviews within 24–48 hours. You'll get the verified badge when approved.",
        rejectedBody:
          "You can submit a new application with clearer photos and documents.",
      },
      step1: {
        body: "A quick check unlocks your verified badge on listings. We review applications within 24–48 hours.",
      },
      step2: {
        body: "Use a clear headshot with your face visible. This may appear on your listings.",
      },
      step3: {
        body: "Select every language you can use with buyers.",
      },
      step4: {
        body: "Choose your document type. Photos should be sharp and readable.",
        passportUpload: "Photo of the information page.",
      },
      lang: {
        ar: "Arabic",
        fr: "French",
        en: "English",
        hassaniya: "Hassaniya",
        wolof: "Wolof",
        pulaar: "Pulaar",
        soninke: "Soninke",
      },
      settingsSaveError:
        "Could not save your broker profile preference. Please try again.",
      showProfileOnListingsTitle: "Show photo & name on listings",
      showProfileOnListingsSubtitle:
        "When off, buyers still see your verified broker badge and ID on property and landmark pages.",
      profileHiddenPublic:
        "Photo hidden. Identity verified by Meskeny.",
    },
  },
  fr: {
    account: {
      brokerIdLine: "ID courtier · {{id}}",
      brokerVerifiedSub:
        "Vos références de courtier sont confirmées sur Meskeny.",
      signUpOrSignIn: {
        title: "Créer un compte ou se connecter",
        subtitle:
          "Connectez-vous pour gérer vos annonces, publier des vidéos et accéder aux outils hôte.",
      },
    },
    broker: {
      dashboard: {
        subtitle:
          "Gagnez la confiance des acheteurs. Étapes simples — photo, langues et pièce d'identité.",
        pendingSub:
          "Nous répondons généralement sous 24 à 48 h. Vous obtiendrez le badge vérifié une fois approuvé.",
        verifiedSub:
          "Vos annonces affichent le statut vérifié. Les acheteurs peuvent confirmer votre ID courtier sur chaque annonce.",
      },
      sheet: {
        verifiedTitle: "Vous êtes vérifié",
        verifiedLead:
          "Meskeny a confirmé votre identité. Les acheteurs voient votre statut vérifié sur les annonces.",
        bulletListings:
          "Badge vérifié sur les annonces vente, location et points d'intérêt",
        bulletSearch: "Meilleure visibilité dans les résultats de recherche",
        bulletPrivacy:
          "Contrôlez la visibilité de votre photo et nom dans les réglages du compte",
      },
      status: {
        verifiedTitle: "Vous êtes vérifié",
        verifiedBody:
          "Votre ID courtier est actif sur vos annonces. Gérez l'affichage de votre nom et photo dans les réglages.",
        pendingBody:
          "Nous terminons généralement les examens sous 24 à 48 h. Vous obtiendrez le badge une fois approuvé.",
        rejectedBody:
          "Vous pouvez soumettre une nouvelle demande avec des photos et documents plus clairs.",
      },
      step1: {
        body: "Une vérification rapide débloque votre badge vérifié. Nous examinons les demandes sous 24 à 48 h.",
      },
      step2: {
        body: "Utilisez une photo claire avec votre visage visible. Elle peut apparaître sur vos annonces.",
      },
      step3: {
        body: "Sélectionnez chaque langue que vous utilisez avec les acheteurs.",
      },
      step4: {
        body: "Choisissez votre type de document. Les photos doivent être nettes et lisibles.",
        passportUpload: "Photo de la page d'informations.",
      },
      lang: {
        ar: "Arabe",
        fr: "Français",
        en: "Anglais",
        hassaniya: "Hassaniya",
        wolof: "Wolof",
        pulaar: "Pulaar",
        soninke: "Soninké",
      },
      settingsSaveError:
        "Impossible d'enregistrer votre préférence de profil courtier. Réessayez.",
      showProfileOnListingsTitle: "Afficher photo et nom sur les annonces",
      showProfileOnListingsSubtitle:
        "Si désactivé, les acheteurs voient toujours votre badge vérifié et votre ID courtier.",
      profileHiddenPublic:
        "Photo masquée. Identité vérifiée par Meskeny.",
    },
    auth: {
      error: {
        invalidCredentials: "E-mail/téléphone ou mot de passe incorrect.",
      },
      validation: {
        phoneInvalid: "Veuillez entrer un numéro de téléphone valide à 8 chiffres",
      },
    },
  },
  ar: {
    account: {
      brokerIdLine: "معرّف الوسيط · {{id}}",
      brokerVerifiedSub: "تم تأكيد بيانات الوسيط الخاصة بك على مسكني.",
      signUpOrSignIn: {
        title: "إنشاء حساب أو تسجيل الدخول",
        subtitle:
          "سجّل الدخول لإدارة إعلاناتك ورفع الفيديوهات والوصول إلى أدوات المضيف.",
      },
    },
    broker: {
      dashboard: {
        subtitle:
          "ابنِ ثقة المشترين. خطوات بسيطة — صورة الملف، اللغات، والتحقق من الهوية.",
        pendingSub:
          "نرد عادة خلال 24–48 ساعة. ستحصل على شارة التوثيق بعد الموافقة.",
        verifiedSub:
          "تعرض إعلاناتك حالة التوثيق. يمكن للمشترين التحقق من معرّف الوسيط في كل إعلان.",
      },
      sheet: {
        verifiedTitle: "أنت موثّق",
        verifiedLead:
          "أكدت مسكني هويتك. يرى المشترون حالة التوثيق على الإعلانات.",
        bulletListings: "شارة موثّق على إعلانات البيع والإيجار والمعالم",
        bulletSearch: "ظهور أعلى في نتائج البحث",
        bulletPrivacy: "تحكم في ظهور صورتك واسمك من إعدادات الحساب",
      },
      status: {
        verifiedTitle: "أنت موثّق",
        verifiedBody:
          "معرّف الوسيط نشط على إعلاناتك. أدر ظهور اسمك وصورتك من إعدادات الحساب.",
        pendingBody:
          "ننهي المراجعات عادة خلال 24–48 ساعة. ستحصل على الشارة عند الموافقة.",
        rejectedBody:
          "يمكنك تقديم طلب جديد بصور ومستندات أوضح.",
      },
      step1: {
        body: "فحص سريع يفتح شارة التوثيق على إعلاناتك. نراجع الطلبات خلال 24–48 ساعة.",
      },
      step2: {
        body: "استخدم صورة واضحة لوجهك. قد تظهر على إعلاناتك.",
      },
      step3: {
        body: "اختر كل لغة تستطيع التواصل بها مع المشترين.",
      },
      step4: {
        body: "اختر نوع المستند. يجب أن تكون الصور واضحة ومقروءة.",
        passportUpload: "صورة صفحة المعلومات.",
      },
      lang: {
        ar: "العربية",
        fr: "الفرنسية",
        en: "الإنجليزية",
        hassaniya: "الحسانية",
        wolof: "الولوفية",
        pulaar: "البولارية",
        soninke: "السونينكية",
      },
      settingsSaveError: "تعذّر حفظ تفضيل ملف الوسيط. حاول مرة أخرى.",
      showProfileOnListingsTitle: "إظهار الصورة والاسم على الإعلانات",
      showProfileOnListingsSubtitle:
        "عند الإيقاف، يرى المشترون شارة التوثيق ومعرّف الوسيط على صفحات العقارات.",
      profileHiddenPublic: "الصورة مخفية. الهوية موثّقة من مسكني.",
    },
    auth: {
      error: {
        invalidCredentials: "البريد/الهاتف أو كلمة المرور غير صحيحة.",
      },
      validation: {
        phoneInvalid: "يرجى إدخال رقم هاتف صالح مكوّن من 8 أرقام",
      },
    },
  },
};

function deepMergeMissing(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object") target[k] = {};
      deepMergeMissing(target[k], v);
    } else if (target[k] === undefined) {
      target[k] = v;
    }
  }
}

for (const lang of ["en", "fr", "ar"]) {
  const file = path.join(dir, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [ns, blocks] of Object.entries(NAMESPACES)) {
    if (!data[ns]) data[ns] = {};
    deepMergeMissing(data[ns], blocks[lang]);
  }
  deepMergeMissing(data, SUPPLEMENTAL[lang]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`Patched ${lang}.json`);
}

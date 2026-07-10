/**
 * Production FR/AR translations for broker-facing screens.
 * Run: node patch_broker_locales.js
 */
const fs = require("fs");
const path = require("path");
const { flatten } = require("./localeUtils");

const dir = __dirname;
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
let fr = JSON.parse(fs.readFileSync(path.join(dir, "fr.json"), "utf8"));
let ar = JSON.parse(fs.readFileSync(path.join(dir, "ar.json"), "utf8"));

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object") target[k] = {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

function setFlat(flatMap, localeObj) {
  for (const [key, value] of Object.entries(flatMap)) {
    const parts = key.split(".");
    let cur = localeObj;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
  }
}

const frOverrides = {
  common: {
    badgeOverflow: "99+",
    error: "Erreur",
  },
  navigation: {
    search: "Recherche",
    profile: "Compte",
    home: "Accueil",
    saved: "Favoris",
  },
  dashboard: { headerTitle: "Tableau de bord" },
  myProperties: {
    title: "Mes biens",
    subtitle: "Gérez vos annonces",
    choosePropertyType: "Choisissez le type de bien à ajouter",
    rentalProperty: "Location",
    saleProperty: "Vente",
    emptyTitle: "Vous n'avez pas encore de biens",
    emptySubtitle:
      "Ajoutez votre premier bien pour commencer à recevoir des demandes",
    addProperty: "Ajouter un bien",
    guests: "Voyageurs",
    bedrooms: "Chambres",
    bathrooms: "Salles de bain",
    perNight: "Par nuit",
    new: "Nouveau",
    reviewNotes: "Notes de modération",
    loadErrorTitle: "Impossible de charger vos annonces",
    noPhoto: "Pas de photo",
    perNightShort: "nuit",
    rentalCount: "locations",
    sessionExpiredTitle: "Reconnectez-vous",
    sessionExpiredSub: "Votre session a expiré. Connectez-vous à nouveau.",
    setPrice: "Définir un prix",
    statTotal: "Total",
    summaryPending: "En attente de validation",
    summarySub: "Annonces en cours de modération",
    status: {
      live: "En ligne",
      pending: "En attente",
      rejected: "Refusée",
    },
  },
  hostSuggestions: {
    tab: "Suggestions",
    title: "Acheteurs potentiels",
    entryTitle: "Suggestions d'acheteurs par IA",
    generatingTitle: "Recherche d'acheteurs intéressés",
    emptyTitle: "Pas encore d'acheteurs potentiels",
    emptyNoPropertyTitle: "Aucune annonce trouvée",
    loadingListings: "Chargement de vos annonces…",
    compatibility: "Compatibilité",
    engagement: "Engagement",
    interestLabel: "Intérêt",
    contact: "Contacter",
    dismiss: "Ignorer",
    refresh: "Actualiser",
    refreshNow: "Actualiser maintenant",
    refreshFailed: "Échec de l'actualisation.",
    contactFailed: "Impossible de démarrer la conversation.",
    dismissFailed: "Impossible d'ignorer cette suggestion.",
    scopeLabel: "Périmètre",
    scopeAllListings: "Toutes les annonces",
    matchedListing: "Annonce",
    unknownListing: "Annonce",
    matchesFound: "correspondances",
    quickAction: "Correspondances",
    paywallTitle: "Voir tout votre trafic",
    paywallCta: "Contactez-nous pour débloquer",
    paywallLockedHint: "Verrouillé",
    sessionExpiredTitle: "Reconnectez-vous",
    unavailableTitle: "Fonction indisponible",
    previewTopN:
      "Affichage de vos {{n}} meilleures correspondances. Débloquez le reste avec Meskeny.",
  },
  hostStudio: {
    brand: "Espace hôte",
    allTime: "Tout le temps",
    welcomeUser: "Bonjour, {{name}}",
    tabOverview: "Aperçu",
    tabProperties: "Biens",
    tabVideos: "Vidéos",
    subTabRent: "Location",
    subTabBuy: "Vente",
    kindRent: "Location",
    kindSale: "À vendre",
    statusLive: "En ligne",
    listingNotFound: "Annonce introuvable",
    loadError: "Impossible de charger vos statistiques",
    sessionExpired: "Reconnectez-vous",
    signInRequired: "Connectez-vous pour accéder à l'espace hôte",
    signInCta: "Se connecter",
    syncing: "Mise à jour…",
    noListings: "Aucune annonce",
    noRentListings: "Aucune annonce en location",
    noBuyListings: "Aucune annonce à vendre",
    noRentVideos: "Aucune vidéo de location",
    noSaleVideos: "Aucune vidéo de vente",
    noVideosCta: "Outils rapides → Vidéo",
    yourListings: "Vos annonces",
    listings: "Annonces",
    untitled: "Annonce",
    upload: "Importer",
    quickTools: "Outils rapides",
    insightsTitle: "Aperçus rapides",
    summaryTitle: "Votre portée",
    summarySubPlain:
      "Une vue simple de la façon dont les gens interagissent avec vos annonces.",
    chartMainTitle: "Personnes qui consultent vos annonces",
    chartMainSub7: "Vues totales sur 7 jours",
    chartMainSub14: "Vues totales sur 14 jours",
    chartFootnote:
      "Des courbes plus hautes indiquent plus de consultations ce jour-là.",
    dailyViews: "Vues par jour",
    range7: "7 jours",
    range14: "14 jours",
    periodTrends: "Tendances · {{range}}",
    views: "Vues",
    likes: "J'aime",
    saves: "Enregistrements",
    comments: "Commentaires",
    cardViews7d: "Vues · 7 j",
    statViewsShort: "Vues",
    statLikesShort: "J'aime",
    statSavesShort: "Saves",
    statListingsShort: "En ligne",
    statViewsHint: "Tout le temps",
    statLikesHint: "Ont montré de l'intérêt",
    statSavesHint: "Enregistré pour plus tard",
    statListingsHint: "Annonces actives",
    videoViews: "Vues d'annonces",
    videosPageTitle: "Statistiques vidéo",
    videosListTitle: "Toutes les vidéos",
    videosRentTitle: "Vidéos location",
    videosSaleTitle: "Vidéos vente",
    viewsThisPeriod: "vues sur cette période",
    viewsThisWeek: "vues cette semaine",
    pendingResTitle: "Demandes de réservation",
    pendingRes: "{{count}} demandes de réservation en attente",
    reservations: "{{count}} demandes actives",
    hypeHot: "Fort intérêt cette semaine — gardez votre annonce à jour.",
    hypeWarm:
      "Activité régulière. Photos et vidéos vous aident à vous démarquer.",
    hypeStart: "Partagez votre annonce pour toucher plus de clients.",
  },
  listingAi: {
    validation: {
      priceRequired: "Saisissez un prix de vente valide.",
      areaRequired: "Saisissez la surface en m².",
      propertyTypeRequired: "Sélectionnez un type de bien.",
      yearBuiltRequired: "Saisissez l'année de construction.",
      amenitiesRequired: "Sélectionnez au moins un équipement.",
      cityRequired: "Sélectionnez une ville.",
      zoneRequired: "Sélectionnez une zone.",
      quartierRequired: "Sélectionnez un quartier.",
      plotNumberRequired: "Saisissez le numéro de parcelle cadastrale.",
      storyMinLength: "Ajoutez quelques détails (10 caractères minimum).",
      titleRequired: "Le titre est obligatoire.",
      descriptionRequired: "La description est obligatoire.",
      mediaRequired: "Ajoutez au moins une photo ou une vidéo.",
      mediaPhotoRequired: "Ajoutez au moins une photo.",
      priceInvalid: "Saisissez un prix valide.",
      areaInvalid: "Saisissez une surface valide.",
      nightlyPriceInvalid: "Saisissez un prix par nuit valide.",
      loginRequired: "Vous devez être connecté.",
      sectorRequired: "Sélectionnez un secteur.",
    },
    listedTitle: "Annonce publiée !",
    listedSub: "Votre bien est maintenant en ligne.",
    errorTitle: "Une erreur s'est produite",
    publishFailedTitle: "Publication impossible",
    promoTitle: "Ajouter avec l'IA",
    introCtaTitle: "Ajouter avec l'IA",
    generate: "Générer l'annonce",
    publishListing: "Publier l'annonce",
    uploadFailed: "Échec du téléversement",
    missingLocationTitle: "Emplacement manquant",
    addMorePhotos: "Ajouter d'autres photos",
    chars: "caractères",
    photos: "Photos",
    quartierTitle: "Quel secteur ?",
    retry: "Réessayer",
    reviewDescription: "Description",
    reviewIntroSub: "Vérifiez les détails avant de publier.",
    startMethodAiTitle: "Ajouter avec l'IA",
    startMethodManualSub:
      "Étape par étape — vous remplissez chaque détail vous-même.",
    startMethodManualTitle: "Ajouter manuellement",
    stepZone: "Zone",
    storyFieldLabel: "Notes descriptives",
    storyTitle: "Parlez-nous de ce bien",
    upToTen: "Jusqu'à 10",
    headline: {
      cityTitle: "Où se situe-t-il ?",
      extrasSub: "Aidez l'IA à rédiger une description précise.",
      quartierTitle: "Choisissez un secteur",
      storySub: "Quelques phrases dans vos propres mots",
      storyTitle: "Parlez-en à l'IA",
    },
  },
  hostShareConsent: {
    sheetBody:
      "Si vous acceptez, Meskeny peut montrer un profil minimal à un hôte à la fois lorsque votre recherche correspond à une annonce. Nous ne partageons jamais votre téléphone ni votre e-mail dans les suggestions.",
    bulletMinimal:
      "Détails minimaux uniquement (ex. prénom et signaux de correspondance).",
    bulletOneHost:
      "Un hôte à la fois — pas partagé avec plusieurs hôtes.",
    bulletPerListing:
      "Jusqu'à {{count}} acheteurs par annonce ; chaque annonce est traitée séparément.",
    bulletOptOut: "Vous pouvez modifier ce choix à tout moment dans Paramètres.",
    saveError: "Impossible d'enregistrer votre choix. Réessayez.",
    settingsTitle: "Partage avec les hôtes",
    settingsSubtitle:
      "Autoriser Meskeny à partager un profil minimal avec les hôtes lorsque votre recherche correspond.",
    toastTitle: "Partagez votre profil avec les hôtes ?",
    toastSubtitle:
      "Découvrez comment Meskeny met en relation acheteurs et hôtes.",
  },
  organization: {
    unnamedAgency: "Agence sans nom",
    noTitle: "Annonce sans titre",
    defaultProperty: "Bien",
    untitledVideo: "Annonce vidéo",
    unknownOwner: "Inconnu",
    invite: {
      title: "Inviter un membre",
      description:
        "Générez un code d'invitation sécurisé à partager avec les membres. Le code expire dans 5 minutes.",
      info: "Partagez ce code avec la personne à inviter. Elle pourra l'utiliser pour rejoindre votre organisation.",
      generate: "Générer le code",
      copied: "Code copié dans le presse-papiers !",
      expires: "Expire dans 5 minutes",
      generateNew: "Générer un nouveau code",
      success: {
        title: "Code d'invitation généré !",
        description:
          "Partagez ce code avec la personne à inviter. Il expire dans 5 minutes.",
      },
      error: "Impossible de générer le code. Réessayez.",
      generateError: "Impossible de générer le code. Réessayez.",
      generateTitle: "Générer un code d'invitation",
      currentUsesLabel: "Utilisations actuelles",
      expiresLabel: "Expiration",
      expiry30Days: "30 jours",
      expiry7Days: "7 jours",
      expiryLabel: "Expiration du code",
      expiryNever: "N'expire jamais",
      usage10: "10 utilisations",
      usageLabel: "Limite d'utilisation",
      usageLimitLabel: "Limite d'utilisation",
      usageSingle: "Usage unique",
      usageUnlimited: "Utilisations illimitées",
    },
    join: {
      confirmButton: "Confirmer et rejoindre",
      joinButton: "Rejoindre l'agence",
      owner: "Propriétaire",
      validateError: "Code d'invitation invalide ou expiré",
      verify: "Vérifier le code",
      confirmTitle: "Rejoindre {{name}} ?",
      properties: "biens",
      previewWarning:
        "Les biens ajoutés après votre adhésion appartiendront à cette agence",
    },
  },
  listing: {
    common: {
      notSet: "Non renseigné",
      optional: "Facultatif",
      required: "Obligatoire",
      search: "Rechercher",
      back: "Retour",
      ok: "OK",
    },
    landmark: {
      steps: {
        plotVerify: {
          city: "Ville",
          zone: "Zone",
          quartier: "Quartier",
        },
      },
    },
  },
};

const arOverrides = {
  common: {
    badgeOverflow: "+99",
    error: "خطأ",
  },
  navigation: {
    search: "بحث",
    profile: "الحساب",
    home: "الرئيسية",
    saved: "المفضلة",
  },
  dashboard: { headerTitle: "لوحة التحكم" },
  myProperties: {
    title: "عقاراتي",
    subtitle: "إدارة إعلاناتك",
    choosePropertyType: "اختر نوع العقار الذي تريد إضافته",
    rentalProperty: "إيجار",
    saleProperty: "بيع",
    emptyTitle: "لا توجد عقارات بعد",
    emptySubtitle: "ابدأ بإضافة أول عقار لتلقي الطلبات",
    addProperty: "إضافة عقار",
    guests: "الضيوف",
    bedrooms: "غرف النوم",
    bathrooms: "الحمامات",
    perNight: "لكل ليلة",
    new: "جديد",
    reviewNotes: "ملاحظات المراجعة",
    loadErrorTitle: "تعذّر تحميل إعلاناتك",
    noPhoto: "لا توجد صورة",
    perNightShort: "ليلة",
    rentalCount: "إيجارات",
    sessionExpiredTitle: "سجّل الدخول مجدداً",
    sessionExpiredSub: "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.",
    setPrice: "حدّد السعر",
    statTotal: "الإجمالي",
    summaryPending: "قيد المراجعة",
    summarySub: "إعلانات بانتظار الموافقة",
    status: {
      live: "منشور",
      pending: "قيد الانتظار",
      rejected: "مرفوض",
    },
  },
  hostSuggestions: {
    tab: "اقتراحات",
    title: "مشترون محتملون",
    entryTitle: "اقتراحات المشترين بالذكاء الاصطناعي",
    generatingTitle: "البحث عن مشترين مهتمين",
    emptyTitle: "لا يوجد مشترون محتملون بعد",
    emptyNoPropertyTitle: "لم يتم العثور على إعلانات",
    loadingListings: "جاري تحميل إعلاناتك…",
    compatibility: "التوافق",
    engagement: "التفاعل",
    interestLabel: "الاهتمام",
    contact: "تواصل",
    dismiss: "تجاهل",
    refresh: "تحديث",
    refreshNow: "حدّث الآن",
    refreshFailed: "فشل التحديث.",
    contactFailed: "تعذّر بدء المحادثة.",
    dismissFailed: "تعذّر تجاهل هذا الاقتراح.",
    scopeLabel: "النطاق",
    scopeAllListings: "كل الإعلانات",
    matchedListing: "إعلان",
    unknownListing: "إعلان",
    matchesFound: "تطابقات",
    quickAction: "التطابقات",
    paywallTitle: "عرض كل الزيارات",
    paywallCta: "تواصل معنا للتفعيل",
    paywallLockedHint: "مقفل",
    sessionExpiredTitle: "سجّل الدخول مجدداً",
    unavailableTitle: "الميزة غير متاحة",
    previewTopN:
      "عرض أفضل {{n}} تطابقات. فعّل الباقي مع مسكني.",
  },
  hostStudio: {
    brand: "استوديو المضيف",
    allTime: "كل الوقت",
    welcomeUser: "مرحباً، {{name}}",
    tabOverview: "نظرة عامة",
    tabProperties: "العقارات",
    tabVideos: "الفيديو",
    subTabRent: "إيجار",
    subTabBuy: "بيع",
    kindRent: "إيجار",
    kindSale: "للبيع",
    statusLive: "منشور",
    listingNotFound: "الإعلان غير موجود",
    loadError: "تعذّر تحميل الإحصائيات",
    sessionExpired: "سجّل الدخول مجدداً",
    signInRequired: "سجّل الدخول للوصول إلى استوديو المضيف",
    signInCta: "تسجيل الدخول",
    syncing: "جاري التحديث…",
    noListings: "لا توجد إعلانات",
    noRentListings: "لا توجد إعلانات إيجار",
    noBuyListings: "لا توجد إعلانات للبيع",
    noRentVideos: "لا توجد فيديوهات إيجار",
    noSaleVideos: "لا توجد فيديوهات بيع",
    noVideosCta: "أدوات سريعة ← فيديو",
    yourListings: "إعلاناتك",
    listings: "الإعلانات",
    untitled: "إعلان",
    upload: "رفع",
    quickTools: "أدوات سريعة",
    insightsTitle: "رؤى سريعة",
    summaryTitle: "مدى وصولك",
    summarySubPlain: "صورة واضحة لكيفية تفاعل الناس مع إعلاناتك.",
    chartMainTitle: "من يشاهد إعلاناتك",
    chartMainSub7: "إجمالي المشاهدات خلال 7 أيام",
    chartMainSub14: "إجمالي المشاهدات خلال 14 يوماً",
    chartFootnote: "خطوط أعلى تعني مشاهدات أكثر في ذلك اليوم.",
    dailyViews: "مشاهدات يومية",
    range7: "7 أيام",
    range14: "14 يوماً",
    periodTrends: "الاتجاهات · {{range}}",
    views: "مشاهدات",
    likes: "إعجابات",
    saves: "حفظ",
    comments: "تعليقات",
    cardViews7d: "مشاهدات · 7 أي",
    statViewsShort: "مشاهدات",
    statLikesShort: "إعجابات",
    statSavesShort: "حفظ",
    statListingsShort: "منشور",
    statViewsHint: "كل الوقت",
    statLikesHint: "أبدوا اهتماماً",
    statSavesHint: "حُفظ للمراجعة",
    statListingsHint: "إعلانات نشطة",
    videoViews: "مشاهدات الإعلان",
    videosPageTitle: "تحليلات الفيديو",
    videosListTitle: "كل الفيديوهات",
    videosRentTitle: "فيديوهات الإيجار",
    videosSaleTitle: "فيديوهات البيع",
    viewsThisPeriod: "مشاهدات في هذه الفترة",
    viewsThisWeek: "مشاهدات هذا الأسبوع",
    pendingResTitle: "طلبات الحجز",
    pendingRes: "{{count}} طلبات حجز بانتظار الرد",
    reservations: "{{count}} طلبات نشطة",
    hypeHot: "اهتمام قوي هذا الأسبوع — حدّث إعلانك.",
    hypeWarm: "نشاط مستقر. الصور والفيديو تساعدك على التميز.",
    hypeStart: "شارك إعلانك للوصول إلى المزيد من العملاء.",
  },
  listingAi: {
    validation: {
      priceRequired: "أدخل سعراً صالحاً.",
      areaRequired: "أدخل المساحة بالمتر المربع.",
      propertyTypeRequired: "اختر نوع العقار.",
      yearBuiltRequired: "أدخل سنة البناء.",
      amenitiesRequired: "اختر مرفقاً واحداً على الأقل.",
      cityRequired: "اختر المدينة.",
      zoneRequired: "اختر المنطقة.",
      quartierRequired: "اختر الحي.",
      plotNumberRequired: "أدخل رقم القطعة في السجل العقاري.",
      storyMinLength: "أضف المزيد من التفاصيل (10 أحرف على الأقل).",
      titleRequired: "العنوان مطلوب.",
      descriptionRequired: "الوصف مطلوب.",
      mediaRequired: "أضف صورة أو فيديو واحداً على الأقل.",
      mediaPhotoRequired: "أضف صورة واحدة على الأقل.",
      priceInvalid: "أدخل سعراً صالحاً.",
      areaInvalid: "أدخل مساحة صالحة.",
      nightlyPriceInvalid: "أدخل سعراً ليلياً صالحاً.",
      loginRequired: "يجب تسجيل الدخول.",
      sectorRequired: "اختر قطاعاً.",
    },
    listedTitle: "تم النشر!",
    listedSub: "عقارك أصبح متاحاً الآن.",
    errorTitle: "حدث خطأ",
    publishFailedTitle: "تعذّر النشر",
    promoTitle: "إضافة بالذكاء الاصطناعي",
    introCtaTitle: "إضافة بالذكاء الاصطناعي",
    generate: "إنشاء الإعلان",
    publishListing: "نشر الإعلان",
    uploadFailed: "فشل الرفع",
    missingLocationTitle: "الموقع غير مكتمل",
    addMorePhotos: "إضافة المزيد من الصور",
    chars: "حرف",
    photos: "الصور",
    quartierTitle: "ما القطاع؟",
    retry: "حاول مرة أخرى",
    reviewDescription: "الوصف",
    reviewIntroSub: "تحقق من التفاصيل قبل النشر.",
    startMethodAiTitle: "إضافة بالذكاء الاصطناعي",
    startMethodManualSub: "خطوة بخطوة — أنت تملأ كل التفاصيل بنفسك.",
    startMethodManualTitle: "إضافة يدوياً",
    stepZone: "المنطقة",
    storyFieldLabel: "ملاحظات الوصف",
    storyTitle: "أخبرنا عن العقار",
    upToTen: "حتى 10",
    headline: {
      cityTitle: "أين يقع؟",
      extrasSub: "ساعد الذكاء الاصطناعي على كتابة وصف دقيق.",
      quartierTitle: "اختر قطاعاً",
      storySub: "بضع جمل بكلماتك الخاصة",
      storyTitle: "أخبر الذكاء الاصطناعي عنه",
    },
  },
  hostShareConsent: {
    sheetBody:
      "إذا وافقت، قد يعرض مسكني ملفاً شخصياً مختصراً لمضيف واحد في كل مرة عندما يتطابق نشاط بحثك مع إعلان. لا نشارك أبداً هاتفك أو بريدك في الاقتراحات.",
    bulletMinimal:
      "تفاصيل محدودة فقط (مثل الاسم الأول وإشارات التطابق).",
    bulletOneHost: "مضيف واحد في كل مرة — لا يُشارك مع عدة مضيفين.",
    bulletPerListing:
      "حتى {{count}} مشترٍ لكل إعلان؛ يُعالج كل إعلان على حدة.",
    bulletOptOut: "يمكنك تغيير هذا في أي وقت من الإعدادات.",
    saveError: "تعذّر حفظ اختيارك. حاول مرة أخرى.",
    settingsTitle: "المشاركة مع المضيفين",
    settingsSubtitle:
      "السماح لمسكني بمشاركة ملف مختصر مع المضيفين عند تطابق بحثك.",
    toastTitle: "هل تريد مشاركة ملفك مع المضيفين؟",
    toastSubtitle: "تعرّف كيف يربط مسكني بين المشترين والمضيفين.",
  },
  organization: {
    unnamedAgency: "وكالة بدون اسم",
    noTitle: "إعلان بدون عنوان",
    defaultProperty: "عقار",
    untitledVideo: "إعلان فيديو",
    unknownOwner: "غير معروف",
    invite: {
      title: "دعوة عضو",
      description:
        "أنشئ رمز دعوة آمن لمشاركته مع الأعضاء. ينتهي الرمز خلال 5 دقائق.",
      info: "شارك هذا الرمز مع الشخص الذي تريد دعوته. يمكنه استخدامه للانضمام إلى مؤسستك.",
      generate: "إنشاء الرمز",
      copied: "تم نسخ الرمز!",
      expires: "ينتهي خلال 5 دقائق",
      generateNew: "إنشاء رمز جديد",
      success: {
        title: "تم إنشاء رمز الدعوة!",
        description:
          "شارك هذا الرمز مع الشخص الذي تريد دعوته. ينتهي خلال 5 دقائق.",
      },
      error: "تعذّر إنشاء الرمز. حاول مرة أخرى.",
      generateError: "تعذّر إنشاء الرمز. حاول مرة أخرى.",
      generateTitle: "إنشاء رمز دعوة",
      currentUsesLabel: "الاستخدامات الحالية",
      expiresLabel: "الانتهاء",
      expiry30Days: "30 يوماً",
      expiry7Days: "7 أيام",
      expiryLabel: "انتهاء الرمز",
      expiryNever: "لا ينتهي",
      usage10: "10 استخدامات",
      usageLabel: "حد الاستخدام",
      usageLimitLabel: "حد الاستخدام",
      usageSingle: "استخدام واحد",
      usageUnlimited: "استخدامات غير محدودة",
    },
    join: {
      confirmButton: "تأكيد والانضمام",
      joinButton: "انضمام للوكالة",
      owner: "المالك",
      validateError: "رمز دعوة غير صالح أو منتهٍ",
      verify: "تحقق من الرمز",
      confirmTitle: "الانضمام إلى {{name}}؟",
      properties: "عقارات",
      previewWarning: "العقارات التي تضيفها بعد الانضمام ستعود لهذه الوكالة",
    },
  },
  listing: {
    common: {
      notSet: "غير محدد",
      optional: "اختياري",
      required: "مطلوب",
      search: "بحث",
      back: "رجوع",
      ok: "موافق",
    },
    landmark: {
      steps: {
        plotVerify: {
          city: "المدينة",
          zone: "المنطقة",
          quartier: "الحي",
        },
      },
    },
  },
};

const enOverrides = {
  common: { badgeOverflow: "99+", error: "Error" },
  listingAi: {
    validation: {
      priceRequired: "Enter a valid asking price.",
      areaRequired: "Enter the area in m².",
      propertyTypeRequired: "Select a property type.",
      yearBuiltRequired: "Enter the year built.",
      amenitiesRequired: "Select at least one amenity.",
      cityRequired: "Select a city.",
      zoneRequired: "Select a zone.",
      quartierRequired: "Select a sector.",
      plotNumberRequired: "Enter the cadastre plot number.",
      storyMinLength: "Add a few more details (at least 10 characters).",
      titleRequired: "Title is required.",
      descriptionRequired: "Description is required.",
      mediaRequired: "Add at least one photo or video.",
      mediaPhotoRequired: "Add at least one photo.",
      priceInvalid: "Enter a valid price.",
      areaInvalid: "Enter a valid area.",
      nightlyPriceInvalid: "Enter a valid nightly price.",
      loginRequired: "You must be logged in.",
      sectorRequired: "Select a sector.",
    },
    uploadFailed: "Upload failed",
    missingLocationTitle: "Missing location",
  },
  hostShareConsent: {
    sheetBody:
      "If you opt in, Meskeny may show a minimal profile to one host at a time when your search activity matches a listing. We never share your phone or email in suggestions.",
    bulletMinimal:
      "Minimal details only (e.g. first name and match signals).",
    bulletOneHost: "One host at a time — not shared with multiple hosts.",
    bulletPerListing:
      "Up to {{count}} buyers per listing; each listing is handled separately.",
    bulletOptOut: "You can change this anytime in Settings.",
    saveError: "Could not save your choice. Please try again.",
    settingsTitle: "Share with property hosts",
    settingsSubtitle:
      "Allow Meskeny to share a minimal profile with hosts when your search matches.",
    toastTitle: "Share your profile with hosts?",
    toastSubtitle: "Learn how Meskeny connects buyers and hosts.",
  },
  organization: {
    unnamedAgency: "Unnamed agency",
    noTitle: "Untitled listing",
    defaultProperty: "Property",
    untitledVideo: "Video listing",
    unknownOwner: "Unknown",
  },
  listing: {
    landmark: {
      steps: {
        plotVerify: {
          city: "City",
          zone: "Zone",
          quartier: "Quartier",
        },
      },
    },
  },
};

// Listing phrase map — high-traffic sale/landmark/rent wizard strings
const LISTING_PHRASES_FR = {
  "Let's list your property": "Mettons votre bien en vente",
  "Ready to sell?": "Prêt à vendre ?",
  "Give your property a title": "Donnez un titre à votre bien",
  "What type of property?": "Quel type de bien ?",
  "Set your asking price": "Fixez votre prix de vente",
  "How many bedrooms?": "Combien de chambres ?",
  "Skip - Not applicable": "Passer — non applicable",
  "What's the total area?": "Quelle est la surface totale ?",
  "Which country?": "Quel pays ?",
  "Where is it located?": "Où se situe le bien ?",
  "Mark your location": "Indiquez l'emplacement sur la carte",
  "Add photos or video": "Ajoutez des photos ou une vidéo",
  "Review your listing": "Vérifiez votre annonce",
  Publish: "Publier",
  Next: "Suivant",
  Back: "Retour",
  "List your land": "Mettez votre terrain en vente",
  "Let's get started": "Commençons",
  "Describe your property": "Décrivez votre bien",
  "Which zone?": "Quelle zone ?",
  "Which quartier?": "Quel quartier ?",
  "Is this your plot?": "Est-ce votre parcelle ?",
  "Property papers": "Documents fonciers",
  "Plot number": "Numéro de parcelle",
  "Rent out your place": "Louez votre logement",
  "Add photos": "Ajouter des photos",
  "Review your listing": "Vérifiez votre annonce",
};

const LISTING_PHRASES_AR = {
  "Let's list your property": "لنُدرج عقارك للبيع",
  "Ready to sell?": "هل أنت مستعد للبيع؟",
  "Give your property a title": "أعطِ عقارك عنواناً",
  "What type of property?": "ما نوع العقار؟",
  "Set your asking price": "حدّد سعر البيع",
  "How many bedrooms?": "كم عدد غرف النوم؟",
  "Skip - Not applicable": "تخطّ — غير منطبق",
  "What's the total area?": "ما المساحة الإجمالية؟",
  "Which country?": "ما الدولة؟",
  "Where is it located?": "أين يقع العقار؟",
  "Mark your location": "حدّد الموقع على الخريطة",
  "Add photos or video": "أضف صوراً أو فيديو",
  "Review your listing": "راجع إعلانك",
  Publish: "نشر",
  Next: "التالي",
  Back: "رجوع",
  "List your land": "اعرض أرضك للبيع",
  "Let's get started": "لنبدأ",
  "Describe your property": "صف عقارك",
  "Which zone?": "ما المنطقة؟",
  "Which quartier?": "ما الحي؟",
  "Is this your plot?": "هل هذه قطعتك؟",
  "Property papers": "الوثائق العقارية",
  "Plot number": "رقم القطعة",
  "Rent out your place": "أجرِ مسكنك",
  "Add photos": "إضافة صور",
};

function translateListingValue(enText, map) {
  if (map[enText]) return map[enText];
  return null;
}

deepMerge(fr, frOverrides);
deepMerge(ar, arOverrides);
deepMerge(en, enOverrides);

const enFlat = flatten(en);
const frFlat = flatten(fr);
const arFlat = flatten(ar);

let listingFr = 0;
let listingAr = 0;

for (const [key, enText] of Object.entries(enFlat)) {
  if (!key.startsWith("listing.") || typeof enText !== "string") continue;
  if (frFlat[key] === enText) {
    const tr = translateListingValue(enText, LISTING_PHRASES_FR);
    if (tr) {
      setFlat({ [key]: tr }, fr);
      listingFr++;
    }
  }
  if (arFlat[key] === enText) {
    const tr = translateListingValue(enText, LISTING_PHRASES_AR);
    if (tr) {
      setFlat({ [key]: tr }, ar);
      listingAr++;
    }
  }
}

fs.writeFileSync(path.join(dir, "en.json"), JSON.stringify(en, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "fr.json"), JSON.stringify(fr, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "ar.json"), JSON.stringify(ar, null, 2) + "\n");

console.log("Broker locale patch applied.");
console.log("Listing FR phrases:", listingFr, "Listing AR phrases:", listingAr);

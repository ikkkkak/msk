/**
 * Profile / host mode / broker FR-AR gaps + unresolved screen keys.
 * Run: node patch_profile_translations.js
 */
const fs = require("fs");
const path = require("path");

const dir = __dirname;

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
}
function save(name, obj) {
  fs.writeFileSync(path.join(dir, name), JSON.stringify(obj, null, 2) + "\n");
}

const en = load("en.json");
const fr = load("fr.json");
const ar = load("ar.json");

// --- Host profile & controls ---
const hostAccess = {
  en: {
    gateTitle: "Host mode required",
    gateDescription: "Turn on host mode to open host controls and manage listings.",
    enableHostMode: "Open host controls",
    modalTitle: "Switch to host mode",
    modalDescription:
      "Host mode lets you manage properties, receive bookings, and talk to guests.",
    menuBadgeHint: "Host mode required",
    toggleHint: "Switch between guest and host experience",
  },
  fr: {
    gateTitle: "Mode hôte requis",
    gateDescription:
      "Activez le mode hôte pour ouvrir les contrôles hôte et gérer vos annonces.",
    enableHostMode: "Ouvrir les contrôles hôte",
    modalTitle: "Passer en mode hôte",
    modalDescription:
      "Le mode hôte vous permet de gérer vos biens, recevoir des réservations et communiquer avec vos voyageurs.",
    menuBadgeHint: "Mode hôte requis",
    toggleHint: "Basculer entre mode voyageur et mode hôte",
  },
  ar: {
    gateTitle: "وضع المضيف مطلوب",
    gateDescription:
      "فعّل وضع المضيف لفتح لوحة التحكم وإدارة إعلاناتك.",
    enableHostMode: "فتح لوحة تحكم المضيف",
    modalTitle: "التبديل إلى وضع المضيف",
    modalDescription:
      "يتيح لك وضع المضيف إدارة العقارات واستقبال الحجوزات والتواصل مع الضيوف.",
    menuBadgeHint: "وضع المضيف مطلوب",
    toggleHint: "التبديل بين وضع الضيف ووضع المضيف",
  },
};

for (const loc of ["en", "fr", "ar"]) {
  const data = loc === "en" ? en : loc === "fr" ? fr : ar;
  data.account.hostAccess = hostAccess[loc];
  data.account.mode = data.account.mode || {};
  if (loc === "en") {
    data.account.mode.guest = "Guest";
    data.account.mode.host = "Host";
  } else if (loc === "fr") {
    data.account.mode.guest = "Voyageur";
    data.account.mode.host = "Hôte";
  } else {
    data.account.mode.guest = "ضيف";
    data.account.mode.host = "مضيف";
  }
}

// Become a host card CTA
en.hostOnboarding.cardCta = "Open host controls";
en.hostOnboarding.cardA11y = "Open host controls — start hosting";
fr.hostOnboarding.cardCta = "Ouvrir les contrôles hôte";
fr.hostOnboarding.cardA11y = "Ouvrir les contrôles hôte — commencer à héberger";
ar.hostOnboarding.cardCta = "فتح لوحة تحكم المضيف";
ar.hostOnboarding.cardA11y = "فتح لوحة تحكم المضيف — ابدأ الاستضافة";

// Fix EN feedback block (was Arabic)
en.account.feedback.info =
  "We use your feedback to improve the experience, fix bugs, and prioritize features. Your feedback is never shared publicly.";
en.account.feedback.ratingLabel = "Rating (1–5, optional)";
en.account.feedback.ratingPlaceholder = "e.g. 5";
en.account.feedback.titleLabel = "Title (optional)";
en.account.feedback.titlePlaceholder = "Short summary";

fr.account.feedback = fr.account.feedback || {};
fr.account.feedback.info =
  "Nous utilisons vos retours pour améliorer l'expérience, corriger les bugs et prioriser les fonctionnalités. Vos retours ne sont jamais partagés publiquement.";
fr.account.feedback.ratingLabel = "Note (1–5, optionnel)";
fr.account.feedback.ratingPlaceholder = "ex. 5";
fr.account.feedback.titleLabel = "Titre (optionnel)";
fr.account.feedback.titlePlaceholder = "Résumé court";

ar.account.feedback = ar.account.feedback || {};
ar.account.feedback.info =
  "نستخدم ملاحظاتك لتحسين التجربة وإصلاح الأخطاء وترتيب الميزات. لن تتم مشاركة ملاحظاتك علنياً.";
ar.account.feedback.ratingLabel = "التقييم (1-5، اختياري)";
ar.account.feedback.ratingPlaceholder = "مثال: 5";
ar.account.feedback.titleLabel = "العنوان (اختياري)";
ar.account.feedback.titlePlaceholder = "ملخص سريع";

// Unresolved screen keys
const extra = {
  en: {
    "aiChat.overview.body": "Overview of your conversation with MeskenyGPT.",
    "landmarkDetails.goBack": "Go back",
    "landmarkDetails.locationPermissionRequired": "Location permission is required.",
    "landmarkDetails.routeNotConfigured": "Directions are not configured for this landmark.",
    "listing.common.papersSectionSubtitle": "Upload title deeds and supporting documents.",
    "listingAi.hint.extras": "Mention parking, utilities, or other details.",
    "listingAi.hint.media": "Add clear photos or a short video tour.",
    "listingAi.hint.plotNumber": "Enter the cadastre plot number if known.",
    "listingAi.hint.story": "Describe what makes this listing special.",
    "listingAi.hint.zone": "Pick the zone or quartier for better discovery.",
    "settings.deleteAccountModal.dataList": "Your profile, listings, messages, and saved items.",
    "videoUpload.uploadedOptimizingInBackground":
      "Uploaded. Optimizing in the background…",
  },
  fr: {
    "aiChat.overview.body": "Aperçu de votre conversation avec MeskenyGPT.",
    "landmarkDetails.goBack": "Retour",
    "landmarkDetails.locationPermissionRequired": "L'autorisation de localisation est requise.",
    "landmarkDetails.routeNotConfigured": "L'itinéraire n'est pas configuré pour ce terrain.",
    "listing.common.papersSectionSubtitle": "Téléversez les titres et documents justificatifs.",
    "listingAi.hint.extras": "Précisez parking, charges ou autres détails.",
    "listingAi.hint.media": "Ajoutez des photos nettes ou une courte visite vidéo.",
    "listingAi.hint.plotNumber": "Saisissez le numéro de parcelle cadastrale si connu.",
    "listingAi.hint.story": "Décrivez ce qui rend cette annonce unique.",
    "listingAi.hint.zone": "Choisissez la zone ou le quartier pour une meilleure visibilité.",
    "settings.deleteAccountModal.dataList":
      "Votre profil, annonces, messages et éléments enregistrés.",
    "videoUpload.uploadedOptimizingInBackground":
      "Téléversé. Optimisation en arrière-plan…",
  },
  ar: {
    "aiChat.overview.body": "نظرة عامة على محادثتك مع MeskenyGPT.",
    "landmarkDetails.goBack": "رجوع",
    "landmarkDetails.locationPermissionRequired": "إذن الموقع مطلوب.",
    "landmarkDetails.routeNotConfigured": "لم يتم إعداد الاتجاهات لهذا الأرض.",
    "listing.common.papersSectionSubtitle": "ارفع سندات الملكية والمستندات الداعمة.",
    "listingAi.hint.extras": "اذكر المواقف أو المرافق أو تفاصيل أخرى.",
    "listingAi.hint.media": "أضف صوراً واضحة أو جولة فيديو قصيرة.",
    "listingAi.hint.plotNumber": "أدخل رقم القطعة في السجل العقاري إن وُجد.",
    "listingAi.hint.story": "صف ما يميز هذا الإعلان.",
    "listingAi.hint.zone": "اختر المنطقة أو الحي لظهور أفضل.",
    "settings.deleteAccountModal.dataList": "ملفك وإعلاناتك ورسائلك والعناصر المحفوظة.",
    "videoUpload.uploadedOptimizingInBackground":
      "تم الرفع. جارٍ التحسين في الخلفية…",
  },
};

function setPath(obj, dotted, value) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

for (const [key, val] of Object.entries(extra.en)) setPath(en, key, val);
for (const [key, val] of Object.entries(extra.fr)) setPath(fr, key, val);
for (const [key, val] of Object.entries(extra.ar)) setPath(ar, key, val);

// Broker FR
Object.assign(fr.broker.errors, {
  submitTitle: "Envoi impossible",
  uploadTitle: "Échec du téléversement",
});
Object.assign(fr.broker.status, {
  pendingTitle: "Examen en cours",
  rejectedTitle: "Demande non approuvée",
  tryAgain: "Soumettre à nouveau",
});
Object.assign(fr.broker.step1, {
  check1: "1. Photo de profil professionnelle",
  check2: "2. Langues parlées avec les clients",
  check3: "3. Passeport ou carte nationale",
  title: "Vérifiez votre identité",
});
Object.assign(fr.broker.step2, {
  addPhoto: "Ajouter une photo",
  title: "Photo de profil",
});
Object.assign(fr.broker.step3, { title: "Langues" });
Object.assign(fr.broker.step4, {
  idBack: "Verso",
  idCard: "Carte nationale",
  idCardHint: "Recto + verso",
  idCardUpload: "Recto et verso de votre carte.",
  idFront: "Recto",
  license: "Licence de courtier",
  passport: "Passeport",
  passportHint: "1 photo",
  passportPhoto: "Photo du passeport",
  title: "Pièce d'identité",
});
fr.broker.submit = "Soumettre";
fr.broker.verifiedBadge = "Identité vérifiée";
fr.broker.verifiedShort = "Vérifié";
fr.broker.languagesSpoken = "Parle";
fr.broker.dashboard.cta = "Commencer la vérification";
fr.broker.dashboard.eyebrow = "Identité courtier";
fr.broker.dashboard.leadsEst = "demandes est./mois";
fr.broker.dashboard.pendingTitle = "Vérification en cours";
fr.broker.dashboard.title = "Soyez vérifié sur Meskeny";
fr.broker.dashboard.verifiedTitle = "Identité vérifiée";
fr.broker.dashboard.views = "vues";
fr.broker.sheet.brokerIdLabel = "Votre ID courtier";
fr.broker.sheet.openSettings = "Confidentialité des annonces";

// Broker AR
Object.assign(ar.broker.errors, {
  submitTitle: "تعذّر الإرسال",
  uploadTitle: "فشل الرفع",
});
Object.assign(ar.broker.status, {
  pendingTitle: "المراجعة جارية",
  rejectedTitle: "الطلب غير مقبول",
  tryAgain: "إرسال مرة أخرى",
});
Object.assign(ar.broker.step1, {
  check1: "1. صورة ملف احترافية",
  check2: "2. اللغات التي تتحدثها مع العملاء",
  check3: "3. جواز سفر أو بطاقة وطنية",
  title: "تحقق من هويتك",
});
Object.assign(ar.broker.step2, {
  addPhoto: "إضافة صورة",
  title: "صورة الملف",
});
Object.assign(ar.broker.step3, { title: "اللغات" });
Object.assign(ar.broker.step4, {
  idBack: "الخلف",
  idCard: "البطاقة الوطنية",
  idCardHint: "الوجه + الخلف",
  idCardUpload: "الوجه والخلف لبطاقتك.",
  idFront: "الوجه",
  license: "رخصة الوسيط",
  passport: "جواز السفر",
  passportHint: "صورة واحدة",
  passportPhoto: "صورة جواز السفر",
  title: "وثيقة الهوية",
});
ar.broker.submit = "إرسال";
ar.broker.verifiedBadge = "الهوية موثّقة";
ar.broker.verifiedShort = "موثّق";
ar.broker.languagesSpoken = "يتحدث";
ar.broker.dashboard.cta = "بدء التحقق";
ar.broker.dashboard.eyebrow = "هوية الوسيط";
ar.broker.dashboard.leadsEst = "استفسارات تقريبية/شهر";
ar.broker.dashboard.pendingTitle = "التحقق قيد المراجعة";
ar.broker.dashboard.title = "احصل على التوثيق في مسكني";
ar.broker.dashboard.verifiedTitle = "الهوية موثّقة";
ar.broker.dashboard.views = "مشاهدات";
ar.broker.sheet.brokerIdLabel = "معرّف الوسيط";
ar.broker.sheet.openSettings = "إعدادات خصوصية الإعلان";

// discoverLands + hostShareConsent FR/AR
fr.discoverLands = {
  empty: "Aucun terrain disponible pour le moment",
  plot: "Parcelle",
  title: "Découvrir les terrains",
  viewMore: "Voir plus",
};
ar.discoverLands = {
  empty: "لا توجد أراضٍ متاحة حالياً",
  plot: "قطعة أرض",
  title: "اكتشف الأراضي",
  viewMore: "عرض المزيد",
};
fr.goToInbox = "Aller à la messagerie";
ar.goToInbox = "الذهاب إلى الرسائل";

fr.hostShareConsent = {
  ...fr.hostShareConsent,
  acceptShort: "Oui, partager",
  decline: "Non merci",
  keepOff: "Garder le partage désactivé",
  keepOn: "Garder le partage activé",
  settingsSection: "CONFIDENTIALITÉ",
  sheetTitle: "Partager avec les hôtes ?",
  statusOff: "Partage désactivé",
  statusOn: "Partage activé",
  toastView: "Voir",
  turnOff: "Désactiver le partage",
  turnOn: "Activer le partage",
};
ar.hostShareConsent = {
  ...ar.hostShareConsent,
  acceptShort: "نعم، شارك",
  decline: "لا شكراً",
  keepOff: "إبقاء المشاركة متوقفة",
  keepOn: "إبقاء المشاركة مفعّلة",
  settingsSection: "الخصوصية",
  sheetTitle: "المشاركة مع المضيفين؟",
  statusOff: "المشاركة متوقفة",
  statusOn: "المشاركة مفعّلة",
  toastView: "عرض",
  turnOff: "إيقاف المشاركة",
  turnOn: "تفعيل المشاركة",
};

function buildSignUpNamespace(auth, overrides = {}) {
  const label =
    typeof auth.signUp === "string"
      ? auth.signUp
      : auth.signUpLabel || overrides.label || "Sign Up";
  return {
    label,
    title: overrides.title || label,
    subtitle:
      overrides.subtitle ||
      "Sign up to save preferences and contact hosts",
    firstName: auth.firstName,
    firstNamePlaceholder: auth.firstNamePlaceholder,
    lastName: auth.lastName,
    lastNamePlaceholder: auth.lastNamePlaceholder,
    email: auth.email,
    emailPlaceholder: auth.emailPlaceholder,
    password: auth.password,
    passwordPlaceholder: auth.passwordPlaceholder,
    phoneNumber: auth.signIn?.phoneNumber || "Phone Number",
    phonePlaceholder: auth.signIn?.phonePlaceholder || auth.phonePlaceholder,
    creatingAccount: overrides.creatingAccount || "Creating account...",
    createAccount: overrides.createAccount || label,
    signIn: auth.signIn?.signIn || "Sign In",
    signUpWithEmail: auth.signUpWithGoogle || "Sign up with email",
    signUpWithPhone: auth.signUpWithPhone,
    alreadyHaveAccount: auth.alreadyHaveAccount,
    terms: overrides.terms || "By signing up, you agree to our",
    termsOfService: auth.termsOfService,
    and: auth.and,
    privacyPolicy: auth.privacyPolicy,
    validation: {
      firstNameRequired: auth.validation.firstNameRequired,
      lastNameRequired: auth.validation.lastNameRequired,
      emailRequired: auth.validation.emailRequired,
      emailInvalid: auth.validation.emailInvalid,
      passwordRequired: auth.validation.passwordRequired,
      passwordMinLength: auth.validation.passwordComplexity,
      phoneRequired: auth.signIn?.validation?.phoneRequired,
      phoneFormat: auth.signIn?.validation?.phoneFormat,
    },
  };
}

en.auth.signUp = buildSignUpNamespace(en.auth, {
  label: "Sign Up",
  title: "Create account",
});
fr.auth.signUp = buildSignUpNamespace(fr.auth, {
  label: "Créer un compte",
  title: "Créer un compte",
  subtitle: "Inscrivez-vous pour enregistrer vos préférences et contacter les hôtes",
  creatingAccount: "Création du compte...",
  createAccount: "Créer un compte",
  terms: "En vous inscrivant, vous acceptez nos",
});
ar.auth.signUp = buildSignUpNamespace(ar.auth, {
  label: "إنشاء حساب",
  title: "إنشاء حساب",
  subtitle: "سجّل لحفظ تفضيلاتك والتواصل مع المضيفين",
  creatingAccount: "جاري إنشاء الحساب...",
  createAccount: "إنشاء حساب",
  terms: "بالتسجيل، فإنك توافق على",
});

function flattenOrganizationStrings(org, locale) {
  const joinErrors = {
    en: "Failed to join organization. Please try again.",
    fr: "Impossible de rejoindre l'organisation. Veuillez réessayer.",
    ar: "تعذّر الانضمام إلى الوكالة. يرجى المحاولة مرة أخرى.",
  };
  const joinSuccess = {
    en: "Successfully joined agency!",
    fr: "Agence rejointe avec succès !",
    ar: "تم الانضمام إلى الوكالة بنجاح!",
  };

  if (org.invite && typeof org.invite.error === "object") {
    org.invite.errorTitle = org.invite.error.title || "Error";
    org.invite.error =
      org.invite.error.message || joinErrors.en;
  }
  if (org.join && typeof org.join.success === "object") {
    org.join.success = joinSuccess[locale] || org.join.success.message || joinSuccess.en;
  }
  if (org.join && typeof org.join.error === "object") {
    org.join.errorEmptyCode = org.join.error.emptyCode;
    org.join.errorTitle = org.join.error.title;
    org.join.error = joinErrors[locale] || joinErrors.en;
  }
}

flattenOrganizationStrings(en.organization, "en");
flattenOrganizationStrings(fr.organization, "fr");
flattenOrganizationStrings(ar.organization, "ar");

save("en.json", en);
save("fr.json", fr);
save("ar.json", ar);
console.log("✅ Profile/host/broker/auth translations patched (en, fr, ar)");

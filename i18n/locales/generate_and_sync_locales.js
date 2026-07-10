/**
 * Merge missing EN keys into FR/AR with translations.
 * Run: node generate_and_sync_locales.js
 */
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
const fr = JSON.parse(fs.readFileSync(path.join(dir, "fr.json"), "utf8"));
const ar = JSON.parse(fs.readFileSync(path.join(dir, "ar.json"), "utf8"));

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function setPath(obj, dotted, value) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function deepMergeMissing(target, source, translations, prefix = "") {
  for (const [k, v] of Object.entries(source)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object") target[k] = {};
      deepMergeMissing(target[k], v, translations, full);
    } else if (target[k] === undefined) {
      target[k] = translations[full] ?? v;
    }
  }
}

const enFlat = flatten(en);

// French translations for keys missing in FR (and shared keys)
const FR = {
  "account.brokerIdLine": "ID courtier · {{id}}",
  "account.brokerVerifiedSub":
    "Vos références de courtier sont confirmées sur Meskeny.",
  "aiChat.plotBoundary": "Limite du terrain",
  "aiChat.plotNumber": "Parcelle {{number}}",
  "apiErrors.AUTH_INVALID_CREDENTIALS": "E-mail/téléphone ou mot de passe incorrect.",
  "apiErrors.AUTH_UNAUTHORIZED": "Veuillez vous reconnecter.",
  "apiErrors.NET_DNS":
    "Connexion impossible pour le moment. Réessayez plus tard.",
  "apiErrors.NET_NO_RESPONSE":
    "Connexion impossible. Vérifiez votre connexion internet et réessayez.",
  "apiErrors.NET_OFFLINE":
    "Pas de connexion internet. Connectez-vous et réessayez.",
  "apiErrors.NET_SSL": "Échec de la connexion sécurisée. Réessayez.",
  "apiErrors.NET_TIMEOUT": "La requête a expiré. Réessayez.",
  "apiErrors.NET_UNKNOWN": "Erreur réseau. Réessayez.",
  "apiErrors.SERVER_INTERNAL":
    "Un problème est survenu de notre côté. Réessayez bientôt.",
  "apiErrors.SERVER_OK": "Serveur en ligne",
  "apiErrors.UNKNOWN": "Une erreur s'est produite.",
  "apiErrors.USER_CHECK_BOTH_IDENTIFIERS":
    "Utilisez l'e-mail ou le téléphone, pas les deux.",
  "apiErrors.USER_CHECK_INVALID_BODY": "Requête invalide. Réessayez.",
  "apiErrors.USER_CHECK_NO_IDENTIFIER":
    "Entrez votre e-mail ou numéro de téléphone.",
  "apiErrors.VALIDATION_FAILED": "Vérifiez vos informations et réessayez.",
  "apiErrors.serverUnreachableTitle": "Problème de connexion",
  "auth.common.current": "Actuel",
  "common.drawArea": "Dessiner une zone",
  "dashboard.goodAfternoon": "Bon après-midi",
  "dashboard.goodEvening": "Bonsoir",
  "dashboard.goodMorning": "Bonjour",
  "editProperty.addAtLeastOne": "Ajoutez au moins une photo",
  "editProperty.recommendedPhotos":
    "Nous recommandons {{count}} photos supplémentaires pour plus de visibilité",
  "editProperty.steps.amenitiesDesc": "Ajouter des équipements",
  "editProperty.steps.availabilityDesc": "Gérer le calendrier de disponibilité",
  "editProperty.steps.bookingModeDesc": "Configurer les réservations",
  "editProperty.steps.cancellationDesc": "Politique d'annulation",
  "editProperty.steps.capacityDesc": "Définir la capacité d'accueil",
  "editProperty.steps.descriptionDesc": "Mettre à jour la description",
  "editProperty.steps.locationDesc": "Définir l'emplacement du bien",
  "editProperty.steps.photosDesc": "Gérer les photos",
  "editProperty.steps.pricingDesc": "Définir le prix par nuit",
  "editProperty.steps.propertyPolicyDesc": "Règles du bien",
  "editProperty.steps.rulesDesc": "Règlement intérieur",
  "editProperty.steps.secureCompoundDesc": "Paramètres de sécurité",
  "editProperty.steps.titleDesc": "Modifier le titre",
  "editProperty.steps.typeDesc": "Choisir le type de bien",
  "editProperty.steps.userSafetyDesc": "Équipements de sécurité",
  "filters.emptyNoData": "Aucune annonce disponible pour le moment.",
  "filters.emptyWithFilters":
    "Aucune annonce ne correspond à ces filtres. Modifiez ou réinitialisez les filtres.",
  "filters.investment": "Investissement",
  "hostStudio.syncing": "Mise à jour…",
  "hostSuggestions.sessionExpiredSub":
    "Votre session a expiré. Reconnectez-vous pour voir les acheteurs correspondants.",
  "hostSuggestions.sessionExpiredTitle": "Reconnectez-vous",
  "hostSuggestions.signInSub":
    "Les correspondances d'acheteurs sont disponibles après connexion en tant qu'hôte.",
  "hostSuggestions.signInTitle": "Connectez-vous pour voir les acheteurs",
  "listing.sale.createTimeout":
    "Le serveur n'a pas répondu à temps. Redémarrez l'API et vérifiez Postgres, puis réessayez.",
  "listing.sale.publishingListing": "Publication de l'annonce…",
  "listing.sale.uploadingMedia": "Téléchargement des photos…",
  "listingAi.introCtaTitle": "Ajouter avec l'IA",
  "listingAi.introCtaSubtitle":
    "Gagnez ~70 % de temps — nous rédigeons titre, description et localisation",
  "listingAi.promoTitle": "Ajouter avec l'IA",
  "listingAi.promoEyebrow": "Nouvel hôte",
  "listingAi.promoSubtitle":
    "Décrivez votre bien — nous rédigeons le titre, la description et la localisation.",
  "listingAi.promoCta": "Créer une annonce",
  "listingAi.screenTitle": "Ajouter avec l'IA",
  "listingAi.composeTitle": "Parlez-nous de votre annonce",
  "listingAi.composeSub":
    "Écrivez naturellement — comme à un conseiller. Nous gérons titre, description et localisation.",
  "listingAi.agentName": "Agent d'annonce Meskeny",
  "listingAi.agentRole": "{{kind}} · rédige titre, description et localisation",
  "listingAi.agentTrust":
    "Privé pour vous · Catalogue Mauritanie · N'invente jamais de quartiers",
  "listingAi.tryExample": "Essayer un exemple",
  "listingAi.exampleLand1":
    "Terrain résidentiel 500 m² à Tevragh Zeina, rue calme, titre foncier disponible.",
  "listingAi.exampleLand2":
    "Terrain d'angle près de la route principale à Nouakchott, clôturé, idéal pour villa.",
  "listingAi.exampleSale1":
    "Appartement moderne 3 chambres à Ksar, cuisine rénovée, parking.",
  "listingAi.exampleSale2":
    "Villa avec jardin à Tevragh Zeina, 4 chambres, quartier familial calme.",
  "listingAi.exampleRent1":
    "2 chambres meublées près de l'université, Wi‑Fi, loyer mensuel.",
  "listingAi.exampleRent2":
    "Studio en centre-ville, climatisation, idéal pour professionnels.",
  "listingAi.usuallyFast": "En général moins de 15 secondes",
  "listingAi.stillWorking": "{{s}}s — encore en cours…",
  "listingAi.flowDescribe": "Décrire",
  "listingAi.flowReview": "Vérifier",
  "listingAi.flowPublish": "Publier",
  "listingAi.flowApply": "Appliquer",
  "listingAi.heroEyebrow": "Essentiels de l'annonce",
  "listingAi.priceHeroLabel": "Prix demandé",
  "listingAi.currencyMru": "MRU",
  "listingAi.areaHeroLabel": "Surface",
  "listingAi.areaHeroRequired": "Surface (obligatoire)",
  "listingAi.credibilityTime": "~70 % plus rapide qu'en manuel",
  "listingAi.credibilityLocation": "Catalogue officiel ville et quartier",
  "listingAi.credibilityPrivate": "Privé jusqu'à la publication",
  "listingAi.storySection": "Votre histoire d'annonce",
  "listingAi.storySectionSub":
    "Décrivez le bien comme à un acheteur — notre agent rédige l'annonce professionnelle.",
  "listingAi.locationSectionSub":
    "Aide à correspondre au catalogue officiel de Mauritanie.",
  "listingAi.footerNote": "Vérifiez tout avant la mise en ligne.",
  "listingAi.hero": "Gagnez ~70 % de votre temps",
  "listingAi.heroSub":
    "Quelques détails et photos suffisent. Notre agent rédige titre, description et localisation.",
  "listingAi.detailsLabel": "À propos de votre bien",
  "listingAi.detailsPlaceholder":
    "Décrivez le bien, terrain ou location — ambiance, état, points forts…",
  "listingAi.priceLabel": "Prix (MRU)",
  "listingAi.bedrooms": "Chambres",
  "listingAi.bathrooms": "Salles de bain",
  "listingAi.areaLabel": "Surface (m²)",
  "listingAi.areaRequiredLabel": "Surface (m²) *",
  "listingAi.locationLabel": "Localisation (ville, zone, quartier)",
  "listingAi.cityPlaceholder": "Ville",
  "listingAi.zonePlaceholder": "Zone / secteur",
  "listingAi.quartierPlaceholder": "Quartier / secteur",
  "listingAi.mediaLabel": "Photos et vidéo (optionnel)",
  "listingAi.specsLabel": "Caractéristiques",
  "listingAi.mediaNote": "Optionnel — vous pourrez ajouter plus tard.",
  "listingAi.addPhotos": "Photos",
  "listingAi.addVideo": "Vidéo",
  "listingAi.generate": "Générer avec l'IA",
  "listingAi.propertyDetailsTitle": "Détails du bien",
  "listingAi.propertyDetailsSub":
    "Obligatoire avant la génération IA — les acheteurs s'y attendent.",
  "listingAi.propertyTypeLabel": "Type de bien",
  "listingAi.yearBuiltLabel": "Année de construction",
  "listingAi.yearBuiltPlaceholder": "ex. 2018",
  "listingAi.amenitiesLabel": "Équipements",
  "listingAi.amenitiesSub":
    "Sélectionnez tout ce qui s'applique — très important pour les acheteurs.",
  "listingAi.amenitiesUnavailable":
    "Impossible de charger les équipements. Réessayez dans un instant.",
  "listingAi.missingPropertyType":
    "Vous n'avez pas indiqué le type de bien. Choisissez-en un ci-dessous.",
  "listingAi.missingYearBuilt":
    "Vous n'avez pas indiqué l'année de construction.",
  "listingAi.missingAmenities":
    "Vous n'avez sélectionné aucun équipement. Choisissez ceux qui s'appliquent.",
  "listingAi.creatingTitle": "L'IA crée votre annonce",
  "listingAi.uploadBadge": "Téléchargement",
  "listingAi.uploadTitle": "Téléchargement photos et vidéo",
  "listingAi.uploadTitleReview": "Téléchargement de vos médias",
  "listingAi.uploadSub":
    "Transfert sécurisé vers Meskeny — l'IA démarre juste après.",
  "listingAi.uploadHint": "Gardez l'application ouverte un instant",
  "listingAi.processingBadge": "Meskeny IA",
  "listingAi.processingTitle": "Rédaction de votre annonce",
  "listingAi.cancelGeneration": "Annuler la génération",
  "listingAi.mediaSheetBadge": "Photos et vidéo",
  "listingAi.generatingOnButton": "Génération…",
  "listingAi.locationSelectedTitle": "Localisation sélectionnée",
  "listingAi.locationSelectedSub":
    "Appuyez sur Modifier pour changer un niveau. Seuls vos choix sont affichés.",
  "listingAi.locationChange": "Modifier",
  "listingAi.locationNotSet": "Non sélectionné",
  "listingAi.locationOptional": "Optionnel",
  "listingAi.noQuartiers": "Aucun quartier pour cette zone",
  "listingAi.cityRequired": "Sélectionnez une ville pour cette annonce.",
  "listingAi.zoneRequired": "Sélectionnez une zone pour cette annonce.",
  "listingAi.detailsMin": "Dites-en un peu plus (10+ caractères).",
  "listingAi.priceRequired": "Entrez un prix valide.",
  "listingAi.areaRequired": "Entrez la surface en m².",
  "listingAi.failed": "Échec de la génération. Réessayez.",
  "listingAi.doneTitle": "Annonce prête",
  "listingAi.doneBody": "Vérifiez les détails et publiez quand vous êtes prêt.",
  "listingAi.progress.default": "Meskeny IA prépare votre annonce…",
  "listingAi.progress.queued": "Démarrage…",
  "listingAi.progress.uploading": "Téléchargement de vos médias…",
  "listingAi.progress.matching_location":
    "Correspondance ville, zone et quartier…",
  "listingAi.progress.writing_listing": "Rédaction du titre et de la description…",
  "listingAi.progress.finalizing": "Finalisation de votre annonce…",
  "listingAi.progress.done": "Presque terminé…",
  "listingAi.outputLanguage":
    "L'IA écrira en : {{lang}} (selon votre texte, pas la langue de l'app)",
  "listingAi.langAr": "Arabe",
  "listingAi.langFr": "Français",
  "listingAi.langEn": "Anglais",
  "listingAi.stepOf": "Étape {{current}} sur {{total}}",
  "listingAi.stepBasics": "Essentiels",
  "listingAi.stepDetails": "Détails",
  "listingAi.stepCity": "Ville",
  "listingAi.stepZone": "Zone",
  "listingAi.stepQuartier": "Secteur",
  "listingAi.stepStory": "Description",
  "listingAi.stepMedia": "Médias",
  "listingAi.hint.basics":
    "Entrez le prix et la surface — l'IA s'occupe du reste.",
  "listingAi.hint.extras":
    "Type, année et équipements façonnent l'annonce pour les acheteurs.",
  "listingAi.hint.city":
    "L'IA fait correspondre votre choix à notre base de localisation.",
  "listingAi.hint.zone":
    "Les zones aident les locataires à trouver le bon quartier.",
  "listingAi.hint.quartier":
    "Les secteurs (quartiers) affinent la zone exacte.",
  "listingAi.hint.plotNumber":
    "Utilisez le numéro sur votre cadastre ou titre foncier.",
  "listingAi.hint.story":
    "Écrivez naturellement — comme si vous parliez à un ami.",
  "listingAi.hint.media":
    "Les photos aident, mais vous pouvez les ajouter après la génération.",
  "listingAi.headline.plotNumberTitle": "Quel est le numéro de parcelle ?",
  "listingAi.headline.plotNumberSub":
    "Obligatoire pour la vérification cadastrale — numéro du titre foncier.",
  "listingAi.reviewSub":
    "Vérifiez ce que Meskeny IA a préparé. Vous pouvez tout modifier.",
  "listingAi.reviewListingTitle": "Titre",
  "listingAi.reviewDescription": "Description",
  "listingAi.reviewPlotNumber": "Numéro de parcelle (obligatoire)",
  "listingAi.stepPlotNumber": "Parcelle",
  "listingAi.plotNumberRequiredTitle": "Numéro de parcelle requis",
  "listingAi.plotNumberRequiredBody":
    "Entrez le numéro cadastral exactement comme sur vos documents.",
  "listingAi.plotNumberRequiredNotice":
    "Le numéro de parcelle est requis — nous l'utilisons pour le cadastre officiel.",
  "listingAi.plotNumberSector": "Secteur : {{name}}",
  "listingAi.locationConfirm": "Localisation — confirmer ou modifier",
  "listingAi.matchConfidence": "Correspondance : {{level}}",
  "listingAi.papersTitle": "Documents du bien",
  "listingAi.papersOptional": "Optionnel",
  "listingAi.papersSub": "Sélectionnez les documents dont vous disposez aujourd'hui.",
  "listingAi.papersCredibility":
    "Déclarer vos documents légaux renforce la crédibilité et peut améliorer le classement.",
  "listingAi.papersSelectedBenefit":
    "Bon choix — cela renforce la confiance dans votre annonce.",
  "listingAi.papersOptionalNote":
    "Pas de souci si vous ignorez — vous pourrez ajouter les documents plus tard.",
  "listingAi.papersSkip": "Ignorer pour l'instant",
  "listingAi.papersSkipped":
    "Vous pourrez ajouter les documents plus tard dans les paramètres.",
  "listingAi.backEdit": "Retour",
  "listingAi.confirmApply": "Utiliser cette annonce",
  "listingAi.confirmApplyNoMedia": "Continuer",
  "listingAi.mediaPromptTitle": "Pas encore de photos",
  "listingAi.mediaPromptBody":
    "Les annonces avec photos performent mieux. Ajoutez des médias — titre et description restent prêts.",
  "listingAi.mediaPromptAddPhotos": "Ajouter des photos",
  "listingAi.mediaPromptAddVideo": "Ajouter une vidéo",
  "listingAi.mediaPromptSkip": "Continuer sans médias",
  "listingAi.mediaPromptConfirm":
    "Ajoutez photos ou vidéo maintenant, ou continuez — vous pourrez les ajouter ensuite.",
  "listingAi.addMoreMedia": "+ Ajouter des photos",
  "listingAi.uploadFailed": "Échec du téléchargement",
  "listingAi.mediaSheetLater": "Plus tard",
  "map.add": "Ajouter",
  "map.addMorePoints": "Ajouter des points",
  "map.added": "ajouté",
  "map.confirmClear": "Effacer le dessin ?",
  "map.confirmClearMessage":
    "Voulez-vous vraiment effacer votre dessin ? Cette action est irréversible.",
  "map.drawingMode": "Mode dessin",
  "map.exitDrawing": "Quitter le mode dessin ?",
  "map.exitDrawingMessage":
    "Vous avez des points non enregistrés. Voulez-vous vraiment quitter ?",
  "map.invalidPolygon": "Zone invalide",
  "map.morePoint": "point de plus",
  "map.morePoints": "points de plus",
  "map.needMorePoints":
    "Ajoutez au moins 3 points pour créer une zone valide.",
  "map.point": "point",
  "map.points": "points",
  "map.readyToApply": "Prêt",
  "map.tapApplyToFinish":
    "Appuyez sur Appliquer pour terminer et rechercher dans cette zone",
  "map.tapApplyWhenDone": "Appuyez sur Appliquer quand c'est fait",
  "map.tapMapToDraw": "Appuyez sur la carte pour dessiner votre zone",
  "map.tapToStartDrawing": "Appuyez sur la carte pour dessiner",
  "map.toComplete": "pour terminer",
  "myProperties.loadErrorTitle": "Impossible de charger vos annonces",
  "myProperties.rentalCount": "locations",
  "myProperties.sessionExpiredSub":
    "Votre session a expiré. Reconnectez-vous pour voir vos locations.",
  "myProperties.sessionExpiredTitle": "Reconnectez-vous",
  "myProperties.status.cancelled": "Annulé",
  "myProperties.summaryPending": "{{count}} en attente de validation",
  "myProperties.summarySub":
    "Appuyez sur une annonce pour modifier les détails et le prix.",
  "myProperties.summaryTitle": "Vos locations",
  "organization.join.button": "Rejoindre",
  "organization.join.codeLabel": "Code d'invitation",
  "organization.join.codePlaceholder": "Entrez le code d'invitation",
  "organization.join.description":
    "Entrez le code fourni par le propriétaire de l'agence pour la rejoindre.",
  "organization.join.error.emptyCode": "Veuillez entrer un code d'invitation.",
  "organization.join.error.title": "Erreur",
  "organization.join.info":
    "Les codes expirent après 5 minutes. Demandez un nouveau code au propriétaire si nécessaire.",
  "organization.join.success.message": "Vous avez rejoint l'organisation avec succès.",
  "organization.join.success.title": "Succès !",
  "organization.join.title": "Rejoindre une organisation",
  "organization.join.warning":
    "Une fois dans une organisation, les biens et terrains que vous créez appartiennent à l'agence.",
  "organization.joinAgency": "Rejoindre une agence",
  "sale.modifyProperty": "Modifier votre bien",
  "sale.reviews": "avis",
  "sale.website": "Site web",
};

// Arabic translations
const AR = {
  "account.brokerIdLine": "معرّف الوسيط · {{id}}",
  "account.brokerVerifiedSub": "تم تأكيد أوراق الوسيط على Meskeny.",
  "aiChat.plotBoundary": "حدود القطعة",
  "aiChat.plotNumber": "قطعة {{number}}",
  "apiErrors.AUTH_INVALID_CREDENTIALS": "البريد/الهاتف أو كلمة المرور غير صحيحة.",
  "apiErrors.AUTH_UNAUTHORIZED": "يرجى تسجيل الدخول مرة أخرى.",
  "apiErrors.NET_DNS": "تعذّر الاتصال الآن. حاول لاحقاً.",
  "apiErrors.NET_NO_RESPONSE":
    "تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.",
  "apiErrors.NET_OFFLINE": "لا يوجد اتصال بالإنترنت. اتصل وحاول مرة أخرى.",
  "apiErrors.NET_SSL": "فشل الاتصال الآمن. حاول مرة أخرى.",
  "apiErrors.NET_TIMEOUT": "انتهت مهلة الطلب. حاول مرة أخرى.",
  "apiErrors.NET_UNKNOWN": "حدث خطأ في الشبكة. حاول مرة أخرى.",
  "apiErrors.SERVER_INTERNAL": "حدث خطأ من جانبنا. حاول قريباً.",
  "apiErrors.SERVER_OK": "الخادم يعمل",
  "apiErrors.UNKNOWN": "حدث خطأ ما.",
  "apiErrors.USER_CHECK_BOTH_IDENTIFIERS": "استخدم البريد أو الهاتف، وليس كليهما.",
  "apiErrors.USER_CHECK_INVALID_BODY": "طلب غير صالح. حاول مرة أخرى.",
  "apiErrors.USER_CHECK_NO_IDENTIFIER": "أدخل بريدك أو رقم هاتفك.",
  "apiErrors.VALIDATION_FAILED": "تحقق من المدخلات وحاول مرة أخرى.",
  "apiErrors.serverUnreachableTitle": "مشكلة في الاتصال",
  "auth.common.current": "الحالي",
  "common.drawArea": "رسم منطقة",
  "dashboard.goodAfternoon": "مساء الخير",
  "dashboard.goodEvening": "مساء الخير",
  "dashboard.goodMorning": "صباح الخير",
  "editProperty.addAtLeastOne": "أضف صورة واحدة على الأقل",
  "editProperty.recommendedPhotos": "نوصي بإضافة {{count}} صور إضافية لمزيد من الظهور",
  "editProperty.steps.amenitiesDesc": "إضافة المرافق",
  "editProperty.steps.availabilityDesc": "إدارة تقويم التوفر",
  "editProperty.steps.bookingModeDesc": "إعداد الحجز",
  "editProperty.steps.cancellationDesc": "سياسة الإلغاء",
  "editProperty.steps.capacityDesc": "تحديد سعة الضيوف",
  "editProperty.steps.descriptionDesc": "تحديث الوصف",
  "editProperty.steps.locationDesc": "تحديد موقع العقار",
  "editProperty.steps.photosDesc": "إدارة الصور",
  "editProperty.steps.pricingDesc": "تحديد السعر لليلة",
  "editProperty.steps.propertyPolicyDesc": "سياسات العقار",
  "editProperty.steps.rulesDesc": "قواعد المنزل",
  "editProperty.steps.secureCompoundDesc": "إعدادات الأمان",
  "editProperty.steps.titleDesc": "تعديل العنوان",
  "editProperty.steps.typeDesc": "اختيار نوع العقار",
  "editProperty.steps.userSafetyDesc": "ميزات السلامة",
  "filters.emptyNoData": "لا توجد إعلانات متاحة حالياً.",
  "filters.emptyWithFilters":
    "لا توجد إعلانات تطابق هذه الفلاتر. جرّب تعديلها أو مسحها.",
  "filters.investment": "استثمار",
  "hostStudio.syncing": "جاري التحديث…",
  "hostSuggestions.sessionExpiredSub":
    "انتهت جلستك. سجّل الدخول مرة أخرى لعرض المشترين المحتملين.",
  "hostSuggestions.sessionExpiredTitle": "سجّل الدخول مرة أخرى",
  "hostSuggestions.signInSub":
    "تطابقات المشترين متاحة بعد تسجيل الدخول كمضيف.",
  "hostSuggestions.signInTitle": "سجّل الدخول لعرض المشترين",
  "listing.sale.createTimeout":
    "الخادم لم يستجب في الوقت المحدد. أعد تشغيل API وتحقق من Postgres ثم حاول.",
  "listing.sale.publishingListing": "جاري نشر الإعلان…",
  "listing.sale.uploadingMedia": "جاري رفع الصور…",
  "listingAi.introCtaTitle": "إضافة بالذكاء الاصطناعي",
  "listingAi.introCtaSubtitle":
    "وفّر ~70٪ من وقتك — نكتب العنوان والوصف والموقع",
  "listingAi.promoTitle": "إضافة بالذكاء الاصطناعي",
  "listingAi.promoEyebrow": "مضيف جديد",
  "listingAi.promoSubtitle":
    "صف مكانك — نكتب العنوان والوصف ونطابق موقعك.",
  "listingAi.promoCta": "ابدأ إعلاناً",
  "listingAi.screenTitle": "إضافة بالذكاء الاصطناعي",
  "listingAi.composeTitle": "أخبرنا عن إعلانك",
  "listingAi.composeSub":
    "اكتب بشكل طبيعي — كأنك تتحدث مع مستشار. نتولى العنوان والوصف والموقع.",
  "listingAi.agentName": "وكيل إعلانات Meskeny",
  "listingAi.agentRole": "{{kind}} · يكتب العنوان والوصف والموقع",
  "listingAi.agentTrust":
    "خاص بك · كتالوج موريتانيا · لا يختلق أحياء",
  "listingAi.tryExample": "جرب مثالاً",
  "listingAi.exampleLand1":
    "قطعة سكنية 500 م² في تفرغ زينة، شارع هادئ، سند ملكية متوفر.",
  "listingAi.exampleLand2":
    "أرض زاوية قرب الطريق الرئيسي في نواكشوط، مسورة، مثالية لفيلا.",
  "listingAi.exampleSale1":
    "شقة حديثة 3 غرف في كصر، مطبخ مجدّد، موقف سيارات.",
  "listingAi.exampleSale2":
    "فيلا بحديقة في تفرغ زينة، 4 غرف، حي عائلي هادئ.",
  "listingAi.exampleRent1":
    "غرفتان مفروشتان قرب الجامعة، واي فاي، إيجار شهري.",
  "listingAi.exampleRent2":
    "استوديو في وسط المدينة، تكييف، مثالي للمهنيين.",
  "listingAi.usuallyFast": "عادة أقل من 15 ثانية",
  "listingAi.stillWorking": "{{s}}ث — لا يزال قيد العمل…",
  "listingAi.flowDescribe": "وصف",
  "listingAi.flowReview": "مراجعة",
  "listingAi.flowPublish": "نشر",
  "listingAi.flowApply": "تطبيق",
  "listingAi.heroEyebrow": "أساسيات الإعلان",
  "listingAi.priceHeroLabel": "السعر المطلوب",
  "listingAi.currencyMru": "أوقية",
  "listingAi.areaHeroLabel": "المساحة",
  "listingAi.areaHeroRequired": "المساحة (مطلوبة)",
  "listingAi.credibilityTime": "~70٪ أسرع من الإدخال اليدوي",
  "listingAi.credibilityLocation": "كتالوج رسمي للمدن والأحياء",
  "listingAi.credibilityPrivate": "خاص حتى النشر",
  "listingAi.storySection": "قصة إعلانك",
  "listingAi.storySectionSub":
    "صف العقار كما تخبر مشترياً — وكيلنا يكتب الإعلان الاحترافي.",
  "listingAi.locationSectionSub": "يساعد على المطابقة مع كتالوج موريتانيا الرسمي.",
  "listingAi.footerNote": "راجع كل شيء قبل النشر.",
  "listingAi.hero": "وفّر ~70٪ من وقتك",
  "listingAi.heroSub":
    "شارك بعض التفاصيل والصور. وكيلنا يكتب العنوان والوصف ويطابق المدينة والمنطقة.",
  "listingAi.detailsLabel": "عن عقارك",
  "listingAi.detailsPlaceholder":
    "صف العقار أو الأرض أو الإيجار — الموقع، الحالة، المميزات…",
  "listingAi.priceLabel": "السعر (أوقية)",
  "listingAi.bedrooms": "غرف النوم",
  "listingAi.bathrooms": "الحمامات",
  "listingAi.areaLabel": "المساحة (م²)",
  "listingAi.areaRequiredLabel": "المساحة (م²) *",
  "listingAi.locationLabel": "الموقع (مدينة، منطقة، حي)",
  "listingAi.cityPlaceholder": "المدينة",
  "listingAi.zonePlaceholder": "المنطقة / القطاع",
  "listingAi.quartierPlaceholder": "الحي / القطاع",
  "listingAi.mediaLabel": "صور وفيديو (اختياري)",
  "listingAi.specsLabel": "المواصفات",
  "listingAi.mediaNote": "اختياري — يمكنك الإضافة لاحقاً.",
  "listingAi.addPhotos": "صور",
  "listingAi.addVideo": "فيديو",
  "listingAi.generate": "إنشاء بالذكاء الاصطناعي",
  "listingAi.propertyDetailsTitle": "تفاصيل العقار",
  "listingAi.propertyDetailsSub":
    "مطلوب قبل إنشاء الإعلان — المشترون يتوقعونها في كل إعلان.",
  "listingAi.propertyTypeLabel": "نوع العقار",
  "listingAi.yearBuiltLabel": "سنة البناء",
  "listingAi.yearBuiltPlaceholder": "مثال: 2018",
  "listingAi.amenitiesLabel": "المرافق",
  "listingAi.amenitiesSub": "اختر كل ما ينطبق — مهم جداً للمشترين.",
  "listingAi.amenitiesUnavailable": "تعذّر تحميل المرافق. حاول بعد لحظة.",
  "listingAi.missingPropertyType": "لم تحدد نوع العقار. اختر واحداً أدناه.",
  "listingAi.missingYearBuilt": "لم تحدد سنة البناء.",
  "listingAi.missingAmenities": "لم تختر أي مرافق. اختر ما ينطبق.",
  "listingAi.creatingTitle": "الذكاء الاصطناعي ينشئ إعلانك",
  "listingAi.uploadBadge": "رفع",
  "listingAi.uploadTitle": "رفع الصور والفيديو",
  "listingAi.uploadTitleReview": "رفع الوسائط",
  "listingAi.uploadSub": "نقل آمن إلى Meskeny — يبدأ الذكاء الاصطناعي بعد الانتهاء.",
  "listingAi.uploadHint": "أبقِ التطبيق مفتوحاً لحظة",
  "listingAi.processingBadge": "Meskeny AI",
  "listingAi.processingTitle": "صياغة إعلانك",
  "listingAi.cancelGeneration": "إلغاء الإنشاء",
  "listingAi.mediaSheetBadge": "صور وفيديو",
  "listingAi.generatingOnButton": "جاري الإنشاء…",
  "listingAi.locationSelectedTitle": "الموقع المحدد",
  "listingAi.locationSelectedSub":
    "اضغط تغيير لاستبدال مستوى. يظهر اختيارك فقط.",
  "listingAi.locationChange": "تغيير",
  "listingAi.locationNotSet": "غير محدد",
  "listingAi.locationOptional": "اختياري",
  "listingAi.noQuartiers": "لا توجد أحياء لهذه المنطقة",
  "listingAi.cityRequired": "اختر مدينة لهذا الإعلان.",
  "listingAi.zoneRequired": "اختر منطقة لهذا الإعلان.",
  "listingAi.detailsMin": "أخبرنا المزيد (10+ أحرف).",
  "listingAi.priceRequired": "أدخل سعراً صالحاً.",
  "listingAi.areaRequired": "أدخل المساحة بالم².",
  "listingAi.failed": "فشل الإنشاء. حاول مرة أخرى.",
  "listingAi.doneTitle": "الإعلان جاهز",
  "listingAi.doneBody": "راجع التفاصيل وانشر عندما تكون جاهزاً.",
  "listingAi.progress.default": "Meskeny AI يجهّز إعلانك…",
  "listingAi.progress.queued": "جاري البدء…",
  "listingAi.progress.uploading": "جاري رفع الوسائط…",
  "listingAi.progress.matching_location": "مطابقة المدينة والمنطقة والحي…",
  "listingAi.progress.writing_listing": "كتابة العنوان والوصف…",
  "listingAi.progress.finalizing": "إنهاء إعلانك…",
  "listingAi.progress.done": "يكاد ينتهي…",
  "listingAi.outputLanguage":
    "سيكتب الذكاء الاصطناعي بـ: {{lang}} (من نصك، وليس لغة التطبيق)",
  "listingAi.langAr": "العربية",
  "listingAi.langFr": "الفرنسية",
  "listingAi.langEn": "الإنجليزية",
  "listingAi.stepOf": "الخطوة {{current}} من {{total}}",
  "listingAi.stepBasics": "الأساسيات",
  "listingAi.stepDetails": "التفاصيل",
  "listingAi.stepCity": "المدينة",
  "listingAi.stepZone": "المنطقة",
  "listingAi.stepQuartier": "القطاع",
  "listingAi.stepStory": "الوصف",
  "listingAi.stepMedia": "الوسائط",
  "listingAi.hint.basics": "أدخل السعر والمساحة — الذكاء الاصطناعي يتولى الباقي.",
  "listingAi.hint.extras": "النوع والسنة والمرافق تشكّل الإعلان للمشترين.",
  "listingAi.hint.city": "الذكاء الاصطناعي يطابق اختيارك مع قاعدة المواقع.",
  "listingAi.hint.zone": "المناطق تساعد المستأجرين على إيجاد الحي المناسب.",
  "listingAi.hint.quartier": "القطاعات (الأحياء) تحدد المنطقة بدقة.",
  "listingAi.hint.plotNumber": "استخدم الرقم على السند العقاري أو المسح.",
  "listingAi.hint.story": "اكتب بشكل طبيعي — كأنك تخبر صديقاً.",
  "listingAi.hint.media": "الصور تساعد، ويمكنك إضافتها بعد الإنشاء.",
  "listingAi.headline.plotNumberTitle": "ما رقم القطعة؟",
  "listingAi.headline.plotNumberSub":
    "مطلوب للتحقق من المسح — الرقم على السند العقاري.",
  "listingAi.reviewSub": "راجع ما أعدّه Meskeny AI. يمكنك تعديل أي شيء.",
  "listingAi.reviewListingTitle": "العنوان",
  "listingAi.reviewDescription": "الوصف",
  "listingAi.reviewPlotNumber": "رقم القطعة (مطلوب)",
  "listingAi.stepPlotNumber": "القطعة",
  "listingAi.plotNumberRequiredTitle": "رقم القطعة مطلوب",
  "listingAi.plotNumberRequiredBody":
    "أدخل رقم المسح كما يظهر في مستنداتك.",
  "listingAi.plotNumberRequiredNotice":
    "رقم القطعة مطلوب — نستخدمه للمطابقة في المسح الرسمي.",
  "listingAi.plotNumberSector": "القطاع: {{name}}",
  "listingAi.locationConfirm": "الموقع — تأكيد أو تغيير",
  "listingAi.matchConfidence": "التطابق: {{level}}",
  "listingAi.papersTitle": "مستندات العقار",
  "listingAi.papersOptional": "اختياري",
  "listingAi.papersSub": "اختر المستندات المتوفرة لديك اليوم.",
  "listingAi.papersCredibility":
    "إعلان المستندات القانونية يزيد المصداقية وقد يحسّن الترتيب في البحث.",
  "listingAi.papersSelectedBenefit": "اختيار جيد — يعزز ثقة المشترين.",
  "listingAi.papersOptionalNote": "لا مشكلة إن تخطيت — يمكنك الإضافة لاحقاً.",
  "listingAi.papersSkip": "تخطي الآن",
  "listingAi.papersSkipped": "يمكنك إضافة المستندات لاحقاً من إعدادات الإعلان.",
  "listingAi.backEdit": "رجوع",
  "listingAi.confirmApply": "استخدام هذا الإعلان",
  "listingAi.confirmApplyNoMedia": "متابعة",
  "listingAi.mediaPromptTitle": "لا توجد صور بعد",
  "listingAi.mediaPromptBody":
    "الإعلانات بالصور تؤدي أفضل. أضف وسائط الآن — العنوان والوصف جاهزان.",
  "listingAi.mediaPromptAddPhotos": "إضافة صور",
  "listingAi.mediaPromptAddVideo": "إضافة فيديو",
  "listingAi.mediaPromptSkip": "متابعة بدون وسائط",
  "listingAi.mediaPromptConfirm":
    "أضف صوراً أو فيديو الآن، أو تابع — يمكنك الإضافة لاحقاً.",
  "listingAi.addMoreMedia": "+ إضافة صور",
  "listingAi.uploadFailed": "فشل الرفع",
  "listingAi.mediaSheetLater": "لاحقاً",
  "map.add": "إضافة",
  "map.addMorePoints": "إضافة نقاط",
  "map.added": "مُضاف",
  "map.confirmClear": "مسح الرسم؟",
  "map.confirmClearMessage": "هل تريد مسح الرسم؟ لا يمكن التراجع.",
  "map.drawingMode": "وضع الرسم",
  "map.exitDrawing": "الخروج من وضع الرسم؟",
  "map.exitDrawingMessage": "لديك نقاط غير محفوظة. هل تريد الخروج؟",
  "map.invalidPolygon": "منطقة غير صالحة",
  "map.morePoint": "نقطة إضافية",
  "map.morePoints": "نقاط إضافية",
  "map.needMorePoints": "أضف 3 نقاط على الأقل لإنشاء منطقة صالحة.",
  "map.point": "نقطة",
  "map.points": "نقاط",
  "map.readyToApply": "جاهز",
  "map.tapApplyToFinish": "اضغط تطبيق للإنهاء والبحث في هذه المنطقة",
  "map.tapApplyWhenDone": "اضغط تطبيق عند الانتهاء",
  "map.tapMapToDraw": "اضغط على الخريطة لبدء رسم المنطقة",
  "map.tapToStartDrawing": "اضغط على الخريطة للرسم",
  "map.toComplete": "للإكمال",
  "myProperties.loadErrorTitle": "تعذّر تحميل إعلاناتك",
  "myProperties.rentalCount": "إيجارات",
  "myProperties.sessionExpiredSub":
    "انتهت جلستك. سجّل الدخول لعرض إعلانات الإيجار.",
  "myProperties.sessionExpiredTitle": "سجّل الدخول مرة أخرى",
  "myProperties.status.cancelled": "ملغى",
  "myProperties.summaryPending": "{{count}} بانتظار المراجعة",
  "myProperties.summarySub": "اضغط على إعلان لتعديل التفاصيل والسعر.",
  "myProperties.summaryTitle": "إيجاراتك",
  "organization.addCover": "إضافة غلاف",
  "organization.addLogo": "إضافة شعار",
  "organization.changeCover": "تغيير الغلاف",
  "organization.changeLogo": "تغيير الشعار",
  "organization.descriptionLabel": "الوصف",
  "organization.descriptionOptional": "اختياري",
  "organization.detailsSection": "تفاصيل الوكالة",
  "organization.editAgency": "تعديل الوكالة",
  "organization.editLead": "حدّث معلومات وكالتك.",
  "organization.editLockedBody":
    "يمكنك تعديل الوكالة مرة أخرى بعد {{days}} يوماً.",
  "organization.editLockedTitle": "التعديل مقفل مؤقتاً",
  "organization.editableInDays": "قابل للتعديل خلال {{days}} يوماً",
  "organization.imageReadError": "تعذّر قراءة الصورة.",
  "organization.join.button": "انضمام",
  "organization.join.codeLabel": "رمز الدعوة",
  "organization.join.codePlaceholder": "أدخل رمز الدعوة",
  "organization.join.description":
    "أدخل رمز الدعوة من مالك الوكالة للانضمام.",
  "organization.join.error.emptyCode": "يرجى إدخال رمز الدعوة.",
  "organization.join.error.title": "خطأ",
  "organization.join.info":
    "تنتهي رموز الدعوة بعد 5 دقائق. اطلب رمزاً جديداً من المالك إن لزم.",
  "organization.join.success.message": "انضممت إلى المنظمة بنجاح.",
  "organization.join.success.title": "تم بنجاح!",
  "organization.join.title": "الانضمام إلى منظمة",
  "organization.join.warning":
    "بعد الانضمام، العقارات والأراضي التي تنشئها تخص الوكالة.",
  "organization.joinAgency": "الانضمام إلى وكالة",
  "organization.logoSub": "يظهر على إعلاناتك وملف الوكالة.",
  "organization.logoTitle": "شعار الوكالة",
  "organization.nameLabel": "اسم الوكالة",
  "organization.noChangesBody": "لم تقم بأي تغييرات.",
  "organization.noChangesTitle": "لا تغييرات",
  "organization.notFound": "الوكالة غير موجودة",
  "organization.photosSection": "الصور",
  "organization.typeRequired": "نوع النشاط مطلوب",
  "organization.updateFailed": "فشل التحديث",
  "organization.updateSuccess": "تم تحديث الوكالة",
  "organization.uploadFailedBody": "تعذّر رفع الصورة. حاول مرة أخرى.",
  "organization.uploadFailedTitle": "فشل الرفع",
  "sale.modifyProperty": "تعديل عقارك",
  "sale.reviews": "تقييمات",
  "sale.website": "الموقع",
};

const frFlatBefore = flatten(fr);
const arFlatBefore = flatten(ar);

for (const key of Object.keys(enFlat)) {
  if (!(key in frFlatBefore)) {
    setPath(fr, key, FR[key] ?? enFlat[key]);
  }
  if (!(key in arFlatBefore)) {
    setPath(ar, key, AR[key] ?? enFlat[key]);
  }
}

for (const [k, v] of Object.entries(FR)) {
  if (v) setPath(fr, k, v);
}
for (const [k, v] of Object.entries(AR)) {
  if (v) setPath(ar, k, v);
}

fs.writeFileSync(path.join(dir, "fr.json"), JSON.stringify(fr, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "ar.json"), JSON.stringify(ar, null, 2) + "\n");

const frAfter = Object.keys(flatten(fr)).length;
const arAfter = Object.keys(flatten(ar)).length;
const missingFr = Object.keys(enFlat).filter((k) => !(k in flatten(fr)));
const missingAr = Object.keys(enFlat).filter((k) => !(k in flatten(ar)));

console.log("EN:", Object.keys(enFlat).length);
console.log("FR:", frAfter, "missing:", missingFr.length);
console.log("AR:", arAfter, "missing:", missingAr.length);
if (missingFr.length) console.log("FR sample:", missingFr.slice(0, 5));
if (missingAr.length) console.log("AR sample:", missingAr.slice(0, 5));

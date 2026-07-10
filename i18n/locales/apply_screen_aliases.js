/**
 * Add screen t() alias keys + fix path mismatches across EN/FR/AR.
 * Run: node apply_screen_aliases.js
 */
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
const fr = JSON.parse(fs.readFileSync(path.join(dir, "fr.json"), "utf8"));
const ar = JSON.parse(fs.readFileSync(path.join(dir, "ar.json"), "utf8"));

function getAt(obj, dotted) {
  const parts = dotted.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    const idx = Number(p);
    cur = Number.isInteger(idx) && String(idx) === p ? cur[idx] : cur[p];
  }
  return cur;
}

function setPath(obj, dotted, value) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const idx = Number(p);
    if (Number.isInteger(idx) && String(idx) === p) {
      if (!Array.isArray(cur)) return false;
      if (!cur[idx] || typeof cur[idx] !== "object") cur[idx] = {};
      cur = cur[idx];
    } else {
      if (cur[p] != null && typeof cur[p] !== "object") return false;
      if (!cur[p]) cur[p] = {};
      cur = cur[p];
    }
  }
  const last = parts[parts.length - 1];
  const existing = cur[last];
  if (existing != null && typeof existing === "object") return false;
  const idx = Number(last);
  if (Number.isInteger(idx) && String(idx) === last) cur[idx] = value;
  else cur[last] = value;
  return true;
}

/** Map code key → existing locale path */
const ALIAS_FROM = {
  "auth.firstName": "auth.signUp.firstName",
  "auth.firstNamePlaceholder": "auth.signUp.firstNamePlaceholder",
  "auth.lastName": "auth.signUp.lastName",
  "auth.lastNamePlaceholder": "auth.signUp.lastNamePlaceholder",
  "auth.password": "auth.signUp.password",
  "auth.passwordPlaceholder": "auth.signUp.passwordPlaceholder",
  "auth.preferPhone": "auth.signUp.signUpWithPhone",
  "auth.signInWithEmail": "auth.signIn.signInWithEmail",
  "auth.signUpLabel": "auth.signIn.signUp",
  "auth.signUpWithPhone": "auth.signUp.signUpWithPhone",
  "auth.alreadyHaveAccount": "auth.signUp.alreadyHaveAccount",
  "auth.signUpWithGoogle": "auth.signUp.signUpWithEmail",
  "auth.signUpWithFacebook": "auth.signUp.signUpWithEmail",
  "auth.validation.emailRequired": "auth.signUp.validation.emailRequired",
  "auth.validation.firstNameRequired": "auth.signUp.validation.firstNameRequired",
  "auth.validation.lastNameRequired": "auth.signUp.validation.lastNameRequired",
  "auth.validation.passwordRequired": "auth.signUp.validation.passwordRequired",
  "auth.validation.passwordComplexity": "auth.signUp.validation.passwordMinLength",
  "filters.selectCityFirst": "search.filterModal.selectCityFirst",
  "filters.selectZoneFirst": "listing.landmark.steps.quartier.selectZoneFirst",
  "filters.zones": "filters.zone",
  "listingAi.basicsSub": "listingAi.headline.basicsSub",
  "notifications.accept": "notifications.permission.accept",
  "notifications.decline": "notifications.permission.decline",
  "notifications.wantsToJoin": "notifications.permission.wantsToJoin",
  "groups.blockedUsers.title": "groups.messages.blockedUsers.title",
  "groups.blockedUsers.emptyTitle": "groups.messages.blockedUsers.emptyTitle",
  "groups.onboarding.slides.0.title": "groups.onboarding.slides.0.title",
  "groups.onboarding.slides.1.title": "groups.onboarding.slides.1.title",
  "groups.onboarding.slides.2.title": "groups.onboarding.slides.2.title",
  "groups.onboarding.slides.3.title": "groups.onboarding.slides.3.title",
  "landmarkDetails.priceOnRequest": "common.priceOnRequest",
  "reservation.verifyNow": "common.verifyNow",
};

/** Keys that need explicit trilingual strings (not in tree at alias path) */
const MANUAL = {
  "account.welcome": {
    en: "Welcome",
    fr: "Bienvenue",
    ar: "مرحباً",
  },
  "common.required": {
    en: "Required",
    fr: "Obligatoire",
    ar: "مطلوب",
  },
  "groups.management.title": {
    en: "Group management",
    fr: "Gestion du groupe",
    ar: "إدارة المجموعة",
  },
  "landmarkDetails.hostConfirmed": {
    en: "Host confirmed",
    fr: "Confirmé par l'hôte",
    ar: "موثّق من المضيف",
  },
  "notifications.enabledSuccess": {
    en: "Notifications enabled",
    fr: "Notifications activées",
    ar: "تم تفعيل الإشعارات",
  },
  "notifications.enabledError": {
    en: "Could not enable notifications",
    fr: "Impossible d'activer les notifications",
    ar: "تعذّر تفعيل الإشعارات",
  },
  "notifications.permission.denied.openSettings": {
    en: "Open Settings",
    fr: "Ouvrir les réglages",
    ar: "فتح الإعدادات",
  },
  "notifications.permission.error.title": {
    en: "Notification error",
    fr: "Erreur de notification",
    ar: "خطأ في الإشعارات",
  },
  "notifications.permission.error.message": {
    en: "Something went wrong with notifications. Try again.",
    fr: "Un problème est survenu avec les notifications. Réessayez.",
    ar: "حدث خطأ في الإشعارات. حاول مرة أخرى.",
  },
  "reservation.propertyFallback": {
    en: "Property",
    fr: "Bien",
    ar: "عقار",
  },
  "property.details.cancel": {
    en: "Cancel",
    fr: "Annuler",
    ar: "إلغاء",
  },
  "property.details.group": {
    en: "Group",
    fr: "Groupe",
    ar: "مجموعة",
  },
  "property.details.locationPlaceholder": {
    en: "Location",
    fr: "Emplacement",
    ar: "الموقع",
  },
  "property.details.shareToGroup": {
    en: "Share to group",
    fr: "Partager au groupe",
    ar: "مشاركة مع المجموعة",
  },
  "propertySaleFilters.features": {
    en: "Features",
    fr: "Caractéristiques",
    ar: "الميزات",
  },
  "propertySaleFilters.amenities": {
    en: "Amenities",
    fr: "Équipements",
    ar: "المرافق",
  },
  "videos.discover": {
    en: "Discover",
    fr: "Découvrir",
    ar: "اكتشف",
  },
};

function applyAliases(targetEn, targetFr, targetAr, key, sourcePath) {
  const enVal = getAt(targetEn, sourcePath);
  const frVal = getAt(targetFr, sourcePath);
  const arVal = getAt(targetAr, sourcePath);
  if (typeof enVal !== "string") return false;
  if (!setPath(targetEn, key, enVal)) return false;
  setPath(targetFr, key, typeof frVal === "string" ? frVal : enVal);
  setPath(targetAr, key, typeof arVal === "string" ? arVal : enVal);
  return true;
}

let applied = 0;
let failed = [];

for (const [key, sourcePath] of Object.entries(ALIAS_FROM)) {
  if (applyAliases(en, fr, ar, key, sourcePath)) applied++;
  else failed.push(key);
}

for (const [key, vals] of Object.entries(MANUAL)) {
  if (setPath(en, key, vals.en)) applied++;
  setPath(fr, key, vals.fr);
  setPath(ar, key, vals.ar);
}

fs.writeFileSync(path.join(dir, "en.json"), JSON.stringify(en, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "fr.json"), JSON.stringify(fr, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "ar.json"), JSON.stringify(ar, null, 2) + "\n");

console.log("Applied alias/manual keys:", applied);
if (failed.length) console.log("Failed aliases:", failed.join(", "));

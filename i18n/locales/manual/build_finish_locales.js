/**
 * One-shot builder: writes complete organization + listingAi FR/AR from English source.
 * Run once: node manual/build_finish_locales.js
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..");
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));

function walkTranslate(obj, table) {
  if (typeof obj === "string") return table[obj] ?? obj;
  if (Array.isArray(obj)) return obj.map((v) => walkTranslate(v, table));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = walkTranslate(v, table);
  }
  return out;
}

// ─── Organization FR ───────────────────────────────────────────────────────
const ORG_FR = {
  "Create land using the map": "Créer un terrain avec la carte",
  "No land yet": "Aucun terrain pour le moment",
  "No offers yet": "Aucune offre pour le moment",
  'Tap "Add Land" to create your first land':
    'Appuyez sur « Ajouter un terrain » pour créer votre premier terrain',
  "No lands": "Aucun terrain",
  'Tap "Add Tour" to create your first tour':
    'Appuyez sur « Ajouter une visite » pour créer votre première visite',
  "No tours yet": "Aucune visite pour le moment",
  'Tap "Add Organization" to create your first organization':
    'Appuyez sur « Ajouter une organisation » pour créer votre première organisation',
  "Create Organization": "Créer une organisation",
  "Create": "Créer",
  "Join Agency": "Rejoindre une agence",
  "Organizations": "Organisations",
  "Properties": "Biens",
  "No properties yet": "Aucun bien pour le moment",
  "Loading Error": "Erreur de chargement",
  "Invite Member": "Inviter un membre",
  "Generate a secure invite code to share with members. The code will expire in 5 minutes.":
    "Générez un code d'invitation sécurisé à partager avec les membres. Le code expire dans 5 minutes.",
  "Share this code with the person you want to invite. They can use it to join your organization.":
    "Partagez ce code avec la personne à inviter. Elle pourra l'utiliser pour rejoindre votre organisation.",
  "Generate Code": "Générer le code",
  Invite: "Inviter",
  "Code copied to clipboard!": "Code copié dans le presse-papiers !",
  "Expires in 5 minutes": "Expire dans 5 minutes",
  "Generate New Code": "Générer un nouveau code",
  "Invite Code Generated!": "Code d'invitation généré !",
  "Share this code with the person you want to invite. It expires in 5 minutes.":
    "Partagez ce code avec la personne à inviter. Il expire dans 5 minutes.",
  "Failed to generate invite code. Please try again.":
    "Impossible de générer le code. Veuillez réessayer.",
  "Current uses": "Utilisations actuelles",
  Expires: "Expiration",
  "30 days": "30 jours",
  "7 days": "7 jours",
  "Code Expiry": "Expiration du code",
  "Never expires": "N'expire jamais",
  "Generate Invitation Code": "Générer un code d'invitation",
  "10 uses": "10 utilisations",
  "Usage Limit": "Limite d'utilisation",
  "Usage limit": "Limite d'utilisation",
  "Single use": "Usage unique",
  "Unlimited uses": "Utilisations illimitées",
  Error: "Erreur",
  "Join Organization": "Rejoindre l'organisation",
  "Enter the invite code provided by the organization owner to join their agency.":
    "Saisissez le code d'invitation fourni par le responsable de l'organisation pour rejoindre l'agence.",
  "Invite Code": "Code d'invitation",
  "Enter invitation code (e.g., AG-X7K2M9)":
    "Saisissez le code d'invitation (ex. AG-X7K2M9)",
  "Invite codes expire after 5 minutes. If the code has expired, ask the organization owner for a new one.":
    "Les codes expirent après 5 minutes. Si le code a expiré, demandez-en un nouveau au responsable.",
  "Once you join an organization, any properties or lands you create will belong to the organization, not to you personally.":
    "Une fois membre, les biens et terrains que vous créez appartiendront à l'organisation, pas à vous personnellement.",
  Join: "Rejoindre",
  "You have successfully joined the organization.":
    "Vous avez rejoint l'organisation avec succès.",
  "Failed to join organization. Please try again.":
    "Impossible de rejoindre l'organisation. Veuillez réessayer.",
  "Confirm & Join": "Confirmer et rejoindre",
  "I understand my future properties will belong to this agency":
    "Je comprends que mes futurs biens appartiendront à cette agence",
  "Properties you add after joining will belong to this agency":
    "Les biens ajoutés après votre adhésion appartiendront à cette agence",
  "Please enter a valid invite code format (e.g., AG-X7K2M9)":
    "Veuillez saisir un code valide (ex. AG-X7K2M9)",
  Owner: "Propriétaire",
  properties: "biens",
  "Invalid or expired invite code": "Code d'invitation invalide ou expiré",
  "Verify Code": "Vérifier le code",
  "Join {{name}}?": "Rejoindre {{name}} ?",
  "Please enter an invite code.": "Veuillez saisir un code d'invitation.",
  "Recommended: 1200x675px": "Recommandé : 1200×675 px",
  "Optional - Tell clients about your organization":
    "Facultatif — présentez votre organisation aux clients",
  "Optional — skip if you prefer not to share":
    "Facultatif — ignorez si vous préférez ne pas partager",
  "Organization Name": "Nom de l'organisation",
  "Select Type": "Choisir le type",
  "What's your organization called?": "Comment s'appelle votre organisation ?",
  "This helps clients find and recognize your business":
    "Aide les clients à trouver et reconnaître votre activité",
  "What type of business?": "Quel type d'activité ?",
  "Select the category that best describes you":
    "Choisissez la catégorie qui vous correspond le mieux",
  "Where are you located?": "Où êtes-vous situé ?",
  "Help clients find you easily": "Aidez les clients à vous trouver facilement",
  "How can clients reach you?": "Comment les clients peuvent-ils vous joindre ?",
  "Add your contact information": "Ajoutez vos coordonnées",
  "Review & Create": "Vérifier et créer",
  "Make sure everything looks good": "Vérifiez que tout est correct",
  "So clients can visit you in person": "Pour que les clients puissent vous rendre visite",
  "What makes your business special?": "Qu'est-ce qui distingue votre activité ?",
  "Tell clients about your organization": "Présentez votre organisation aux clients",
  "For inquiries and communication": "Pour les demandes et la communication",
  "Clients will use this to reach you": "Les clients utiliseront ce numéro pour vous joindre",
  "Real Estate Brokerage": "Courtage immobilier",
  "Real Estate Agency": "Agence immobilière",
  "Individual Agent": "Agent indépendant",
  "Property Developer": "Promoteur immobilier",
  "Property Management": "Gestion immobilière",
  "Organization Info": "Informations organisation",
  "Business Info": "Informations activité",
  "Basic Info": "Informations de base",
  "Add Land": "Ajouter un terrain",
  "Tell us about your organization": "Parlez-nous de votre organisation",
  Location: "Localisation",
  "Where is your organization located?": "Où se situe votre organisation ?",
  "Business Details": "Détails de l'activité",
  "Add your business information": "Ajoutez les informations de votre activité",
  "Review & Submit": "Vérifier et envoyer",
  "Review your info before submitting": "Vérifiez vos informations avant envoi",
  "Add a banner photo": "Ajouter une photo de couverture",
  "Select Business Type": "Choisir le type d'activité",
  "e.g., Al-Nour Real Estate": "ex. Al-Nour Immobilier",
  Description: "Présentation",
  "Describe your organization": "Décrivez votre organisation",
  Website: "Site web",
  "https://yourwebsite.com": "https://votresite.com",
  Phone: "Téléphone",
  "e.g., +222 1234 5678": "ex. +222 1234 5678",
  Email: "E-mail",
  "e.g., contact@yourorg.com": "ex. contact@votreorg.com",
  Address: "Adresse",
  "Street Address": "Adresse postale",
  "Enter street address": "Saisissez l'adresse",
  City: "Ville",
  "e.g., Nouakchott": "ex. Nouakchott",
  "State/Region": "Région",
  "Enter state or region": "Saisissez la région",
  Country: "Pays",
  "Enter country": "Saisissez le pays",
  "Postal Code": "Code postal",
  "Enter postal code": "Saisissez le code postal",
  "License Number": "Numéro de licence",
  "Enter business license number": "Saisissez le numéro de licence",
  "Tax ID": "Identifiant fiscal",
  "Enter tax identification number": "Saisissez l'identifiant fiscal",
  "Business Type": "Type d'activité",
  "Agency, Brokerage, Individual": "Agence, courtage, indépendant",
  "Your organization will be reviewed by our team before approval. You will be notified once approved.":
    "Votre organisation sera examinée par notre équipe avant approbation. Vous serez notifié une fois approuvée.",
  "Success!": "Succès !",
  "Your organization created successfully and is pending approval.":
    "Organisation créée avec succès — en attente d'approbation.",
  "Failed to create organization. Please try again.":
    "Impossible de créer l'organisation. Veuillez réessayer.",
  "Organization name required": "Nom de l'organisation requis",
  "City required": "Ville requise",
  "State/Region required": "Région requise",
  "Country required": "Pays requis",
  "License number required": "Numéro de licence requis",
  "Please select business type": "Veuillez sélectionner un type d'activité",
  "Agency dashboard": "Tableau de bord agence",
  "No Organization": "Aucune organisation",
  "You need to create an organization first":
    "Vous devez d'abord créer une organisation",
  "Create an organization to start managing properties and agents":
    "Créez une organisation pour gérer biens et agents",
  "Failed to load organization data. Please try again.":
    "Impossible de charger les données. Veuillez réessayer.",
  Agents: "Agents",
  "Create Property": "Créer un bien",
  "Manage Agents": "Gérer les agents",
  "View All Agents": "Voir tous les agents",
  "View All Properties": "Voir tous les biens",
  "No agents yet": "Aucun agent pour le moment",
  "Create First Property": "Créer le premier bien",
  "My Properties": "Mes biens",
  "Optional: Create organization to manage multiple properties and agents":
    "Facultatif : créez une organisation pour gérer plusieurs biens et agents",
  Pending: "En attente",
  Approved: "Approuvé",
  Rejected: "Refusé",
  Suspended: "Suspendu",
  Admin: "Administrateur",
  Manager: "Gestionnaire",
  Editor: "Éditeur",
  Viewer: "Lecteur",
  "Update Member Role": "Modifier le rôle du membre",
  "Select Role": "Choisir le rôle",
  "Update Role": "Mettre à jour le rôle",
  "Updating...": "Mise à jour…",
  "Role Updated": "Rôle mis à jour",
  "Member role has been updated successfully.":
    "Le rôle du membre a été mis à jour avec succès.",
  "Failed to update member role. Please try again.":
    "Impossible de mettre à jour le rôle. Veuillez réessayer.",
  Draft: "Brouillon",
  Published: "Publié",
  Verified: "Vérifié",
  Tours: "Visites",
  Offers: "Offres",
  "Add Land Plot": "Ajouter un terrain",
  "Land Plots": "Terrains",
  "Manage your business & properties": "Gérez votre activité et vos biens",
  "Your Agency": "Votre agence",
  "No Agency Connected": "Aucune agence connectée",
  "You can create your agency to start managing listings, or join an existing one with an invite code. This helps you and others find your properties easier!":
    "Créez votre agence ou rejoignez-en une avec un code d'invitation pour gérer vos annonces plus facilement.",
  "Create Agency": "Créer une agence",
  "Your Listed Properties": "Vos biens publiés",
  "Agency Properties": "Biens de l'agence",
  "Your Lands": "Vos terrains",
  "Loading your properties...": "Chargement de vos biens…",
  "No Properties Yet": "Aucun bien pour le moment",
  Modify: "Modifier",
  "Property Actions": "Actions sur le bien",
  "Deactivate Property": "Désactiver le bien",
  "Reactivate Property": "Réactiver le bien",
  "Delete Property": "Supprimer le bien",
  "Mark as Sold": "Marquer comme vendu",
  Deactivate: "Désactiver",
  Reactivate: "Réactiver",
  Delete: "Supprimer",
  "This property will be hidden from search results. You can reactivate it later.":
    "Ce bien sera masqué des résultats de recherche. Vous pourrez le réactiver plus tard.",
  "This property will be permanently deleted in 15 days. This action cannot be undone.":
    "Ce bien sera définitivement supprimé dans 15 jours. Cette action est irréversible.",
  "This property will be marked as sold and hidden from search results.":
    "Ce bien sera marqué vendu et masqué des résultats de recherche.",
  "Property deactivated": "Bien désactivé",
  "Property reactivated": "Bien réactivé",
  "Property marked for deletion": "Bien marqué pour suppression",
  "Property marked as sold": "Bien marqué comme vendu",
  "Property unmarked as sold": "Bien démarqué comme vendu",
  "Generate Invite Code": "Générer un code d'invitation",
  "Video Performance": "Performance vidéo",
  "Mark as Unsold": "Marquer comme non vendu",
  "This property will be unmarked as sold and reactivated in search results.":
    "Ce bien ne sera plus marqué vendu et réapparaîtra dans les résultats.",
  Sold: "Vendu",
  Deactivated: "Désactivé",
  "List properties in your agency—they'll be seen by more users and you can manage them easily.":
    "Publiez des biens dans votre agence — plus de visibilité et une gestion simplifiée.",
  "No Agency Properties Yet": "Aucun bien d'agence pour le moment",
  "Properties you add while part of this agency will appear here":
    "Les biens ajoutés au sein de cette agence apparaîtront ici",
  "+ Add Property": "+ Ajouter un bien",
  "No Lands Yet": "Aucun terrain pour le moment",
  "Add lands to your agency profile to start selling or managing deals.":
    "Ajoutez des terrains au profil de votre agence pour vendre ou gérer des transactions.",
  "+ Add Land": "+ Ajouter un terrain",
  Lands: "Terrains",
  "Unknown location": "Emplacement inconnu",
  "Leave Organization": "Quitter l'organisation",
  "Leave Agency": "Quitter l'agence",
  "Important Notice": "Avis important",
  "Leaving {{agencyName}} will:": "Quitter {{agencyName}} va :",
  "Remove your access to all agency properties and data":
    "Retirer votre accès à tous les biens et données de l'agence",
  "Prevent you from creating new properties under this agency":
    "Vous empêcher de créer de nouveaux biens sous cette agence",
  "Allow you to create personal properties again":
    "Vous permettre de créer à nouveau des biens personnels",
  "Leave Organization?": "Quitter l'organisation ?",
  "Are you sure you want to leave {{agencyName}}? You will lose access to all agency properties and data.":
    "Voulez-vous vraiment quitter {{agencyName}} ? Vous perdrez l'accès à tous les biens et données de l'agence.",
  'Type "{{confirmText}}" to confirm:': 'Tapez « {{confirmText}} » pour confirmer :',
  Type: "Type",
  "to confirm...": "pour confirmer…",
  Leave: "Quitter",
  "Left Successfully": "Départ confirmé",
  "You have successfully left the organization.":
    "Vous avez quitté l'organisation avec succès.",
  "Failed to leave organization. Please try again.":
    "Impossible de quitter l'organisation. Veuillez réessayer.",
  'Please type "LEAVE" to confirm.': 'Veuillez taper « QUITTER » pour confirmer.',
  "Add Property or Land for Sale": "Ajouter un bien ou un terrain à vendre",
  "How do you want to add this listing?":
    "Comment souhaitez-vous ajouter cette annonce ?",
  "List your property or land as an agency or individual owner":
    "Publiez votre bien ou terrain en tant qu'agence ou propriétaire",
  Agency: "Agence",
  "Create an agency to manage multiple properties and agents":
    "Créez une agence pour gérer plusieurs biens et agents",
  "Manage multiple properties": "Gérer plusieurs biens",
  "Add agents to your team": "Ajouter des agents à votre équipe",
  "Professional verification": "Vérification professionnelle",
  "Owner / Individual": "Propriétaire / particulier",
  "List your property or land directly without creating an agency":
    "Publiez directement sans créer d'agence",
  "Quick and simple": "Rapide et simple",
  "No agency required": "Sans agence",
  "Start listing immediately": "Publier immédiatement",
  "What would you like to add?": "Que souhaitez-vous ajouter ?",
  "Choose the type of listing you want to create":
    "Choisissez le type d'annonce à créer",
  "Property for Sale": "Bien à vendre",
  "Land for Sale": "Terrain à vendre",
  "List houses, apartments, commercial buildings, and other properties":
    "Maisons, appartements, locaux commerciaux et autres biens",
  "List land plots, vacant lots, and development sites":
    "Parcelles, terrains vides et sites aménageables",
  "Houses & Apartments": "Maisons et appartements",
  "Commercial Buildings": "Locaux commerciaux",
  "Detailed listings with photos": "Annonces détaillées avec photos",
  "Land Plots & Vacant Lots": "Parcelles et terrains vides",
  "Development Sites": "Sites aménageables",
  "Map-based boundaries": "Limites sur carte",
  Continue: "Continuer",
  "Confirm ownership": "Confirmer la publication",
  "Agency listing": "Annonce agence",
  "This {{type}} will be registered under {{agencyName}}, not your personal account.":
    "Ce {{type}} sera enregistré sous {{agencyName}}, pas sous votre compte personnel.",
  "Join an agency": "Rejoindre une agence",
  "Publish under an agency profile": "Publier sous le profil d'une agence",
  "Personal account": "Compte personnel",
  "List under your own name": "Publier sous votre propre nom",
  "How would you like to publish this listing?":
    "Comment souhaitez-vous publier cette annonce ?",
  "Add listing": "Ajouter une annonce",
  "Create & manage your organization": "Créer et gérer votre organisation",
  "Add agents to help with property sales":
    "Ajouter des agents pour les ventes immobilières",
  "List properties for sale with verification":
    "Publier des biens à vendre avec vérification",
  "View Dashboard": "Voir le tableau de bord",
  About: "À propos",
  "Contact support to edit": "Contactez le support pour modifier",
  Add: "Ajouter",
  "Add cover photo": "Ajouter une photo de couverture",
  "Add logo": "Ajouter un logo",
  "e.g., Rue des Fleurs, Bloc A": "ex. Rue des Fleurs, Bloc A",
  Banner: "Bannière",
  "Change cover photo": "Changer la photo de couverture",
  "Change logo": "Changer le logo",
  "Enter the city where your office is located":
    "Saisissez la ville où se trouve votre bureau",
  "Optional — but helps attract more clients":
    "Facultatif — mais utile pour attirer plus de clients",
  "Describe your services, experience, and what sets you apart...":
    "Décrivez vos services, votre expérience et ce qui vous distingue…",
  "About": "À propos",
  Optional: "Facultatif",
  Details: "Détails",
  "Edit agency": "Modifier l'agence",
  "Editing restricted": "Modification restreinte",
  "Optional — clients can use this to email you":
    "Facultatif — les clients peuvent vous écrire par e-mail",
  "Listing insights": "Statistiques de l'annonce",
  "Gold listing": "Annonce Gold",
  "Higher priority in feeds and discovery.":
    "Priorité accrue dans les fils et la découverte.",
  "Gold distribution is off. Turn on Gold from your agency listing to boost reach.":
    "La diffusion Gold est désactivée. Activez Gold depuis votre annonce agence pour plus de portée.",
  "Gold distribution is on for this listing.":
    "La diffusion Gold est activée pour cette annonce.",
  "Unable to read the selected image.":
    "Impossible de lire l'image sélectionnée.",
  "Could not load insights": "Impossible de charger les statistiques",
  "Set up your professional profile so clients can find and trust your business.":
    "Configurez votre profil professionnel pour que les clients vous trouvent et vous fassent confiance.",
  "Tell us about your organization": "Parlez-nous de votre organisation",
  "Choose your business type": "Choisissez votre type d'activité",
  "Add location & contact info": "Ajoutez l'emplacement et les coordonnées",
  "Create your organization": "Créez votre organisation",
  "Invite code generated": "Code d'invitation généré",
  "Joined agency": "Agence rejointe",
  Logo: "Logo",
  "Manage agency": "Gérer l'agence",
  Members: "Membres",
  "Detail opens": "Ouvertures fiche",
  "Feed impressions": "Impressions fil",
  "Feed → detail rate": "Taux fil → fiche",
  "Push notifications sent": "Notifications push envoyées",
  "Total profile views": "Vues totales du profil",
  "My lands": "Mes terrains",
  "Choose a clear, memorable name": "Choisissez un nom clair et mémorable",
  "Agency name": "Nom de l'agence",
  "No changes": "Aucune modification",
  "Agency not found": "Agence introuvable",
  "Optional — add your best contact number":
    "Facultatif — ajoutez votre meilleur numéro de contact",
  Photos: "Photographies",
  "You can edit your organization details anytime after creation":
    "Vous pouvez modifier les détails de votre organisation à tout moment après création",
  Insights: "Statistiques",
  "Metrics updated": "Indicateurs mis à jour",
  "No team members yet": "Aucun membre d'équipe pour le moment",
  "Invite team members to collaborate":
    "Invitez des membres pour collaborer",
  "Could not save. Please try again.":
    "Impossible d'enregistrer. Veuillez réessayer.",
  "Agency profile updated.": "Profil agence mis à jour.",
  "Upload failed": "Échec du téléversement",
  "Editable in {{count}} days": "Modifiable dans {{count}} jours",
  "{{count}} members": "{{count}} membres",
  "View all {{count}}": "Voir les {{count}}",
  Property: "Bien",
  "Untitled listing": "Annonce sans titre",
  Unknown: "Inconnu",
  "Unnamed agency": "Agence sans nom",
  "Video listing": "Annonce vidéo",
};

// ─── Organization AR (abbreviated table — full walk from EN) ─────────────────
const ORG_AR = {
  "Create land using the map": "إنشاء أرض باستخدام الخريطة",
  "No land yet": "لا توجد أراضٍ بعد",
  "No offers yet": "لا توجد عروض بعد",
  'Tap "Add Land" to create your first land':
    'اضغط «إضافة أرض» لإنشاء أول أرض',
  "No lands": "لا توجد أراضٍ",
  'Tap "Add Tour" to create your first tour':
    'اضغط «إضافة جولة» لإنشاء أول جولة',
  "No tours yet": "لا توجد جولات بعد",
  'Tap "Add Organization" to create your first organization':
    'اضغط «إضافة مؤسسة» لإنشاء أول مؤسسة',
  "Create Organization": "إنشاء مؤسسة",
  "Create": "إنشاء",
  "Join Agency": "انضمام للوكالة",
  "Organizations": "المؤسسات",
  "Properties": "العقارات",
  "No properties yet": "لا توجد عقارات بعد",
  "Loading Error": "خطأ في التحميل",
  "Invite Member": "دعوة عضو",
  "Generate a secure invite code to share with members. The code will expire in 5 minutes.":
    "أنشئ رمز دعوة آمن لمشاركته مع الأعضاء. ينتهي الرمز خلال 5 دقائق.",
  "Share this code with the person you want to invite. They can use it to join your organization.":
    "شارك هذا الرمز مع الشخص المراد دعوته. يمكنه استخدامه للانضمام إلى مؤسستك.",
  "Generate Code": "إنشاء الرمز",
  "Invite": "دعوة",
  "Code copied to clipboard!": "تم نسخ الرمز!",
  "Expires in 5 minutes": "ينتهي خلال 5 دقائق",
  "Generate New Code": "إنشاء رمز جديد",
  "Invite Code Generated!": "تم إنشاء رمز الدعوة!",
  "Share this code with the person you want to invite. It expires in 5 minutes.":
    "شارك هذا الرمز مع الشخص المراد دعوته. ينتهي خلال 5 دقائق.",
  "Failed to generate invite code. Please try again.":
    "تعذّر إنشاء الرمز. حاول مرة أخرى.",
  "Current uses": "الاستخدامات الحالية",
  "Expires": "الانتهاء",
  "30 days": "30 يوماً",
  "7 days": "7 أيام",
  "Code Expiry": "انتهاء الرمز",
  "Never expires": "لا ينتهي",
  "Generate Invitation Code": "إنشاء رمز دعوة",
  "10 uses": "10 استخدامات",
  "Usage Limit": "حد الاستخدام",
  "Usage limit": "حد الاستخدام",
  "Single use": "استخدام واحد",
  "Unlimited uses": "استخدامات غير محدودة",
  "Error": "خطأ",
  "Join Organization": "انضمام للمؤسسة",
  "Enter the invite code provided by the organization owner to join their agency.":
    "أدخل رمز الدعوة من مالك المؤسسة للانضمام إلى الوكالة.",
  "Invite Code": "رمز الدعوة",
  "Enter invitation code (e.g., AG-X7K2M9)": "أدخل رمز الدعوة (مثال: AG-X7K2M9)",
  "Invite codes expire after 5 minutes. If the code has expired, ask the organization owner for a new one.":
    "تنتهي رموز الدعوة بعد 5 دقائق. إذا انتهى الرمز، اطلب رمزاً جديداً من المسؤول.",
  "Once you join an organization, any properties or lands you create will belong to the organization, not to you personally.":
    "بعد الانضمام، العقارات والأراضي التي تنشئها ستعود للمؤسسة وليس لحسابك الشخصي.",
  "Join": "انضمام",
  "You have successfully joined the organization.": "انضممت إلى المؤسسة بنجاح.",
  "Failed to join organization. Please try again.":
    "تعذّر الانضمام. حاول مرة أخرى.",
  "Confirm & Join": "تأكيد والانضمام",
  "I understand my future properties will belong to this agency":
    "أفهم أن عقاراتي المستقبلية ستعود لهذه الوكالة",
  "Properties you add after joining will belong to this agency":
    "العقارات التي تضيفها بعد الانضمام ستعود لهذه الوكالة",
  "Please enter a valid invite code format (e.g., AG-X7K2M9)":
    "يرجى إدخال رمز صالح (مثال: AG-X7K2M9)",
  "Owner": "المالك",
  "properties": "عقارات",
  "Invalid or expired invite code": "رمز دعوة غير صالح أو منتهٍ",
  "Verify Code": "تحقق من الرمز",
  "Join {{name}}?": "الانضمام إلى {{name}}؟",
  "Please enter an invite code.": "يرجى إدخال رمز دعوة.",
  "Agency dashboard": "لوحة تحكم الوكالة",
  "My lands": "أراضيي",
  "You can edit your organization details anytime after creation":
    "يمكنك تعديل تفاصيل مؤسستك في أي وقت بعد الإنشاء",
  "Metrics updated": "تم تحديث المؤشرات",
  "{{count}} members": "{{count}} أعضاء",
  "View all {{count}}": "عرض الكل ({{count}})",
  "Enter the city where your office is located":
    "أدخل المدينة التي يقع فيها مكتبك",
  "Optional — but helps attract more clients":
    "اختياري — يساعد في جذب المزيد من العملاء",
  "Optional — clients can use this to email you":
    "اختياري — يمكن للعملاء مراسلتك عبر البريد",
  "Choose your business type": "اختر نوع نشاطك",
  "Add location & contact info": "أضف الموقع ومعلومات الاتصال",
  "Optional — add your best contact number":
    "اختياري — أضف أفضل رقم للتواصل",
  "Listing insights": "إحصائيات الإعلان",
  "Gold listing": "إعلان Gold",
  "Gold distribution is off. Turn on Gold from your agency listing to boost reach.":
    "توزيع Gold متوقف. فعّله من إعلان الوكالة لزيادة الظهور.",
  "Gold distribution is on for this listing.":
    "توزيع Gold مفعّل لهذا الإعلان.",
  "Choose a clear, memorable name": "اختر اسماً واضحاً وسهل التذكر",
  "Agency listing": "إعلان الوكالة",
  "Publish under an agency profile": "النشر تحت ملف الوكالة",
  "How would you like to publish this listing?":
    "كيف تريد نشر هذا الإعلان؟",
  "Add listing": "إضافة إعلان",
  Description: "الوصف",
  Agents: "الوكلاء",
  Type: "النوع",
  Logo: "الشعار",
  Photos: "الصور",
  "Agency name": "اسم الوكالة",
  "No changes": "لا توجد تغييرات",
  "Agency not found": "الوكالة غير موجودة",
  "Could not save. Please try again.": "تعذّر الحفظ. حاول مرة أخرى.",
  "Agency profile updated.": "تم تحديث ملف الوكالة.",
  "Editable in {{count}} days": "قابل للتعديل خلال {{count}} يوماً",
};

// Merge ORG_AR with ORG_FR for keys not in AR (fallback to FR is wrong - use EN walk with both)
function buildOrg(table) {
  return walkTranslate(en.organization, table);
}

fs.writeFileSync(
  path.join(__dirname, "organization_fr.json"),
  JSON.stringify({ organization: buildOrg(ORG_FR) }, null, 2) + "\n",
);
const ORG_AR_SUPPLEMENT = JSON.parse(
  fs.readFileSync(path.join(__dirname, "org_ar_supplement.json"), "utf8"),
);
fs.writeFileSync(
  path.join(__dirname, "organization_ar.json"),
  JSON.stringify(
    {
      organization: walkTranslate(en.organization, {
        ...ORG_AR,
        ...ORG_AR_SUPPLEMENT,
      }),
    },
    null,
    2,
  ) + "\n",
);

// ─── ListingAi FR / AR ───────────────────────────────────────────────────────
const AI_FR = {
  "Add more photos": "Ajouter d'autres photos",
  Added: "Ajouté",
  "Meskeny Listing Agent": "Agent d'annonce Meskeny",
  "Private to you · Matches Mauritania catalog · Never invents quartiers":
    "Privé · Catalogue officiel · Quartiers jamais inventés",
  Amenities: "Équipements",
  "Could not load amenities.": "Impossible de charger les équipements.",
  "Apply to listing": "Appliquer à l'annonce",
  "Area (m²)": "Surface (m²)",
  "Price & size": "Prix et surface",
  Bathrooms: "Salles de bain",
  Bedrooms: "Chambres",
  Cancel: "Annuler",
  "Could not load property types.": "Impossible de charger les types de biens.",
  characters: "caractères",
  City: "Ville",
  "Select the city where the property is located.":
    "Sélectionnez la ville du bien.",
  "Which city?": "Quelle ville ?",
  "Official city & quartier catalog": "Catalogue officiel villes et quartiers",
  "Private until you publish": "Privé jusqu'à publication",
  "~70% faster than manual": "~70 % plus rapide qu'en manuel",
  "Something went wrong": "Une erreur s'est produite",
  "Property details": "Détails du bien",
  "Generate listing": "Générer l'annonce",
  "AI uses these to structure your listing.":
    "L'IA s'en sert pour structurer votre annonce.",
  "Set your price & size": "Fixez le prix et la surface",
  "Select the city": "Sélectionnez la ville",
  "Where is it?": "Où se situe-t-il ?",
  "Help AI write an accurate description.":
    "Aidez l'IA à rédiger une description précise.",
  "Type, year, and features help AI write an accurate description.":
    "Le type, l'année et les équipements aident l'IA à rédiger une description précise.",
  "Optional — you can add more later":
    "Facultatif — vous pourrez en ajouter plus tard",
  "Add photos": "Ajouter des photos",
  "Cadastre reference": "Référence cadastrale",
  "Plot number": "Numéro de parcelle",
  "Final location level": "Niveau de localisation final",
  "Pick a sector": "Choisissez un secteur",
  "A few sentences in your own words": "Quelques phrases dans vos propres mots",
  "Tell AI about it": "Parlez-en à l'IA",
  "Narrow down the area": "Affinez la zone",
  "Which zone?": "Quelle zone ?",
  "Enter the asking price and area — AI handles the rest.":
    "Saisissez le prix et la surface — l'IA fait le reste.",
  "AI matches your pick to our location database.":
    "L'IA recoupe votre choix avec notre base de localisation.",
  "Sectors improve search accuracy for your listing.":
    "Les secteurs améliorent la précision de recherche.",
  "Mention parking, utilities, or other details.":
    "Mentionnez parking, équipements ou autres détails.",
  "Add clear photos or a short video tour.":
    "Ajoutez des photos nettes ou une courte visite vidéo.",
  "Enter the cadastre plot number if known.":
    "Saisissez le numéro cadastral si connu.",
  "Describe what makes this listing special.":
    "Décrivez ce qui rend cette annonce unique.",
  "Pick the zone or quartier for better discovery.":
    "Choisissez zone ou quartier pour une meilleure visibilité.",
  "Win ~70% of your time — we write title, description & location":
    "Gagnez ~70 % de temps — nous rédigeons titre, description et localisation",
  "Add with AI": "Ajouter avec l'IA",
  "Your property is now live.": "Votre bien est en ligne.",
  "Listed!": "Annonce publiée !",
  Change: "Modifier",
  "Not selected": "Non sélectionné",
  Optional: "Facultatif",
  Location: "Localisation",
  "Add video": "Ajouter une vidéo",
  "Listings with photos get more views.":
    "Les annonces avec photos obtiennent plus de vues.",
  "Photos help your listing get more views.":
    "Les photos augmentent les vues de votre annonce.",
  "Continue without media": "Continuer sans média",
  "Maybe later": "Plus tard",
  "Optional — listings with photos get far more views. You can also add them after.":
    "Facultatif — les annonces avec photos performent mieux. Vous pourrez en ajouter après.",
  "Select at least one amenity.": "Sélectionnez au moins un équipement.",
  "Select a property type.": "Sélectionnez un type de bien.",
  "Enter the year built.": "Saisissez l'année de construction.",
  "No sectors for this zone": "Aucun secteur pour cette zone",
  "Declaring papers can improve credibility and search ranking.":
    "Déclarer les documents renforce la crédibilité et le référencement.",
  "Property papers": "Documents fonciers",
  Photos: "Photographies",
  "The cadastre reference for this land parcel.":
    "Référence cadastrale de cette parcelle.",
  "Price (MRU)": "Prix (MRU)",
  "Meskeny AI": "Meskeny IA",
  "Building your listing": "Rédaction de votre annonce",
  "Preparing your listing…": "Préparation de votre annonce…",
  "Start a listing": "Créer une annonce",
  "Listing assistant": "Assistant d'annonce",
  "Describe your place — we write the title, description, and match your location.":
    "Décrivez le bien — nous rédigeons titre, description et localisation.",
  "Property type": "Type de bien",
  "Could not publish": "Publication impossible",
  "Publish listing": "Publier l'annonce",
  Sector: "Secteur",
  "Final location detail.": "Détail de localisation final.",
  "Which sector?": "Quel secteur ?",
  "Try again": "Réessayer",
  Description: "Présentation",
  "Check the details before publishing.":
    "Vérifiez les détails avant de publier.",
  "Review listing": "Vérifier l'annonce",
  Title: "Titre",
  "Select a city for this listing.":
    "Sélectionnez une ville pour cette annonce.",
  "Select a zone for this listing.":
    "Sélectionnez une zone pour cette annonce.",
  "Check the details below and edit anything before publishing.":
    "Vérifiez les détails ci-dessous et modifiez avant publication.",
  "Skip for now": "Passer pour l'instant",
  "Describe your place — we draft title, description & location.":
    "Décrivez le bien — nous rédigeons titre, description et localisation.",
  "Step-by-step — you fill in every detail yourself.":
    "Étape par étape — vous remplissez chaque détail vous-même.",
  "Add manually": "Ajouter manuellement",
  "How would you like to create your listing?":
    "Comment souhaitez-vous créer votre annonce ?",
  Basics: "Essentiels",
  Details: "Détails",
  Media: "Médias",
  Plot: "Parcelle",
  Story: "Description",
  Zone: "Zone géographique",
  "Description notes": "Notes descriptives",
  "Location, condition, nearby amenities, what makes it special…":
    "Emplacement, état, commodités, points forts…",
  "A few sentences — AI turns your notes into a polished listing.":
    "Quelques phrases — l'IA transforme vos notes en annonce soignée.",
  "Tell us about it": "Parlez-nous de ce bien",
  Examples: "Exemples",
  "Up to 10": "Jusqu'à 10",
  "Keep the app open": "Gardez l'application ouverte",
  "Uploading media": "Téléversement des médias",
  "Usually under 15 seconds": "En général moins de 15 secondes",
  Video: "Vidéo",
  "Year built": "Année de construction",
  "e.g. 2018": "ex. 2018",
  "Narrow down the area.": "Affinez la zone.",
  "Review the details and publish when you're ready.":
    "Vérifiez les détails et publiez quand vous êtes prêt.",
  "Listing ready": "Annonce prête",
  "Enter a valid asking price.": "Saisissez un prix de vente valide.",
  "Enter the area in m².": "Saisissez la surface en m².",
  "Select a property type.": "Sélectionnez un type de bien.",
  "Enter the year built.": "Saisissez l'année de construction.",
  "Select at least one amenity.": "Sélectionnez au moins un équipement.",
  "Select a city.": "Sélectionnez une ville.",
  "Select a zone.": "Sélectionnez une zone.",
  "Select a sector.": "Sélectionnez un secteur.",
  "Enter the cadastre plot number.": "Saisissez le numéro de parcelle cadastrale.",
  "Add a few more details (at least 10 characters).":
    "Ajoutez plus de détails (10 caractères minimum).",
  "You must be logged in.": "Vous devez être connecté.",
  "Title is required.": "Le titre est obligatoire.",
  "Description is required.": "La description est obligatoire.",
  "Add at least one photo or video.": "Ajoutez au moins une photo ou une vidéo.",
  "Add at least one photo.": "Ajoutez au moins une photo.",
  "Enter a valid price.": "Saisissez un prix valide.",
  "Enter a valid area.": "Saisissez une surface valide.",
  "Enter a valid nightly price.": "Saisissez un prix par nuit valide.",
  "Missing location": "Emplacement manquant",
  "Upload failed": "Échec du téléversement",
  "Publishing…": "Publication…",
  "Please wait": "Veuillez patienter",
};

const AI_AR = {
  "Add more photos": "إضافة المزيد من الصور",
  Added: "تمت الإضافة",
  "Meskeny Listing Agent": "وكيل إعلانات مسكني",
  "Private to you · Matches Mauritania catalog · Never invents quartiers":
    "خاص بك · دليل رسمي · لا يختلق أحياء",
  Amenities: "المرافق",
  "Could not load amenities.": "تعذّر تحميل المرافق.",
  "Apply to listing": "تطبيق على الإعلان",
  "Area (m²)": "المساحة (م²)",
  "Price & size": "السعر والمساحة",
  Bathrooms: "الحمامات",
  Bedrooms: "غرف النوم",
  Cancel: "إلغاء",
  "Could not load property types.": "تعذّر تحميل أنواع العقارات.",
  characters: "حرف",
  City: "المدينة",
  "Select the city where the property is located.": "اختر مدينة العقار.",
  "Which city?": "ما المدينة؟",
  "Official city & quartier catalog": "دليل المدن والأحياء الرسمي",
  "Private until you publish": "خاص حتى النشر",
  "~70% faster than manual": "أسرع ~70% من الإدخال اليدوي",
  "Something went wrong": "حدث خطأ",
  "Property details": "تفاصيل العقار",
  "Generate listing": "إنشاء الإعلان",
  "AI uses these to structure your listing.": "يستخدمها الذكاء الاصطناعي لبناء الإعلان.",
  "Set your price & size": "حدّد السعر والمساحة",
  "Select the city": "اختر المدينة",
  "Where is it?": "أين يقع؟",
  "Help AI write an accurate description.": "ساعد الذكاء الاصطناعي على كتابة وصف دقيق.",
  "Type, year, and features help AI write an accurate description.":
    "النوع وسنة البناء والمرافق تساعد الذكاء الاصطناعي على كتابة وصف دقيق.",
  "Optional — you can add more later": "اختياري — يمكنك الإضافة لاحقاً",
  "Add photos": "إضافة صور",
  "Cadastre reference": "مرجع السجل العقاري",
  "Plot number": "رقم القطعة",
  "Final location level": "مستوى الموقع النهائي",
  "Pick a sector": "اختر قطاعاً",
  "A few sentences in your own words": "بضع جمل بكلماتك",
  "Tell AI about it": "أخبر الذكاء الاصطناعي عنه",
  "Narrow down the area": "حدّد المنطقة",
  "Which zone?": "ما المنطقة؟",
  "Enter the asking price and area — AI handles the rest.":
    "أدخل السعر والمساحة — الذكاء الاصطناعي يكمل الباقي.",
  "AI matches your pick to our location database.":
    "يطابق اختيارك مع قاعدة المواقع.",
  "Sectors improve search accuracy for your listing.":
    "القطاعات تحسّن دقة البحث.",
  "Mention parking, utilities, or other details.":
    "اذكر المواقف والمرافق وتفاصيل أخرى.",
  "Add clear photos or a short video tour.":
    "أضف صوراً واضحة أو جولة فيديو قصيرة.",
  "Enter the cadastre plot number if known.":
    "أدخل رقم القطعة إن وُجد.",
  "Describe what makes this listing special.":
    "صف ما يميز هذا الإعلان.",
  "Pick the zone or quartier for better discovery.":
    "اختر المنطقة أو الحي لظهور أفضل.",
  "Win ~70% of your time — we write title, description & location":
    "وفّر ~70% من وقتك — نكتب العنوان والوصف والموقع",
  "Add with AI": "إضافة بالذكاء الاصطناعي",
  "Your property is now live.": "عقارك متاح الآن.",
  "Listed!": "تم النشر!",
  Change: "تغيير",
  "Not selected": "غير محدد",
  Optional: "اختياري",
  Location: "الموقع",
  "Add video": "إضافة فيديو",
  "Listings with photos get more views.": "الإعلانات بالصور تحصل على مشاهدات أكثر.",
  "Photos help your listing get more views.":
    "الصور تزيد مشاهدات إعلانك.",
  "Continue without media": "المتابعة بدون وسائط",
  "Maybe later": "لاحقاً",
  "Optional — listings with photos get far more views. You can also add them after.":
    "اختياري — الإعلانات بالصور تؤدي أفضل. يمكنك الإضافة لاحقاً.",
  "Select at least one amenity.": "اختر مرفقاً واحداً على الأقل.",
  "Select a property type.": "اختر نوع العقار.",
  "Enter the year built.": "أدخل سنة البناء.",
  "No sectors for this zone": "لا قطاعات لهذه المنطقة",
  "Declaring papers can improve credibility and search ranking.":
    "إعلان الوثائق يعزز المصداقية والظهور.",
  "Property papers": "الوثائق العقارية",
  Photos: "الصور",
  "The cadastre reference for this land parcel.":
    "مرجع السجل العقاري لهذه القطعة.",
  "Price (MRU)": "السعر (MRU)",
  "Meskeny AI": "مسكني IA",
  "Building your listing": "جاري إعداد إعلانك",
  "Preparing your listing…": "جاري تحضير إعلانك…",
  "Start a listing": "بدء إعلان",
  "Listing assistant": "مساعد الإعلان",
  "Describe your place — we write the title, description, and match your location.":
    "صف العقار — نكتب العنوان والوصف ونطابق الموقع.",
  "Property type": "نوع العقار",
  "Could not publish": "تعذّر النشر",
  "Publish listing": "نشر الإعلان",
  Sector: "القطاع",
  "Final location detail.": "تفصيل الموقع النهائي.",
  "Which sector?": "ما القطاع؟",
  "Try again": "حاول مرة أخرى",
  Description: "الوصف",
  "Check the details before publishing.": "تحقق من التفاصيل قبل النشر.",
  "Review listing": "مراجعة الإعلان",
  Title: "العنوان",
  "Select a city for this listing.": "اختر مدينة لهذا الإعلان.",
  "Select a zone for this listing.": "اختر منطقة لهذا الإعلان.",
  "Check the details below and edit anything before publishing.":
    "راجع التفاصيل أدناه وعدّل قبل النشر.",
  "Skip for now": "تخطّ الآن",
  "Describe your place — we draft title, description & location.":
    "صف العقار — نصوغ العنوان والوصف والموقع.",
  "Step-by-step — you fill in every detail yourself.":
    "خطوة بخطوة — أنت تملأ كل التفاصيل.",
  "Add manually": "إضافة يدوياً",
  "How would you like to create your listing?":
    "كيف تريد إنشاء إعلانك؟",
  Basics: "الأساسيات",
  Details: "التفاصيل",
  Media: "الوسائط",
  Plot: "القطعة",
  Story: "الوصف",
  Zone: "المنطقة",
  "Description notes": "ملاحظات الوصف",
  "Location, condition, nearby amenities, what makes it special…":
    "الموقع، الحالة، المرافق، ما يميزه…",
  "A few sentences — AI turns your notes into a polished listing.":
    "بضع جمل — الذكاء الاصطناعي يحوّلها إلى إعلان متقن.",
  "Tell us about it": "أخبرنا عن العقار",
  Examples: "أمثلة",
  "Up to 10": "حتى 10",
  "Keep the app open": "أبقِ التطبيق مفتوحاً",
  "Uploading media": "جاري رفع الوسائط",
  "Usually under 15 seconds": "عادة أقل من 15 ثانية",
  Video: "فيديو",
  "Year built": "سنة البناء",
  "e.g. 2018": "مثال: 2018",
  "Narrow down the area.": "حدّد المنطقة.",
  "Review the details and publish when you're ready.":
    "راجع التفاصيل وانشر عندما تكون جاهزاً.",
  "Listing ready": "الإعلان جاهز",
  "Enter a valid asking price.": "أدخل سعراً صالحاً.",
  "Enter the area in m².": "أدخل المساحة بالمتر المربع.",
  "Select a property type.": "اختر نوع العقار.",
  "Enter the year built.": "أدخل سنة البناء.",
  "Select at least one amenity.": "اختر مرفقاً واحداً على الأقل.",
  "Select a city.": "اختر المدينة.",
  "Select a zone.": "اختر المنطقة.",
  "Select a sector.": "اختر قطاعاً.",
  "Enter the cadastre plot number.": "أدخل رقم القطعة.",
  "Add a few more details (at least 10 characters).":
    "أضف المزيد من التفاصيل (10 أحرف على الأقل).",
  "You must be logged in.": "يجب تسجيل الدخول.",
  "Title is required.": "العنوان مطلوب.",
  "Description is required.": "الوصف مطلوب.",
  "Add at least one photo or video.": "أضف صورة أو فيديو واحداً على الأقل.",
  "Add at least one photo.": "أضف صورة واحدة على الأقل.",
  "Enter a valid price.": "أدخل سعراً صالحاً.",
  "Enter a valid area.": "أدخل مساحة صالحة.",
  "Enter a valid nightly price.": "أدخل سعراً ليلياً صالحاً.",
  "Missing location": "الموقع غير مكتمل",
  "Upload failed": "فشل الرفع",
  "Publishing…": "جاري النشر…",
  "Please wait": "يرجى الانتظار",
};

// Add AI example strings (keep place names, translate structure)
const AI_EXAMPLES_FR = {
  "500 m² residential plot in Tevragh Zeina, quiet street, title deed available.":
    "Parcelle résidentielle 500 m² à Tevragh Zeina, rue calme, titre foncier disponible.",
  "Corner land near main road in Nouakchott, fenced, ideal for villa.":
    "Terrain d'angle près de l'axe principal à Nouakchott, clôturé, idéal pour villa.",
  "Furnished 2-bedroom near university, Wi‑Fi, monthly rent.":
    "Meublé 2 chambres près de l'université, Wi‑Fi, loyer mensuel.",
  "Studio in city center, AC, ideal for professionals.":
    "Studio centre-ville, climatisation, idéal pour professionnels.",
  "Modern 3-bedroom apartment in Ksar, renovated kitchen, parking.":
    "Appartement moderne 3 chambres à Ksar, cuisine rénovée, parking.",
  "Villa with garden in Tevragh Zeina, 4 beds, quiet family area.":
    "Villa avec jardin à Tevragh Zeina, 4 chambres, quartier familial calme.",
};
const AI_EXAMPLES_AR = {
  "500 m² residential plot in Tevragh Zeina, quiet street, title deed available.":
    "قطعة سكنية 500 م² في تفرغ زينة، شارع هادئ، سند ملكية متاح.",
  "Corner land near main road in Nouakchott, fenced, ideal for villa.":
    "أرض زاوية قرب الطريق الرئيسي في نواكشوط، مسورة، مناسبة لفيلا.",
  "Furnished 2-bedroom near university, Wi‑Fi, monthly rent.":
    "مفروش غرفتين قرب الجامعة، واي‑فاي، إيجار شهري.",
  "Studio in city center, AC, ideal for professionals.":
    "استوديو في وسط المدينة، مكيف، مناسب للمهنيين.",
  "Modern 3-bedroom apartment in Ksar, renovated kitchen, parking.":
    "شقة حديثة 3 غرف في لكصر، مطبخ مجدّد، موقف سيارات.",
  "Villa with garden in Tevragh Zeina, 4 beds, quiet family area.":
    "فيلا بحديقة في تفرغ زينة، 4 غرف، حي عائلي هادئ.",
};

fs.writeFileSync(
  path.join(__dirname, "listingAi_fr.json"),
  JSON.stringify(
    {
      listingAi: walkTranslate(en.listingAi, { ...AI_FR, ...AI_EXAMPLES_FR }),
    },
    null,
    2,
  ) + "\n",
);
fs.writeFileSync(
  path.join(__dirname, "listingAi_ar.json"),
  JSON.stringify(
    {
      listingAi: walkTranslate(en.listingAi, { ...AI_AR, ...AI_EXAMPLES_AR }),
    },
    null,
    2,
  ) + "\n",
);

console.log("Built organization_fr.json, organization_ar.json, listingAi_fr.json, listingAi_ar.json");

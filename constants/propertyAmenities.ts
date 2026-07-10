export interface PropertyAmenity {
  id: string;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
  icon: string; // Phosphor icon name
  category: 'essential' | 'safety' | 'kitchen' | 'bathroom' | 'bedroom' | 'outdoor' | 'entertainment' | 'mauritania_specific';
  description?: {
    en: string;
    fr: string;
    ar: string;
  };
}

export const propertyAmenities: PropertyAmenity[] = [
  // Essential Amenities
  {
    id: 'wifi',
    name: {
      en: 'WiFi',
      fr: 'WiFi',
      ar: 'واي فاي'
    },
    icon: 'WifiHigh',
    category: 'essential',
    description: {
      en: 'High-speed internet connection',
      fr: 'Connexion internet haut débit',
      ar: 'اتصال إنترنت عالي السرعة'
    }
  },
  {
    id: 'air_conditioning',
    name: {
      en: 'Air Conditioning',
      fr: 'Climatisation',
      ar: 'تكييف هواء'
    },
    icon: 'Snowflake',
    category: 'essential',
    description: {
      en: 'Air conditioning for hot weather',
      fr: 'Climatisation pour temps chaud',
      ar: 'تكييف هواء للطقس الحار'
    }
  },
  {
    id: 'heating',
    name: {
      en: 'Heating',
      fr: 'Chauffage',
      ar: 'تدفئة'
    },
    icon: 'Thermometer',
    category: 'essential',
    description: {
      en: 'Heating system for cooler months',
      fr: 'Système de chauffage pour mois plus frais',
      ar: 'نظام تدفئة للأشهر الباردة'
    }
  },
  {
    id: 'parking',
    name: {
      en: 'Free Parking',
      fr: 'Parking gratuit',
      ar: 'موقف سيارات مجاني'
    },
    icon: 'Car',
    category: 'essential',
    description: {
      en: 'Free parking space available',
      fr: 'Place de parking gratuite disponible',
      ar: 'مكان وقوف سيارات مجاني متاح'
    }
  },

  // Safety Amenities
  {
    id: 'smoke_detector',
    name: {
      en: 'Smoke Detector',
      fr: 'Détecteur de fumée',
      ar: 'كاشف الدخان'
    },
    icon: 'Warning',
    category: 'safety',
    description: {
      en: 'Smoke detection system',
      fr: 'Système de détection de fumée',
      ar: 'نظام كشف الدخان'
    }
  },
  {
    id: 'first_aid_kit',
    name: {
      en: 'First Aid Kit',
      fr: 'Trousse de premiers secours',
      ar: 'حقيبة إسعافات أولية'
    },
    icon: 'FirstAid',
    category: 'safety',
    description: {
      en: 'First aid supplies available',
      fr: 'Fournitures de premiers secours disponibles',
      ar: 'مستلزمات الإسعافات الأولية متاحة'
    }
  },
  {
    id: 'security_cameras',
    name: {
      en: 'Security Cameras',
      fr: 'Caméras de sécurité',
      ar: 'كاميرات أمنية'
    },
    icon: 'Camera',
    category: 'safety',
    description: {
      en: 'Security camera system',
      fr: 'Système de caméras de sécurité',
      ar: 'نظام كاميرات أمنية'
    }
  },
  {
    id: 'secure_compound',
    name: {
      en: 'Secure Compound',
      fr: 'Compound sécurisé',
      ar: 'مجمع آمن'
    },
    icon: 'Shield',
    category: 'safety',
    description: {
      en: 'Gated and secured residential compound',
      fr: 'Compound résidentiel fermé et sécurisé',
      ar: 'مجمع سكني محاط ببوابات وآمن'
    }
  },

  // Kitchen Amenities
  {
    id: 'kitchen',
    name: {
      en: 'Kitchen',
      fr: 'Cuisine',
      ar: 'مطبخ'
    },
    icon: 'CookingPot',
    category: 'kitchen',
    description: {
      en: 'Fully equipped kitchen',
      fr: 'Cuisine entièrement équipée',
      ar: 'مطبخ مجهز بالكامل'
    }
  },
  {
    id: 'refrigerator',
    name: {
      en: 'Refrigerator',
      fr: 'Réfrigérateur',
      ar: 'ثلاجة'
    },
    icon: 'Refrigerator',
    category: 'kitchen',
    description: {
      en: 'Refrigerator for food storage',
      fr: 'Réfrigérateur pour stockage alimentaire',
      ar: 'ثلاجة لتخزين الطعام'
    }
  },
  {
    id: 'microwave',
    name: {
      en: 'Microwave',
      fr: 'Micro-ondes',
      ar: 'ميكروويف'
    },
    icon: 'Microwave',
    category: 'kitchen',
    description: {
      en: 'Microwave oven available',
      fr: 'Four à micro-ondes disponible',
      ar: 'فرن ميكروويف متاح'
    }
  },
  {
    id: 'coffee_maker',
    name: {
      en: 'Coffee Maker',
      fr: 'Machine à café',
      ar: 'آلة قهوة'
    },
    icon: 'Coffee',
    category: 'kitchen',
    description: {
      en: 'Coffee brewing equipment',
      fr: 'Équipement de préparation de café',
      ar: 'معدات تحضير القهوة'
    }
  },

  // Bathroom Amenities
  {
    id: 'hot_water',
    name: {
      en: 'Hot Water',
      fr: 'Eau chaude',
      ar: 'ماء ساخن'
    },
    icon: 'Drop',
    category: 'bathroom',
    description: {
      en: 'Hot water available 24/7',
      fr: 'Eau chaude disponible 24h/24',
      ar: 'ماء ساخن متاح 24/7'
    }
  },
  {
    id: 'bathtub',
    name: {
      en: 'Bathtub',
      fr: 'Baignoire',
      ar: 'حوض استحمام'
    },
    icon: 'Bathtub',
    category: 'bathroom',
    description: {
      en: 'Bathtub for relaxation',
      fr: 'Baignoire pour relaxation',
      ar: 'حوض استحمام للاسترخاء'
    }
  },
  {
    id: 'hair_dryer',
    name: {
      en: 'Hair Dryer',
      fr: 'Sèche-cheveux',
      ar: 'مجفف شعر'
    },
    icon: 'Wind',
    category: 'bathroom',
    description: {
      en: 'Hair drying equipment',
      fr: 'Équipement de séchage de cheveux',
      ar: 'معدات تجفيف الشعر'
    }
  },

  // Bedroom Amenities
  {
    id: 'bed_linens',
    name: {
      en: 'Bed Linens',
      fr: 'Draps de lit',
      ar: 'ملاءات السرير'
    },
    icon: 'Bed',
    category: 'bedroom',
    description: {
      en: 'Clean bed linens provided',
      fr: 'Draps de lit propres fournis',
      ar: 'ملاءات سرير نظيفة متوفرة'
    }
  },
  {
    id: 'wardrobe',
    name: {
      en: 'Wardrobe',
      fr: 'Garde-robe',
      ar: 'خزانة ملابس'
    },
    icon: 'Shirt',
    category: 'bedroom',
    description: {
      en: 'Clothing storage space',
      fr: 'Espace de rangement pour vêtements',
      ar: 'مساحة تخزين الملابس'
    }
  },
  {
    id: 'desk',
    name: {
      en: 'Desk',
      fr: 'Bureau',
      ar: 'مكتب'
    },
    icon: 'Notebook',
    category: 'bedroom',
    description: {
      en: 'Work desk available',
      fr: 'Bureau de travail disponible',
      ar: 'مكتب عمل متاح'
    }
  },

  // Outdoor Amenities
  {
    id: 'balcony',
    name: {
      en: 'Balcony',
      fr: 'Balcon',
      ar: 'شرفة'
    },
    icon: 'Balcony',
    category: 'outdoor',
    description: {
      en: 'Private balcony with view',
      fr: 'Balcon privé avec vue',
      ar: 'شرفة خاصة مع إطلالة'
    }
  },
  {
    id: 'garden',
    name: {
      en: 'Garden',
      fr: 'Jardin',
      ar: 'حديقة'
    },
    icon: 'Tree',
    category: 'outdoor',
    description: {
      en: 'Private garden space',
      fr: 'Espace jardin privé',
      ar: 'مساحة حديقة خاصة'
    }
  },
  {
    id: 'pool',
    name: {
      en: 'Swimming Pool',
      fr: 'Piscine',
      ar: 'مسبح'
    },
    icon: 'SwimmingPool',
    category: 'outdoor',
    description: {
      en: 'Swimming pool access',
      fr: 'Accès à la piscine',
      ar: 'وصول إلى المسبح'
    }
  },
  {
    id: 'bbq_area',
    name: {
      en: 'BBQ Area',
      fr: 'Zone BBQ',
      ar: 'منطقة شواء'
    },
    icon: 'Fire',
    category: 'outdoor',
    description: {
      en: 'Barbecue and outdoor cooking area',
      fr: 'Zone barbecue et cuisine extérieure',
      ar: 'منطقة شواء وطبخ خارجي'
    }
  },

  // Entertainment Amenities
  {
    id: 'tv',
    name: {
      en: 'TV',
      fr: 'Télévision',
      ar: 'تلفزيون'
    },
    icon: 'Television',
    category: 'entertainment',
    description: {
      en: 'Television with cable/satellite',
      fr: 'Télévision avec câble/satellite',
      ar: 'تلفزيون مع كابل/ساتل'
    }
  },
  {
    id: 'sound_system',
    name: {
      en: 'Sound System',
      fr: 'Système audio',
      ar: 'نظام صوتي'
    },
    icon: 'SpeakerHigh',
    category: 'entertainment',
    description: {
      en: 'Audio system for music',
      fr: 'Système audio pour musique',
      ar: 'نظام صوتي للموسيقى'
    }
  },
  {
    id: 'board_games',
    name: {
      en: 'Board Games',
      fr: 'Jeux de société',
      ar: 'ألعاب الطاولة'
    },
    icon: 'GameController',
    category: 'entertainment',
    description: {
      en: 'Board games and entertainment',
      fr: 'Jeux de société et divertissement',
      ar: 'ألعاب الطاولة والترفيه'
    }
  },

  // Mauritania-Specific Amenities
  {
    id: 'generator',
    name: {
      en: 'Generator',
      fr: 'Générateur',
      ar: 'مولد كهرباء'
    },
    icon: 'Lightning',
    category: 'mauritania_specific',
    description: {
      en: 'Backup generator for power outages',
      fr: 'Générateur de secours pour pannes d\'électricité',
      ar: 'مولد احتياطي لانقطاع الكهرباء'
    }
  },
  {
    id: 'water_tank',
    name: {
      en: 'Water Tank',
      fr: 'Réservoir d\'eau',
      ar: 'خزان ماء'
    },
    icon: 'Drop',
    category: 'mauritania_specific',
    description: {
      en: 'Water storage tank for reliable supply',
      fr: 'Réservoir de stockage d\'eau pour approvisionnement fiable',
      ar: 'خزان تخزين ماء لإمداد موثوق'
    }
  },
  {
    id: 'mosque_nearby',
    name: {
      en: 'Mosque Nearby',
      fr: 'Mosquée à proximité',
      ar: 'مسجد قريب'
    },
    icon: 'Mosque',
    category: 'mauritania_specific',
    description: {
      en: 'Mosque within walking distance',
      fr: 'Mosquée à distance de marche',
      ar: 'مسجد على مسافة قريبة'
    }
  },
  {
    id: 'halal_food',
    name: {
      en: 'Halal Food Available',
      fr: 'Nourriture halal disponible',
      ar: 'طعام حلال متاح'
    },
    icon: 'ForkKnife',
    category: 'mauritania_specific',
    description: {
      en: 'Halal food options nearby',
      fr: 'Options de nourriture halal à proximité',
      ar: 'خيارات طعام حلال قريبة'
    }
  },
  {
    id: 'desert_view',
    name: {
      en: 'Desert View',
      fr: 'Vue sur le désert',
      ar: 'إطلالة صحراوية'
    },
    icon: 'Mountains',
    category: 'mauritania_specific',
    description: {
      en: 'Beautiful desert landscape view',
      fr: 'Belle vue sur le paysage désertique',
      ar: 'إطلالة جميلة على المشهد الصحراوي'
    }
  },
  {
    id: 'traditional_furniture',
    name: {
      en: 'Traditional Furniture',
      fr: 'Mobilier traditionnel',
      ar: 'أثاث تقليدي'
    },
    icon: 'Armchair',
    category: 'mauritania_specific',
    description: {
      en: 'Traditional Mauritanian furniture and decor',
      fr: 'Mobilier et décoration traditionnels mauritaniens',
      ar: 'أثاث وديكور موريتاني تقليدي'
    }
  }
];

// Helper function to get amenities by category
export const getAmenitiesByCategory = (category: PropertyAmenity['category']) => {
  return propertyAmenities.filter(amenity => amenity.category === category);
};

// Helper function to get all categories
export const getAmenityCategories = () => {
  const categories = [...new Set(propertyAmenities.map(amenity => amenity.category))];
  return categories.map(category => ({
    id: category,
    name: {
      en: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
      fr: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
      ar: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
    }
  }));
};
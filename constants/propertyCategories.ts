export interface PropertyCategory {
  id: string;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
  icon: string; // Phosphor icon name
  description: {
    en: string;
    fr: string;
    ar: string;
  };
}

export const propertyCategories: PropertyCategory[] = [
  {
    id: 'apartment',
    name: {
      en: 'Apartment',
      fr: 'Appartement',
      ar: 'شقة'
    },
    icon: 'Buildings',
    description: {
      en: 'Modern apartments in Nouakchott and other cities',
      fr: 'Appartements modernes à Nouakchott et autres villes',
      ar: 'شقق حديثة في نواكشوط ومدن أخرى'
    }
  },
  {
    id: 'house',
    name: {
      en: 'House',
      fr: 'Maison',
      ar: 'منزل'
    },
    icon: 'House',
    description: {
      en: 'Traditional and modern houses',
      fr: 'Maisons traditionnelles et modernes',
      ar: 'منازل تقليدية وحديثة'
    }
  },
  {
    id: 'villa',
    name: {
      en: 'Villa',
      fr: 'Villa',
      ar: 'فيلا'
    },
    icon: 'HouseLine',
    description: {
      en: 'Luxury villas with gardens and pools',
      fr: 'Villas de luxe avec jardins et piscines',
      ar: 'فيلات فاخرة مع حدائق ومسابح'
    }
  },
  {
    id: 'riyad',
    name: {
      en: 'Riyad',
      fr: 'Riyad',
      ar: 'رياض'
    },
    icon: 'Tree',
    description: {
      en: 'Traditional Mauritanian courtyard houses',
      fr: 'Maisons traditionnelles mauritaniennes avec cour',
      ar: 'منازل تقليدية موريتانية مع فناء'
    }
  },
  {
    id: 'guesthouse',
    name: {
      en: 'Guest House',
      fr: 'Maison d\'hôtes',
      ar: 'بيت ضيافة'
    },
    icon: 'Users',
    description: {
      en: 'Traditional guest houses and family homes',
      fr: 'Maisons d\'hôtes traditionnelles et maisons familiales',
      ar: 'بيوت ضيافة تقليدية ومنازل عائلية'
    }
  },
  {
    id: 'hotel',
    name: {
      en: 'Hotel',
      fr: 'Hôtel',
      ar: 'فندق'
    },
    icon: 'Buildings',
    description: {
      en: 'Hotels and business accommodations',
      fr: 'Hôtels et hébergements d\'affaires',
      ar: 'فنادق وإقامات تجارية'
    }
  },
  {
    id: 'beach_house',
    name: {
      en: 'Beach House',
      fr: 'Maison de plage',
      ar: 'منزل شاطئي'
    },
    icon: 'Waves',
    description: {
      en: 'Beachfront properties in Nouadhibou and coastal areas',
      fr: 'Propriétés en bord de mer à Nouadhibou et zones côtières',
      ar: 'عقارات على الشاطئ في نواذيبو والمناطق الساحلية'
    }
  },
  {
    id: 'desert_camp',
    name: {
      en: 'Desert Camp',
      fr: 'Camp du désert',
      ar: 'مخيم صحراوي'
    },
    icon: 'Tent',
    description: {
      en: 'Traditional desert camps and nomadic accommodations',
      fr: 'Camps du désert traditionnels et hébergements nomades',
      ar: 'مخيمات صحراوية تقليدية وإقامات بدوية'
    }
  },
  {
    id: 'business_space',
    name: {
      en: 'Business Space',
      fr: 'Espace d\'affaires',
      ar: 'مساحة تجارية'
    },
    icon: 'Briefcase',
    description: {
      en: 'Office spaces and business accommodations',
      fr: 'Espaces de bureau et hébergements d\'affaires',
      ar: 'مساحات مكتبية وإقامات تجارية'
    }
  },
  {
    id: 'student_housing',
    name: {
      en: 'Student Housing',
      fr: 'Logement étudiant',
      ar: 'سكن طلابي'
    },
    icon: 'GraduationCap',
    description: {
      en: 'Student accommodations near universities',
      fr: 'Hébergements étudiants près des universités',
      ar: 'إقامات طلابية قرب الجامعات'
    }
  }
];

export const experienceCategories: PropertyCategory[] = [
  {
    id: 'cultural_tour',
    name: {
      en: 'Cultural Tour',
      fr: 'Tour culturel',
      ar: 'جولة ثقافية'
    },
    icon: 'MapPin',
    description: {
      en: 'Explore Mauritanian culture and heritage',
      fr: 'Explorez la culture et le patrimoine mauritanien',
      ar: 'استكشف الثقافة والتراث الموريتاني'
    }
  },
  {
    id: 'desert_safari',
    name: {
      en: 'Desert Safari',
      fr: 'Safari dans le désert',
      ar: 'رحلة سفاري صحراوية'
    },
    icon: 'Car',
    description: {
      en: 'Adventure tours in the Sahara Desert',
      fr: 'Tours d\'aventure dans le désert du Sahara',
      ar: 'رحلات مغامرة في الصحراء الكبرى'
    }
  },
  {
    id: 'camel_riding',
    name: {
      en: 'Camel Riding',
      fr: 'Balade à dos de chameau',
      ar: 'ركوب الجمال'
    },
    icon: 'Horse',
    description: {
      en: 'Traditional camel riding experiences',
      fr: 'Expériences traditionnelles de balade à dos de chameau',
      ar: 'تجارب تقليدية لركوب الجمال'
    }
  },
  {
    id: 'fishing_trip',
    name: {
      en: 'Fishing Trip',
      fr: 'Sortie de pêche',
      ar: 'رحلة صيد'
    },
    icon: 'Fish',
    description: {
      en: 'Deep sea and coastal fishing experiences',
      fr: 'Expériences de pêche en haute mer et côtière',
      ar: 'تجارب صيد في أعماق البحر والساحل'
    }
  },
  {
    id: 'cooking_class',
    name: {
      en: 'Cooking Class',
      fr: 'Cours de cuisine',
      ar: 'فصل طبخ'
    },
    icon: 'ChefHat',
    description: {
      en: 'Learn traditional Mauritanian cuisine',
      fr: 'Apprenez la cuisine traditionnelle mauritanienne',
      ar: 'تعلم المطبخ الموريتاني التقليدي'
    }
  },
  {
    id: 'music_performance',
    name: {
      en: 'Music Performance',
      fr: 'Spectacle musical',
      ar: 'عرض موسيقي'
    },
    icon: 'MusicNote',
    description: {
      en: 'Traditional Mauritanian music and performances',
      fr: 'Musique et spectacles traditionnels mauritaniens',
      ar: 'موسيقى وعروض موريتانية تقليدية'
    }
  },
  {
    id: 'handicraft_workshop',
    name: {
      en: 'Handicraft Workshop',
      fr: 'Atelier d\'artisanat',
      ar: 'ورشة حرف يدوية'
    },
    icon: 'Hammer',
    description: {
      en: 'Learn traditional Mauritanian crafts',
      fr: 'Apprenez l\'artisanat traditionnel mauritanien',
      ar: 'تعلم الحرف اليدوية الموريتانية التقليدية'
    }
  },
  {
    id: 'city_tour',
    name: {
      en: 'City Tour',
      fr: 'Visite de la ville',
      ar: 'جولة في المدينة'
    },
    icon: 'Buildings',
    description: {
      en: 'Guided tours of Nouakchott and other cities',
      fr: 'Visites guidées de Nouakchott et autres villes',
      ar: 'جولات إرشادية في نواكشوط ومدن أخرى'
    }
  },
  {
    id: 'beach_activity',
    name: {
      en: 'Beach Activity',
      fr: 'Activité de plage',
      ar: 'نشاط شاطئي'
    },
    icon: 'Waves',
    description: {
      en: 'Beach activities and water sports',
      fr: 'Activités de plage et sports nautiques',
      ar: 'أنشطة شاطئية ورياضات مائية'
    }
  },
  {
    id: 'stargazing',
    name: {
      en: 'Stargazing',
      fr: 'Observation des étoiles',
      ar: 'مراقبة النجوم'
    },
    icon: 'Star',
    description: {
      en: 'Desert stargazing and astronomy experiences',
      fr: 'Observation des étoiles dans le désert et expériences d\'astronomie',
      ar: 'مراقبة النجوم في الصحراء وتجارب الفلك'
    }
  }
];

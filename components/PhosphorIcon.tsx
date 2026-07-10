import React from 'react';
import * as P from 'phosphor-react-native';

type Props = { name: string; size?: number; color?: string };

const iconMap: Record<string, React.ComponentType<any>> = {
  Buildings: P.Buildings,
  House: P.House,
  HouseLine: P.HouseLine,
  Tree: P.Tree,
  Users: P.Users,
  Waves: P.Waves,
  Tent: P.Tent,
  Briefcase: P.Briefcase,
  GraduationCap: P.GraduationCap,
  MapPin: P.MapPin,
  Car: P.Car,
  Horse: P.Horse,
  Fish: P.Fish,
  CookingPot: P.CookingPot,
  MusicNote: P.MusicNote,
  Hammer: P.Hammer,
  Star: P.Star,
  WifiHigh: P.WifiHigh,
  Snowflake: P.Snowflake,
  Thermometer: P.Thermometer,
  Camera: P.Camera,
  Shield: P.Shield,
  Refrigerator: (P as any).Refrigerator || P.Fridge,
  Microwave: (P as any).Microwave || P.DeviceTablet,
  Coffee: P.Coffee,
  Drop: P.Drop,
  Bathtub: (P as any).Bathtub || P.Bath,
  Wind: P.Wind,
  Bed: (P as any).Bed || P.Bed,
  TShirt: P.TShirt,
  Shirt: P.TShirt,
  Note: P.Note,
  Television: P.Television,
  SpeakerHigh: P.SpeakerHigh,
  GameController: P.GameController,
  Lightning: P.Lightning,
  ForkKnife: P.ForkKnife,
  Mountains: P.Mountains,
  Armchair: P.Armchair,
};

// Normalize incoming names like "wifi-high", "wifi_high", "WifiHigh" → "WifiHigh"
const toPascal = (raw: string) =>
  raw
    .replace(/[-_\s]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

const alias: Record<string, string> = {
  Wifi: 'WifiHigh',
  WiFi: 'WifiHigh',
  AC: 'Snowflake',
  Fridge: 'Refrigerator',
  Bath: 'Bathtub',
  Closet: 'Shirt',
};

export const PhosphorIcon: React.FC<Props> = ({ name, size = 20, color = '#222' }) => {
  const tryNames = [name, toPascal(name), alias[name] || alias[toPascal(name)]].filter(Boolean) as string[];
  let Icon: any = null;
  for (const key of tryNames) {
    Icon = (iconMap as any)[key] || (P as any)[key];
    if (Icon) break;
  }
  if (!Icon) Icon = P.Question;
  return <Icon size={size} color={color} />;
};



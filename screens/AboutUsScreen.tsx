// import React from 'react';
// import { 
//   ScrollView, 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity,
//   SafeAreaView,
//   StatusBar,
//   Image
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useTranslation } from 'react-i18next';

// const AboutUsScreen = () => {
//   const { t } = useTranslation();
  
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
// <View
// style={
//     {
//         flex: 1,
//         backgroundColor: '#FFF',
//         marginTop: "15%",
//     }
// }
// >
          
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
//           <Ionicons name="chevron-back" size={28} color="#222" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>{t('about.title')}</Text>
//         <View style={styles.placeholder} />
//       </View>

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Hero Section */}
//         <View style={styles.heroSection}>
//           <View style={styles.logoContainer}>
//             {/* <Text style={styles.logoEmoji}>🏡</Text> */}
//             <Image source={require('../assets/house.png')} style={{
//                 width: 80,
//                 height: 80,
//                 resizeMode: 'contain',
//                 position: 'absolute',
//             }} />
//           </View>
//           <Text style={styles.heroTitle}>{t('about.heroTitle')}</Text>
//         </View>

//         {/* DIVIDERE */}
//         <View style={styles.divider} />

//         {/* Introduction */}
//         <View style={styles.section}>
//           <Text style={styles.bodyText}>
//             {t('about.intro1')}{' '}
//             <Text style={styles.boldText}>{t('about.intro1Bold1')}</Text> {t('about.intro1And')}{' '}
//             <Text style={styles.boldText}>{t('about.intro1Bold2')}</Text>.
//           </Text>
//         </View>

//         {/* Origin Story */}
//         <View style={styles.highlightCard}>
//           <Text style={styles.cardText}>
//             {t('about.origin1')} <Text style={styles.boldText}>{t('about.origin2')}</Text>, {t('about.origin3')}.
//           </Text>
//         </View>

//         {/* Philosophy Section */}
//         <View style={styles.section}>
//           <Text style={styles.bodyText}>
//             {t('about.philosophy1')}{' '}
//             <Text style={styles.emphasisText}>{t('about.philosophy2')}</Text>.
//           </Text>
//         </View>

//         {/* Who We Serve */}
//         <View style={styles.section}>
//           <Text style={styles.bodyText}>
//             {t('about.whoWeServe1')}{' '}
//             <Text style={styles.boldText}>{t('about.whoWeServe2')}</Text>.
//           </Text>
//         </View>

//         {/* DIVIDERE */}
//         <View style={styles.divider} />

//         {/* Mission Section */}
//         <View style={styles.missionSection}>
//           <Text style={styles.missionTitle}>{t('about.missionTitle')}</Text>
//           <Text style={styles.missionSubtitle}>✨ {t('about.missionSubtitle')}</Text>
          
//           <View style={styles.missionCard}>
//             <View style={styles.missionIconContainer}>
//               <Ionicons name="home" size={24} color="#FF385C" />
//             </View>
//             <View style={styles.missionContent}>
//               <Text style={styles.missionLabel}>{t('about.guests')}</Text>
//               <Text style={styles.missionText}>{t('about.guestsText')}</Text>
//             </View>
//           </View>

//           <View style={styles.missionCard}>
//             <View style={styles.missionIconContainer}>
//               <Ionicons name="people" size={24} color="#FF385C" />
//             </View>
//             <View style={styles.missionContent}>
//               <Text style={styles.missionLabel}>{t('about.hosts')}</Text>
//               <Text style={styles.missionText}>
//                 {t('about.hostsText')}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.missionCard}>
//             <View style={styles.missionIconContainer}>
//               <Ionicons name="globe" size={24} color="#FF385C" />
//             </View>
//             <View style={styles.missionContent}>
//               <Text style={styles.missionLabel}>{t('about.travelers')}</Text>
//               <Text style={styles.missionText}>
//                 {t('about.travelersText1')} <Text style={styles.boldText}>{t('about.travelersText2')}</Text>.
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Vision Statement */}
//         <View style={styles.visionCard}>
//           <Text style={styles.visionText}>
//             {t('about.vision1')} <Text style={styles.boldText}>{t('about.vision2')}</Text> {t('about.vision3')}
//           </Text>
//         </View>

//         {/* DIVIDERE */}
//         <View style={styles.divider} />

//         {/* Sweet Message Section */}
//         <View style={styles.messageSection}>
//           <Text style={styles.messageTitle}>{t('about.messageTitle')}</Text>
          
//           <View style={styles.messageCard}>
//             <Text style={styles.messageText}>
//               {t('about.message1')} <Text style={styles.boldText}>{t('about.message2')}</Text>. 
//               {t('about.message3')}
//             </Text>
//           </View>

//           <View style={styles.messageCard}>
//             <Text style={styles.messageText}>
//               {t('about.message4')}{' '}
//               <Text style={styles.emphasisText}>{t('about.message5')}</Text>
//             </Text>
//           </View>
//         </View>

//         {/* DIVIDERE */}
//         <View style={styles.divider} />

//         {/* Final CTA */}
//         <View style={styles.ctaSection}>
//           <Text style={styles.ctaTitle}>{t('about.ctaTitle')}</Text>
//           <Text style={styles.ctaSubtitle}>{t('about.ctaSubtitle')} 🏡✨</Text>
//         </View>

//         {/* DIVIDERE */}
//         {/* <View style={styles.divider} /> */}

//         {/* Stats Section (Optional) */}
//         {/* <View style={styles.statsSection}>
//           <View style={styles.statCard}>
//             <Ionicons name="home-outline" size={28} color="#FF385C" />
//             <Text style={styles.statNumber}>1000+</Text>
//             <Text style={styles.statLabel}>Properties</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Ionicons name="people-outline" size={28} color="#FF385C" />
//             <Text style={styles.statNumber}>5000+</Text>
//             <Text style={styles.statLabel}>Community Members</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Ionicons name="location-outline" size={28} color="#FF385C" />
//             <Text style={styles.statNumber}>50+</Text>
//             <Text style={styles.statLabel}>Cities</Text>
//           </View>
//         </View> */}

//         <View style={styles.footerSpace} />
//       </ScrollView>
// </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFF',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EBEBEB',
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#222',
//     letterSpacing: -0.3,
//   },
//   placeholder: {
//     width: 32,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 40,
//   },
//   heroSection: {
//     alignItems: 'center',
//     paddingTop: 40,
//     paddingBottom: 32,
//     paddingHorizontal: 24,
//     backgroundColor: '#FFF',
//   },
//   logoContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 20,
//   },
//   logoEmoji: {
//     fontSize: 40,
//   },
//   heroTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#222',
//     textAlign: 'center',
//     letterSpacing: -0.5,
//     marginBottom: 8,
//   },
//   heroSubtitle: {
//     fontSize: 32,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#EBEBEB',
//     marginVertical: 20,
//   },
//   section: {
//     paddingHorizontal: 24,
//     paddingVertical: 20,
//   },
//   bodyText: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#484848',
//   },
//   boldText: {
//     fontWeight: '600',
//     color: '#222',
//   },
//   emphasisText: {
//     fontWeight: '700',
//     color: '#FF385C',
//   },
//   highlightCard: {
//     backgroundColor: '#FF385C',
//     marginHorizontal: 24,
//     marginVertical: 16,
//     padding: 20,
//     borderRadius: 12,
//   },
//   cardText: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#fff',
//     textAlign: 'center',
//   },
//   missionSection: {
//     paddingHorizontal: 24,
//     paddingVertical: 32,
//     backgroundColor: '#FAFAFA',
//   },
//   missionTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#222',
//     marginBottom: 12,
//     letterSpacing: -0.4,
//   },
//   missionSubtitle: {
//     fontSize: 16,
//     color: '#484848',
//     marginBottom: 24,
//   },
//   missionCard: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   missionIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#FFF4F4',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   missionContent: {
//     flex: 1,
//   },
//   missionLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#222',
//     marginBottom: 4,
//   },
//   missionText: {
//     fontSize: 15,
//     lineHeight: 22,
//     color: '#484848',
//   },
//   visionCard: {
//     backgroundColor: '#6366F1',
//     marginHorizontal: 24,
//     marginVertical: 24,
//     padding: 24,
//     borderRadius: 12,
//   },
//   visionText: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#fff',
//     textAlign: 'center',
//   },
//   messageSection: {
//     paddingHorizontal: 24,
//     paddingVertical: 32,
//   },
//   heartContainer: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   heartEmoji: {
//     fontSize: 48,
//   },
//   messageTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#222',
//     textAlign: 'center',
//     marginBottom: 24,
//     letterSpacing: -0.4,
//   },
//   messageCard: {
//     backgroundColor: '#FFF9E6',
//     padding: 20,
//     borderRadius: 12,
//     marginBottom: 16,
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#484848',
//     textAlign: 'center',
//   },
//   ctaSection: {
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingVertical: 32,
//     backgroundColor: '#FAFAFA',
//   },
//   ctaTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#222',
//     textAlign: 'center',
//     marginBottom: 8,
//     letterSpacing: -0.5,
//   },
//   ctaSubtitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#FF385C',
//     textAlign: 'center',
//   },
//   statsSection: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingHorizontal: 24,
//     paddingVertical: 32,
//   },
//   statCard: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#222',
//     marginTop: 12,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 13,
//     color: '#717171',
//     textAlign: 'center',
//   },
//   footerSpace: {
//     height: 20,
//   },
// });

// export default AboutUsScreen;

import React from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import {  Users, Upload, Video, HouseIcon, ChartLine, Star, ArrowLeftIcon, } from 'phosphor-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function AboutUsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  const features = [
    {
      icon: HouseIcon,
      title: t('about.features.propertyManagement.title'),
      description: t('about.features.propertyManagement.description')
    },
    {
      icon: Upload,
      title: t('about.features.easyUploads.title'),
      description: t('about.features.easyUploads.description')
    },
    {
      icon: Video,
      title: t('about.features.professionalMedia.title'),
      description: t('about.features.professionalMedia.description')
    },
    {
      icon: Users,
      title: t('about.features.userHostTools.title'),
      description: t('about.features.userHostTools.description')
    },
    {
      icon: Star,
      title: t('about.features.qualityStandards.title'),
      description: t('about.features.qualityStandards.description')
    },
    {
      icon: ChartLine,
      title: t('about.features.growthFocused.title'),
      description: t('about.features.growthFocused.description')
    }
  ];
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Section, if back button is pressed, go back to the previous screen */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack ? navigation.goBack() : null}>
          <ArrowLeftIcon size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('about.title')}</Text>
      </View>
        <View style={styles.divider} />

      {/* Mission Statement */}
      <View style={styles.missionSection}>
        <Text style={styles.sectionTitle}>{t('about.ourMission')}</Text>
        <Text style={styles.missionText}>
          {t('about.ourMissionText')}
        </Text>
      </View>

      {/* What We Offer */}
      <View style={styles.offerSection}>
        <Text style={styles.sectionTitle}>{t('about.whatWeOffer')}</Text>
        <Text style={styles.offerDescription}>
          {t('about.whatWeOfferDescription')}
        </Text>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <View key={index} style={styles.featureCard}>
              <View style={styles.iconContainer}>
                <IconComponent size={28} color="#1a1a1a" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          );
        })}
      </View>

      {/* Our Commitment */}
      <View style={styles.commitmentSection}>
        <Text style={styles.sectionTitle}>{t('about.ourCommitment')}</Text>
        <View style={styles.commitmentCard}>
          <Text style={styles.commitmentText}>
            <Text style={styles.bold}>{t('about.forHosts')}</Text> {t('about.forHostsText')}
          </Text>
          <View style={styles.spacer} />
          <Text style={styles.commitmentText}>
            <Text style={styles.bold}>{t('about.forUsers')}</Text> {t('about.forUsersText')}
          </Text>
          <View style={styles.spacer} />
          <Text style={styles.commitmentText}>
            <Text style={styles.bold}>{t('about.ourPromise')}</Text> {t('about.ourPromiseText')}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('about.footerText')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  backButton: {
    padding: 4,
  },
    header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  divider: {
    height: 3,
    width: 60,
    backgroundColor: '#1a1a1a',
    marginTop: 16,
  },
  missionSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  missionText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4a4a4a',
    letterSpacing: 0.2,
  },
  offerSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  offerDescription: {
    fontSize: 15,
    color: '#6a6a6a',
    marginTop: 8,
    letterSpacing: 0.1,
  },
  featuresContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5a5a5a',
    letterSpacing: 0.1,
  },
  commitmentSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  commitmentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
  },
  commitmentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#e8e8e8',
    letterSpacing: 0.1,
  },
  bold: {
    fontWeight: '600',
    color: '#ffffff',
  },
  spacer: {
    height: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#8a8a8a',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// import { MaterialIcons } from '@expo/vector-icons';
// import { useTranslation } from 'react-i18next';

// export const AddListingGuideScreen = ({ navigation }: { navigation: any }) => {
//   const { t } = useTranslation();

//   const steps = [
//     { 
//       icon: 'account-circle', 
//       title: t('listingGuide.profile', 'أكمل ملفك الشخصي'), 
//       desc: t('listingGuide.profileDesc', 'أضف معلوماتك وصورة واضحة لبناء الثقة.'),
//       free: true
//     },
//     { 
//       icon: 'verified-user', 
//       title: t('listingGuide.verify', 'تحقق من هويتك'), 
//       desc: t('listingGuide.verifyDesc', 'ارفع هوية سارية وصورة ذاتية لإتمام التحقق.'),
//       free: true
//     },
//     { 
//       icon: 'switch-account', 
//       title: t('listingGuide.switchHost', 'فعّل وضع المضيف'), 
//       desc: t('listingGuide.switchHostDesc', 'انتقل إلى وضع المضيف لإدارة إعلاناتك.'),
//       free: true
//     },
//     { 
//       icon: 'add-business', 
//       title: t('listingGuide.createOrg', 'أنشئ منظمة (اختياري)'), 
//       desc: t('listingGuide.createOrgDesc', 'أضف منظمتك لإدارة الفريق والعقارات بشكل احترافي.'),
//       free: true
//     },
//     { 
//       icon: 'home-work', 
//       title: t('listingGuide.addProperty', 'أضف عقاراً أو أرضاً'), 
//       desc: t('listingGuide.addPropertyDesc', 'املأ التفاصيل والصور والتسعير بخطوات بسيطة.'),
//       free: true
//     },
//     { 
//       icon: 'public', 
//       title: t('listingGuide.publish', 'قدّم للمراجعة ثم انشر'), 
//       desc: t('listingGuide.publishDesc', 'نراجع إعلانك لضمان الجودة قبل نشره.'),
//       free: true
//     },
//   ];

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//           <MaterialIcons name="arrow-back" size={24} color="#111827" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>{t('listingGuide.title', 'أضف إعلانك خطوة بخطوة')}</Text>
//         <View style={styles.headerSpacer} />
//       </View>

//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         {/* Hero Section */}
//         <View style={styles.heroSection}>
//           <MaterialIcons name="rocket-launch" size={40} color="#667eea" />
//           <Text style={styles.heroTitle}>{t('listingGuide.heroTitle', 'تحكم كامل—أضف إعلانك بنفسك')}</Text>
//           <Text style={styles.heroSubtitle}>{t('listingGuide.heroSubtitle', 'واجهة احترافية، موافقات سريعة، وترويج فعّال')}</Text>
          
//           {/* Free Badge */}
//           <View style={styles.freeBadge}>
//             <MaterialIcons name="money-off" size={18} color="#00C851" />
//             <Text style={styles.freeBadgeText}>{t('listingGuide.completelyFree', 'مجاناً تماماً!')}</Text>
//           </View>
//         </View>

//         {/* Steps Section */}
//         <View style={styles.stepsContainer}>
//           <Text style={styles.stepsTitle}>{t('listingGuide.stepsTitle', 'خطوات بسيطة ومجانية')}</Text>
//           <Text style={styles.stepsSubtitle}>{t('listingGuide.stepsSubtitle', 'لا تحتاج أي أوقية أو فلس واحد!')}</Text>
          
//           <View style={styles.stepsList}>
//             {steps.map((step, index) => (
//               <View key={index} style={styles.stepContainer}>
//                 {/* Step Card */}
//                 <View style={styles.stepCard}>
//                   <View style={styles.stepIconContainer}>
//                     <MaterialIcons name={step.icon as any} size={24} color="#667eea" />
//                   </View>
//                   <View style={styles.stepContent}>
//                     <View style={styles.stepHeader}>
//                       <Text style={styles.stepTitle}>{step.title}</Text>
//                       {step.free && (
//                         <View style={styles.freeTag}>
//                           <Text style={styles.freeTagText}>{t('listingGuide.free', 'مجاني')}</Text>
//                         </View>
//                       )}
//                     </View>
//                     <Text style={styles.stepDesc}>{step.desc}</Text>
//                   </View>
//                   <View style={styles.stepNumber}>
//                     <Text style={styles.stepNumberText}>{index + 1}</Text>
//                   </View>
//                 </View>
                
//                 {/* Vertical Line */}
//                 {index < steps.length - 1 && (
//                   <View style={styles.verticalLine} />
//                 )}
//               </View>
//             ))}
//           </View>
//         </View>

//         {/* Call to Action */}
//         <View style={styles.ctaSection}>
//           <View style={styles.ctaCard}>
//             <MaterialIcons name="celebration" size={28} color="#FF6B35" />
//             <Text style={styles.ctaTitle}>{t('listingGuide.ctaTitle', 'ابدأ الآن - مجاناً تماماً!')}</Text>
//             <Text style={styles.ctaSubtitle}>{t('listingGuide.ctaSubtitle', 'لا توجد رسوم خفية أو تكاليف إضافية')}</Text>
            
//             <View style={styles.ctaButtons}>
//               <TouchableOpacity 
//                 style={styles.primaryCtaBtn} 
//                 onPress={() => (navigation as any).navigate('AccountRoot', { screen: 'Account' })}
//               >
//                 <MaterialIcons name="person" size={18} color="#FFFFFF" />
//                 <Text style={styles.primaryCtaText}>{t('listingGuide.goToProfile', 'الذهاب إلى الملف الشخصي')}</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity 
//                 style={styles.secondaryCtaBtn} 
//                 onPress={() => (navigation as any).navigate('AddProperty')}
//               >
//                 <MaterialIcons name="add-home" size={18} color="#667eea" />
//                 <Text style={styles.secondaryCtaText}>{t('listingGuide.addNow', 'أضف الآن')}</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//     paddingTop: 50,
//   },
//   backBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#111827',
//     flex: 1,
//     textAlign: 'center',
//   },
//   headerSpacer: {
//     width: 36,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   heroSection: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//     alignItems: 'center',
//     backgroundColor: '#F8FAFC',
//   },
//   heroTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#111827',
//     textAlign: 'center',
//     marginTop: 12,
//     marginBottom: 6,
//   },
//   heroSubtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 16,
//   },
//   freeBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#00C851',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   freeBadgeText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#FFFFFF',
//     marginLeft: 6,
//   },
//   stepsContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//   },
//   stepsTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#111827',
//     textAlign: 'center',
//     marginBottom: 6,
//   },
//   stepsSubtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 24,
//     fontWeight: '500',
//   },
//   stepsList: {
//     alignItems: 'center',
//   },
//   stepContainer: {
//     alignItems: 'center',
//     width: '100%',
//   },
//   stepCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 6,
//     width: '100%',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   stepIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   stepContent: {
//     flex: 1,
//   },
//   stepHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 3,
//   },
//   stepTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//     flex: 1,
//   },
//   freeTag: {
//     backgroundColor: '#00C851',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 8,
//     marginLeft: 6,
//   },
//   freeTagText: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   stepDesc: {
//     fontSize: 13,
//     color: '#6B7280',
//     lineHeight: 18,
//   },
//   stepNumber: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: '#667eea',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginLeft: 8,
//   },
//   stepNumberText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   verticalLine: {
//     width: 2,
//     height: 16,
//     backgroundColor: '#E5E7EB',
//     marginVertical: 2,
//   },
//   ctaSection: {
//     paddingHorizontal: 20,
//     paddingBottom: 24,
//   },
//   ctaCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   ctaTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#111827',
//     textAlign: 'center',
//     marginTop: 12,
//     marginBottom: 6,
//   },
//   ctaSubtitle: {
//     fontSize: 13,
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   ctaButtons: {
//     flexDirection: 'row',
//     gap: 10,
//     width: '100%',
//   },
//   primaryCtaBtn: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#667eea',
//     paddingVertical: 12,
//     borderRadius: 10,
//     gap: 6,
//   },
//   primaryCtaText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   secondaryCtaBtn: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#F3F4F6',
//     paddingVertical: 12,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#667eea',
//     gap: 6,
//   },
//   secondaryCtaText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#667eea',
//   },
// });

// export default AddListingGuideScreen;



import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { 
  ArrowLeft, 
  User, 
  ShieldCheck, 
  ToggleRight, 
  Buildings, 
  House, 
  Sparkle,
  Check
} from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

export const AddListingGuideScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();

  const steps = [
    { 
      icon: User,
      title: t('listingGuide.profile', 'أكمل ملفك الشخصي'), 
      desc: t('listingGuide.profileDesc', 'أضف معلوماتك وصورة واضحة لبناء الثقة.')
    },
    { 
      icon: ShieldCheck,
      title: t('listingGuide.verify', 'تحقق من هويتك'), 
      desc: t('listingGuide.verifyDesc', 'ارفع هوية سارية وصورة ذاتية لإتمام التحقق.')
    },
    { 
      icon: ToggleRight,
      title: t('listingGuide.switchHost', 'فعّل وضع المضيف'), 
      desc: t('listingGuide.switchHostDesc', 'انتقل إلى وضع المضيف لإدارة إعلاناتك.')
    },
    { 
      icon: Buildings,
      title: t('listingGuide.createOrg', 'أنشئ منظمة (اختياري)'), 
      desc: t('listingGuide.createOrgDesc', 'أضف منظمتك لإدارة الفريق والعقارات بشكل احترافي.')
    },
    { 
      icon: House,
      title: t('listingGuide.addProperty', 'أضف عقاراً أو أرضاً'), 
      desc: t('listingGuide.addPropertyDesc', 'املأ التفاصيل والصور والتسعير بخطوات بسيطة.')
    },
    { 
      icon: Sparkle,
      title: t('listingGuide.publish', 'قدّم للمراجعة ثم انشر'), 
      desc: t('listingGuide.publishDesc', 'نراجع إعلانك لضمان الجودة قبل نشره.')
    },
  ];

  return (
    <View style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#000000" weight="regular" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            {t('listingGuide.heroTitle', 'تحكم كامل—أضف إعلانك بنفسك')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {t('listingGuide.heroSubtitle', 'واجهة احترافية، موافقات سريعة، وترويج فعّال')}
          </Text>
        </View>

        {/* Steps Section */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepIconWrapper}>
                  <View style={styles.stepIconCircle}>
                    <IconComponent size={24} color="#000000" weight="regular" />
                  </View>
                  {index < steps.length - 1 && (
                    <View style={styles.stepConnector} />
                  )}
                </View>
                
                <View style={styles.stepContent}>
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <View style={styles.featureCard}>
            <Check size={20} color="#000000" weight="bold" />
            <Text style={styles.featureText}>
              {t('listingGuide.feature1', 'مجاناً تماماً - لا رسوم خفية')}
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Check size={20} color="#000000" weight="bold" />
            <Text style={styles.featureText}>
              {t('listingGuide.feature2', 'موافقة سريعة خلال 24 ساعة')}
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Check size={20} color="#000000" weight="bold" />
            <Text style={styles.featureText}>
              {t('listingGuide.feature3', 'واجهة احترافية سهلة الاستخدام')}
            </Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => (navigation as any).navigate('AccountRoot', { screen: 'Account' })}
          >
            <Text style={styles.primaryBtnText}>
              {t('listingGuide.getStarted', 'ابدأ الآن')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => (navigation as any).navigate('AddProperty')}
          >
            <Text style={styles.secondaryBtnText}>
              {t('listingGuide.addProperty', 'إضافة عقار')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#717171',
    lineHeight: 26,
    fontWeight: '400',
  },
  stepsContainer: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepIconWrapper: {
    alignItems: 'center',
    marginRight: 20,
  },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    width: 1,
    flex: 1,
    backgroundColor: '#EBEBEB',
    marginTop: 8,
    marginBottom: 8,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTextContainer: {
    paddingBottom: 32,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  stepDesc: {
    fontSize: 16,
    color: '#717171',
    lineHeight: 24,
    fontWeight: '400',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  featureText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 16,
    fontWeight: '400',
  },
  ctaSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.2,
  },
});

export default AddListingGuideScreen;
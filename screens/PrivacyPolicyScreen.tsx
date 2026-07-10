/**
 * Privacy Policy Screen - Professional Airbnb/Zillow Style
 * Clean, readable, legally compliant privacy policy
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const toggleSection = (id: number) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [
    {
      id: 1,
      title: t('privacyPolicy.sections.dataCollection.title'),
      icon: 'storage',
      content: [
        { subtitle: t('privacyPolicy.sections.dataCollection.personal.title'), items: [
          t('privacyPolicy.sections.dataCollection.personal.name'),
          t('privacyPolicy.sections.dataCollection.personal.email'),
          t('privacyPolicy.sections.dataCollection.personal.phone'),
          t('privacyPolicy.sections.dataCollection.personal.photo'),
          t('privacyPolicy.sections.dataCollection.personal.id'),
        ]},
        { subtitle: t('privacyPolicy.sections.dataCollection.usage.title'), items: [
          t('privacyPolicy.sections.dataCollection.usage.device'),
          t('privacyPolicy.sections.dataCollection.usage.ip'),
          t('privacyPolicy.sections.dataCollection.usage.browser'),
          t('privacyPolicy.sections.dataCollection.usage.activity'),
        ]},
        { subtitle: t('privacyPolicy.sections.dataCollection.location.title'), items: [
          t('privacyPolicy.sections.dataCollection.location.gps'),
          t('privacyPolicy.sections.dataCollection.location.purpose'),
        ]},
      ],
    },
    {
      id: 2,
      title: t('privacyPolicy.sections.dataUse.title'),
      icon: 'settings',
      content: [
        { items: [
          t('privacyPolicy.sections.dataUse.provide'),
          t('privacyPolicy.sections.dataUse.improve'),
          t('privacyPolicy.sections.dataUse.communicate'),
          t('privacyPolicy.sections.dataUse.security'),
          t('privacyPolicy.sections.dataUse.legal'),
          t('privacyPolicy.sections.dataUse.marketing'),
        ]},
      ],
    },
    {
      id: 3,
      title: t('privacyPolicy.sections.dataSharing.title'),
      icon: 'share',
      content: [
        { items: [
          t('privacyPolicy.sections.dataSharing.hosts'),
          t('privacyPolicy.sections.dataSharing.providers'),
          t('privacyPolicy.sections.dataSharing.legal'),
          t('privacyPolicy.sections.dataSharing.business'),
          t('privacyPolicy.sections.dataSharing.consent'),
        ]},
      ],
      note: t('privacyPolicy.sections.dataSharing.note'),
    },
    {
      id: 4,
      title: t('privacyPolicy.sections.dataSecurity.title'),
      icon: 'security',
      content: [
        { items: [
          t('privacyPolicy.sections.dataSecurity.encryption'),
          t('privacyPolicy.sections.dataSecurity.access'),
          t('privacyPolicy.sections.dataSecurity.monitoring'),
          t('privacyPolicy.sections.dataSecurity.incident'),
        ]},
      ],
    },
    {
      id: 5,
      title: t('privacyPolicy.sections.yourRights.title'),
      icon: 'verified-user',
      content: [
        { items: [
          t('privacyPolicy.sections.yourRights.access'),
          t('privacyPolicy.sections.yourRights.correction'),
          t('privacyPolicy.sections.yourRights.deletion'),
          t('privacyPolicy.sections.yourRights.portability'),
          t('privacyPolicy.sections.yourRights.optout'),
          t('privacyPolicy.sections.yourRights.withdraw'),
        ]},
      ],
    },
    {
      id: 6,
      title: t('privacyPolicy.sections.cookies.title'),
      icon: 'cookie',
      content: [
        { items: [
          t('privacyPolicy.sections.cookies.essential'),
          t('privacyPolicy.sections.cookies.analytics'),
          t('privacyPolicy.sections.cookies.preferences'),
          t('privacyPolicy.sections.cookies.manage'),
        ]},
      ],
    },
    {
      id: 7,
      title: t('privacyPolicy.sections.retention.title'),
      icon: 'schedule',
      content: [
        { items: [
          t('privacyPolicy.sections.retention.duration'),
          t('privacyPolicy.sections.retention.deletion'),
          t('privacyPolicy.sections.retention.legal'),
        ]},
      ],
    },
    {
      id: 8,
      title: t('privacyPolicy.sections.children.title'),
      icon: 'child-care',
      content: [
        { items: [
          t('privacyPolicy.sections.children.age'),
          t('privacyPolicy.sections.children.action'),
        ]},
      ],
    },
    {
      id: 9,
      title: t('privacyPolicy.sections.international.title'),
      icon: 'public',
      content: [
        { items: [
          t('privacyPolicy.sections.international.transfer'),
          t('privacyPolicy.sections.international.safeguards'),
        ]},
      ],
    },
    {
      id: 10,
      title: t('privacyPolicy.sections.changes.title'),
      icon: 'update',
      content: [
        { items: [
          t('privacyPolicy.sections.changes.notify'),
          t('privacyPolicy.sections.changes.review'),
        ]},
      ],
    },
  ];

  const Section = ({ section }: { section: typeof sections[0] }) => {
    const isExpanded = expandedSections[section.id];

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.iconContainer}>
              <MaterialIcons name={section.icon as any} size={20} color="#222" />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <MaterialIcons
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#717171"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {section.content.map((block, idx) => (
              <View key={idx} style={styles.contentBlock}>
                {'subtitle' in block && block.subtitle && (
                  <Text style={styles.subtitle}>{block.subtitle}</Text>
                )}
                {block.items.map((item, i) => (
                  <View key={i} style={styles.bulletItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
            {section.note && (
              <View style={styles.noteBox}>
                <MaterialIcons name="info-outline" size={16} color="#1a73e8" />
                <Text style={styles.noteText}>{section.note}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('privacyPolicy.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="privacy-tip" size={32} color="#222" />
          </View>
          <Text style={styles.heroTitle}>{t('privacyPolicy.title')}</Text>
          <Text style={styles.heroDate}>{t('privacyPolicy.effectiveDate')}</Text>
        </View>

        {/* Introduction */}
        <View style={styles.intro}>
          <Text style={styles.introText}>{t('privacyPolicy.intro1')}</Text>
          <Text style={styles.introText}>{t('privacyPolicy.intro2')}</Text>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map(section => (
            <Section key={section.id} section={section} />
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.contact}>
          <Text style={styles.contactTitle}>{t('privacyPolicy.contact.title')}</Text>
          <Text style={styles.contactText}>{t('privacyPolicy.contact.description')}</Text>
          
          <View style={styles.contactItem}>
            <MaterialIcons name="email" size={20} color="#717171" />
            <Text style={styles.contactValue}>privacy@habitat.mr</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialIcons name="phone" size={20} color="#717171" />
            <Text style={styles.contactValue}>+222 45 25 00 00</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialIcons name="location-on" size={20} color="#717171" />
            <Text style={styles.contactValue}>Nouakchott, Mauritania</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('privacyPolicy.footer')}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  heroDate: {
    fontSize: 14,
    color: '#717171',
  },
  intro: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  introText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#484848',
    marginBottom: 12,
  },
  sectionsContainer: {
    paddingTop: 8,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  contentBlock: {
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#717171',
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#484848',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F0FE',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#1a73e8',
    marginLeft: 10,
  },
  contact: {
    padding: 24,
    backgroundColor: '#F7F7F7',
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#484848',
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactValue: {
    fontSize: 14,
    color: '#222',
    marginLeft: 12,
  },
  footer: {
    padding: 24,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#717171',
    textAlign: 'center',
  },
});

export default PrivacyPolicyScreen;

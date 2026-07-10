/**
 * Terms of Service Screen - Professional Airbnb/Zillow Style
 * Clean, readable, legally compliant terms
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

const TermsOfServiceScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const toggleSection = (id: number) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [
    {
      id: 1,
      title: t('termsOfService.sections.acceptance.title'),
      icon: 'check-circle',
      important: true,
      content: [
        { items: [
          t('termsOfService.sections.acceptance.agreement'),
          t('termsOfService.sections.acceptance.binding'),
          t('termsOfService.sections.acceptance.update'),
        ]},
      ],
    },
    {
      id: 2,
      title: t('termsOfService.sections.eligibility.title'),
      icon: 'person-outline',
      content: [
        { items: [
          t('termsOfService.sections.eligibility.age'),
          t('termsOfService.sections.eligibility.capacity'),
          t('termsOfService.sections.eligibility.jurisdiction'),
        ]},
      ],
    },
    {
      id: 3,
      title: t('termsOfService.sections.accounts.title'),
      icon: 'account-circle',
      important: true,
      content: [
        { subtitle: t('termsOfService.sections.accounts.registration.title'), items: [
          t('termsOfService.sections.accounts.registration.accurate'),
          t('termsOfService.sections.accounts.registration.secure'),
          t('termsOfService.sections.accounts.registration.responsible'),
        ]},
        { subtitle: t('termsOfService.sections.accounts.termination.title'), items: [
          t('termsOfService.sections.accounts.termination.right'),
          t('termsOfService.sections.accounts.termination.violation'),
          t('termsOfService.sections.accounts.termination.effect'),
        ]},
      ],
    },
    {
      id: 4,
      title: t('termsOfService.sections.services.title'),
      icon: 'home-work',
      content: [
        { items: [
          t('termsOfService.sections.services.platform'),
          t('termsOfService.sections.services.listings'),
          t('termsOfService.sections.services.bookings'),
          t('termsOfService.sections.services.payments'),
          t('termsOfService.sections.services.messaging'),
        ]},
      ],
      note: t('termsOfService.sections.services.note'),
    },
    {
      id: 5,
      title: t('termsOfService.sections.userContent.title'),
      icon: 'photo-library',
      important: true,
      content: [
        { subtitle: t('termsOfService.sections.userContent.ownership.title'), items: [
          t('termsOfService.sections.userContent.ownership.yours'),
          t('termsOfService.sections.userContent.ownership.license'),
        ]},
        { subtitle: t('termsOfService.sections.userContent.guidelines.title'), items: [
          t('termsOfService.sections.userContent.guidelines.accurate'),
          t('termsOfService.sections.userContent.guidelines.legal'),
          t('termsOfService.sections.userContent.guidelines.respectful'),
          t('termsOfService.sections.userContent.guidelines.original'),
        ]},
      ],
    },
    {
      id: 6,
      title: t('termsOfService.sections.prohibited.title'),
      icon: 'block',
      important: true,
      content: [
        { items: [
          t('termsOfService.sections.prohibited.fraud'),
          t('termsOfService.sections.prohibited.illegal'),
          t('termsOfService.sections.prohibited.harassment'),
          t('termsOfService.sections.prohibited.spam'),
          t('termsOfService.sections.prohibited.interference'),
          t('termsOfService.sections.prohibited.scraping'),
          t('termsOfService.sections.prohibited.impersonation'),
        ]},
      ],
      warning: t('termsOfService.sections.prohibited.warning'),
    },
    {
      id: 7,
      title: t('termsOfService.sections.payments.title'),
      icon: 'payment',
      important: true,
      content: [
        { subtitle: t('termsOfService.sections.payments.fees.title'), items: [
          t('termsOfService.sections.payments.fees.service'),
          t('termsOfService.sections.payments.fees.host'),
          t('termsOfService.sections.payments.fees.guest'),
        ]},
        { subtitle: t('termsOfService.sections.payments.refunds.title'), items: [
          t('termsOfService.sections.payments.refunds.policy'),
          t('termsOfService.sections.payments.refunds.cancellation'),
          t('termsOfService.sections.payments.refunds.disputes'),
        ]},
      ],
    },
    {
      id: 8,
      title: t('termsOfService.sections.intellectual.title'),
      icon: 'copyright',
      content: [
        { items: [
          t('termsOfService.sections.intellectual.ownership'),
          t('termsOfService.sections.intellectual.license'),
          t('termsOfService.sections.intellectual.restrictions'),
          t('termsOfService.sections.intellectual.trademarks'),
        ]},
      ],
    },
    {
      id: 9,
      title: t('termsOfService.sections.liability.title'),
      icon: 'gavel',
      important: true,
      content: [
        { items: [
          t('termsOfService.sections.liability.disclaimer'),
          t('termsOfService.sections.liability.limitation'),
          t('termsOfService.sections.liability.indemnification'),
        ]},
      ],
      highlight: t('termsOfService.sections.liability.highlight'),
    },
    {
      id: 10,
      title: t('termsOfService.sections.disputes.title'),
      icon: 'balance',
      content: [
        { items: [
          t('termsOfService.sections.disputes.resolution'),
          t('termsOfService.sections.disputes.arbitration'),
          t('termsOfService.sections.disputes.jurisdiction'),
        ]},
      ],
    },
    {
      id: 11,
      title: t('termsOfService.sections.modifications.title'),
      icon: 'edit',
      content: [
        { items: [
          t('termsOfService.sections.modifications.right'),
          t('termsOfService.sections.modifications.notice'),
          t('termsOfService.sections.modifications.continued'),
        ]},
      ],
    },
    {
      id: 12,
      title: t('termsOfService.sections.governing.title'),
      icon: 'public',
      content: [
        { items: [
          t('termsOfService.sections.governing.law'),
          t('termsOfService.sections.governing.compliance'),
        ]},
      ],
    },
  ];

  const Section = ({ section }: { section: typeof sections[0] }) => {
    const isExpanded = expandedSections[section.id];

    return (
      <View style={[styles.section, section.important && styles.importantSection]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.iconContainer, section.important && styles.importantIcon]}>
              <MaterialIcons name={section.icon as any} size={20} color={section.important ? '#FF385C' : '#222'} />
            </View>
            <Text style={[styles.sectionTitle, section.important && styles.importantTitle]}>
              {section.title}
            </Text>
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
                    <View style={[styles.bullet, section.important && styles.importantBullet]} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
            {section.warning && (
              <View style={styles.warningBox}>
                <MaterialIcons name="warning" size={18} color="#D93025" />
                <Text style={styles.warningText}>{section.warning}</Text>
              </View>
            )}
            {section.highlight && (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightText}>{section.highlight}</Text>
              </View>
            )}
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
        <Text style={styles.headerTitle}>{t('termsOfService.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="description" size={32} color="#222" />
          </View>
          <Text style={styles.heroTitle}>{t('termsOfService.title')}</Text>
          <Text style={styles.heroDate}>{t('termsOfService.effectiveDate')}</Text>
        </View>

        {/* Agreement Notice */}
        <View style={styles.agreement}>
          <View style={styles.agreementIcon}>
            <MaterialIcons name="info" size={20} color="#1a73e8" />
          </View>
          <Text style={styles.agreementText}>{t('termsOfService.agreementNotice')}</Text>
        </View>

        {/* Introduction */}
        <View style={styles.intro}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('termsOfService.platform')}:</Text>
            <Text style={styles.infoValue}>Habitat</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('termsOfService.operator')}:</Text>
            <Text style={styles.infoValue}>Habitat Technologies SARL</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('termsOfService.jurisdiction')}:</Text>
            <Text style={styles.infoValue}>Mauritania</Text>
          </View>
          <Text style={styles.introText}>{t('termsOfService.intro')}</Text>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map(section => (
            <Section key={section.id} section={section} />
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.contact}>
          <Text style={styles.contactTitle}>{t('termsOfService.contact.title')}</Text>
          <Text style={styles.contactText}>{t('termsOfService.contact.description')}</Text>
          
          <View style={styles.contactItem}>
            <MaterialIcons name="email" size={20} color="#717171" />
            <Text style={styles.contactValue}>legal@habitat.mr</Text>
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

        {/* Footer Agreement */}
        <View style={styles.footer}>
          <View style={styles.footerBox}>
            <MaterialIcons name="check-circle" size={24} color="#34A853" />
            <Text style={styles.footerText}>{t('termsOfService.footer')}</Text>
          </View>
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
  agreement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F0FE',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  agreementIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1a73e8',
    fontWeight: '500',
  },
  intro: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#484848',
  },
  introText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#484848',
    marginTop: 16,
  },
  sectionsContainer: {
    paddingTop: 8,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  importantSection: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF385C',
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
  importantIcon: {
    backgroundColor: '#FFF0F2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    flex: 1,
  },
  importantTitle: {
    color: '#222',
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
  importantBullet: {
    backgroundColor: '#FF385C',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#484848',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#D93025',
    fontWeight: '500',
    marginLeft: 10,
  },
  highlightBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  highlightText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#92400E',
    fontWeight: '500',
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
  footerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#166534',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
});

export default TermsOfServiceScreen;

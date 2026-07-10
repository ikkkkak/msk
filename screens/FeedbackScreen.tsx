import React, { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { Screen } from "../components/Screen";
import { useTranslation } from "react-i18next";
import { useUser } from "../hooks/useUser";
import { endpoints } from "../constants";
import { MaterialIcons } from "@expo/vector-icons";

export const FeedbackScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  const submit = async () => {
    if (!message.trim()) {
      Alert.alert(t('account.feedback.errorTitle', 'خطأ'), t('account.feedback.errorMessage', 'حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.'));
      return;
    }
    if (!user) {
      Alert.alert(t('account.authButtons.signIn', 'تسجيل الدخول'), t('account.saved.signInPrompt', 'سجّل الدخول لإرسال الملاحظات'));
      return;
    }
    try {
      setSubmitting(true);
      const ratingNum = rating ? parseInt(rating, 10) : undefined;
      const rawToken =
        (user as any)?.accessToken?.accessToken ||
        (user as any)?.accessToken ||
        (user as any)?.access_token ||
        (user as any)?.token?.accessToken ||
        (user as any)?.token;
      const authHeader = rawToken ? (String(rawToken).startsWith('Bearer ') ? String(rawToken) : `Bearer ${rawToken}`) : undefined;
      console.log('Feedback submit payload', { title: title.trim() || undefined, message: message.trim(), rating: ratingNum, hasToken: !!rawToken });
      const res = await fetch(`${endpoints.baseURL}/user/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ title: title.trim() || undefined, message: message.trim(), rating: ratingNum }),
      });
      console.log('Feedback submit response status', res.status);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log('Feedback submit error body', body);
        throw new Error(body?.message || `Erreur (${res.status})`);
      }
      const body = await res.json().catch(() => ({}));
      console.log('Feedback submit success body', body);
      setTitle(""); setMessage(""); setRating("");
      Alert.alert(t('account.feedback.successTitle', 'تم الإرسال'), t('account.feedback.successMessage', 'شكراً لملاحظاتك!'), [{ text: t('common.ok', 'موافق'), onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      console.log('Feedback submit exception', e);
      Alert.alert(t('account.feedback.errorTitle', 'تعذر الإرسال'), e?.message || t('account.feedback.errorMessage', 'حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.'));
    } finally { setSubmitting(false); }
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}> 
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('account.feedback.title', 'إرسال ملاحظات')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t('account.feedback.howCanWeImprove', 'كيف يمكننا تحسين تجربتك؟')}</Text>
            <Text style={styles.infoText}>
              {t('account.feedback.info', 'نستخدم ملاحظاتك لتحسين التجربة، إصلاح الأخطاء، وأولوية الميزات. لن تتم مشاركة ملاحظاتك علنياً.')}
            </Text>
          </View>

          <Text style={styles.label}>{t('account.feedback.titleLabel', 'العنوان (اختياري)')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('account.feedback.titlePlaceholder', 'ملخص سريع')}
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>{t('account.feedback.howCanWeImprove', 'كيف يمكننا تحسين تجربتك؟')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t('account.feedback.messagePlaceholder', 'اكتب ملاحظاتك أو اقتراحاتك هنا...')}
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
          />

          <Text style={styles.label}>{t('account.feedback.ratingLabel', 'التقييم (1-5، اختياري)')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('account.feedback.ratingPlaceholder', 'مثال: 5')}
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={rating}
            onChangeText={setRating}
          />

          <TouchableOpacity onPress={submit} disabled={submitting || !message.trim()} style={[styles.submitBtn, (submitting || !message.trim()) && { opacity: 0.6 }]}>
            <Text style={styles.submitText}>{submitting ? t('common.loading', 'جاري التحميل...') : t('account.feedback.submit', 'إرسال')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 6, borderRadius: 18, backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 30 },
  infoBox: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 16 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#374151', lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827' },
  textarea: { height: 140, textAlignVertical: 'top' },
  submitBtn: { marginTop: 16, backgroundColor: '#222222', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
});

export default FeedbackScreen;



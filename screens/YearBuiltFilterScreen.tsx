import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const MIN = 1950;

const YearBuiltFilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { initialYearBuilt, onApply } = route.params || {} as any;
  const current = new Date().getFullYear();
  
  const init = initialYearBuilt && initialYearBuilt !== "" && initialYearBuilt !== "any"
      ? parseInt(initialYearBuilt, 10)
      : current;
      
  const [year, setYear] = useState(init);
  const [any, setAny] = useState(!initialYearBuilt || initialYearBuilt === "" || initialYearBuilt === "any");

  useEffect(() => {
    if (initialYearBuilt !== undefined) {
      if (initialYearBuilt === "" || initialYearBuilt === "any") {
        setAny(true);
        setYear(current);
      } else {
        const y = parseInt(initialYearBuilt, 10);
        if (!isNaN(y) && y >= MIN && y <= current) {
          setYear(y);
          setAny(false);
        }
      }
    }
  }, [initialYearBuilt, current]);

  const handleApply = () => {
    onApply && onApply(any ? "any" : String(year));
    navigation.goBack();
  };

  const handleReset = () => {
    setAny(true);
    setYear(current);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("filters.yearBuilt", "Year Built")}</Text>
        <TouchableOpacity onPress={handleReset} style={styles.headerBtn}>
          <Text style={styles.clearText}>{t("filters.reset", "Reset")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Construction Year</Text>
          <Text style={styles.sectionSubtitle}>Shows properties built in this year or later</Text>
          
          <TouchableOpacity 
            style={[styles.chip, any && styles.chipActive]} 
            onPress={() => setAny(true)}
          >
            <Text style={[styles.chipText, any && styles.chipTextActive]}>Any Year</Text>
          </TouchableOpacity>

          {!any && (
            <View style={styles.yearPicker}>
              <TouchableOpacity 
                onPress={() => setYear(y => Math.max(MIN, y - 1))} 
                style={styles.counterBtn}
                disabled={year <= MIN}
              >
                <MaterialIcons name="remove" size={24} color={year <= MIN ? "#CCC" : "#111827"} />
              </TouchableOpacity>
              
              <View style={styles.yearDisplay}>
                <Text style={styles.yearValue}>{year}</Text>
                <Text style={styles.yearLabel}>Year</Text>
              </View>

              <TouchableOpacity 
                onPress={() => setYear(y => Math.min(current, y + 1))} 
                style={styles.counterBtn}
                disabled={year >= current}
              >
                <MaterialIcons name="add" size={24} color={year >= current ? "#CCC" : "#111827"} />
              </TouchableOpacity>
            </View>
          )}

          {any && (
            <TouchableOpacity 
              style={[styles.chip, !any && styles.chipActive, { marginTop: 12 }]} 
              onPress={() => setAny(false)}
            >
              <Text style={[styles.chipText, !any && styles.chipTextActive]}>Pick a specific year</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>{t("filters.apply", "Apply")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  clearText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', alignItems: 'center' },
  chipActive: { backgroundColor: '#F0F7FF', borderColor: '#006AFF', borderWidth: 2 },
  chipText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#006AFF', fontWeight: '700' },
  yearPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30, marginTop: 24 },
  yearDisplay: { alignItems: 'center', minWidth: 100 },
  yearValue: { fontSize: 32, fontWeight: '800', color: '#111827' },
  yearLabel: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  counterBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  applyBtn: { backgroundColor: theme["color-temporary-primary"], borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default YearBuiltFilterScreen;

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { HabitatPlan, HabitatSector } from "../../types/habitat";

type Props = {
  plans: HabitatPlan[];
  sectors: HabitatSector[];
  selectedPlanId: number | null;
  selectedSectorId: number | null;
  plansLoading?: boolean;
  sectorsLoading?: boolean;
  onPlanSelect: (planId: number | null) => void;
  onSectorSelect: (sectorId: number | null) => void;
  onSearch: (query: string) => void;
};

export function HabitatFilterBar({
  plans,
  sectors,
  selectedPlanId,
  selectedSectorId,
  plansLoading,
  sectorsLoading,
  onPlanSelect,
  onSectorSelect,
  onSearch,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        <TouchableOpacity
          style={[styles.pill, selectedPlanId == null && styles.pillActive]}
          onPress={() => {
            onPlanSelect(null);
            onSectorSelect(null);
          }}
        >
          <Text
            style={[
              styles.pillText,
              selectedPlanId == null && styles.pillTextActive,
            ]}
          >
            الكل
          </Text>
        </TouchableOpacity>
        {plansLoading ? (
          <ActivityIndicator size="small" color="#2a5298" style={{ marginLeft: 8 }} />
        ) : (
          plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.pill,
                selectedPlanId === plan.id && styles.pillActive,
              ]}
              onPress={() => onPlanSelect(plan.id)}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedPlanId === plan.id && styles.pillTextActive,
                ]}
                numberOfLines={1}
              >
                {plan.name_ar || plan.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedPlanId != null && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          style={styles.sectorRow}
        >
          <TouchableOpacity
            style={[styles.pillSmall, selectedSectorId == null && styles.pillActive]}
            onPress={() => onSectorSelect(null)}
          >
            <Text
              style={[
                styles.pillTextSmall,
                selectedSectorId == null && styles.pillTextActive,
              ]}
            >
              كل القطاعات
            </Text>
          </TouchableOpacity>
          {sectorsLoading ? (
            <ActivityIndicator size="small" color="#2a5298" />
          ) : (
            sectors.map((sector) => (
              <TouchableOpacity
                key={sector.id}
                style={[
                  styles.pillSmall,
                  selectedSectorId === sector.id && styles.pillActive,
                ]}
                onPress={() => onSectorSelect(sector.id)}
              >
                <Text
                  style={[
                    styles.pillTextSmall,
                    selectedSectorId === sector.id && styles.pillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {sector.name_ar || sector.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          placeholder="ابحث برقم القطعة..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => onSearch(searchQuery)}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8e8e8",
    zIndex: 10,
  },
  pillsRow: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  sectorRow: {
    marginTop: 8,
    maxHeight: 40,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f2f5",
    marginRight: 8,
  },
  pillSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f2f5",
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: "#2a5298",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  pillTextSmall: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3e50",
  },
  pillTextActive: {
    color: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#2c3e50",
    padding: 0,
  },
});

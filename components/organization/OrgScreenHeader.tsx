import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { ArrowLeft, PencilSimple } from "phosphor-react-native";
import { orgTheme as o } from "./orgTheme";

type Props = {
  title: string;
  onBack: () => void;
  onEdit?: () => void;
  editLabel?: string;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  syncing?: boolean;
};

export function OrgScreenHeader({
  title,
  onBack,
  onEdit,
  editLabel,
  onSave,
  saveLabel,
  saveDisabled,
  saveLoading,
  syncing,
}: Props) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.iconBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={22} color={o.ink} />
      </TouchableOpacity>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {syncing ? (
          <ActivityIndicator
            size="small"
            color={o.muted}
            style={styles.spinner}
          />
        ) : null}
      </View>
      {onSave ? (
        <TouchableOpacity
          onPress={onSave}
          disabled={saveDisabled || saveLoading}
          style={styles.saveBtn}
          hitSlop={8}
          accessibilityRole="button"
        >
          {saveLoading ? (
            <ActivityIndicator size="small" color={o.accent} />
          ) : (
            <Text
              style={[
                styles.saveText,
                saveDisabled && styles.saveTextDisabled,
              ]}
            >
              {saveLabel ?? "Save"}
            </Text>
          )}
        </TouchableOpacity>
      ) : onEdit ? (
        <TouchableOpacity
          onPress={onEdit}
          style={styles.editBtn}
          hitSlop={8}
          accessibilityRole="button"
        >
          <PencilSimple size={16} color={o.ink} />
          {editLabel ? (
            <Text style={styles.editText}>{editLabel}</Text>
          ) : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: o.line,
    backgroundColor: o.bg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: o.ink,
    letterSpacing: -0.2,
    textAlign: "center",
    maxWidth: "85%",
  },
  spinner: {
    marginLeft: 2,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: o.r8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: o.line,
    minWidth: 40,
    justifyContent: "center",
  },
  editText: {
    fontSize: 13,
    fontWeight: "600",
    color: o.ink,
  },
  saveBtn: {
    minWidth: 56,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: o.accent,
  },
  saveTextDisabled: {
    color: o.muted,
    opacity: 0.5,
  },
});

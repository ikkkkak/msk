import React, { useEffect, useState } from "react";
import { Text, StyleSheet, I18nManager, View } from "react-native";
import { useTranslation } from "react-i18next";

type Props = {
  text: string;
  /** Max characters to reveal (rest appears after animation). */
  maxReveal?: number;
  style?: object;
};

function splitRevealUnits(text: string, isRTL: boolean): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (isRTL) {
    return trimmed.split(/\s+/).filter(Boolean);
  }
  return Array.from(trimmed);
}

function joinUnits(units: string[], count: number, isRTL: boolean): string {
  if (count <= 0) return "";
  const slice = units.slice(0, count);
  return isRTL ? slice.join(" ") : slice.join("");
}

/**
 * Reveals guide text progressively — word-by-word in Arabic, letter-by-letter in LTR.
 */
export function HandwrittenLetterReveal({
  text,
  maxReveal = 110,
  style,
}: Props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar") || I18nManager.isRTL;
  const full = (text || "").trim();
  const units = splitRevealUnits(full, isRTL);
  const charCap = Math.min(full.length, maxReveal);
  const targetLen = isRTL
    ? units.length
    : Math.min(units.length, charCap);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    if (!full) return;
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= targetLen) {
          clearInterval(id);
          return targetLen;
        }
        return n + 1;
      });
    }, isRTL ? 220 : 28);
    return () => clearInterval(id);
  }, [full, targetLen, isRTL]);

  const visible = joinUnits(units, shown, isRTL);
  const rest =
    shown >= targetLen
      ? isRTL
        ? units.slice(targetLen).join(" ")
        : full.slice(charCap)
      : "";

  return (
    <View>
      <Text style={[styles.letter, isRTL && styles.letterRtl, style]}>
        {visible}
        {shown < targetLen ? (
          <Text style={styles.cursor}>|</Text>
        ) : null}
        {rest ? <Text style={styles.rest}>{rest}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  letter: {
    fontSize: 16,
    lineHeight: 26,
    color: "#3D3426",
    fontStyle: "italic",
    letterSpacing: 0.3,
  },
  letterRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  cursor: {
    color: "#008489",
    fontWeight: "300",
  },
  rest: {
    fontStyle: "italic",
    color: "#3D3426",
  },
});

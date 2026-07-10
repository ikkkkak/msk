import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { translateText, getAppLanguage } from "../utils/translation";

/**
 * Hook to translate text with automatic caching and state management
 * Automatically uses phone's OS language as target
 * Auto-detects source language from the text
 * Returns the translated text and a flag indicating if translation is in progress
 */
export function useTranslatedText(
  originalText: string | null | undefined,
  targetLang?: string
): { translatedText: string; isTranslating: boolean; isTranslated: boolean } {
  const [translatedText, setTranslatedText] = useState<string>(originalText || "");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isTranslated, setIsTranslated] = useState<boolean>(false);

  // Always get current phone language dynamically
  const phoneLanguage = useMemo(() => targetLang || getAppLanguage(), [targetLang]);

  useEffect(() => {
    if (!originalText || originalText.trim().length === 0) {
      setTranslatedText("");
      setIsTranslated(false);
      setIsTranslating(false);
      return;
    }

    // Always attempt translation - let LibreTranslate decide if translation is needed
    setIsTranslating(true);
    
    // translateText will:
    // 1. Auto-detect source language (source: "auto")
    // 2. Translate to phone's OS language (target: phoneLanguage)
    translateText(originalText, phoneLanguage)
      .then((translated) => {
        const wasTranslated = translated !== originalText && translated.trim() !== originalText.trim();
        setTranslatedText(translated);
        setIsTranslated(wasTranslated);
        setIsTranslating(false);
      })
      .catch((error) => {
        console.error("[useTranslatedText] Translation hook error:", error);
        setTranslatedText(originalText);
        setIsTranslated(false);
        setIsTranslating(false);
      });
  }, [originalText, phoneLanguage]);

  return { translatedText, isTranslating, isTranslated };
}

/**
 * Component to show skeleton loading while text is being translated
 */
export function TranslationSkeleton({ width = "80%", height = 16 }: { width?: string | number; height?: number }) {
  return (
    <View
      style={[
        skeletonStyles.skeleton,
        {
          width: typeof width === 'number' ? width : undefined,
          height,
        },
      ]}
    >
      <View
        style={[
          skeletonStyles.skeletonShimmer,
          typeof width === 'string' ? { width: undefined } : undefined,
        ]}
      />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  skeletonShimmer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
});




import * as Localization from "expo-localization";
import { LIBRETRANSLATE_URL } from "../constants";

/**
 * Translation System for Habitat App
 * 
 * HOW IT WORKS:
 * 1. Detects phone's OS language (Arabic, French, or English)
 * 2. Auto-detects source language of text using LibreTranslate
 * 3. Translates text to phone's OS language
 * 
 * IMPORTANT:
 * - Language is ALWAYS read from phone OS settings (no app settings)
 * - Source language is auto-detected (no need to specify)
 * - Target language is always phone's OS language
 * - Unsupported languages fallback to English
 * 
 * Supported languages: en, fr, ar
 */
const SUPPORTED_LANGUAGES = ["en", "fr", "ar"] as const;

/**
 * Determine if a language is supported
 * Handles locale codes like "ar-SA", "fr-FR", "en-US" by checking prefix
 */
function supportedLanguage(lang: string): "en" | "fr" | "ar" {
  const normalized = lang.toLowerCase().trim();
  
  // Check for exact match first
  if (SUPPORTED_LANGUAGES.includes(normalized as any)) {
    return normalized as "en" | "fr" | "ar";
  }
  
  // Check if it starts with supported language code (handles "ar-SA", "fr-FR", etc.)
  if (normalized.startsWith('ar')) {
    return 'ar';
  }
  if (normalized.startsWith('fr')) {
    return 'fr';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  
  // Default to English
  return "en";
}

/**
 * Get the app language from the device's OS settings
 * This is the ONLY way to change the app language - through OS settings
 * This function is called dynamically to always get the current phone language
 */
export function getAppLanguage(): "en" | "fr" | "ar" {
  try {
    // expo-localization v17+ uses getLocales() instead of locale property
    // Always read from phone settings dynamically
    const locales = Localization.getLocales();
    const systemLocale = locales && locales.length > 0 ? locales[0].languageCode || "en" : "en";
    const systemLanguage = systemLocale.toLowerCase();
    return supportedLanguage(systemLanguage);
  } catch (error) {
    console.warn("Failed to detect system language, defaulting to English:", error);
    return "en";
  }
}

/**
 * Get the current app language (always reads from phone OS settings)
 * Use this instead of a static constant to ensure it's always up-to-date
 */
export function getCurrentAppLanguage(): "en" | "fr" | "ar" {
  return getAppLanguage();
}

/**
 * In-memory cache for translations
 * Key format: `${text}_${targetLang}`
 */
const translationCache = new Map<string, string>();

/**
 * Clear the translation cache (useful for testing or memory management)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cache key for a translation request
 */
function getCacheKey(text: string, targetLang: string): string {
  return `${text.trim()}_${targetLang}`;
}

/**
 * Translate text using LibreTranslate server
 * Automatically detects source language and translates to phone's OS language
 * 
 * @param text - The text to translate (source language auto-detected)
 * @param targetLang - Target language code (en, fr, ar). Defaults to phone's OS language
 * @returns Promise<string> - Translated text or original text on failure
 */
export async function translateText(
  text: string,
  targetLang?: string
): Promise<string> {
  // Validate input
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return text;
  }

  // Always use phone's current OS language as target if not specified
  const phoneLanguage = targetLang || getAppLanguage();
  const normalizedLang = supportedLanguage(phoneLanguage);

  // Check cache first
  const cacheKey = getCacheKey(text, normalizedLang);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // If target language is English and text appears to be in English, skip translation
  if (normalizedLang === "en") {
    // Simple heuristic: if text contains only ASCII characters, likely English
    const isLikelyEnglish = /^[\x00-\x7F]*$/.test(text);
    if (isLikelyEnglish) {
      translationCache.set(cacheKey, text);
      return text;
    }
  }

  try {
    // Make POST request to LibreTranslate
    // source: "auto" - automatically detects the source language of the text
    // target: normalizedLang - always uses phone's OS language
    console.log(`[Translation] Translating "${text.substring(0, 50)}..." to ${normalizedLang}`);
    console.log(`[Translation] Using LibreTranslate URL: ${LIBRETRANSLATE_URL}`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(LIBRETRANSLATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: "auto", // Auto-detect source language
          target: normalizedLang, // Phone's OS language
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`[Translation] API error (${response.status}):`, errorText);
        throw new Error(`Translation API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const translatedText = data.translatedText || data.translated || text;
      
      // Check if translation actually happened
      if (translatedText === text || translatedText.trim() === text.trim()) {
        console.log(`[Translation] No translation needed (already in target language or same text)`);
        // Cache the original text
        translationCache.set(cacheKey, text);
        return text;
      }
      
      console.log(`[Translation] Success: "${text.substring(0, 30)}..." → "${translatedText.substring(0, 30)}..."`);

      // Cache the result
      translationCache.set(cacheKey, translatedText);

      return translatedText;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    // Graceful fallback: return original text on any error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNetworkError = errorMessage.includes("Network request failed") || 
                          errorMessage.includes("Failed to fetch") ||
                          errorMessage.includes("timeout");
    
    if (isNetworkError) {
      console.error(`[Translation] Network error - LibreTranslate server may not be running or accessible at ${LIBRETRANSLATE_URL}`);
      console.error(`[Translation] Make sure LibreTranslate is running on your network at: ${LIBRETRANSLATE_URL}`);
    } else {
      console.error("[Translation] Translation failed:", errorMessage);
    }
    
    console.error("[Translation] Error details:", {
      url: LIBRETRANSLATE_URL,
      text: text.substring(0, 50),
      targetLang: normalizedLang,
      error: errorMessage
    });
    
    // Don't cache failed translations - allow retry on next render
    // translationCache.set(cacheKey, text);
    
    return text;
  }
}

/**
 * Batch translate multiple texts
 * Uses cache and parallel requests for efficiency
 * Always translates to phone's OS language
 */
export async function translateMultiple(
  texts: string[],
  targetLang?: string
): Promise<string[]> {
  // Always use phone's current OS language as target if not specified
  const phoneLanguage = targetLang || getAppLanguage();
  const normalizedLang = supportedLanguage(phoneLanguage);
  
  // Check cache for all texts first
  const results: string[] = [];
  const textsToTranslate: { index: number; text: string }[] = [];

  texts.forEach((text, index) => {
    const cacheKey = getCacheKey(text, normalizedLang);
    if (translationCache.has(cacheKey)) {
      results[index] = translationCache.get(cacheKey)!;
    } else {
      textsToTranslate.push({ index, text });
    }
  });

  // Translate remaining texts in parallel
  if (textsToTranslate.length > 0) {
    const translationPromises = textsToTranslate.map(({ text }) =>
      translateText(text, normalizedLang)
    );

    const translations = await Promise.all(translationPromises);

    textsToTranslate.forEach(({ index }, i) => {
      results[index] = translations[i];
    });
  }

  return results;
}

/**
 * Check if text is likely already in the target language
 * This helps avoid unnecessary translation requests
 */
export function isLikelyInLanguage(text: string, targetLang: string): boolean {
  const normalizedLang = supportedLanguage(targetLang);
  
  if (normalizedLang === "en") {
    // Simple heuristic for English
    return /^[\x00-\x7F]*$/.test(text);
  }
  
  // For other languages, we can't easily detect, so return false
  // to allow translation attempt
  return false;
}


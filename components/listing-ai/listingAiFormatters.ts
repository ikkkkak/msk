import type { InputLang } from "../../utils/detectInputLanguage";

import type { ListingAiKind } from "../../types/listingAi";



/** Strip to digits and re-format with thousands separators (e.g. 1250000 → 1,250,000). */

export function formatThousandsDisplay(raw: string): string {

  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

}



/** Parse display value with commas into a number. */

export function parseFormattedNumber(formatted: string): number {

  const n = parseFloat(formatted.replace(/[^\d.]/g, ""));

  return Number.isFinite(n) ? n : 0;

}



/** Localized structured lines appended to the user story for the listing AI job. */

export function composeAiDetailsContext(

  lang: InputLang,

  kind: ListingAiKind,

  opts: {

    propertyTypeLabel?: string;

    yearBuilt?: string;

    bedrooms?: string;

    bathrooms?: string;

    price?: string;

    area?: string;

    plotNumber?: string;

  },

): string {

  const lines: string[] = [];

  const L = (ar: string, fr: string, en: string) =>

    lang === "ar" ? ar : lang === "en" ? en : fr;



  if (opts.propertyTypeLabel) {

    lines.push(

      `${L("نوع العقار", "Type de bien", "Property type")}: ${opts.propertyTypeLabel}`,

    );

  }

  if (opts.yearBuilt?.trim() && kind === "sale") {

    lines.push(

      `${L("سنة البناء", "Année de construction", "Year built")}: ${opts.yearBuilt.trim()}`,

    );

  }

  if (opts.bedrooms?.trim()) {

    lines.push(`${L("غرف النوم", "Chambres", "Bedrooms")}: ${opts.bedrooms.trim()}`);

  }

  if (opts.bathrooms?.trim()) {

    lines.push(

      `${L("الحمامات", "Salles de bain", "Bathrooms")}: ${opts.bathrooms.trim()}`,

    );

  }

  if (opts.area?.trim()) {

    lines.push(`${L("المساحة", "Surface", "Area")}: ${opts.area.trim()} m²`);

  }

  if (opts.price?.trim()) {

    lines.push(`${L("السعر", "Prix", "Price")}: ${opts.price.trim()} MRU`);

  }

  if (opts.plotNumber?.trim() && kind === "land") {

    lines.push(

      `${L("رقم القطعة", "Numéro de parcelle", "Plot number")}: ${opts.plotNumber.trim()}`,

    );

  }



  return lines.length ? `\n\n${lines.join("\n")}` : "";

}



export function listingAiLanguageLabel(lang: InputLang): string {

  switch (lang) {

    case "ar":

      return "العربية";

    case "en":

      return "English";

    default:

      return "Français";

  }

}



import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  useListingGuidePreviews,
  type ListingGuidePreview,
} from "../../hooks/queries/useMeskenyGuide";
import { pickFeaturedGuideTip } from "../../hooks/queries/guideFeaturedTip";
import { GuideVisibilityTeaser } from "./GuideVisibilityTeaser";

type Props = {
  /** property_sale_id → display title */
  titleBySaleId: Map<number, string>;
  enabled?: boolean;
};

export function GuideFeaturedTipBanner({
  titleBySaleId,
  enabled = true,
}: Props) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const ids = [...titleBySaleId.keys()].filter((id) => id > 0);
  const { data: previews = new Map<number, ListingGuidePreview>() } =
    useListingGuidePreviews(ids, enabled && ids.length > 0);

  const featured = pickFeaturedGuideTip(previews, titleBySaleId);
  if (!featured) return null;

  const open = () => {
    navigation.navigate("ListingGuide", {
      propertySaleId: featured.preview.propertySaleId,
      commentId: featured.preview.id,
    });
  };

  const title =
    featured.propertyTitle.startsWith("#")
      ? t("meskenyGuide.listing", "Listing")
      : featured.propertyTitle;

  return (
    <GuideVisibilityTeaser
      propertyTitle={title}
      preview={featured.preview}
      onPress={open}
    />
  );
}

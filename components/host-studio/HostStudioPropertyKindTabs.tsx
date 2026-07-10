import React from "react";
import { useTranslation } from "react-i18next";
import { HostStudioVideoSegment } from "./HostStudioVideoSegment";

export type HostStudioPropertyKind = "rent" | "sale";

type Props = {
  value: HostStudioPropertyKind;
  onChange: (kind: HostStudioPropertyKind) => void;
  rentCount?: number;
  buyCount?: number;
};

/** Same segmented control as the Videos tab. */
export function HostStudioPropertyKindTabs({
  value,
  onChange,
  rentCount,
  buyCount,
}: Props) {
  const { t } = useTranslation();
  const tabs = [
    {
      key: "rent" as const,
      label: t("hostStudio.subTabRent", "Rent"),
      count: rentCount,
    },
    {
      key: "sale" as const,
      label: t("hostStudio.subTabBuy", "Buy"),
      count: buyCount,
    },
  ];

  return (
    <HostStudioVideoSegment value={value} onChange={onChange} tabs={tabs} />
  );
}

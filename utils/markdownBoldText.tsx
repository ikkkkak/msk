import React, { useMemo } from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

export type BoldMarkdownSegment = { text: string; bold: boolean };

/** Split text on `**bold**` markers (non-greedy). */
export function splitBoldMarkdown(text: string): BoldMarkdownSegment[] {
  if (!text) return [];

  const segments: BoldMarkdownSegment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1] ?? "", bold: true });
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  return segments.length > 0 ? segments : [{ text, bold: false }];
}

type BoldMarkdownTextProps = TextProps & {
  boldStyle?: TextStyle;
};

/** Renders plain text with `**segments**` shown in bold. */
export function BoldMarkdownText({
  children,
  style,
  boldStyle,
  ...rest
}: BoldMarkdownTextProps) {
  const text = String(children ?? "");
  const segments = useMemo(() => splitBoldMarkdown(text), [text]);

  return (
    <Text style={style} {...rest}>
      {segments.map((seg, i) =>
        seg.bold ? (
          <Text key={i} style={[boldStyle, styles.bold]}>
            {seg.text}
          </Text>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ),
      )}
    </Text>
  );
}

const styles = {
  bold: { fontWeight: "700" as const },
};

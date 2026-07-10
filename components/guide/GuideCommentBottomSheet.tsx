import React, { useCallback, useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { GuideCommentCard } from "./GuideCommentCard";
import type { GuideComment } from "../../hooks/queries/useMeskenyGuide";
import {
  useImplementGuideComment,
  useDismissGuideComment,
  useReplyGuideComment,
} from "../../hooks/queries/useMeskenyGuide";

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  comment: GuideComment | null;
  onClose: () => void;
};

export function GuideCommentBottomSheet({
  sheetRef,
  comment,
  onClose,
}: Props) {
  const snapPoints = useMemo(() => ["55%", "88%"], []);
  const busyRef = useRef(false);
  const implement = useImplementGuideComment();
  const dismiss = useDismissGuideComment();
  const reply = useReplyGuideComment();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const run = async (
    action: "implement" | "dismiss" | "reply",
    body?: string,
  ) => {
    if (!comment || busyRef.current) return;
    busyRef.current = true;
    try {
      if (action === "implement") await implement.mutateAsync(comment.id);
      else if (action === "dismiss") await dismiss.mutateAsync(comment.id);
      else if (action === "reply" && body)
        await reply.mutateAsync({ commentId: comment.id, body });
      if (action !== "reply") onClose();
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.bg}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scroll}>
        {comment ? (
          <GuideCommentCard
            comment={comment}
            highlighted
            showListingTitle={!!comment.propertySale?.title}
            onImplement={() => run("implement")}
            onDismiss={() => run("dismiss")}
            onAskQuestion={(body) => run("reply", body)}
            busy={implement.isPending || dismiss.isPending || reply.isPending}
          />
        ) : (
          <View style={{ height: 120 }} />
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: { backgroundColor: "#EBEBEB", width: 36 },
  scroll: { padding: 16, paddingBottom: 40 },
});

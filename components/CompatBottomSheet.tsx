import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect
} from "react";
import {
  View,
  ScrollView,
  Dimensions,
  StyleProp,
  ViewStyle,
  FlatList
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

let GorhomModule: any = null;
let Gorhom: any = null;
try {
  // runtime require so project still builds if gorhom isn't installed locally
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GorhomModule = require("@gorhom/bottom-sheet");
  Gorhom = GorhomModule?.default ?? GorhomModule;
} catch (e) {
  GorhomModule = null;
  Gorhom = null;
}

type BaseProps = {
  index?: number;
  snapPoints?: Array<string | number>;
  children?: React.ReactNode;
  backgroundStyle?: StyleProp<ViewStyle>;
  handleComponent?: React.ReactNode | (() => React.ReactNode);
  enablePanDownToClose?: boolean;
  animateOnMount?: boolean;
  onChange?: (index: number) => void;
  contentContainerStyle?: any;
  [key: string]: any;
};

/**
 * CompatBottomSheet: prefer Gorhom BottomSheet when available.
 * Exposes `snapToIndex`, `close`, and `present` methods. When Gorhom is not
 * available, falls back to a Modalize-like emulation using a ScrollView.
 */
const CompatBottomSheet = forwardRef((props: BaseProps, ref) => {
  if (Gorhom) {
    const BottomSheetComponent = Gorhom;
    const innerRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => innerRef.current?.snapToIndex(index),
      close: () => innerRef.current?.close?.(),
      present: () => innerRef.current?.present?.()
    }));

    // open/close controlled by `index` prop
    useEffect(() => {
      if (typeof props.index === "number") {
        if (props.index >= 0) innerRef.current?.snapToIndex(props.index);
        else innerRef.current?.close?.();
      }
    }, [props.index]);

    return (
      // forward all props to gorhom BottomSheet
      // Pass children directly - Gorhom handles layout internally
      // BottomSheetScrollView and other Gorhom components work best as direct children
      // @ts-ignore - dynamic forwarding
      <BottomSheetComponent ref={innerRef} {...props}>
        {props.children}
      </BottomSheetComponent>
    );
  }

  // Fallback (previous Modalize-based emulation)
  // lazy require modalize to avoid failing when not present
  let Modalize: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Modalize = require("react-native-modalize").default;
  } catch (e) {
    Modalize = null;
  }

  const modalRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(props.index ?? -1);

  const snapHeights = (props.snapPoints || []).map((p) => {
    if (typeof p === "string" && p.endsWith("%")) {
      const pct = Number(p.replace("%", "")) / 100;
      return Math.round(SCREEN_HEIGHT * pct);
    }
    if (typeof p === "number") return p;
    return SCREEN_HEIGHT;
  });

  useImperativeHandle(ref, () => ({
    snapToIndex: (index: number) => {
      setCurrentIndex(index);
      modalRef.current?.open?.();
      props.onChange && props.onChange(index);
    },
    close: () => modalRef.current?.close?.(),
    present: () => modalRef.current?.open?.()
  }));

  useEffect(() => {
    if (typeof props.index === "number" && props.index >= 0) {
      setCurrentIndex(props.index);
      modalRef.current?.open?.();
      if (props.onChange) props.onChange(props.index);
    } else {
      modalRef.current?.close?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.index]);

  const topPadding = (() => {
    if (!snapHeights || snapHeights.length === 0) return 0;
    const idx = Math.max(0, Math.min(currentIndex, snapHeights.length - 1));
    const snap = snapHeights[idx] || 0;
    return Math.max(0, SCREEN_HEIGHT - snap);
  })();

  if (Modalize) {
    return (
      // @ts-ignore - dynamic Modalize type
      <Modalize
        ref={modalRef}
        modalHeight={SCREEN_HEIGHT}
        handleStyle={{ display: "none" }}
      >
        <View style={{ minHeight: SCREEN_HEIGHT, width: "100%" }}>
          <View style={{ height: topPadding }} />
          <ScrollView
            contentContainerStyle={[
              { width: "100%", flexGrow: 1 },
              props.contentContainerStyle
            ]}
            showsVerticalScrollIndicator={false}
          >
            {props.children}
          </ScrollView>
        </View>
      </Modalize>
    );
  }

  // Last resort: render content inline (not modal)
  return (
    <View style={{ minHeight: SCREEN_HEIGHT, width: "100%" }}>
      <View style={{ height: topPadding }} />
      <ScrollView
        contentContainerStyle={[
          { width: "100%", flexGrow: 1 },
          props.contentContainerStyle
        ]}
        showsVerticalScrollIndicator={false}
      >
        {props.children}
      </ScrollView>
    </View>
  );
});

// Export helpers: when gorhom is available, prefer their ScrollView/FlatList types
export const BottomSheetScrollView: any =
  GorhomModule?.BottomSheetScrollView ??
  GorhomModule?.default?.BottomSheetScrollView ??
  ScrollView;
export const BottomSheetFlatList: any =
  GorhomModule?.BottomSheetFlatList ??
  GorhomModule?.default?.BottomSheetFlatList ??
  FlatList;
export type BottomSheetHandleProps = any;
export const useBottomSheetInternal =
  GorhomModule?.useBottomSheetInternal ??
  GorhomModule?.default?.useBottomSheetInternal ??
  (() => ({ animatedIndex: null, animatedPosition: null } as any));

export default CompatBottomSheet;

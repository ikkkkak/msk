// import React, { useMemo } from 'react';
// import { StyleSheet, Platform, Dimensions } from 'react-native';
// import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// interface InteractiveBottomSheetProps {
//   // Refs
//   sheetRef: React.RefObject<any>;
//   scrollViewRef?: React.RefObject<any>;
  
//   // Callbacks
//   onChange?: (index: number) => void;
//   onScroll?: (event: any) => void;
  
//   // Content
//   children: React.ReactNode;
  
//   // Styling
//   backgroundColor?: string;
//   handleColor?: string;
  
//   // Optional override for tab container height (defaults to 50 if not provided)
//   tabContainerHeight?: number;
// }

// export const InteractiveBottomSheet: React.FC<InteractiveBottomSheetProps> = ({
//   sheetRef,
//   scrollViewRef,
//   onChange,
//   onScroll,
//   children,
//   backgroundColor = '#FFFFFF',
//   handleColor = '#D1D5DB',
//   tabContainerHeight = 50,
// }) => {
//   // Internal hooks
//   const insets = useSafeAreaInsets();
  
//   // Calculate header height internally
//   const headerHeight = useMemo(() => {
//     // Tab container: ~15% margin + height + padding
//     // Filter container: ~24px padding + 1px border
//     // Safe area: insets.top
//     const estimatedTabHeight = SCREEN_HEIGHT * 0.15 + tabContainerHeight;
//     const filterContainerHeight = 48; // paddingVertical 12*2 + border 1 + content ~24
//     return estimatedTabHeight + filterContainerHeight + insets.top;
//   }, [insets.top, tabContainerHeight]);
  
//   // Internal values - all defined here
//   const initialIndex = 0;
//   const topInset = insets.top;
  
//   // Calculate snap points - sheet should be draggable to hide map completely
//   const snapPoints = useMemo(() => {
//     // Available height after accounting for header
//     const availableHeight = SCREEN_HEIGHT;
    
//     // Minimum peek - very small, just shows handle (can hide map)
//     const minPeek = 60;
    
//     // Mid point - 50% of available space
//     const midHeight = availableHeight * 0.5;
    
//     // Maximum - reaches just below header
//     const maxHeight = availableHeight;
    
//     return [minPeek, midHeight, maxHeight];
//   }, [headerHeight]);

//   return (
//     <BottomSheet
//       ref={sheetRef}
//       index={initialIndex}
//       snapPoints={snapPoints}
//       enablePanDownToClose={false}
//       onChange={onChange}
//       backgroundStyle={[
//         styles.bottomSheetBackground,
//         { backgroundColor },
//       ]}
//       handleIndicatorStyle={[
//         styles.handleIndicator,
//         { backgroundColor: handleColor },
//       ]}
//       style={styles.bottomSheetOverlay}
//       // topInset positions the sheet content below the header
//       // The handle will be positioned at the top of the sheet (after topInset)
//       topInset={headerHeight}
//       android_keyboardInputMode="adjustResize"
//     >
//       <SafeAreaView style={styles.safeArea} edges={['bottom']}>
//         <BottomSheetScrollView
//           ref={scrollViewRef}
//           style={styles.scrollView}
//           showsVerticalScrollIndicator={false}
//           onScroll={onScroll}
//           scrollEventThrottle={16}
//           contentContainerStyle={styles.scrollContent}
//         >
//           {children}
//         </BottomSheetScrollView>
//       </SafeAreaView>
//     </BottomSheet>
//   );
// };

// const styles = StyleSheet.create({
//   bottomSheetOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 1000,
//     ...Platform.select({
//       android: {
//         elevation: 1000,
//       },
//     }),
//   },
//   bottomSheetBackground: {
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 10,
//   },
//   handleIndicator: {
//     width: 40,
//     height: 4,
//     // Handle will be positioned by BottomSheet at the top of the content area
//     // (after topInset), so it appears on the sheet header
//   },
//   safeArea: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingBottom: 0,
//   },
// });


import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Platform, Dimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface InteractiveBottomSheetProps {
  sheetRef: React.RefObject<any>;
  scrollViewRef?: React.RefObject<any>;
  onChange?: (index: number) => void;
  onScroll?: (event: any) => void;
  children: React.ReactNode;
  backgroundColor?: string;
  handleColor?: string;
  tabContainerHeight?: number;
  headerContent?: React.ReactNode;
  searchHeaderHeight?: number;
}

// Animated Header Component with magnification effect
const AnimatedSheetHeader: React.FC<{
  headerContent?: React.ReactNode;
  searchHeaderHeight: number;
}> = ({ headerContent, searchHeaderHeight }) => {
  const { animatedPosition, animatedIndex } = useBottomSheetInternal();

  const animatedHeaderStyle = useAnimatedStyle(() => {
    // Interpolate based on sheet position
    // When sheet is at index 2 (fully expanded), scale and translate
    const scale = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [0.95, 0.98, 1.05], // Magnify when aligned
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [0, -5, -12], // Move up to align with search header
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      animatedIndex.value,
      [0, 0.5, 2],
      [0.8, 0.9, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: withSpring(scale, { damping: 15, stiffness: 120 }) },
        { translateY: withTiming(translateY, { duration: 300 }) },
      ],
      opacity: withTiming(opacity, { duration: 200 }),
    };
  });

  // Shadow effect that intensifies on alignment
  const animatedShadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      animatedIndex.value,
      [0, 2],
      [0.05, 0.15],
      Extrapolate.CLAMP
    );

    const elevation = interpolate(
      animatedIndex.value,
      [0, 2],
      [2, 8],
      Extrapolate.CLAMP
    );

    return {
      shadowOpacity: withTiming(shadowOpacity, { duration: 300 }),
      elevation: withTiming(elevation, { duration: 300 }),
    };
  });

  if (!headerContent) return null;

  return (
    <Animated.View style={[styles.headerContainer, animatedHeaderStyle, animatedShadowStyle]}>
      {headerContent}
    </Animated.View>
  );
};

// Corner clip masks with animated reveal
const AnimatedCornerMasks: React.FC = () => {
  const { animatedIndex } = useBottomSheetInternal();

  const leftMaskStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 1],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: withTiming(opacity, { duration: 400 }),
    };
  });

  const rightMaskStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 1],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: withTiming(opacity, { duration: 400 }),
    };
  });

  return (
    <View style={styles.clipMask} pointerEvents="none">
      <Animated.View style={[styles.cornerMaskLeft, leftMaskStyle]} />
      <Animated.View style={[styles.cornerMaskRight, rightMaskStyle]} />
    </View>
  );
};

export const InteractiveBottomSheet: React.FC<InteractiveBottomSheetProps> = ({
  sheetRef,
  scrollViewRef,
  onChange,
  onScroll,
  children,
  backgroundColor = '#FFFFFF',
  handleColor = '#D1D5DB',
  tabContainerHeight = 50,
  headerContent,
  searchHeaderHeight,
}) => {
  const insets = useSafeAreaInsets();
  
  const calculatedHeaderHeight = useMemo(() => {
    if (searchHeaderHeight) return searchHeaderHeight;
    
    const estimatedTabHeight = SCREEN_HEIGHT * 0.15 + tabContainerHeight;
    const filterContainerHeight = 48;
    return estimatedTabHeight + filterContainerHeight + insets.top;
  }, [insets.top, tabContainerHeight, searchHeaderHeight]);
  
  const initialIndex = 0;
  
  const snapPoints = useMemo(() => {
    const availableHeight = SCREEN_HEIGHT;
    
    // Peek state - just handle and bit of content visible
    const minPeek = 80;
    
    // Mid expansion - half screen
    const midHeight = availableHeight * 0.5;
    
    // Full expansion - reaches just below search header
    const maxHeight = availableHeight - calculatedHeaderHeight + 20;
    
    return [minPeek, midHeight, maxHeight];
  }, [calculatedHeaderHeight]);

  const handleChange = useCallback((index: number) => {
    onChange?.(index);
  }, [onChange]);

  const renderBackdrop = useCallback(() => null, []);

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        index={initialIndex}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        onChange={handleChange}
        backgroundStyle={[
          styles.bottomSheetBackground,
          { backgroundColor },
        ]}
        handleIndicatorStyle={[
          styles.handleIndicator,
          { backgroundColor: handleColor },
        ]}
        style={styles.bottomSheetOverlay}
        topInset={calculatedHeaderHeight}
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        animateOnMount={true}
      >
        {/* Animated Header with Magnification */}
        <AnimatedSheetHeader 
          headerContent={headerContent} 
          searchHeaderHeight={calculatedHeaderHeight}
        />

        {/* Corner Masks */}
        <AnimatedCornerMasks />

        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <BottomSheetScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
          >
            {children}
          </BottomSheetScrollView>
        </SafeAreaView>
      </BottomSheet>
    </>
  );
};

const CORNER_RADIUS = 20;
const CORNER_SIZE = 50;

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    ...Platform.select({
      android: {
        elevation: 1000,
      },
    }),
  },
  bottomSheetBackground: {
    borderTopLeftRadius: CORNER_RADIUS,
    borderTopRightRadius: CORNER_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  clipMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: -1,
    pointerEvents: 'none',
  },
  cornerMaskLeft: {
    position: 'absolute',
    top: 0,
    left: -CORNER_SIZE,
    width: CORNER_SIZE * 2,
    height: CORNER_SIZE,
    backgroundColor: '#F5F5F5',
    borderTopRightRadius: CORNER_RADIUS * 3,
  },
  cornerMaskRight: {
    position: 'absolute',
    top: 0,
    right: -CORNER_SIZE,
    width: CORNER_SIZE * 2,
    height: CORNER_SIZE,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: CORNER_RADIUS * 3,
  },
});
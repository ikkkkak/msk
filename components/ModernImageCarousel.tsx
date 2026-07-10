import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

interface ModernImageCarouselProps {
  images: string[];
  onImagePress?: () => void;
  width?: number;
  height?: number;
  showDots?: boolean;
  showArrows?: boolean;
  borderRadius?: number;
}

export const ModernImageCarousel: React.FC<ModernImageCarouselProps> = ({
  images = [],
  onImagePress,
  width = screenWidth,
  height = 240,
  showDots = true,
  showArrows = true,
  borderRadius = 12,
}) => {
  // Ensure images is always an array
  const safeImages = Array.isArray(images) ? images : [];
  
  // Debug logging
  console.log('ModernImageCarousel: Received images:', images);
  console.log('ModernImageCarousel: Safe images:', safeImages);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(() => new Array(safeImages.length).fill(false));
  const scrollViewRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;


  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < safeImages.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      // Loop to first image
      scrollViewRef.current?.scrollTo({
        x: 0,
        animated: true,
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex - 1) * width,
        animated: true,
      });
    } else {
      // Loop to last image
      scrollViewRef.current?.scrollTo({
        x: (safeImages.length - 1) * width,
        animated: true,
      });
    }
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  if (!safeImages || safeImages.length === 0) {
    return (
      <View style={[styles.container, { width, height, borderRadius }]}> 
        <Pressable onPress={onImagePress} style={styles.imageContainer}>
          <View style={[styles.placeholder, { borderRadius }]}>
            <MaterialCommunityIcons
              name="image-outline"
              size={48}
              color="#717171"
            />
          </View>
        </Pressable>
      </View>
    );
  }


  return (
    <View style={[styles.container, { width, height, borderRadius }]}> 
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {safeImages.map((image, index) => {
          const opacity = new Animated.Value(0);
          const [imageError, setImageError] = useState(false);
          
          const handleOnLoad = () => {
            console.log('ModernImageCarousel: Image loaded successfully:', image);
            setLoaded(prev => {
              const next = [...prev];
              next[index] = true;
              return next;
            });
            Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
          };
          
          const handleOnError = (error: any) => {
            console.log('ModernImageCarousel: Image failed to load:', image, error);
            setImageError(true);
          };
          
          return (
            <Pressable
              key={`${image}-${index}`}
              onPress={onImagePress}
              style={styles.imageContainer}
            >
              <View style={[styles.imageBackdrop, { width, height }]} />
              {imageError ? (
                <View style={[styles.image, { width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
                  <MaterialCommunityIcons
                    name="image-broken"
                    size={48}
                    color="#CCCCCC"
                  />
                </View>
              ) : (
                <Animated.Image
                  source={{ uri: image }}
                  style={[styles.image, { width, height, opacity }]}
                  resizeMode="cover"
                  onLoad={handleOnLoad}
                  onError={handleOnError}
                />
              )}
            </Pressable>
          );
        })}
      </Animated.ScrollView>

      {/* Navigation Arrows */}
      {showArrows && safeImages.length > 1 && (
        <>
          <Pressable
            style={[styles.arrow, styles.arrowLeft]}
            onPress={goToPrevious}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>
          <Pressable
            style={[styles.arrow, styles.arrowRight]}
            onPress={goToNext}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>
        </>
      )}

      {/* Modern Dot Indicators */}
      {showDots && safeImages.length > 1 && (
        <View style={styles.dotsContainer}>
          {safeImages.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            return (
              <Pressable
                key={index}
                style={styles.dotWrapper}
                onPress={() => goToSlide(index)}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Image Counter */}
      {safeImages.length > 1 && (
        <View style={styles.counter}>
          <View style={styles.counterBackground}>
            <MaterialCommunityIcons
              name="camera"
              size={12}
              color="#FFFFFF"
            />
            <Animated.Text style={styles.counterText}>
              {currentIndex + 1}/{safeImages.length}
            </Animated.Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
  },
  imageBackdrop: {
    flex: 1,
    backgroundColor: '#EEE',
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dotWrapper: {
    padding: 4,
  },
  dot: {
    height: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  counter: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  counterBackground: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

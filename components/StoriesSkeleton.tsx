import React from 'react';
import { View, StyleSheet } from 'react-native';

const AVATAR_SIZE = 48;
const RING_SIZE = AVATAR_SIZE + 4;
const SKELETON_COUNT = 5;
const ITEM_WIDTH = 58;

const SkeletonItem: React.FC = () => (
  <View style={styles.item}>
    <View style={styles.ringSkeleton} />
    <View style={styles.usernameSkeleton} />
  </View>
);

export const StoriesSkeleton: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.listContent}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  listContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginRight: 2,
  },
  ringSkeleton: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: '#EBEBEB',
    marginTop: 2,
  },
  usernameSkeleton: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    marginTop: 6,
  },
});

export default StoriesSkeleton;

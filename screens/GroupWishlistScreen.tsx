import React from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGroupWishlist } from '../hooks/queries/useChat';
import { ArrowLeft } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

export default function GroupWishlistScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, title } = route.params as { groupId: number; title?: string };
  const { data: items = [] } = useGroupWishlist(groupId);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#222" weight="duotone" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || t('groups.wishlist.sharedWishlist', 'Shared wishlist')}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it: any) => String(it.id || it.ID)}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }: any) => {
          const exp = item.experience || item.Experience;
          const prop = item.property || item.Property;
          const addedBy = item?.addedBy || item?.AddedBy;
          const likes = item?.likes || item?.Likes || [];
          let imageUrl = '';
          const pImgs = (prop?.images as any) || (prop?.Images as any);
          if (Array.isArray(pImgs) && pImgs.length > 0) {
            imageUrl = typeof pImgs[0] === 'string' ? pImgs[0] : (pImgs[0]?.url || pImgs[0]?.URL || '');
          }
          if (!imageUrl) {
            const ePhotos = (exp?.photos as any) || (exp?.Photos as any);
            if (Array.isArray(ePhotos) && ePhotos.length > 0) {
              const first = ePhotos[0];
              imageUrl = typeof first === 'string' ? first : (first?.url || first?.URL || '');
            }
          }
          if (!imageUrl) imageUrl = 'https://via.placeholder.com/200x120?text=Wishlist';
          const titleText = prop?.title || exp?.title || t('groups.wishlist.wishlistItem', 'Wishlist item');
          const subText = prop ? (prop.city ? `${prop.city}` : '') : (exp?.city || '');
          return (
            <View style={styles.card}>
              <Image source={{ uri: imageUrl }} style={styles.cardImage} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{titleText}</Text>
                {!!subText && <Text style={styles.cardMeta}>{subText}</Text>}
                <Text style={styles.cardMeta}>{t('groups.wishlist.addedBy', { name: (addedBy?.firstName || addedBy?.FirstName || t('groups.wishlist.member', 'Member')) })}</Text>
                <View style={styles.likersRow}>
                  {likes.slice(0, 6).map((lk: any, idx: number) => (
                    <Image key={idx} source={{ uri: lk?.user?.avatarURL || 'https://i.pravatar.cc/100' }} style={[styles.avatar, { marginLeft: idx === 0 ? 0 : -10 }]} />
                  ))}
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' , marginTop: "15%"},
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#222222' },
  card: { flexDirection: 'row', padding: 10, borderWidth: 1, borderColor: '#EEE', borderRadius: 12, backgroundColor: '#FFF' },
  cardImage: { width: 120, height: 80, borderRadius: 8, backgroundColor: '#F2F2F2' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  cardMeta: { fontSize: 12, color: '#767676', marginTop: 4 },
  likersRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#FFF' },
});



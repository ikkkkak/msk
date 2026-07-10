import React, { useMemo, useState } from "react";
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Share } from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialIcons } from "@expo/vector-icons";
import { useCreateExperienceInvites } from "../hooks/queries/useExperienceInvites";
import { useUser } from "../hooks/useUser";

type Friend = { id: number; name: string; avatarURL?: string };

export const InviteModal = ({
  visible,
  onClose,
  experienceId,
  capacityLeft,
  friends,
}: {
  visible: boolean;
  onClose: () => void;
  experienceId: number;
  capacityLeft: number;
  friends: Friend[];
}) => {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [link, setLink] = useState<string | null>(null);
  const createInvites = useCreateExperienceInvites(experienceId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(f => (f.name || "").toLowerCase().includes(q));
  }, [query, friends]);

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const canInviteCount = Math.max(0, Math.min(capacityLeft, selected.length));

  const handleInvite = async () => {
    if (canInviteCount === 0) return;
    const payload = { inviteeUserIDs: selected.slice(0, capacityLeft) };
    try {
      await createInvites.mutateAsync(payload);
      setSelected([]);
      onClose();
    } catch (e) {}
  };

  const handleCreateLink = async () => {
    try {
      const res = await createInvites.mutateAsync({ inviteeUserIDs: [], createLink: true, expiresInHours: 48 });
      if (res?.linkToken) {
        const deepLink = `apartments://invite/${res.linkToken}`;
        setLink(deepLink);
        Share.share({ message: deepLink });
      }
    } catch (e) {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Inviter des amis</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color="#222" />
            </TouchableOpacity>
          </View>
          <Text style={styles.capacityText}>Places restantes: {capacityLeft}</Text>
          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={18} color="#999" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher des amis"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => toggleSelect(item.id)} style={[styles.row, selected.includes(item.id) && styles.rowSelected]}>
                <Text style={styles.rowName}>{item.name}</Text>
                {selected.includes(item.id) && <MaterialIcons name="check-circle" size={20} color="#00A699" />}
              </TouchableOpacity>
            )}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.linkBtn} onPress={handleCreateLink} disabled={createInvites.isPending}>
              {createInvites.isPending ? <ActivityIndicator color="#222" /> : <Text style={styles.linkText}>Créer un lien</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inviteBtn, canInviteCount === 0 && styles.inviteBtnDisabled]} onPress={handleInvite} disabled={canInviteCount === 0 || createInvites.isPending}>
              <Text style={[styles.inviteText, canInviteCount === 0 && styles.inviteTextDisabled]}>Inviter ({canInviteCount})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "85%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", color: "#222" },
  closeBtn: { padding: 6 },
  capacityText: { fontSize: 12, color: "#717171", marginBottom: 8 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#EBEBEB", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  input: { flex: 1, color: "#222" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  rowSelected: { backgroundColor: "#F4FAF8" },
  rowName: { fontSize: 14, color: "#222" },
  footer: { flexDirection: "row", gap: 10, marginTop: 12 },
  linkBtn: { flex: 1, backgroundColor: "#F5F5F5", paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: '#EBEBEB' },
  linkText: { color: "#222", fontWeight: "600" },
  inviteBtn: { flex: 1, backgroundColor: "#00A699", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  inviteBtnDisabled: { backgroundColor: '#CDEBE3' },
  inviteText: { color: "#fff", fontWeight: "700" },
  inviteTextDisabled: { color: '#f8f8f8' },
});



import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Property, Host } from "../../types/property";

interface HostProfileSectionProps {
  property: Property;
  onContactHost?: () => void;
}

export const HostProfileSection: React.FC<HostProfileSectionProps> = ({
  property,
  onContactHost,
}) => {
  const host = property.host;

  if (!host) {
    return null;
  }

  const getHostName = () => {
    return `${host.firstName} ${host.lastName}`;
  };

  const getJoinedDate = () => {
    if (property.createdAt) {
      const date = new Date(property.createdAt);
      return `Membre depuis ${date.getFullYear()}`;
    }
    return "Membre depuis récemment";
  };

  const getLanguages = () => {
    if (host.languages && host.languages.length > 0) {
      return host.languages.join(", ");
    }
    return "Langues non spécifiées";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Votre hôte</Text>
        <TouchableOpacity style={styles.contactButton} onPress={onContactHost}>
          <MaterialCommunityIcons
            name="message-text"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.contactButtonText}>Contacter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hostInfo}>
        <View style={styles.hostAvatarContainer}>
          {host.avatarURL ? (
            <Image source={{ uri: host.avatarURL }} style={styles.hostAvatar} />
          ) : (
            <View style={styles.hostAvatarPlaceholder}>
              <MaterialCommunityIcons
                name="account"
                size={32}
                color="#717171"
              />
            </View>
          )}
          {host.isVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons
                name="check"
                size={12}
                color="#FFFFFF"
              />
            </View>
          )}
        </View>

        <View style={styles.hostDetails}>
          <View style={styles.hostNameRow}>
            <Text style={styles.hostName}>{getHostName()}</Text>
            {host.isVerified && (
              <View style={styles.verifiedContainer}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color="#222222"
                />
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            )}
          </View>

          <Text style={styles.joinedDate}>{getJoinedDate()}</Text>

          {host.bio && (
            <Text style={styles.bio} numberOfLines={3}>
              {host.bio}
            </Text>
          )}

          <View style={styles.languagesContainer}>
            <MaterialCommunityIcons
              name="translate"
              size={16}
              color="#717171"
            />
            <Text style={styles.languages}>{getLanguages()}</Text>
          </View>

          {host.rating && (
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons
                name="star"
                size={16}
                color="#222222"
              />
              <Text style={styles.rating}>{host.rating.toFixed(1)}</Text>
              <Text style={styles.ratingText}>Note moyenne</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>Taux de réponse</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>&lt; 1h</Text>
          <Text style={styles.statLabel}>Délai de réponse</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Années d'expérience</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222222",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  hostInfo: {
    flexDirection: "row",
    marginBottom: 20,
  },
  hostAvatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  hostAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  hostAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#222222",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  hostDetails: {
    flex: 1,
  },
  hostNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  hostName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginRight: 8,
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: "#222222",
    fontWeight: "500",
  },
  joinedDate: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20,
    marginBottom: 12,
  },
  languagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  languages: {
    fontSize: 14,
    color: "#717171",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "600",
  },
  ratingText: {
    fontSize: 12,
    color: "#717171",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F7F7F7",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#717171",
    textAlign: "center",
  },
});

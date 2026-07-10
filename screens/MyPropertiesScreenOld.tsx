import { StyleSheet, FlatList, View, Image, RefreshControl, TouchableOpacity, ScrollView } from "react-native";
import { Text, Button } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { Entypo, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { useUser } from "../hooks/useUser";
import { SignUpOrSignInScreen } from "./SignUpOrSignInScreen";
import { Loading } from "../components/Loading";
import { Card } from "../components/Card";
import { ModalHeader } from "../components/ModalHeader";
import { theme } from "../theme";
import { useMyPropertiesQuery } from "../hooks/queries/useMyPropertiesQuery";

export const MyPropertiesScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const properties = useMyPropertiesQuery();

  const addPropertyNavigation = () => {
    navigation.navigate("AddProperty");
  };

  if (!user) return <SignUpOrSignInScreen />;

  if (properties.isLoading) return <Loading />;

  const data = properties?.data ?? [];

  return (
    <Screen>
      <ModalHeader xShown text="Mes annonces" />
      <View style={styles.headerRow}>
        <Button
          accessoryLeft={
            <Entypo name="plus" size={16} color={theme["color-primary-500"]} />
          }
          appearance={"ghost"}
          size="small"
          style={styles.button}
          onPress={addPropertyNavigation}
        >
          Ajouter une annonce
        </Button>
        <Button
          accessoryLeft={
            <MaterialCommunityIcons
              name="refresh"
              size={16}
              color={theme["color-primary-500"]}
            />
          }
          appearance={"ghost"}
          size="small"
          style={styles.button}
          onPress={() => properties.refetch()}
        >
          Actualiser
        </Button>
      </View>

      {data.length > 0 ? (
        <FlatList
          data={data}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          keyExtractor={(item) => item.ID.toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={!!properties.isRefetching}
              onRefresh={() => properties.refetch()}
              tintColor={theme["color-primary-500"]}
            />
          }
          renderItem={({ item }) => {
            const cover = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : undefined;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.item}
                onPress={() => navigation.navigate("EditProperty", { propertyID: item.ID })}
              >
                <View style={styles.coverWrap}>
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.cover} />
                  ) : (
                    <View style={[styles.cover, styles.coverPlaceholder]} />
                  )}
                  {item.isActive ? (
                    <View style={[styles.badge, styles.badgeActive]}>
                      <Text style={styles.badgeText}>Publiée</Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, styles.badgeDraft]}>
                      <Text style={styles.badgeText}>Brouillon</Text>
                    </View>
                  )}
                </View>
                <View style={styles.meta}>
                  <Text numberOfLines={1} style={styles.title}>{item.title || "Sans titre"}</Text>
                  <Text appearance="hint" numberOfLines={1} style={styles.subTitle}>
                    {item.city}{item.city && item.state ? ", " : ""}{item.state}
                  </Text>
                  {item.nightlyPrice ? (
                    <Text style={styles.price}>MRU {item.nightlyPrice}<Text appearance="hint"> / nuit</Text></Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<View style={{ height: 16 }} />}
        />
      ) : (
        <View style={styles.noPropertiesContainer}>
          <LottieView
            autoPlay
            style={styles.lottie}
            source={require("../assets/lotties/AddProperty.json")}
          />
          <Text category={"h6"} style={styles.text}>
            Vous n’avez aucune annonce
          </Text>
          <Text appearance={"hint"} style={[styles.text, styles.bottomText]}>
            Ajoutez une annonce et commencez à accueillir.
          </Text>

          <Button style={styles.addPropertyButton} onPress={addPropertyNavigation}>
            Ajouter une annonce
          </Button>
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  noPropertiesContainer: {
    marginTop: 30,
    marginHorizontal: 10,
  },
  button: {
    alignSelf: "flex-start",
    marginVertical: 5,
  },
  gridRow: {
    paddingHorizontal: 10,
    gap: 12,
  },
  item: {
    flex: 1,
    marginTop: 12,
  },
  coverWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
  },
  cover: {
    width: "100%",
    aspectRatio: 1.2,
  },
  coverPlaceholder: {
    backgroundColor: "#EFEFEF",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: "#1F8A70",
  },
  badgeDraft: {
    backgroundColor: "#999999",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  meta: {
    marginTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },
  subTitle: {
    fontSize: 12,
    color: "#717171",
    marginTop: 2,
  },
  price: {
    fontSize: 12,
    color: "#222222",
    marginTop: 4,
  },
  lottie: {
    marginBottom: 50,
    height: 250,
    width: 250,
    alignSelf: "center",
  },
  text: {
    textAlign: "center",
  },
  bottomText: {
    marginTop: 10,
    marginBottom: 30,
  },
  addPropertyButton: {
    marginTop: 20,
  },
});

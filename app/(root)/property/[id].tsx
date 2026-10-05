import { useSavedProperty } from "@/hooks/useSavedProperty";
import { useSupabase } from "@/hooks/useSupabase";
import { ADMIN_PHONE } from "@/lib/contact";
import { parsePropertyImage } from "@/lib/propertyImages";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { Property } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoLinking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAdmin = useUserStore((state) => state.isAdmin);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedImageCategory, setSelectedImageCategory] = useState("All");
  const [expanded, setExpanded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const { isSaved, saveLoading, toggleSave } = useSavedProperty(id ?? "");
  const authSupabase = useSupabase();

  useEffect(() => {
    let isActive = true;

    const fetchProperty = async () => {
      setLoading(true);
      setLoadError(false);

      if (!id) {
        setProperty(null);
        setLoadError(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (isActive) setProperty(data);
      } catch (error) {
        console.error("Could not load property:", error);
        if (isActive) {
          setProperty(null);
          setLoadError(true);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void fetchProperty();
    return () => {
      isActive = false;
    };
  }, [id]);

  const handleDelete = () => {
    if (!isAdmin) return;

    Alert.alert("Delete Property", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await authSupabase
            .from("properties")
            .delete()
            .eq("id", id);
          if (error) {
            Alert.alert("Could not delete property", error.message);
            return;
          }
          router.replace("/(root)/(tabs)");
        },
      },
    ]);
  };

  const handleMarkSold = () => {
    if (!isAdmin) return;

    Alert.alert("Mark as Sold", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Sold",
        onPress: async () => {
          const { error } = await authSupabase
            .from("properties")
            .update({ is_sold: true })
            .eq("id", id);
          if (error) {
            Alert.alert("Could not update property", error.message);
            return;
          }
          setProperty((prev) => (prev ? { ...prev, is_sold: true } : prev));
        },
      },
    ]);
  };

  const handleContact = () => {
    if (!ADMIN_PHONE || !property || !id) {
      Alert.alert(
        "Contact unavailable",
        "The admin contact number or property details are unavailable.",
      );
      return;
    }

    const propertyLink = ExpoLinking.createURL(`/property/${id}`);
    const message = `Hi! I'm interested in the property: ${property.title}\nProperty link: ${propertyLink}`;
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(
      message,
    )}`;
    void Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp unavailable", "Could not open the WhatsApp chat.");
    });
  };

  const handleToggleSave = async (currentProperty: Property) => {
    try {
      await toggleSave(currentProperty);
    } catch (error) {
      Alert.alert(
        "Could not update saved homes",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!property) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Ionicons
          name={loadError ? "cloud-offline-outline" : "home-outline"}
          size={34}
          color="#94a3b8"
        />
        <Text className="mt-3 text-center text-gray-600">
          {loadError ? "Could not load this property." : "Property not found."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-4 py-2"
        >
          <Text className="font-semibold text-blue-600">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = (property.images ?? [])
    .filter(Boolean)
    .map(parsePropertyImage);
  const imageCategories = Array.from(
    new Set(images.map((image) => image.category)),
  );
  const visibleImages =
    selectedImageCategory === "All"
      ? images
      : images.filter((image) => image.category === selectedImageCategory);
  const imageViewerIndex = Math.max(
    0,
    images.findIndex((image) => image.uri === visibleImages[activeIndex]?.uri),
  );
  const propertyCategory = property.type.replace(/\s+for\s+(sale|rent)$/i, "");
  const hasCoordinates =
    Number.isFinite(property.latitude) &&
    Number.isFinite(property.longitude) &&
    Math.abs(property.latitude) <= 90 &&
    Math.abs(property.longitude) <= 180 &&
    (property.latitude !== 0 || property.longitude !== 0);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    property.longitude - 0.003
  }%2C${property.latitude - 0.003}%2C${property.longitude + 0.003}%2C${
    property.latitude + 0.003
  }&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`;

  const isLongDesc = (property.description?.length ?? 0) > 150;
  const displayDesc =
    expanded || !isLongDesc
      ? property.description
      : property.description?.slice(0, 150) + "...";

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="h-[390px] w-full overflow-hidden bg-[#eaf3ff]">
          {images.length ? (
            <FlatList
              data={visibleImages}
              keyExtractor={(image, index) => `${image.uri}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.96}
                  onPress={() => setImageViewerVisible(true)}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width, height: 390 }}
                    resizeMode="cover"
                    accessibilityLabel={`${property.title} photo`}
                  />
                </TouchableOpacity>
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="image-outline" size={44} color="#6b8280" />
              <Text className="mt-2 text-sm font-medium text-[#526765]">
                Photos coming soon
              </Text>
            </View>
          )}

          <SafeAreaView className="absolute left-0 right-0 top-0">
            <View className="flex-row items-center justify-between px-5 pt-2">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => router.back()}
                className="h-11 w-11 items-center justify-center rounded-full bg-white/95"
              >
                <Ionicons name="arrow-back" size={20} color="#152b45" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  isSaved ? "Remove from saved homes" : "Save home"
                }
                accessibilityState={{ selected: isSaved }}
                onPress={() => void handleToggleSave(property)}
                disabled={saveLoading}
                className="h-11 w-11 items-center justify-center rounded-full bg-white/95"
              >
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={20}
                  color={isSaved ? "#2878d0" : "#152b45"}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View className="absolute bottom-4 right-5 rounded-md bg-[#152b45]/90 px-3 py-1.5">
            <Text className="text-xs font-semibold text-white">
              {visibleImages.length === 0
                ? "No photos"
                : `${activeIndex + 1} / ${visibleImages.length} photos`}
            </Text>
          </View>
          {property.is_sold ? (
            <View className="absolute bottom-4 left-5 rounded-md bg-red-600 px-3 py-1.5">
              <Text className="text-xs font-bold uppercase text-white">
                Sold
              </Text>
            </View>
          ) : null}
        </View>

        {imageCategories.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              gap: 8,
            }}
          >
            {["All", ...imageCategories].map((category) => {
              const selected = selectedImageCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setSelectedImageCategory(category);
                    setActiveIndex(0);
                  }}
                  className={`rounded-md border px-3.5 py-2 ${selected ? "border-[#2878d0] bg-[#2878d0]" : "border-[#d8e4f1] bg-white"}`}
                >
                  <Text
                    className={`text-xs font-semibold ${selected ? "text-white" : "text-[#526765]"}`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <View className="px-5 pt-6">
          <View className="mb-3 flex-row flex-wrap items-center gap-2">
            <Text className="rounded-sm bg-[#eaf3ff] px-2.5 py-1 text-[11px] font-bold uppercase text-[#2878d0]">
              {propertyCategory || "Property"}
            </Text>
            {property.is_featured ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="sparkles" size={13} color="#c18532" />
                <Text className="text-xs font-semibold text-[#946322]">
                  Featured listing
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="text-[27px] font-bold leading-8 text-[#152b45]">
            {property.title}
          </Text>
          <View className="mt-2 flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={15} color="#718198" />
            <Text className="flex-1 text-sm text-[#718198]">
              {[property.address, property.city].filter(Boolean).join(", ") ||
                "Location available on request"}
            </Text>
          </View>

          <View className="mt-5 flex-row items-end justify-between border-b border-[#dfe8f2] pb-5">
            <View>
              <Text className="text-[11px] font-semibold uppercase text-[#8295ad]">
                {property.type.toLowerCase().includes("rent")
                  ? "Monthly rent"
                  : "Asking price"}
              </Text>
              <Text className="mt-1 text-[25px] font-extrabold text-[#2878d0]">
                {formatPrice(property.price)}
                {property.type.toLowerCase().includes("rent") ? (
                  <Text className="text-sm font-medium text-[#718198]">
                    {" "}
                    / month
                  </Text>
                ) : null}
              </Text>
            </View>
            <Ionicons name="arrow-up-outline" size={19} color="#2878d0" />
          </View>

          <View className="flex-row border-b border-[#dfe8f2] py-5">
            <SpecItem
              icon="bed-outline"
              label="Bedrooms"
              value={`${property.bedrooms}`}
            />
            <SpecItem
              icon="water-outline"
              label="Bathrooms"
              value={`${property.bathrooms}`}
            />
            <SpecItem
              icon="expand-outline"
              label="Area"
              value={`${property.area_sqft.toLocaleString("en-IN")} sqft`}
            />
            <SpecItem
              icon="home-outline"
              label="Property"
              value={propertyCategory}
            />
          </View>

          <View className="pt-6">
            <Text className="text-lg font-bold text-[#152b45]">
              About this home
            </Text>
            <Text className="mt-2 text-[14px] leading-[22px] text-[#718198]">
              {displayDesc ||
                "No description has been added for this property yet."}
            </Text>
            {isLongDesc ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setExpanded(!expanded)}
                className="mt-2 self-start py-1"
              >
                <Text className="text-sm font-bold text-[#2878d0]">
                  {expanded ? "Show less" : "Read full description"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="pt-7">
            <Text className="text-lg font-bold text-[#152b45]">
              Where you’ll be
            </Text>
            <View className="mt-2 flex-row items-center gap-2">
              <Ionicons name="navigate-outline" size={16} color="#2878d0" />
              <Text className="flex-1 text-sm text-[#718198]">
                {[property.address, property.city].filter(Boolean).join(", ") ||
                  "Location available on request"}
              </Text>
            </View>
            {hasCoordinates ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open full property map"
                onPress={() =>
                  router.push({
                    pathname: "/(root)/property/map" as never,
                    params: {
                      latitude: String(property.latitude),
                      longitude: String(property.longitude),
                      title: property.title,
                      address: `${property.address}, ${property.city}`,
                    },
                  })
                }
                activeOpacity={0.9}
                className="mt-4 h-[190px] overflow-hidden rounded-md bg-[#eaf3ff]"
              >
                <WebView
                  source={{ uri: mapUrl }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  pointerEvents="none"
                />
                <View className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-md bg-white px-3 py-2">
                  <Ionicons name="expand-outline" size={14} color="#2878d0" />
                  <Text className="text-xs font-semibold text-[#152b45]">
                    Explore map
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View className="mt-4 h-[110px] items-center justify-center rounded-md bg-[#f4f8fc] px-5">
                <Ionicons name="location-outline" size={24} color="#8295ad" />
                <Text className="mt-2 text-center text-xs text-[#718198]">
                  Map location is not available for this property.
                </Text>
              </View>
            )}
          </View>

          {isAdmin ? (
            <View className="mt-7 flex-row gap-3 border-t border-[#dfe8f2] pt-5">
              {!property.is_sold ? (
                <TouchableOpacity
                  onPress={handleMarkSold}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-md border border-amber-200 py-3.5"
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#a66a16"
                  />
                  <Text className="font-semibold text-[#946322]">
                    Mark sold
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-md border border-red-200 py-3.5"
              >
                <Ionicons name="trash-outline" size={18} color="#c43f45" />
                <Text className="font-semibold text-[#b3343a]">
                  Delete listing
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <SafeAreaView
        edges={["bottom"]}
        className="border-t border-[#dfe8f2] bg-white"
      >
        <View className="flex-row items-center gap-3 px-5 py-3">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              isSaved ? "Remove from saved homes" : "Save home"
            }
            accessibilityState={{ selected: isSaved }}
            onPress={() => void handleToggleSave(property)}
            disabled={saveLoading}
            className="h-12 w-12 items-center justify-center rounded-md border border-[#d8e4f1]"
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={21}
              color={isSaved ? "#2878d0" : "#152b45"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleContact}
            disabled={property.is_sold}
            className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-md ${property.is_sold ? "bg-slate-300" : "bg-[#2878d0]"}`}
          >
            <Ionicons name="logo-whatsapp" size={19} color="white" />
            <Text className="text-sm font-bold text-white">
              {property.is_sold ? "No longer available" : "Contact agent"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ImageViewing
        images={images.map(({ uri }) => ({ uri }))}
        imageIndex={imageViewerIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="min-w-0 flex-1 items-center gap-1">
      <Ionicons name={icon} size={19} color="#2878d0" />
      <Text
        numberOfLines={1}
        className="mt-1 text-center text-xs font-bold text-[#152b45]"
      >
        {value}
      </Text>
      <Text numberOfLines={1} className="text-[10px] text-[#8295ad]">
        {label}
      </Text>
    </View>
  );
}

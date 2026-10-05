import FeaturedCard from "@/components/FeaturedCard";
import PropertyCard from "@/components/PropertyCard";
import { supabase } from "@/lib/supabase";
import { Property } from "@/types";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ListingFilter = "All" | "Buy" | "Rent";

function matchesFilter(property: Property, filter: ListingFilter) {
  if (filter === "All") return true;

  const type = property.type?.toLowerCase() ?? "";
  return filter === "Rent"
    ? type.includes("rent") || type.includes("lease")
    : type.includes("buy") || type.includes("sale") || type.includes("sell");
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [recommended, setRecommended] = useState<Property[]>([]);
  const [filter, setFilter] = useState<ListingFilter>("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const [featuredResult, recommendedResult] = await Promise.all([
        supabase
          .from("properties")
          .select("*")
          .eq("is_featured", true)
          .eq("is_sold", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("properties")
          .select("*")
          .eq("is_featured", false)
          .eq("is_sold", false)
          .order("created_at", { ascending: false }),
      ]);

      if (featuredResult.error || recommendedResult.error) {
        throw featuredResult.error ?? recommendedResult.error;
      }

      setFeatured(featuredResult.data ?? []);
      setRecommended(recommendedResult.data ?? []);
    } catch (error) {
      console.error("Could not load properties:", error);
      setLoadError(true);
      setFeatured([]);
      setRecommended([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchProperties();
    }, [fetchProperties]),
  );

  const visibleFeatured = featured.filter((property) =>
    matchesFilter(property, filter),
  );
  const visibleRecommended = recommended.filter((property) =>
    matchesFilter(property, filter),
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f7f9fc]" edges={["top"]}>
      <FlatList
        data={visibleRecommended}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchProperties}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between pl-2 pr-4 pb-6 pt-4">
              <Image
                source={require("../../../assets/images/StanzyLive.png")}
                className="h-16 w-44"
                resizeMode="contain"
                accessibilityLabel="StanzyLive"
              />
              <View className="items-end">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="sunny-outline" size={15} color="#d99a2b" />
                  <Text className="text-[13px] font-medium text-slate-500">
                    Good morning
                  </Text>
                </View>
                <Text className="mt-0.5 text-base font-bold text-slate-900">
                  {user?.firstName ?? "Welcome"}
                </Text>
              </View>
            </View>

            <View className="px-5 pb-5 pt-2">
              <Text className="text-[27px] font-bold leading-8 text-slate-950">
                Find your place
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Homes worth coming home to.
              </Text>
            </View>

            <View className="mb-6 flex-row gap-2.5 px-5">
              <Pressable
                accessibilityRole="search"
                onPress={() => router.push("/(root)/(tabs)/search")}
                className="h-12 flex-1 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white px-4"
              >
                <Ionicons name="search-outline" size={19} color="#8492a6" />
                <Text className="flex-1 text-sm text-slate-400">
                  Search city, area, or property
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open property filters"
                onPress={() =>
                  router.push("/(root)/(tabs)/search?openFilters=true")
                }
                className="h-12 w-12 items-center justify-center rounded-lg bg-[#2878d0]"
              >
                <Ionicons name="options-outline" size={20} color="#ffffff" />
              </Pressable>
            </View>

            <View className="mb-7 flex-row gap-2 px-5">
              {(["All", "Buy", "Rent"] as const).map((option) => {
                const isSelected = filter === option;

                return (
                  <Pressable
                    key={option}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setFilter(option)}
                    className={`min-w-16 items-center rounded-full border px-5 py-2 ${isSelected ? "border-[#2878d0] bg-[#2878d0]" : "border-slate-200 bg-white"}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-600"}`}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mb-7">
              <View className="mb-3 flex-row items-end justify-between px-5">
                <View>
                  <Text className="text-lg font-bold text-slate-900">
                    Featured homes
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    Handpicked places to get you inspired
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/(root)/(tabs)/search")}
                  className="py-1"
                >
                  <Text className="text-sm font-semibold text-[#2878d0]">
                    View all
                  </Text>
                </Pressable>
              </View>

              {loading ? (
                <View className="h-64 items-center justify-center">
                  <ActivityIndicator color="#2878d0" />
                </View>
              ) : visibleFeatured.length > 0 ? (
                <FlatList
                  horizontal
                  data={visibleFeatured}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <FeaturedCard property={item} />}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                />
              ) : (
                <View className="mx-5 min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-5">
                  <Ionicons name="home-outline" size={23} color="#94a3b8" />
                  <Text className="mt-2 text-sm font-semibold text-slate-700">
                    No featured homes yet
                  </Text>
                  <Text className="mt-1 text-center text-xs text-slate-500">
                    New featured listings will show up here.
                  </Text>
                </View>
              )}
            </View>

            <View className="mb-3 flex-row items-end justify-between px-5">
              <View>
                <Text className="text-lg font-bold text-slate-900">
                  Recommended for you
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  {filter === "All"
                    ? "Fresh places to explore"
                    : `${filter} listings`}
                </Text>
              </View>
              <Ionicons name="sparkles-outline" size={19} color="#2878d0" />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="mx-5 items-center rounded-lg border border-slate-200 bg-white px-5 py-8">
            <Ionicons
              name={loadError ? "cloud-offline-outline" : "search-outline"}
              size={26}
              color="#94a3b8"
            />
            <Text className="mt-2 text-sm font-semibold text-slate-700">
              {loading
                ? "Loading homes..."
                : loadError
                  ? "Could not load homes"
                  : "No homes match this filter"}
            </Text>
            <Text className="mt-1 text-center text-xs text-slate-500">
              {loadError
                ? "Check your connection and pull down to try again."
                : "Try another option or check back soon for new listings."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

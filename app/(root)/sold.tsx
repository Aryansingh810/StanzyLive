import PropertyCard from "@/components/PropertyCard";
import { useSupabase } from "@/hooks/useSupabase";
import { Property } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SoldPropertiesScreen() {
  const supabase = useSupabase();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadSoldProperties = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("is_sold", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isActive) setProperties((data as Property[] | null) ?? []);
      } catch (error) {
        console.error("Could not load sold properties:", error);
        if (isActive) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load sold properties.",
          );
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadSoldProperties();
    return () => {
      isActive = false;
    };
  }, [supabase]);

  return (
    <SafeAreaView className="flex-1 bg-[#f4f8fc]" edges={["top"]}>
      <View className="px-5 pb-4 pt-5">
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle-outline" size={23} color="#2878d0" />
          <Text className="text-2xl font-bold text-[#152b45]">
            Sold properties
          </Text>
        </View>
        <Text className="mt-1 text-sm text-[#718198]">
          {properties.length} {properties.length === 1 ? "listing" : "listings"}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2878d0" />
        </View>
      ) : errorMessage ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={30} color="#b42318" />
          <Text className="mt-3 text-center text-sm text-red-700">
            {errorMessage}
          </Text>
        </View>
      ) : properties.length ? (
        <FlatList
          data={properties}
          keyExtractor={(property) => property.id}
          renderItem={({ item }) => (
            <View>
              <View className="mb-1 self-start flex-row items-center gap-1 rounded bg-[#eaf3ff] px-2 py-1">
                <Ionicons name="checkmark-circle" size={13} color="#2878d0" />
                <Text className="text-[10px] font-bold uppercase text-[#2878d0]">
                  Sold
                </Text>
              </View>
              <PropertyCard property={item} />
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6 pb-12">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#eaf3ff]">
            <Ionicons
              name="checkmark-circle-outline"
              size={30}
              color="#2878d0"
            />
          </View>
          <Text className="mt-4 text-base font-semibold text-[#152b45]">
            No sold properties yet
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

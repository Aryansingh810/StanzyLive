import PropertyCard from "@/components/PropertyCard";
import { useSavedProperties } from "@/hooks/useSavedProperty";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedPropertiesScreen() {
  const { savedProperties, loading, errorMessage } = useSavedProperties();
  const isEmpty = savedProperties.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1 px-5 pt-5">
        <Text className="text-2xl font-bold text-[#152b45]">Saved</Text>
        <Text className="mt-1 text-sm text-[#8290a2]">
          {savedProperties.length}{" "}
          {savedProperties.length === 1 ? "property" : "properties"} saved
        </Text>

        {isEmpty ? (
          <View className="flex-1 items-center justify-center pb-12">
            {loading ? (
              <ActivityIndicator color="#2878d0" />
            ) : errorMessage ? (
              <>
                <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <Ionicons
                    name="alert-circle-outline"
                    size={30}
                    color="#b42318"
                  />
                </View>
                <Text className="mt-4 text-center text-base font-semibold text-[#152b45]">
                  Could not load saved properties
                </Text>
                <Text className="mt-2 text-center text-sm text-[#718198]">
                  {errorMessage}
                </Text>
              </>
            ) : (
              <>
                <View className="h-16 w-16 items-center justify-center rounded-full bg-[#f1f7ff]">
                  <Ionicons name="heart-outline" size={30} color="#2878d0" />
                </View>
                <Text className="mt-4 text-base font-semibold text-[#152b45]">
                  No saved properties
                </Text>
                <Text className="mt-1 text-center text-sm text-[#8290a2]">
                  Tap the heart on any property to save it here
                </Text>
              </>
            )}
          </View>
        ) : (
          <FlatList
            className="mt-5"
            data={savedProperties}
            keyExtractor={(property) => property.id}
            renderItem={({ item }) => <PropertyCard property={item} />}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

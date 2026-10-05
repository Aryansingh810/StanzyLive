import { parsePropertyImage } from "@/lib/propertyImages";
import { Property } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

type FeaturedCardProps = {
  property: Property;
};

function formatPrice(price: number, type: string) {
  const formatted =
    price >= 10_000_000
      ? `₹${(price / 10_000_000).toFixed(1)} Cr`
      : price >= 100_000
        ? `₹${(price / 100_000).toFixed(1)} L`
        : `₹${price.toLocaleString("en-IN")}`;

  return type.toLowerCase().includes("rent") ? `${formatted} / mo` : formatted;
}

function listingType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("rent") || normalized.includes("lease")) {
    return "For rent";
  }
  if (normalized.includes("sale") || normalized.includes("buy")) {
    return "For sale";
  }
  return type || "Property";
}

export default function FeaturedCard({ property }: FeaturedCardProps) {
  const router = useRouter();
  const imageValue = property.images?.[0];
  const imageUri = imageValue ? parsePropertyImage(imageValue).uri : undefined;
  const location = [property.address, property.city].filter(Boolean).join(", ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${property.title}`}
      onPress={() =>
        router.push({
          pathname: "/(root)/property/[id]",
          params: { id: property.id },
        })
      }
      className="w-[276px] overflow-hidden rounded-lg border border-slate-200 bg-white"
    >
      <View className="relative h-[166px] bg-[#e8eef4]">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={`${property.title} property photo`}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-[#e8eef4]">
            <Ionicons name="home-outline" size={38} color="#8a9caf" />
            <Text className="mt-2 text-xs font-medium text-slate-500">
              Photo coming soon
            </Text>
          </View>
        )}
        <View className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full bg-white/95 px-2.5 py-1">
          <Ionicons name="sparkles" size={12} color="#2878d0" />
          <Text className="text-[10px] font-bold text-[#2878d0]">FEATURED</Text>
        </View>
        <View className="absolute bottom-3 left-3 rounded-full bg-slate-950/75 px-2.5 py-1">
          <Text className="text-[10px] font-semibold text-white">
            {listingType(property.type)}
          </Text>
        </View>
      </View>

      <View className="p-3.5">
        <Text numberOfLines={1} className="text-base font-bold text-slate-900">
          {property.title}
        </Text>
        <View className="mt-1.5 flex-row items-center gap-1">
          <Ionicons name="location-outline" size={14} color="#8492a6" />
          <Text numberOfLines={1} className="flex-1 text-xs text-slate-500">
            {location || "Location available on request"}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
          <Text className="text-base font-extrabold text-[#2878d0]">
            {formatPrice(property.price, property.type)}
          </Text>
          <View className="flex-row items-center gap-3">
            {property.bedrooms > 0 ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="bed-outline" size={14} color="#718096" />
                <Text className="text-xs text-slate-600">
                  {property.bedrooms}
                </Text>
              </View>
            ) : null}
            {property.area_sqft > 0 ? (
              <Text className="text-xs text-slate-500">
                {property.area_sqft.toLocaleString("en-IN")} sqft
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

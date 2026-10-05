import { parsePropertyImage } from "@/lib/propertyImages";
import { Property } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

type PropertyCardProps = {
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

export default function PropertyCard({ property }: PropertyCardProps) {
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
      className="mb-3 flex-row overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5"
    >
      <View className="h-[116px] w-[112px] overflow-hidden rounded-md bg-[#e8eef4]">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={`${property.title} property photo`}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="home-outline" size={30} color="#8a9caf" />
            <Text className="mt-1 text-[9px] text-slate-500">No photo yet</Text>
          </View>
        )}
      </View>

      <View className="min-w-0 flex-1 justify-between py-0.5 pl-3">
        <View>
          <View className="flex-row items-start justify-between gap-2">
            <Text
              numberOfLines={2}
              className="flex-1 text-sm font-bold leading-5 text-slate-900"
            >
              {property.title}
            </Text>
            <View className="rounded bg-[#edf5ff] px-2 py-1">
              <Text className="text-[9px] font-semibold text-[#2878d0]">
                {listingType(property.type)}
              </Text>
            </View>
          </View>
          <View className="mt-1.5 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color="#8492a6" />
            <Text
              numberOfLines={1}
              className="flex-1 text-[11px] text-slate-500"
            >
              {location || "Location available on request"}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-base font-extrabold text-[#2878d0]">
            {formatPrice(property.price, property.type)}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-3">
            {property.bedrooms > 0 ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="bed-outline" size={13} color="#718096" />
                <Text className="text-[10px] text-slate-600">
                  {property.bedrooms} beds
                </Text>
              </View>
            ) : null}
            {property.bathrooms > 0 ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="water-outline" size={13} color="#718096" />
                <Text className="text-[10px] text-slate-600">
                  {property.bathrooms} baths
                </Text>
              </View>
            ) : null}
            {property.area_sqft > 0 ? (
              <Text className="text-[10px] text-slate-600">
                {property.area_sqft.toLocaleString("en-IN")} sqft
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

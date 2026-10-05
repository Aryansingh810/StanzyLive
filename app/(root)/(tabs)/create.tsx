import { useSupabase } from "@/hooks/useSupabase";
import { useUserStore } from "@/store/userStore";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STORAGE_BUCKET = "property-images";
const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio"] as const;
const LISTING_TYPES = ["For sale", "For rent"] as const;
const IMAGE_CATEGORIES = [
  "Living room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Other",
] as const;

type PropertyImage = {
  uri: string;
  name: string;
  category: "Exterior" | (typeof IMAGE_CATEGORIES)[number];
  mimeType?: string;
};

export default function CreatePropertyScreen() {
  const isAdmin = useUserStore((state) => state.isAdmin);
  const supabase = useSupabase();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] =
    useState<(typeof PROPERTY_TYPES)[number]>("Apartment");
  const [listingType, setListingType] =
    useState<(typeof LISTING_TYPES)[number]>("For sale");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [areaSqft, setAreaSqft] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageCategory, setImageCategory] =
    useState<(typeof IMAGE_CATEGORIES)[number]>("Living room");
  const [mainImage, setMainImage] = useState<PropertyImage | null>(null);
  const [selectedImages, setSelectedImages] = useState<PropertyImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const appendImages = (images: PropertyImage[]) => {
    setSelectedImages((current) => {
      const knownUris = new Set(current.map((image) => image.uri));
      return [
        ...current,
        ...images.filter((image) => !knownUris.has(image.uri)),
      ];
    });
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 12,
        orderedSelection: true,
        quality: 0.85,
      });

      if (!result.canceled) {
        appendImages(
          result.assets.map((asset) => ({
            uri: asset.uri,
            name:
              asset.fileName ?? `Property photo ${selectedImages.length + 1}`,
            category: imageCategory,
            mimeType: asset.mimeType,
          })),
        );
      }
    } catch {
      setIsError(true);
      setMessage("Could not open the image gallery.");
    }
  };

  const pickImageFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        appendImages(
          result.assets.map((asset) => ({
            uri: asset.uri,
            name: asset.name,
            category: imageCategory,
            mimeType: asset.mimeType,
          })),
        );
      }
    } catch {
      setIsError(true);
      setMessage("Could not open the file picker.");
    }
  };

  const pickMainImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMainImage({
          uri: asset.uri,
          name: asset.fileName ?? "Exterior photo",
          category: "Exterior",
          mimeType: asset.mimeType,
        });
      }
    } catch {
      setIsError(true);
      setMessage("Could not open the image gallery.");
    }
  };

  const pickMainImageFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMainImage({
          uri: asset.uri,
          name: asset.name,
          category: "Exterior",
          mimeType: asset.mimeType,
        });
      }
    } catch {
      setIsError(true);
      setMessage("Could not open the file picker.");
    }
  };

  const createProperty = async () => {
    const numericPrice = Number(price.replace(/,/g, ""));
    const numericBedrooms = Number(bedrooms);
    const numericBathrooms = Number(bathrooms);
    const numericArea = areaSqft.trim() ? Number(areaSqft) : Number.NaN;
    const numericLatitude = latitude.trim() ? Number(latitude) : null;
    const numericLongitude = longitude.trim() ? Number(longitude) : null;

    if (!mainImage) {
      setIsError(true);
      setMessage("Choose an exterior photo to use as the listing cover.");
      return;
    }

    if (!title.trim() || !address.trim() || !city.trim() || !price.trim()) {
      setIsError(true);
      setMessage("Enter a title, address, city, and price.");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setIsError(true);
      setMessage("Enter a valid price greater than zero.");
      return;
    }

    if (
      !Number.isInteger(numericBedrooms) ||
      numericBedrooms < 0 ||
      !Number.isInteger(numericBathrooms) ||
      numericBathrooms < 0 ||
      !Number.isFinite(numericArea) ||
      numericArea <= 0
    ) {
      setIsError(true);
      setMessage("Enter valid room counts and an area greater than zero.");
      return;
    }

    if (
      (latitude.trim() || longitude.trim()) &&
      (numericLatitude === null ||
        numericLongitude === null ||
        !Number.isFinite(numericLatitude) ||
        !Number.isFinite(numericLongitude) ||
        Math.abs(numericLatitude) > 90 ||
        Math.abs(numericLongitude) > 180)
    ) {
      setIsError(true);
      setMessage("Enter both valid latitude and longitude values.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    const uploadedPaths: string[] = [];

    try {
      const imageEntries: string[] = [];
      const imagesToUpload = [mainImage, ...selectedImages];

      for (const [index, image] of imagesToUpload.entries()) {
        const response = await fetch(image.uri);
        if (!response.ok) {
          throw new Error(`Could not read ${image.name}.`);
        }

        const file = await response.arrayBuffer();
        const extension = image.name.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? "jpg";
        const path = `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, {
            contentType: image.mimeType ?? `image/${extension.toLowerCase()}`,
            upsert: false,
          });

        if (uploadError) throw uploadError;
        uploadedPaths.push(path);

        const { data } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path);
        imageEntries.push(
          JSON.stringify({ uri: data.publicUrl, category: image.category }),
        );
      }

      const { error } = await supabase.from("properties").insert({
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        type: `${propertyType} ${listingType.toLowerCase()}`,
        bedrooms: numericBedrooms,
        bathrooms: numericBathrooms,
        area_sqft: numericArea,
        address: address.trim(),
        city: city.trim(),
        latitude: numericLatitude,
        longitude: numericLongitude,
        images: imageEntries,
        is_featured: isFeatured,
        is_sold: false,
      });

      if (error) throw error;

      setTitle("");
      setAddress("");
      setCity("");
      setPrice("");
      setDescription("");
      setBedrooms("1");
      setBathrooms("1");
      setAreaSqft("");
      setLatitude("");
      setLongitude("");
      setIsFeatured(false);
      setMainImage(null);
      setSelectedImages([]);
      setIsError(false);
      setMessage("Property added successfully.");
      router.replace("/(root)/(tabs)");
    } catch (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove(uploadedPaths);
        if (cleanupError) {
          console.warn(
            "Could not remove incomplete property images:",
            cleanupError,
          );
        }
      }
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save the property. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f3f3f3] px-6">
        <MaterialCommunityIcons
          name="shield-lock-outline"
          size={38}
          color="#64748b"
        />
        <Text className="mt-3 text-base font-semibold text-slate-800">
          Admin access required
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f4f7f8]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-12 pt-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 flex-row items-center gap-3.5">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f2ff]">
              <MaterialCommunityIcons
                name="home-plus-outline"
                size={24}
                color="#1687d9"
              />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-slate-900">
                Add property
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                Create a new listing for your collection.
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Property details
            </Text>
          </View>

          <View className="gap-5">
            <PropertyField
              icon="format-title"
              label="Property title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Bright downtown apartment"
            />
            <View>
              <Text className="mb-2.5 text-sm font-semibold text-slate-800">
                Property category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PROPERTY_TYPES.map((option) => (
                  <ChoiceButton
                    key={option}
                    label={option}
                    selected={propertyType === option}
                    onPress={() => setPropertyType(option)}
                  />
                ))}
              </View>
            </View>
            <View>
              <Text className="mb-2.5 text-sm font-semibold text-slate-800">
                Listing type
              </Text>
              <View className="flex-row gap-2">
                {LISTING_TYPES.map((option) => (
                  <ChoiceButton
                    key={option}
                    label={option}
                    selected={listingType === option}
                    onPress={() => setListingType(option)}
                  />
                ))}
              </View>
            </View>
            <PropertyField
              icon="map-marker-outline"
              label="Street address"
              value={address}
              onChangeText={setAddress}
              placeholder="Building, street, or neighborhood"
            />
            <PropertyField
              icon="city-variant-outline"
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Mumbai"
            />
            <PropertyField
              icon="currency-inr"
              label={listingType === "For rent" ? "Monthly rent" : "Price"}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              keyboardType="decimal-pad"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <PropertyField
                  icon="bed-outline"
                  label="Bedrooms"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  placeholder="1"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <PropertyField
                  icon="shower"
                  label="Bathrooms"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  placeholder="1"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <PropertyField
              icon="ruler-square"
              label="Area (sq ft)"
              value={areaSqft}
              onChangeText={setAreaSqft}
              placeholder="e.g. 1100"
              keyboardType="decimal-pad"
            />
            <PropertyField
              icon="text-box-outline"
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the home, features, and nearby amenities"
              multiline
            />

            <View>
              <Text className="mb-2.5 text-sm font-semibold text-slate-800">
                Main exterior photo
              </Text>
              <Text className="mb-3 text-xs text-slate-500">
                This photo appears first on the property card and listing.
              </Text>
              <View className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                {mainImage ? (
                  <Image
                    source={{ uri: mainImage.uri }}
                    className="h-44 w-full rounded-lg bg-slate-100"
                    resizeMode="cover"
                    accessibilityLabel="Selected exterior cover photo"
                  />
                ) : (
                  <View className="h-44 w-full items-center justify-center rounded-lg bg-slate-100">
                    <MaterialCommunityIcons
                      name="home-city-outline"
                      size={34}
                      color="#748494"
                    />
                    <Text className="mt-2 text-sm text-slate-500">
                      Choose a photo of the outside of the property
                    </Text>
                  </View>
                )}
                <View className="mt-2 flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    onPress={pickMainImageFromGallery}
                    className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-[#eaf5fc] px-3"
                  >
                    <MaterialCommunityIcons
                      name="image-outline"
                      size={18}
                      color="#1687d9"
                    />
                    <Text className="text-sm font-semibold text-[#126eae]">
                      {mainImage ? "Change photo" : "Choose photo"}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Browse files for exterior photo"
                    onPress={pickMainImageFromFiles}
                    className="h-11 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white"
                  >
                    <MaterialCommunityIcons
                      name="folder-open-outline"
                      size={19}
                      color="#1687d9"
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            <View>
              <Text className="mb-2.5 text-sm font-semibold text-slate-800">
                Room photos
              </Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {IMAGE_CATEGORIES.map((option) => (
                  <ChoiceButton
                    key={option}
                    label={option}
                    selected={imageCategory === option}
                    onPress={() => setImageCategory(option)}
                  />
                ))}
              </View>
              <View className="flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  onPress={pickImageFromGallery}
                  className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3"
                >
                  <MaterialCommunityIcons
                    name="image-multiple-outline"
                    size={19}
                    color="#1687d9"
                  />
                  <Text className="text-sm font-semibold text-slate-700">
                    Gallery
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={pickImageFromFiles}
                  className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3"
                >
                  <MaterialCommunityIcons
                    name="folder-open-outline"
                    size={19}
                    color="#1687d9"
                  />
                  <Text className="text-sm font-semibold text-slate-700">
                    Browse files
                  </Text>
                </Pressable>
              </View>
              {selectedImages.length ? (
                <View className="mt-3 gap-2">
                  {selectedImages.map((image, index) => (
                    <View
                      key={`${image.uri}-${index}`}
                      className="flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-2"
                    >
                      <Image
                        source={{ uri: image.uri }}
                        className="h-14 w-14 rounded-md bg-slate-100"
                        resizeMode="cover"
                        accessibilityLabel={`${image.category} photo`}
                      />
                      <View className="min-w-0 flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-sm font-medium text-slate-800"
                        >
                          {image.name}
                        </Text>
                        <Text className="mt-0.5 text-xs text-slate-500">
                          {image.category}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${image.name}`}
                        onPress={() =>
                          setSelectedImages((current) =>
                            current.filter(
                              (_, imageIndex) => imageIndex !== index,
                            ),
                          )
                        }
                        className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={18}
                          color="#475569"
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text className="mt-2 text-xs text-slate-500">
                Choose a room label before selecting its photos. Photos upload
                to the property-images Supabase Storage bucket.
              </Text>
            </View>

            <View>
              <Text className="mb-2.5 text-sm font-semibold text-slate-800">
                Map coordinates (optional)
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <PropertyField
                    icon="map-marker-radius-outline"
                    label="Latitude"
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="19.0760"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1">
                  <PropertyField
                    icon="map-marker-radius"
                    label="Longitude"
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="72.8777"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isFeatured }}
              onPress={() => setIsFeatured((value) => !value)}
              className="flex-row items-center gap-3 py-1"
            >
              <MaterialCommunityIcons
                name={isFeatured ? "checkbox-marked" : "checkbox-blank-outline"}
                size={22}
                color={isFeatured ? "#1687d9" : "#748494"}
              />
              <Text className="text-sm font-medium text-slate-800">
                Show as a featured property
              </Text>
            </Pressable>
          </View>

          {message ? (
            <View
              accessibilityRole="alert"
              className={`mt-5 flex-row items-center gap-2.5 rounded-xl px-4 py-3 ${isError ? "bg-red-50" : "bg-emerald-50"}`}
            >
              <MaterialCommunityIcons
                name={isError ? "alert-circle-outline" : "check-circle-outline"}
                size={19}
                color={isError ? "#b42318" : "#087e5b"}
              />
              <Text
                className={`flex-1 text-sm ${isError ? "text-red-700" : "text-emerald-800"}`}
              >
                {message}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={createProperty}
            className="mt-7 min-h-14 flex-row items-center justify-center gap-2.5 rounded-xl bg-[#1687d9] px-4 py-3 active:bg-[#0875c3] disabled:opacity-60"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
            )}
            <Text className="font-semibold text-white">
              {isSubmitting ? "Adding property..." : "Add property"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PropertyFieldProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
  multiline?: boolean;
};

function ChoiceButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-10 flex-row items-center justify-center rounded-lg border px-3.5 ${selected ? "border-[#1687d9] bg-[#eaf5fc]" : "border-slate-200 bg-white"}`}
    >
      <Text
        className={`text-sm font-semibold ${selected ? "text-[#126eae]" : "text-slate-600"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PropertyField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: PropertyFieldProps) {
  return (
    <View>
      <Text className="mb-2.5 text-sm font-semibold text-slate-800">
        {label}
      </Text>
      <View
        className={`flex-row rounded-xl border border-slate-200 bg-white px-4 ${multiline ? "min-h-32 items-start py-3.5" : "h-14 items-center"}`}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color="#748494"
          style={{ marginTop: multiline ? 2 : 0 }}
        />
        <TextInput
          accessibilityLabel={label}
          className={`ml-3 flex-1 text-base text-slate-900 ${multiline ? "min-h-24 py-0" : "h-full py-0"}`}
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8792a2"
          textAlignVertical={multiline ? "top" : "center"}
          value={value}
        />
      </View>
    </View>
  );
}

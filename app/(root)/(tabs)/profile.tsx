import { useSupabase } from "@/hooks/useSupabase";
import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PROFILE_IMAGE_BUCKET = "property-images";

type UserProfile = {
  clerk_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const supabase = useSupabase();
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;
  const loadedUserId = useRef<string | null>(null);
  const requestedUserId = useRef<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    if (
      loadedUserId.current === user.id ||
      requestedUserId.current === user.id
    ) {
      return;
    }

    requestedUserId.current = user.id;
    setLoading(true);
    setErrorMessage("");

    try {
      const client = supabaseRef.current;
      const { data, error } = await client
        .from("users")
        .select("clerk_id, first_name, last_name, email, avatar_url, is_admin")
        .eq("clerk_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as UserProfile | null);
    } catch (error) {
      console.error("Could not load profile:", error);
      setErrorMessage("Some profile information could not be loaded.");
    } finally {
      loadedUserId.current = user.id;
      requestedUserId.current = null;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user?.id) return;

    setSavingAvatar(true);
    setErrorMessage("");
    let uploadedPath: string | undefined;
    const client = supabaseRef.current;

    try {
      const response = await fetch(asset.uri);
      if (!response.ok) throw new Error("Could not read the selected photo.");

      const contentType = asset.mimeType ?? "image/jpeg";
      const extension =
        contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const path = `avatars/${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await client.storage
        .from(PROFILE_IMAGE_BUCKET)
        .upload(path, await response.arrayBuffer(), {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;
      uploadedPath = path;
      const nextAvatarUrl = client.storage
        .from(PROFILE_IMAGE_BUCKET)
        .getPublicUrl(path).data.publicUrl;

      const { error } = await client
        .from("users")
        .update({ avatar_url: nextAvatarUrl })
        .eq("clerk_id", user.id);

      if (error) throw error;

      setProfile(
        (current) => current && { ...current, avatar_url: nextAvatarUrl },
      );
    } catch (error) {
      if (uploadedPath) {
        const { error: cleanupError } = await client.storage
          .from(PROFILE_IMAGE_BUCKET)
          .remove([uploadedPath]);
        if (cleanupError) {
          console.warn(
            "Could not remove incomplete avatar upload:",
            cleanupError,
          );
        }
      }
      console.error("Could not update avatar:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save the profile photo. Please try again.",
      );
    } finally {
      setSavingAvatar(false);
    }
  };

  const chooseAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        await saveAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error("Could not choose profile photo:", error);
      setErrorMessage("Could not open the photo gallery.");
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      console.error("Could not sign out:", error);
      setErrorMessage("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  };

  const openSystemSettings = () => {
    void Linking.openSettings().catch(() => {
      Alert.alert("Settings unavailable", "Could not open device settings.");
    });
  };

  const firstName = profile?.first_name?.trim() || "";
  const lastName = profile?.last_name?.trim() || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || "Your profile";
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}` || "U";
  const displayAvatar = profile?.avatar_url;

  return (
    <SafeAreaView className="flex-1 bg-[#f4f8fc]" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 36,
        }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[26px] font-bold text-[#152b45]">
              Profile
            </Text>
            <Text className="mt-1 text-sm text-[#718198]">
              Your account and property activity
            </Text>
          </View>
        </View>

        {errorMessage ? (
          <View className="mt-4 flex-row items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3.5 py-3">
            <Ionicons name="alert-circle-outline" size={18} color="#b42318" />
            <Text className="flex-1 text-sm text-red-700">{errorMessage}</Text>
          </View>
        ) : null}

        <View className="mt-6 overflow-hidden rounded-lg border border-[#dfe8f2] bg-white">
          <View className="items-center px-5 py-6">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose profile photo from gallery"
              disabled={savingAvatar}
              onPress={chooseAvatar}
              className="h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#d8e8f8] bg-[#eaf3ff]"
            >
              {loading ? (
                <ActivityIndicator color="#2878d0" />
              ) : displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  className="h-full w-full"
                  resizeMode="cover"
                  accessibilityLabel={`${displayName} profile photo`}
                />
              ) : (
                <Text className="text-3xl font-bold text-[#2878d0]">
                  {initials}
                </Text>
              )}
              <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#2878d0]">
                {savingAvatar ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="camera-outline" size={15} color="white" />
                )}
              </View>
            </Pressable>
            <Text className="mt-4 text-xl font-bold text-[#152b45]">
              {displayName}
            </Text>
            <Text className="mt-1 text-sm text-[#718198]">
              {profile?.email ?? ""}
            </Text>
            <View className="mt-3 rounded-full bg-[#eaf3ff] px-3 py-1">
              <Text className="text-xs font-semibold text-[#2878d0]">
                {profile?.is_admin ? "Administrator" : "Member"}
              </Text>
            </View>
            <Text className="mt-4 text-xs text-[#718198]">
              Tap your photo to change it
            </Text>
          </View>

          <View className="border-t border-[#edf1f6]">
            <ProfileMenuRow
              icon="heart-outline"
              label="Saved Properties"
              onPress={() => router.push("/(root)/(tabs)/save")}
            />
            <ProfileMenuRow
              icon="checkmark-circle-outline"
              label="Sold Properties"
              onPress={() => router.push("/(root)/sold" as never)}
            />
            <ProfileMenuRow
              icon="settings-outline"
              label="Settings"
              onPress={openSystemSettings}
            />
            <ProfileMenuRow
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => router.push("/(root)/support" as never)}
              last
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          disabled={signingOut}
          onPress={handleSignOut}
          className="mt-8 min-h-12 flex-row items-center justify-center gap-2 rounded-lg border border-[#e5b8bc] bg-white px-4"
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#c43f45" />
          ) : (
            <Ionicons name="log-out-outline" size={19} color="#c43f45" />
          )}
          <Text className="text-sm font-semibold text-[#b3343a]">
            {signingOut ? "Signing out..." : "Sign out"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileMenuRow({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 px-4 ${last ? "" : "border-b border-[#edf1f6]"}`}
    >
      <Ionicons name={icon} size={20} color="#718198" />
      <Text className="flex-1 text-sm font-medium text-[#152b45]">{label}</Text>
      <Ionicons name="chevron-forward" size={17} color="#a0aec0" />
    </Pressable>
  );
}

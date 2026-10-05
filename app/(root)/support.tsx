import { ADMIN_PHONE } from "@/lib/contact";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formattedPhone = `+${ADMIN_PHONE.slice(0, 2)} ${ADMIN_PHONE.slice(2, 7)} ${ADMIN_PHONE.slice(7)}`;

export default function SupportScreen() {
  const router = useRouter();
  const [openingContact, setOpeningContact] = useState(false);

  const openContact = async (url: string) => {
    if (openingContact) return;
    setOpeningContact(true);

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Could not open contact",
        "Try again or use the phone number shown on this page.",
      );
    } finally {
      setOpeningContact(false);
    }
  };

  const openWhatsApp = () => {
    const message = "Hi, I need help with StanzyLive.";
    void openContact(
      `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`,
    );
  };

  const callAdmin = () => {
    void openContact(`tel:${ADMIN_PHONE}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f8fc]" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 36,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="arrow-back" size={20} color="#152b45" />
        </Pressable>

        <View className="items-center pb-7 pt-2">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-[#e1efff]">
            <Ionicons name="headset-outline" size={39} color="#2878d0" />
          </View>
          <Text className="text-2xl font-bold text-[#152b45]">
            Help & Support
          </Text>
          <Text className="mt-2 max-w-[290px] text-center text-sm leading-5 text-[#718198]">
            Need help with a listing or planning a visit? Contact the StanzyLive
            admin.
          </Text>
        </View>

        <View className="rounded-lg border border-[#dfe8f2] bg-white p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#edf4ff]">
              <Ionicons
                name="person-circle-outline"
                size={25}
                color="#2878d0"
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-[#152b45]">
                Contact the admin
              </Text>
              <Text className="mt-0.5 text-sm text-[#718198]">
                Listing questions, pricing, and property visits
              </Text>
            </View>
          </View>

          <View className="my-5 h-px bg-[#edf1f6]" />

          <Text className="text-xs font-semibold uppercase text-[#718198]">
            Phone
          </Text>
          <Text className="mt-1 text-xl font-bold text-[#152b45]">
            {formattedPhone}
          </Text>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call the admin"
              disabled={openingContact}
              onPress={callAdmin}
              className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-[#2878d0] px-3"
            >
              <Ionicons name="call-outline" size={18} color="#ffffff" />
              <Text className="text-sm font-semibold text-white">Call</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Message the admin on WhatsApp"
              disabled={openingContact}
              onPress={openWhatsApp}
              className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-[#cbe8d5] bg-[#f0faf3] px-3"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="#21834b"
              />
              <Text className="text-sm font-semibold text-[#21834b]">
                WhatsApp
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-5 flex-row items-start gap-3 rounded-lg border border-[#dfe8f2] bg-white px-4 py-4">
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#2878d0"
          />
          <Text className="flex-1 text-sm leading-5 text-[#718198]">
            For faster help, include the property name or listing link in your
            message.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

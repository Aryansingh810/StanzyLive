import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Slot, usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

const tabs = [
  { key: "index", label: "Home", icon: "home", route: "/(root)/(tabs)" },
  {
    key: "save",
    label: "Save",
    icon: "bookmark",
    route: "/(root)/(tabs)/save",
  },
  {
    key: "search",
    label: "Search",
    icon: "magnify",
    route: "/(root)/(tabs)/search",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "account",
    route: "/(root)/(tabs)/profile",
  },
];

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="flex-1 bg-[#f3f3f3]">
      <View className="flex-1">
        <Slot />
      </View>

      <View className="absolute inset-x-0 bottom-0 w-full flex-row border-t border-slate-200 bg-white px-2 pb-5 pt-2">
        {tabs.map((tab) => {
          const isSelected =
            tab.key === "index"
              ? pathname === "/" || pathname.endsWith("/(tabs)")
              : pathname.endsWith(`/${tab.key}`);

          return (
            <Pressable
              key={tab.key}
              onPress={() => router.push(tab.route)}
              className="flex-1 items-center justify-center py-1"
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={24}
                color={isSelected ? "#2f9cff" : "#7d8797"}
              />

              <Text
                className={[
                  "mt-1 text-[11px] font-medium",
                  isSelected ? "text-[#2f9cff]" : "text-[#7d8797]",
                ].join(" ")}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

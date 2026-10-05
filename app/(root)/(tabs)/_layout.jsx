import { useUserStore } from "@/store/userStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Slot, usePathname, useRouter } from "expo-router";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function AndroidTabs() {
  const isAdmin = useUserStore((state) => state.isAdmin);
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabs = [
    { key: "index", label: "Home", icon: "home", route: "/(root)/(tabs)" },
    {
      key: "search",
      label: "Search",
      icon: "search",
      route: "/(root)/(tabs)/search",
    },
    ...(isAdmin
      ? [
          {
            key: "create",
            label: "Add Property",
            icon: "add-circle",
            route: "/(root)/(tabs)/create",
          },
        ]
      : []),
    {
      key: "save",
      label: "Saved",
      icon: "heart",
      route: "/(root)/(tabs)/save",
    },
    {
      key: "profile",
      label: "Profile",
      icon: "person",
      route: "/(root)/(tabs)/profile",
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">
        <Slot />
      </View>
      <View
        className="flex-row border-t border-slate-200 bg-white px-1 pt-2"
        style={{
          marginBottom: 16,
          paddingBottom: Math.max(insets.bottom, 8),
        }}
      >
        {tabs.map((tab) => {
          const isSelected =
            tab.key === "index"
              ? pathname === "/" || pathname.endsWith("/(tabs)")
              : pathname.endsWith(`/${tab.key}`);

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onPress={() => router.navigate(tab.route)}
              className="min-w-0 flex-1 items-center justify-center gap-1 py-1"
            >
              <Ionicons
                name={tab.key === "index" ? "home" : tab.icon}
                size={tab.key === "create" ? 25 : 23}
                color={
                  isSelected || tab.key === "create" ? "#2f9cff" : "#687386"
                }
              />
              <Text
                numberOfLines={1}
                className={`text-[10px] font-medium ${isSelected ? "text-[#2f9cff]" : "text-[#687386]"}`}
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

function IOSTabs() {
  const isAdmin = useUserStore((state) => state.isAdmin);

  return (
    <NativeTabs
      backgroundColor="#ffffff"
      blurEffect="systemMaterial"
      disableTransparentOnScrollEdge
      tintColor="#2f9cff"
    >
      <NativeTabs.Trigger name="index">
        <Icon src={<VectorIcon family={Ionicons} name="home" />} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon src={<VectorIcon family={Ionicons} name="search" />} />
        <Label>Search</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create" hidden={!isAdmin}>
        <Icon src={<VectorIcon family={Ionicons} name="add-circle" />} />
        <Label>Add Property</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="save">
        <Icon src={<VectorIcon family={Ionicons} name="heart" />} />
        <Label>Saved</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon src={<VectorIcon family={Ionicons} name="person" />} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabLayout() {
  return Platform.OS === "ios" ? <IOSTabs /> : <AndroidTabs />;
}

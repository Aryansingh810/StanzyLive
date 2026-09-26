import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function index() {
  return (
    <SafeAreaView className="flex-1 p-7">
      <View>
        <Text>Home</Text>
      </View>
    </SafeAreaView>
  );
}

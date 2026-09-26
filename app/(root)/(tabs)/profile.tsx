import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function profile() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handlesignout = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      console.log("Error signinig out:", error);
    }
  };
  return (
    <SafeAreaView>
      <Text>profile</Text>
      <TouchableOpacity onPress={handlesignout}>
        <Text>signout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

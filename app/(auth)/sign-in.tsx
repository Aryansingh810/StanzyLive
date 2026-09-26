import { useSignIn } from "@clerk/expo/legacy";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
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

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const passwordInput = useRef<TextInput | null>(null);
  const successScale = useRef(new Animated.Value(0.7)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!isLoaded || isSubmitting) return;

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        strategy: "password",
        identifier: email.trim(),
        password,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError(
          "This sign-in needs an additional verification step. Please try another sign-in method or contact support.",
        );
        return;
      }

      setIsSuccess(true);
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();

      await new Promise<void>((resolve) => setTimeout(resolve, 1100));
      await setActive({ session: result.createdSessionId });
    } catch (caughtError) {
      const clerkError = caughtError as {
        errors?: { longMessage?: string; message?: string }[];
      };
      setError(
        clerkError.errors?.[0]?.longMessage ??
          clerkError.errors?.[0]?.message ??
          "We could not sign you in. Check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-md flex-1 self-center justify-center px-5 py-8">
            <View className="mb-8 items-center">
              <Image
                source={require("../../assets/images/StanzyLive.png")}
                className="h-20 w-64"
                resizeMode="contain"
              />
            </View>

            <View className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200">
              {isSuccess ? (
                <View className="items-center py-10">
                  <Animated.View
                    className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
                    style={{
                      opacity: successOpacity,
                      transform: [{ scale: successScale }],
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={54}
                      color="#059669"
                    />
                  </Animated.View>
                  <Text className="mb-2 text-center text-2xl font-bold text-slate-900">
                    Good to see you again!
                  </Text>
                  <Text className="text-center text-base text-slate-500">
                    Welcome back to StanzyLive.
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="mb-2 text-3xl font-bold text-slate-900">
                    Welcome to StanzyLive
                  </Text>
                  <Text className="mb-7 text-base text-slate-500">
                    Sign in to pick up where you left off.
                  </Text>

                  <View className="mb-4 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <Ionicons name="mail-outline" size={20} color="#64748b" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-slate-900"
                      placeholder="Email address"
                      placeholderTextColor="#94a3b8"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInput.current?.focus()}
                    />
                  </View>

                  <View className="mb-4 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#64748b"
                    />
                    <TextInput
                      ref={passwordInput}
                      className="ml-3 flex-1 text-base text-slate-900"
                      placeholder="Password"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry={!isPasswordVisible}
                      textContentType="password"
                      returnKeyType="done"
                      onSubmitEditing={handleSignIn}
                    />
                    <Pressable
                      className="ml-2 h-10 w-10 items-center justify-center"
                      onPress={() =>
                        setIsPasswordVisible((visible) => !visible)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                      hitSlop={8}
                    >
                      <Ionicons
                        name={
                          isPasswordVisible ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color="#64748b"
                      />
                    </Pressable>
                  </View>

                  {error ? (
                    <Text
                      accessibilityRole="alert"
                      className="mb-3 text-sm leading-5 text-red-600"
                    >
                      {error}
                    </Text>
                  ) : null}

                  <Pressable
                    className={`h-14 items-center justify-center rounded-xl ${
                      isSubmitting
                        ? "bg-blue-400"
                        : "bg-blue-600 active:bg-blue-700"
                    }`}
                    onPress={handleSignIn}
                    disabled={isSubmitting || !isLoaded}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-base font-bold text-white">
                        Sign in
                      </Text>
                    )}
                  </Pressable>

                  <View className="mt-6 flex-row justify-center">
                    <Text className="text-sm text-slate-500">
                      Don’t have an account?{" "}
                    </Text>
                    <Link href="/sign-up" asChild>
                      <Pressable>
                        <Text className="text-sm font-semibold text-blue-600">
                          Sign up
                        </Text>
                      </Pressable>
                    </Link>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

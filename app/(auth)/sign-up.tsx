import { useSignUp } from "@clerk/expo/legacy";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useRef, useState } from "react";
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

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const scrollView = useRef<ScrollView | null>(null);
  const lastNameInput = useRef<TextInput | null>(null);
  const emailInput = useRef<TextInput | null>(null);
  const passwordInput = useRef<TextInput | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded || isSubmitting) return;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please complete all fields.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const loadingStartedAt = Date.now();

    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setVerificationCode("");
      setVerificationMessage("");
      setIsVerifying(true);
    } catch (caughtError) {
      const clerkError = caughtError as {
        errors?: { longMessage?: string; message?: string }[];
      };
      setError(
        clerkError.errors?.[0]?.longMessage ??
          clerkError.errors?.[0]?.message ??
          "We could not create your account. Please try again.",
      );
    } finally {
      const remainingLoadingTime = 2000 - (Date.now() - loadingStartedAt);

      if (remainingLoadingTime > 0) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, remainingLoadingTime),
        );
      }

      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isLoaded || isSubmitting) return;

    if (!verificationCode.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    setError("");
    setVerificationMessage("");
    setIsSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
      } else {
        setError(
          "The email is not verified yet. Check the code and try again.",
        );
      }
    } catch (caughtError) {
      const clerkError = caughtError as {
        errors?: { longMessage?: string; message?: string }[];
      };
      setError(
        clerkError.errors?.[0]?.longMessage ??
          clerkError.errors?.[0]?.message ??
          "We could not verify your email. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || isSubmitting) return;

    setError("");
    setVerificationMessage("");
    setIsSubmitting(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerificationMessage("A new verification code has been sent.");
    } catch (caughtError) {
      const clerkError = caughtError as {
        errors?: { longMessage?: string; message?: string }[];
      };
      setError(
        clerkError.errors?.[0]?.longMessage ??
          clerkError.errors?.[0]?.message ??
          "We could not resend the code. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollView}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 220 }}
          className="bg-white"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-md flex-1 self-center translate-y-8 justify-center px-5 py-2">
            <View className="items-center">
              <Image
                source={require("../../assets/images/StanzyLive.png")}
                className="mb-1 h-20 w-64"
                resizeMode="contain"
              />
            </View>

            <View className="translate-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200">
              <Text className="mb-2 text-3xl font-bold text-slate-900">
                Create Account
              </Text>
              <Text className="mb-7 text-base text-slate-500">
                {isVerifying
                  ? `Enter the verification code sent to ${email.trim()}.`
                  : "Find your dream home today."}
              </Text>

              {isVerifying ? (
                <>
                  <View className="mb-4 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <Ionicons name="keypad-outline" size={20} color="#64748b" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-slate-900"
                      placeholder="Email verification code"
                      placeholderTextColor="#94a3b8"
                      value={verificationCode}
                      onChangeText={(value) =>
                        setVerificationCode(value.replace(/\\D/g, ""))
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="number-pad"
                      maxLength={10}
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyEmail}
                    />
                  </View>
                  {error ? (
                    <Text className="mb-3 text-sm leading-5 text-red-600">
                      {error}
                    </Text>
                  ) : null}
                  {verificationMessage ? (
                    <Text className="mb-3 text-sm leading-5 text-emerald-700">
                      {verificationMessage}
                    </Text>
                  ) : null}
                  <Pressable
                    className={`h-14 items-center justify-center rounded-xl ${
                      isSubmitting
                        ? "bg-blue-400"
                        : "bg-blue-600 active:bg-blue-700"
                    }`}
                    onPress={handleVerifyEmail}
                    disabled={isSubmitting || !isLoaded}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-base font-bold text-white">
                        Verify email
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    className="mt-4 items-center py-2"
                    onPress={handleResendCode}
                    disabled={isSubmitting || !isLoaded}
                  >
                    <Text className="text-sm font-semibold text-blue-600">
                      Resend code
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View className="mb-4 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <Ionicons name="person-outline" size={20} color="#64748b" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-slate-900"
                      placeholder="First name"
                      placeholderTextColor="#94a3b8"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => lastNameInput.current?.focus()}
                    />
                  </View>

                  <View className="mb-4 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <Ionicons name="person-outline" size={20} color="#64748b" />
                    <TextInput
                      ref={lastNameInput}
                      className="ml-3 flex-1 text-base text-slate-900"
                      placeholder="Last name"
                      placeholderTextColor="#94a3b8"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => emailInput.current?.focus()}
                    />
                  </View>

                  <View className="mb-4 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <Ionicons name="mail-outline" size={20} color="#64748b" />
                    <TextInput
                      ref={emailInput}
                      className="ml-3 flex-1 text-base text-slate-900"
                      placeholder="Email address"
                      placeholderTextColor="#94a3b8"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInput.current?.focus()}
                    />
                  </View>

                  <View className="mb-3 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
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
                      returnKeyType="done"
                      onFocus={() =>
                        setTimeout(
                          () =>
                            scrollView.current?.scrollToEnd({ animated: true }),
                          100,
                        )
                      }
                      onSubmitEditing={handleSignUp}
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
                    <Text className="mb-3 text-sm leading-5 text-red-600">
                      {error}
                    </Text>
                  ) : null}

                  <Pressable
                    className={`h-14 items-center justify-center rounded-xl ${
                      isSubmitting
                        ? "bg-blue-400"
                        : "bg-blue-600 active:bg-blue-700"
                    }`}
                    onPress={handleSignUp}
                    disabled={isSubmitting || !isLoaded}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-base font-bold text-white">
                        Sign up
                      </Text>
                    )}
                  </Pressable>
                </>
              )}

              {!isVerifying ? (
                <View className="mt-6 flex-row justify-center">
                  <Text className="text-sm text-slate-500">
                    Already have an account?{" "}
                  </Text>
                  <Link href="/sign-in" asChild>
                    <Pressable>
                      <Text className="text-sm font-semibold text-blue-600">
                        Sign in
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

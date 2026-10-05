import { useSignIn } from "@clerk/expo/legacy";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
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

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const passwordInput = useRef<TextInput | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailAddressId, setEmailAddressId] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activateSession = async (sessionId: string) => {
    if (!setActive) return;
    await setActive({ session: sessionId });
    router.replace("/(root)/(tabs)");
  };

  const sendEmailCode = async (addressId: string) => {
    if (!signIn) return;
    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: addressId,
    });
    setEmailAddressId(addressId);
    setIsVerifyingCode(true);
    setError("");
  };

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

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession(result.createdSessionId);
        return;
      }

      if (
        result.status === "needs_client_trust" ||
        result.status === "needs_second_factor"
      ) {
        const factorInfo = result as typeof result & {
          supportedSecondFactors?: {
            strategy: string;
            emailAddressId?: string;
          }[];
        };
        const emailCodeFactor = factorInfo.supportedSecondFactors?.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailCodeFactor?.emailAddressId) {
          await sendEmailCode(emailCodeFactor.emailAddressId);
          return;
        }

        setError(
          "Clerk requires another verification method that this screen does not support.",
        );
        return;
      }

      setError(`Sign-in could not be completed (${result.status}).`);
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

  const handleVerifyCode = async () => {
    if (!isLoaded || !signIn || !setActive || isSubmitting) return;
    if (!verificationCode.trim()) {
      setError("Enter the verification code sent to your email.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: verificationCode.trim(),
      });

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession(result.createdSessionId);
      } else {
        setError(`Verification could not be completed (${result.status}).`);
      }
    } catch (caughtError) {
      const clerkError = caughtError as {
        errors?: { longMessage?: string; message?: string }[];
      };
      setError(
        clerkError.errors?.[0]?.longMessage ??
          clerkError.errors?.[0]?.message ??
          "That code could not be verified. Check it and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn || isSubmitting || !emailAddressId) return;
    setIsSubmitting(true);
    setError("");

    try {
      await signIn.prepareSecondFactor({
        strategy: "email_code",
        emailAddressId,
      });
      setVerificationCode("");
    } catch (caughtError) {
      const clerkError = caughtError as {
        errors?: { longMessage?: string; message?: string }[];
      };
      setError(
        clerkError.errors?.[0]?.longMessage ??
          clerkError.errors?.[0]?.message ??
          "Could not resend the verification code. Try again.",
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
              <>
                <Text className="mb-2 text-3xl font-bold text-slate-900">
                  Welcome to StanzyLive
                </Text>
                <Text className="mb-7 text-base text-slate-500">
                  {isVerifyingCode
                    ? `Enter the verification code sent to ${email.trim()}.`
                    : "Sign in to pick up where you left off."}
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

                {isVerifyingCode ? (
                  <View className="mb-4 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <Ionicons name="keypad-outline" size={20} color="#64748b" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-slate-900"
                      placeholder="Email verification code"
                      placeholderTextColor="#94a3b8"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyCode}
                    />
                  </View>
                ) : (
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
                )}

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
                  onPress={isVerifyingCode ? handleVerifyCode : handleSignIn}
                  disabled={isSubmitting || !isLoaded}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-base font-bold text-white">
                      {isVerifyingCode ? "Verify code" : "Sign in"}
                    </Text>
                  )}
                </Pressable>

                {isVerifyingCode ? (
                  <View className="mt-4 flex-row justify-center">
                    <Text className="text-sm text-slate-500">
                      Didn’t receive a code?{" "}
                    </Text>
                    <Pressable
                      onPress={handleResendCode}
                      disabled={isSubmitting}
                    >
                      <Text className="text-sm font-semibold text-blue-600">
                        Resend
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

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
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

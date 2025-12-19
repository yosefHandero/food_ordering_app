import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "@/lib/supabase-auth";
import useAuthStore from "@/store/auth.state";
import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

const SignIn = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await signIn({ email: form.email.trim(), password: form.password });
      await useAuthStore.getState().fetchAuthenticatedUser();
      router.replace("/");
    } catch (error: any) {
      const errorMessage = error.message || "Sign-in failed";
      if (
        errorMessage.includes("Invalid login credentials") ||
        errorMessage.includes("Email not confirmed")
      ) {
        setErrors({ password: "Invalid email or password" });
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-8">
          <View className="gap-6 bg-bg-tertiary rounded-3xl p-6 border border-bg-elevated/50">
            <View className="mb-2">
              <Text className="h2-bold text-text-primary mb-2">
                Welcome Back
              </Text>
              <Text className="paragraph-medium text-text-secondary">
                Sign in to continue to MealHop
              </Text>
            </View>

            <Input
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, email: text }));
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              label="Email"
              keyboardType="email-address"
              error={errors.email}
            />

            <Input
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, password: text }));
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              label="Password"
              secureTextEntry={true}
              error={errors.password}
            />

            <Button
              title="Sign In"
              isLoading={isSubmitting}
              onPress={submit}
              variant="primary"
              fullWidth
            />

            <View className="flex justify-center mt-4 flex-row gap-2">
              <Text className="paragraph-medium text-text-tertiary">
                Don&apos;t have an account?
              </Text>
              <Link
                href="/sign-up"
                className="paragraph-semibold text-accent-primary"
              >
                Sign Up
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;

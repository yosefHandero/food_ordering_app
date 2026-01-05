import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import useAuthStore from "@/store/auth.state";
import { Link, Redirect } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

const SignUp = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

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
      Alert.alert(
        "Error",
        "User registration is not available. Please implement a new authentication system."
      );
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create account";
      if (
        errorMessage.includes("already registered") ||
        errorMessage.includes("User already registered")
      ) {
        setErrors({ email: "This email is already registered" });
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
          <View className="gap-6 bg-white rounded-3xl p-6 border border-bg-elevated/40 shadow-medium">
            <View className="mb-2">
              <Text className="h2-bold text-text-primary mb-2">
                Create Account
              </Text>
              <Text className="paragraph-medium text-text-secondary">
                Join MealHop and start ordering delicious food
              </Text>
            </View>

            <Input
              placeholder="Enter your name"
              value={form.name}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, name: text }));
                if (errors.name)
                  setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              label="Full name"
              error={errors.name}
            />

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
              title="Sign Up"
              isLoading={isSubmitting}
              onPress={submit}
              variant="primary"
              fullWidth
            />

            <View className="flex justify-center mt-4 flex-row gap-2">
              <Text className="paragraph-medium text-text-tertiary">
                Already have an account?
              </Text>
              <Link
                href="/sign-in"
                className="paragraph-semibold text-accent-primary"
              >
                Sign In
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

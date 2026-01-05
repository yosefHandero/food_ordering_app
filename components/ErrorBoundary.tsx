import { ErrorBoundaryProps, ErrorBoundaryState } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import React, { Component, ErrorInfo } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 bg-bg-primary items-center justify-center px-5">
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            showsVerticalScrollIndicator={false}
          >
            <Card variant="elevated" className="items-center p-6 max-w-md">
              <View className="items-center mb-4">
                <View className="bg-accent-error/20 rounded-full p-4 mb-4">
                  <Ionicons name="alert-circle" size={48} color="#E63946" />
                </View>
                <Text className="h2-bold text-text-primary mb-2 text-center">
                  Something went wrong
                </Text>
                <Text className="paragraph-medium text-text-secondary text-center mb-4">
                  {this.state.error?.message || "An unexpected error occurred"}
                </Text>
              </View>
              <Button
                title="Try Again"
                onPress={this.handleReset}
                variant="primary"
                fullWidth
                leftIcon="refresh"
              />
            </Card>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

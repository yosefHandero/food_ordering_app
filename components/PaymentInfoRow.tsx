import { PaymentInfoRowProps } from "@/type";
import cn from "clsx";
import React from "react";
import { Text, View } from "react-native";

export const PaymentInfoRow: React.FC<PaymentInfoRowProps> = ({
  label,
  value,
  isTotal = false,
}) => (
  <View className="flex-row items-center justify-between my-2">
    <Text
      className={cn(
        "paragraph-medium",
        isTotal
          ? "text-text-primary font-quicksand-bold"
          : "text-text-secondary"
      )}
    >
      {label}
    </Text>
    <Text
      className={cn(
        "paragraph-semibold",
        isTotal ? "text-text-primary" : "text-text-primary"
      )}
    >
      {value}
    </Text>
  </View>
);

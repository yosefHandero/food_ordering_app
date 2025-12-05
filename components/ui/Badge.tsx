import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import cn from 'clsx';

interface BadgeProps {
  label: string | number;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  className,
}) => {
  const baseClasses = cn(
    'flex-row items-center justify-center rounded-full px-3 py-1.5',
    {
      'bg-accent-primary/20 border border-accent-primary/30': variant === 'primary',
      'bg-accent-success/20 border border-accent-success/30': variant === 'success',
      'bg-accent-secondary/20 border border-accent-secondary/30': variant === 'warning',
      'bg-accent-error/20 border border-accent-error/30': variant === 'error',
      'bg-bg-elevated border border-bg-elevated': variant === 'neutral',
      'px-2 py-1': size === 'sm',
      'px-3 py-1.5': size === 'md',
    },
    className
  );

  const textClasses = cn(
    'font-quicksand-semibold',
    {
      'text-accent-primary': variant === 'primary',
      'text-accent-success': variant === 'success',
      'text-accent-secondary': variant === 'warning',
      'text-accent-error': variant === 'error',
      'text-text-secondary': variant === 'neutral',
      'text-xs': size === 'sm',
      'text-sm': size === 'md',
    }
  );

  return (
    <View className={baseClasses}>
      {icon && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 12 : 14}
          color={
            variant === 'primary'
              ? '#FF6B35'
              : variant === 'success'
              ? '#00FF88'
              : variant === 'warning'
              ? '#FFB800'
              : variant === 'error'
              ? '#FF3366'
              : '#B3B3B3'
          }
          style={{ marginRight: 4 }}
        />
      )}
      <Text className={textClasses}>{label}</Text>
    </View>
  );
};


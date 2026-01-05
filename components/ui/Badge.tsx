import { BadgeProps } from '@/type';
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import cn from 'clsx';

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
      'bg-accent-primary/12 border border-accent-primary/25': variant === 'primary',
      'bg-accent-success/12 border border-accent-success/25': variant === 'success',
      'bg-accent-secondary/12 border border-accent-secondary/25': variant === 'warning',
      'bg-accent-error/12 border border-accent-error/25': variant === 'error',
      'bg-bg-elevated border border-bg-elevated/40': variant === 'neutral',
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
              ? '#E63946'
              : variant === 'success'
              ? '#2A9D8F'
              : variant === 'warning'
              ? '#F4A261'
              : variant === 'error'
              ? '#E63946'
              : '#878787'
          }
          style={{ marginRight: 4 }}
        />
      )}
      <Text className={textClasses}>{label}</Text>
    </View>
  );
};


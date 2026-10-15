import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'outline';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary-pressed',
  outline: 'border border-primary bg-card active:bg-primary-tint',
};

const DISABLED_CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-disabled',
  outline: 'border border-border bg-card',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-on-primary',
  outline: 'text-primary',
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  // Loading keeps the enabled colors; only an explicit disable greys out
  const inactive = disabled && !loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      className={`h-13 flex-row items-center justify-center rounded-full px-5 ${
        inactive ? DISABLED_CONTAINER[variant] : CONTAINER[variant]
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          colorClassName={variant === 'primary' ? 'accent-on-primary' : 'accent-primary'}
        />
      ) : (
        <Text
          className={`font-sans-semibold text-[16px] leading-[18px] ${
            inactive ? 'text-placeholder' : LABEL[variant]
          }`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

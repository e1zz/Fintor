import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  /** compact = 44pt (Register, SAT forms); default = 50pt */
  size?: 'default' | 'compact';
  containerClassName?: string;
};

export default function TextField({
  label,
  error,
  size = 'default',
  containerClassName = '',
  ...inputProps
}: TextFieldProps) {
  return (
    <View className={`gap-1.5 ${containerClassName}`}>
      {label ? <Text className="font-sans-medium text-xs text-muted">{label}</Text> : null}
      <TextInput
        placeholderTextColorClassName="accent-placeholder"
        accessibilityLabel={label}
        {...inputProps}
        className={`${size === 'compact' ? 'h-11' : 'h-12.5'} rounded-md border bg-card px-[15px] py-0 font-sans text-[14px] tracking-[-0.43px] text-ink ${
          error ? 'border-danger' : 'border-border'
        } focus:border-2 focus:border-primary focus:px-[14px]`}
      />
      {error ? <Text className="font-sans text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

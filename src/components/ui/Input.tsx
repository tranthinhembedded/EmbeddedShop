import React, {useState} from 'react';
import {TextInput, View, type TextInputProps} from 'react-native';

import {cn} from '../../design-system/cn';
import {useDesignSystemTheme} from '../../design-system/theme';

import Text from './Text';

export type InputProps = Omit<TextInputProps, 'className'> & {
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export default function Input({
  label,
  helperText,
  error,
  className,
  inputClassName,
  leftIcon,
  rightIcon,
  multiline = false,
  onFocus,
  onBlur,
  ...props
}: InputProps): React.JSX.Element {
  const {theme} = useDesignSystemTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View className={cn('w-full', className)}>
      {label ? (
        <Text
          className="mb-2 uppercase tracking-[1px]"
          variant="caption"
          color="muted"
          weight="semibold">
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          'flex-row border bg-input px-4',
          multiline
            ? 'min-h-[112px] items-start rounded-md py-3'
            : 'min-h-12 items-center rounded-md',
          error ? 'border-error' : focused ? 'border-ring' : 'border-border',
        )}>
        {leftIcon ? (
          <View className={cn('mr-3', multiline ? 'pt-1' : null)}>{leftIcon}</View>
        ) : null}

        <TextInput
          {...props}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={theme.colors.muted}
          className={cn(
            'flex-1 font-medium text-body text-foreground',
            multiline ? 'min-h-[88px] py-0' : '',
            inputClassName,
          )}
        />

        {rightIcon ? (
          <View className={cn('ml-3', multiline ? 'pt-1' : null)}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-2" variant="caption" color="error" weight="medium">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="mt-2" variant="caption" color="muted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

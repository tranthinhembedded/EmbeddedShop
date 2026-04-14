import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text as RNText,
  View,
  type PressableProps,
} from 'react-native';

import {cn} from '../../design-system/cn';
import {useDesignSystemTheme} from '../../design-system/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = PressableProps & {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'border border-border bg-surface',
  ghost: 'bg-transparent',
};

const textClasses: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 rounded-sm px-3',
  md: 'min-h-12 rounded-md px-4',
  lg: 'min-h-14 rounded-lg px-5',
};

const textSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-label',
  md: 'text-body',
  lg: 'text-body',
};

export default function Button({
  children,
  className,
  textClassName,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  ...props
}: ButtonProps): React.JSX.Element {
  const {theme} = useDesignSystemTheme();
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'primary'
      ? theme.colors.primaryForeground
      : variant === 'secondary'
        ? theme.colors.secondaryForeground
        : theme.colors.foreground;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center',
        fullWidth ? 'w-full' : 'self-start',
        sizeClasses[size],
        variantClasses[variant],
        isDisabled ? 'opacity-60' : null,
        className,
      )}>
      {loading ? (
        <View className="mr-2">
          <ActivityIndicator color={spinnerColor} />
        </View>
      ) : leftIcon ? (
        <View className="mr-2">{leftIcon}</View>
      ) : null}

      <RNText
        className={cn(
          'font-semibold',
          textClasses[variant],
          textSizeClasses[size],
          textClassName,
        )}>
        {children}
      </RNText>

      {!loading && rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
    </Pressable>
  );
}

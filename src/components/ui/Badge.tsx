import React from 'react';
import {View} from 'react-native';

import {cn} from '../../design-system/cn';

import Text from './Text';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

export type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-primary bg-primary-soft',
  success: 'border-success bg-success-soft',
  error: 'border-error bg-error-soft',
  warning: 'border-warning bg-warning-soft',
  info: 'border-info bg-info-soft',
};

const textVariantClasses: Record<BadgeVariant, string> = {
  default: 'text-primary',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'rounded-full px-2.5 py-1',
  md: 'rounded-full px-3 py-1.5',
  lg: 'rounded-full px-4 py-2',
};

const textSizeClasses: Record<BadgeSize, string> = {
  sm: 'text-caption',
  md: 'text-caption',
  lg: 'text-label',
};

export default function Badge({
  children,
  className,
  variant = 'default',
  size = 'md',
}: BadgeProps): React.JSX.Element {
  return (
    <View
      className={cn(
        'self-start border',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}>
      <Text
        className={cn(
          'uppercase tracking-[0.8px]',
          textVariantClasses[variant],
          textSizeClasses[size],
        )}
        variant="caption"
        weight="semibold">
        {children}
      </Text>
    </View>
  );
}

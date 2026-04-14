import React from 'react';
import {View, type ViewProps} from 'react-native';

import {cn} from '../../design-system/cn';

type CardVariant = 'default' | 'elevated' | 'outlined';

export type CardProps = ViewProps & {
  className?: string;
  variant?: CardVariant;
  children: React.ReactNode;
};

const variantClasses: Record<CardVariant, string> = {
  default: 'border-border bg-card',
  elevated: 'border-border bg-card shadow-elevation-md',
  outlined: 'border-border bg-transparent',
};

export default function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <View
      {...props}
      className={cn(
        'rounded-lg border p-4',
        variantClasses[variant],
        className,
      )}>
      {children}
    </View>
  );
}

import React from 'react';
import {Text as RNText, type TextProps as RNTextProps} from 'react-native';

import {cn} from '../../design-system/cn';

type TextVariant = 'heading' | 'body' | 'caption';
type TextColor =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type UITextProps = RNTextProps & {
  className?: string;
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
};

const variantClasses: Record<TextVariant, string> = {
  heading: 'font-sans text-title text-foreground',
  body: 'font-sans text-body text-foreground',
  caption: 'font-sans text-caption text-muted',
};

const colorClasses: Record<TextColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted',
  primary: 'text-primary',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

const weightClasses: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export default function Text({
  className,
  variant = 'body',
  color = 'default',
  weight = 'regular',
  children,
  ...props
}: UITextProps): React.JSX.Element {
  return (
    <RNText
      {...props}
      className={cn(
        variantClasses[variant],
        colorClasses[color],
        weightClasses[weight],
        className,
      )}>
      {children}
    </RNText>
  );
}

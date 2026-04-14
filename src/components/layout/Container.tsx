import React from 'react';
import {View, type ViewProps} from 'react-native';

import {cn} from '../../design-system/cn';

type ContainerSize = 'sm' | 'md' | 'lg';

export type ContainerProps = ViewProps & {
  className?: string;
  size?: ContainerSize;
  centered?: boolean;
  children: React.ReactNode;
};

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-content',
  md: 'max-w-prose',
  lg: 'max-w-page',
};

export default function Container({
  className,
  size = 'md',
  centered = false,
  children,
  ...props
}: ContainerProps): React.JSX.Element {
  return (
    <View
      {...props}
      className={cn(
        'w-full self-center px-4 sm:px-6',
        centered ? 'items-center' : null,
        sizeClasses[size],
        className,
      )}>
      {children}
    </View>
  );
}

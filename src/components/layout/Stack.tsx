import React from 'react';
import {View, type ViewProps} from 'react-native';

import {cn} from '../../design-system/cn';

type StackDirection = 'vertical' | 'horizontal';
type StackGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type StackAlign = 'start' | 'center' | 'end' | 'stretch';
type StackJustify = 'start' | 'center' | 'end' | 'between';

export type StackProps = ViewProps & {
  className?: string;
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  children: React.ReactNode;
};

const directionClasses: Record<StackDirection, string> = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
};

const gapClasses: Record<StackGap, string> = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const alignClasses: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export default function Stack({
  className,
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  children,
  ...props
}: StackProps): React.JSX.Element {
  return (
    <View
      {...props}
      className={cn(
        'w-full',
        directionClasses[direction],
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap ? 'flex-wrap' : null,
        className,
      )}>
      {children}
    </View>
  );
}

import React from 'react';
import {View, type ViewProps} from 'react-native';

import {cn} from '../../design-system/cn';

type GridColumns = 1 | 2 | 3 | 4;
type GridGap = 'sm' | 'md' | 'lg';

export type GridProps = ViewProps & {
  className?: string;
  columns?: GridColumns;
  smColumns?: GridColumns;
  mdColumns?: GridColumns;
  gap?: GridGap;
  children: React.ReactNode;
};

const gapClasses: Record<GridGap, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const baseColumnClasses: Record<GridColumns, string> = {
  1: 'basis-full',
  2: 'basis-[48%]',
  3: 'basis-[31%]',
  4: 'basis-[23%]',
};

const smColumnClasses: Record<GridColumns, string> = {
  1: 'sm:basis-full',
  2: 'sm:basis-[48%]',
  3: 'sm:basis-[31%]',
  4: 'sm:basis-[23%]',
};

const mdColumnClasses: Record<GridColumns, string> = {
  1: 'md:basis-full',
  2: 'md:basis-[48%]',
  3: 'md:basis-[31%]',
  4: 'md:basis-[23%]',
};

export default function Grid({
  className,
  columns = 1,
  smColumns,
  mdColumns,
  gap = 'md',
  children,
  ...props
}: GridProps): React.JSX.Element {
  return (
    <View
      {...props}
      className={cn(
        'w-full flex-row flex-wrap justify-between',
        gapClasses[gap],
        className,
      )}>
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          className={cn(
            baseColumnClasses[columns],
            smColumns ? smColumnClasses[smColumns] : null,
            mdColumns ? mdColumnClasses[mdColumns] : null,
          )}>
          {child}
        </View>
      ))}
    </View>
  );
}

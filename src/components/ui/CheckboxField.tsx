import React from 'react';
import {Pressable, View} from 'react-native';

import {cn} from '../../design-system/cn';

import Text from './Text';

export type CheckboxFieldProps = {
  checked: boolean;
  label: string;
  description?: string;
  error?: string;
  onChange: (nextValue: boolean) => void;
  className?: string;
};

export default function CheckboxField({
  checked,
  label,
  description,
  error,
  onChange,
  className,
}: CheckboxFieldProps): React.JSX.Element {
  return (
    <View className={cn('w-full', className)}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{checked}}
        className="flex-row items-start"
        onPress={() => onChange(!checked)}>
        <View
          className={cn(
            'mt-0.5 h-5 w-5 items-center justify-center rounded-[6px] border',
            checked ? 'border-primary bg-primary' : 'border-border bg-surface',
            error ? 'border-error' : null,
          )}>
          {checked ? (
            <Text className="text-[12px] text-primary-foreground" weight="bold">
              ✓
            </Text>
          ) : null}
        </View>

        <View className="ml-3 flex-1">
          <Text weight="semibold">{label}</Text>
          {description ? (
            <Text className="mt-1" variant="caption" color="muted">
              {description}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {error ? (
        <Text className="mt-2" variant="caption" color="error" weight="medium">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

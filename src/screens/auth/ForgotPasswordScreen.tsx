import React from 'react';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AppIcon} from '../../components/AppIcon';
import {Button, Input, Stack, Text} from '../../design-system';
import {useForgotPasswordMutation} from '../../hooks/useAuthMutations';
import type {AuthStackParamList} from '../../navigation/types';
import {getApiErrorMessage} from '../../services/httpClient';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../../validation/authSchemas';
import {AuthScaffold, AuthSwitchLink} from './AuthScaffold';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({
  navigation,
}: Props): React.JSX.Element {
  const forgotMutation = useForgotPasswordMutation();
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const submit = handleSubmit(async values => {
    await forgotMutation.mutateAsync(values);
    navigation.goBack();
  });

  return (
    <AuthScaffold
      eyebrow="RESET ACCESS"
      title="Request a password reset"
      subtitle="Enter your email and EmbeddedShop will queue a reset link through the auth service mock.">
      <Stack gap="md">
        {forgotMutation.error ? (
          <Text color="error">{getApiErrorMessage(forgotMutation.error)}</Text>
        ) : null}

        <Controller
          control={control}
          name="email"
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              label="Email"
              placeholder="admin@embeddedshop.app"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              helperText="We return a generic success message for security."
              leftIcon={<AppIcon name="user" size={18} color="#667A89" />}
            />
          )}
        />

        <Button
          loading={forgotMutation.isPending}
          onPress={submit}
          leftIcon={<AppIcon name="globe" size={16} color="#061018" />}>
          Send reset link
        </Button>
      </Stack>

      <AuthSwitchLink
        prompt="Remembered your password?"
        actionLabel="Back to login"
        onPress={() => navigation.navigate('Login')}
      />
    </AuthScaffold>
  );
}

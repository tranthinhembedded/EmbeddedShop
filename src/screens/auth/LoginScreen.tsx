import React, {useState} from 'react';
import {Pressable, View} from 'react-native';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AppIcon} from '../../components/AppIcon';
import {Button, Input, Stack, Text} from '../../design-system';
import {useLoginMutation} from '../../hooks/useAuthMutations';
import type {AuthStackParamList, RootStackParamList} from '../../navigation/types';
import {getApiErrorMessage} from '../../services/httpClient';
import {type LoginFormValues, loginSchema} from '../../validation/authSchemas';
import {
  AuthRememberRow,
  AuthScaffold,
  AuthSwitchLink,
} from './AuthScaffold';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

type DemoAccount = {
  key: 'admin' | 'member';
  label: string;
  email: string;
  password: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: 'admin',
    label: 'Admin',
    email: 'admin@embeddedshop.app',
    password: 'EmbeddedShop123',
  },
  {
    key: 'member',
    label: 'Member',
    email: 'demo@embeddedshop.app',
    password: 'Demo1234',
  },
];

export default function LoginScreen({navigation}: Props): React.JSX.Element {
  const rootNavigation =
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {errors},
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@embeddedshop.app',
      password: 'EmbeddedShop123',
      rememberMe: true,
    },
  });

  const rememberMe = watch('rememberMe');

  const applyDemoAccount = (account: DemoAccount) => {
    reset({
      email: account.email,
      password: account.password,
      rememberMe: true,
    });
  };

  const submit = handleSubmit(async values => {
    await loginMutation.mutateAsync(values);
    rootNavigation?.replace('MainTabs');
  });

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in with your email and password to continue."
      showDemoCredentials={false}
      footer={
        <AuthSwitchLink
          prompt="Don't have an account?"
          actionLabel="Create account"
          onPress={() => navigation.navigate('Register')}
        />
      }>
      <Stack gap="md">
        {loginMutation.error ? (
          <View className="flex-row items-center rounded-md border border-error bg-error-soft px-4 py-3">
            <View className="mr-3">
              <AppIcon name="info" size={16} color="#FF6B7C" />
            </View>
            <Text className="flex-1" variant="caption" color="error" weight="medium">
              {getApiErrorMessage(loginMutation.error)}
            </Text>
          </View>
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
              leftIcon={<AppIcon name="user" size={18} color="#667A89" />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              secureTextEntry={!showPassword}
              label="Password"
              placeholder="Enter your password"
              helperText="Use the admin demo account or switch below."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<AppIcon name="lock" size={18} color="#667A89" />}
              rightIcon={
                <Pressable
                  hitSlop={8}
                  onPress={() => setShowPassword(current => !current)}>
                  <AppIcon name="eye" size={18} color="#7D96AA" />
                </Pressable>
              }
            />
          )}
        />

        <AuthRememberRow
          checked={rememberMe}
          onChange={nextValue =>
            setValue('rememberMe', nextValue, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          error={errors.rememberMe?.message}
          onForgotPress={() => navigation.navigate('ForgotPassword')}
        />

        <Button
          loading={loginMutation.isPending}
          onPress={submit}
          leftIcon={<AppIcon name="user" size={16} color="#05111A" />}
          rightIcon={<AppIcon name="chevron-right" size={16} color="#05111A" />}>
          Sign in
        </Button>

        <Stack align="center" gap="sm" className="pt-1">
          <Text variant="caption" color="muted">
            Quick demo access
          </Text>
          <Stack direction="horizontal" gap="sm" justify="center">
            {DEMO_ACCOUNTS.map(account => (
              <Button
                key={account.key}
                fullWidth={false}
                size="sm"
                variant="outline"
                onPress={() => applyDemoAccount(account)}>
                {account.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </AuthScaffold>
  );
}

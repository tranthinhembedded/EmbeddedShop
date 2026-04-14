import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppIcon } from '../../components/AppIcon';
import { Button, Input, Stack, Text } from '../../design-system';
import { useRegisterMutation } from '../../hooks/useAuthMutations';
import type {
  AuthStackParamList,
  RootStackParamList,
} from '../../navigation/types';
import { getApiErrorMessage } from '../../services/httpClient';
import {
  type RegisterFormValues,
  registerSchema,
} from '../../validation/authSchemas';
import { AuthScaffold, AuthSwitchLink } from './AuthScaffold';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({
  navigation,
}: Props): React.JSX.Element {
  const rootNavigation =
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const registerMutation = useRegisterMutation();
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const submit = handleSubmit(async values => {
    await registerMutation.mutateAsync(values);
    rootNavigation?.replace('MainTabs');
  });

  return (
    <AuthScaffold
      title="Create your EmbeddedShop account"
      subtitle="Register with cross-field validation, MMKV persistence, and query-powered API mutations."
    >
      <Stack gap="md">
        {registerMutation.error ? (
          <Text color="error">
            {getApiErrorMessage(registerMutation.error)}
          </Text>
        ) : null}

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full name"
              placeholder="Nguyen Van A"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
              leftIcon={<AppIcon name="profile" size={18} color="#667A89" />}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              label="Email"
              placeholder="you@embeddedshop.app"
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
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              keyboardType="phone-pad"
              label="Phone"
              placeholder="0901234567"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
              leftIcon={<AppIcon name="globe" size={18} color="#667A89" />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              secureTextEntry
              label="Password"
              placeholder="At least 8 characters"
              helperText="Include uppercase, lowercase, and a number."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<AppIcon name="lock" size={18} color="#667A89" />}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              secureTextEntry
              label="Confirm password"
              placeholder="Re-enter your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<AppIcon name="lock" size={18} color="#667A89" />}
            />
          )}
        />

        <Controller
          control={control}
          name="acceptTerms"
          render={({ field: { value, onChange } }) => (
            <View>
              <View style={styles.termsRow}>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: '#1F3240', true: '#41D7FF' }}
                  thumbColor={value ? '#FFFFFF' : '#7D96AA'}
                />
                <Text style={styles.termsText}>
                  I accept the{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setTermsModalVisible(true)}
                  >
                    terms and conditions
                  </Text>
                </Text>
              </View>
              {errors.acceptTerms ? (
                <Text color="error" variant="caption" style={{ marginTop: 4 }}>
                  {errors.acceptTerms.message}
                </Text>
              ) : null}

              <Modal
                animationType="slide"
                transparent={true}
                visible={termsModalVisible}
                onRequestClose={() => setTermsModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text
                      variant="heading"
                      style={{ fontSize: 18, marginBottom: 12 }}
                    >
                      Điều khoản & Dịch vụ
                    </Text>
                    <ScrollView style={styles.modalScroll}>
                      <Text style={{ lineHeight: 22, color: '#A1B4C4' }}>
                        1. Bạn đồng ý tuân thủ toàn bộ các quy định an toàn khi
                        sử dụng nền tảng EmbeddedShop.{'\n\n'}
                        2. Các thiết bị bo mạch (Raspberry, Jetson) cần được sử
                        dụng đúng mục đích và không áp dụng vào các máy móc gây
                        hại.{'\n\n'}
                        3. Chúng tôi không lưu trữ dữ liệu cá nhân của bạn ngoài
                        email và thông tin bảo hành.{'\n\n'}
                      </Text>
                    </ScrollView>
                    <Stack
                      direction="horizontal"
                      gap="sm"
                      style={styles.modalActions}
                    >
                      <View style={{ flex: 1 }}>
                        <Button
                          variant="outline"
                          onPress={() => setTermsModalVisible(false)}
                        >
                          Đóng
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          onPress={() => {
                            onChange(true);
                            setTermsModalVisible(false);
                          }}
                        >
                          Tôi đồng ý
                        </Button>
                      </View>
                    </Stack>
                  </View>
                </View>
              </Modal>
            </View>
          )}
        />

        <Button
          loading={registerMutation.isPending}
          onPress={submit}
          leftIcon={<AppIcon name="user" size={16} color="#061018" />}
        >
          Create account
        </Button>
      </Stack>

      <AuthSwitchLink
        prompt="Already have an account?"
        actionLabel="Sign in"
        onPress={() => navigation.navigate('Login')}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsText: {
    color: '#7D96AA',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  termsLink: {
    color: '#41D7FF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 17, 26, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0F1F2D',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F3240',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  modalScroll: {
    marginVertical: 14,
  },
  modalActions: {
    marginTop: 8,
  },
});

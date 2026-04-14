import React, {useState} from 'react';
import {ScrollView, View} from 'react-native';

import {AppIcon} from '../../components/AppIcon';
import {
  Badge,
  Button,
  Card,
  Container,
  DesignSystemThemeProvider,
  Grid,
  Input,
  Stack,
  Text,
  useDesignSystemTheme,
  type ThemePreference,
} from '../../design-system';

function ThemePreferenceButton({
  label,
  preference,
  activePreference,
  onPress,
}: {
  label: string;
  preference: ThemePreference;
  activePreference: ThemePreference;
  onPress: (preference: ThemePreference) => void;
}): React.JSX.Element {
  return (
    <Button
      fullWidth={false}
      size="sm"
      variant={activePreference === preference ? 'primary' : 'outline'}
      onPress={() => onPress(preference)}>
      {label}
    </Button>
  );
}

function LoginExampleContent(): React.JSX.Element {
  const {mode, preference, setPreference, toggleTheme} = useDesignSystemTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError =
    submitted && !email.trim() ? 'Please enter your email address.' : undefined;
  const passwordError =
    submitted && password.trim().length < 6
      ? 'Password must be at least 6 characters.'
      : undefined;
  const iconColor = mode === 'dark' ? '#E8F3FF' : '#0C1821';
  const accentColor = mode === 'dark' ? '#41D7FF' : '#0E86FF';

  const handleSubmit = () => {
    setSubmitted(true);

    if (emailError || passwordError || !email.trim() || password.trim().length < 6) {
      return;
    }

    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 900);
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <Container size="sm" className="py-10">
        <Stack gap="lg">
          <Stack direction="horizontal" align="center" justify="between">
            <Badge variant="info">NativeWind Example</Badge>
            <Button
              fullWidth={false}
              size="sm"
              variant="ghost"
              onPress={toggleTheme}
              leftIcon={<AppIcon name="moon" size={16} color={accentColor} />}>
              {mode === 'dark' ? 'Dark' : 'Light'}
            </Button>
          </Stack>

          <Stack gap="sm">
            <Text variant="heading" weight="bold">
              Login Screen Example
            </Text>
            <Text color="muted">
              Screen demo nay su dung Container, Stack, Grid, Button, Input,
              Card, Text, Badge va theme switching bang NativeWind.
            </Text>
          </Stack>

          <Card variant="elevated" className="gap-4">
            <Stack gap="md">
              <Stack gap="sm">
                <Text variant="caption" color="muted" weight="semibold">
                  THEME PREFERENCE
                </Text>
                <Stack direction="horizontal" gap="sm" wrap>
                  <ThemePreferenceButton
                    label="System"
                    preference="system"
                    activePreference={preference}
                    onPress={setPreference}
                  />
                  <ThemePreferenceButton
                    label="Light"
                    preference="light"
                    activePreference={preference}
                    onPress={setPreference}
                  />
                  <ThemePreferenceButton
                    label="Dark"
                    preference="dark"
                    activePreference={preference}
                    onPress={setPreference}
                  />
                </Stack>
              </Stack>

              <Input
                label="Email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                helperText="Use any valid email format for the demo."
                leftIcon={<AppIcon name="user" size={18} color="#667A89" />}
                placeholder="alex@embeddedshop.ai"
              />

              <Input
                label="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                helperText="Minimum 6 characters."
                leftIcon={<AppIcon name="lock" size={18} color="#667A89" />}
                rightIcon={<AppIcon name="eye" size={18} color="#667A89" />}
                placeholder="Enter your password"
              />

              <Stack gap="sm">
                <Button
                  loading={submitting}
                  onPress={handleSubmit}
                  leftIcon={<AppIcon name="user" size={16} color="#061018" />}>
                  Sign in
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<AppIcon name="globe" size={16} color={iconColor} />}>
                  Continue with SSO
                </Button>
                <Button variant="ghost">Forgot password?</Button>
              </Stack>
            </Stack>
          </Card>

          <Grid columns={1} smColumns={2} gap="md">
            <Card variant="outlined">
              <Stack gap="sm">
                <Text variant="caption" color="muted" weight="semibold">
                  ACTIVE MODE
                </Text>
                <Badge variant={mode === 'dark' ? 'default' : 'success'}>
                  {mode}
                </Badge>
              </Stack>
            </Card>

            <Card variant="outlined">
              <Stack gap="sm">
                <Text variant="caption" color="muted" weight="semibold">
                  COMPONENTS USED
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Badge>Button</Badge>
                  <Badge variant="success">Input</Badge>
                  <Badge variant="warning">Card</Badge>
                  <Badge variant="info">Grid</Badge>
                </View>
              </Stack>
            </Card>
          </Grid>
        </Stack>
      </Container>
    </ScrollView>
  );
}

export default function LoginExampleScreen(): React.JSX.Element {
  return (
    <DesignSystemThemeProvider>
      <LoginExampleContent />
    </DesignSystemThemeProvider>
  );
}

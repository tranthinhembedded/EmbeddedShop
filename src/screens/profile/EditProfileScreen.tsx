import React, {useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/types';
import {useShopApp} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;
type FieldErrors = Partial<
  Record<'fullName' | 'email' | 'title' | 'bio', string>
>;

const alpha = (hex: string, value: number) => {
  const clean = hex.replace('#', '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map(character => `${character}${character}`)
          .join('')
      : clean;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${value})`;
};

const getInitials = (fullName: string) => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.length
    ? parts.map(part => part[0]?.toUpperCase() ?? '').join('')
    : 'ES';
};

export default function EditProfileScreen({
  navigation,
}: Props): React.JSX.Element {
  const {
    dark,
    profile,
    setProfile,
    emailPublic,
    setEmailPublic,
  } = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [title, setTitle] = useState(profile.title);
  const [bio, setBio] = useState(profile.bio);
  const [publicEmail, setPublicEmail] = useState(emailPublic);
  const [errors, setErrors] = useState<FieldErrors>({});

  const initials = useMemo(() => getInitials(fullName), [fullName]);

  const validateForm = () => {
    const nextErrors: FieldErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!title.trim()) {
      nextErrors.title = 'Professional title is required.';
    }

    if (!bio.trim() || bio.trim().length < 16) {
      nextErrors.bio = 'Add a short bio with at least 16 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveProfile = () => {
    if (!validateForm()) {
      return;
    }

    setProfile({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      title: title.trim(),
      bio: bio.trim(),
    });
    setEmailPublic(publicEmail);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />
      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[
                styles.backButton,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.backButtonLabel, {color: theme.text}]}>Back</Text>
            </Pressable>
            <Pressable onPress={saveProfile}>
              <Text style={[styles.linkLabel, {color: theme.accent}]}>Save</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: alpha(theme.panel, 0.96),
                borderColor: alpha(theme.border, 0.94),
              },
            ]}>
            <Text style={[styles.eyebrow, {color: theme.accent}]}>
              EDIT PROFILE
            </Text>
            <Text style={[styles.title, {color: theme.text}]}>
              Update your operator card
            </Text>
            <Text style={[styles.body, {color: theme.textMuted}]}>
              Change the identity details shown across the profile section and
              keep your account card current.
            </Text>

            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <View
                style={[
                  styles.avatar,
                  {backgroundColor: theme.accent},
                ]}>
                <Text style={styles.avatarLabel}>{initials}</Text>
              </View>
              <Text style={[styles.previewName, {color: theme.text}]}>
                {fullName.trim() || 'Your name'}
              </Text>
              <Text style={[styles.previewMeta, {color: theme.textMuted}]}>
                {publicEmail ? email.trim() || 'email@example.com' : 'Email hidden'}
              </Text>
              <Text style={[styles.previewTag, {color: theme.textMuted}]}>
                {title.trim() || 'Professional title'}
              </Text>
              <Text style={[styles.previewBio, {color: theme.textMuted}]}>
                {bio.trim() || 'A short profile bio appears here.'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: alpha(theme.panel, 0.96),
                borderColor: alpha(theme.border, 0.94),
              },
            ]}>
            <FieldBlock
              label="Full name"
              value={fullName}
              onChangeText={value => {
                setFullName(value);
                setErrors(previous => ({...previous, fullName: undefined}));
              }}
              theme={theme}
              error={errors.fullName}
            />
            <FieldBlock
              label="Email"
              value={email}
              onChangeText={value => {
                setEmail(value);
                setErrors(previous => ({...previous, email: undefined}));
              }}
              theme={theme}
              error={errors.email}
              keyboardType="email-address"
            />
            <FieldBlock
              label="Professional title"
              value={title}
              onChangeText={value => {
                setTitle(value);
                setErrors(previous => ({...previous, title: undefined}));
              }}
              theme={theme}
              error={errors.title}
            />
            <FieldBlock
              label="Bio"
              value={bio}
              onChangeText={value => {
                setBio(value);
                setErrors(previous => ({...previous, bio: undefined}));
              }}
              theme={theme}
              error={errors.bio}
              multiline
            />

            <View
              style={[
                styles.visibilityCard,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <View style={styles.visibilityCopy}>
                <Text style={[styles.visibilityTitle, {color: theme.text}]}>
                  Show email on profile
                </Text>
                <Text
                  style={[styles.visibilityDescription, {color: theme.textMuted}]}>
                  Toggle whether your email appears directly on the public profile
                  card.
                </Text>
              </View>
              <Switch
                value={publicEmail}
                onValueChange={setPublicEmail}
                trackColor={{false: alpha(theme.border, 0.8), true: theme.accent}}
                thumbColor={theme.surface}
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={saveProfile}
              style={[styles.primaryButton, {backgroundColor: theme.accent}]}>
              <Text style={styles.primaryButtonLabel}>Save changes</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldBlock({
  label,
  value,
  onChangeText,
  theme,
  error,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: typeof CONTROL_ROOM_THEME;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address';
}): React.JSX.Element {
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, {color: theme.textMuted}]}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.field,
          multiline ? styles.fieldMultiline : null,
          {
            color: theme.text,
            backgroundColor: alpha(theme.panelAlt, 0.92),
            borderColor: error ? theme.danger : alpha(theme.border, 0.92),
          },
        ]}
      />
      {error ? (
        <Text style={[styles.fieldError, {color: theme.danger}]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  visibilityCopy: {flex: 1},
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  previewCard: {
    marginTop: 18,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLabel: {
    color: '#061018',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  previewName: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  previewMeta: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  previewTag: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    fontWeight: '700',
  },
  previewBio: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  field: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  fieldMultiline: {
    minHeight: 112,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  fieldError: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  visibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  flexFill: {flex: 1},
  visibilityTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  visibilityDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1.2,
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#061018',
    fontSize: 16,
    fontWeight: '900',
  },
});

import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useRenderMetric} from '../../hooks/useRenderMetric';
import type {RootStackParamList} from '../../navigation/types';
import {useShopApp} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MapExam'>;

const INITIAL_REGION = {
  latitude: 10.776889,
  longitude: 106.700806,
  latitudeDelta: 0.018,
  longitudeDelta: 0.018,
};

const MAIN_MARKER = {
  latitude: 10.776889,
  longitude: 106.700806,
};

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

export default function MapExamScreen({
  navigation,
}: Props): React.JSX.Element {
  useRenderMetric('MapExam');

  const {dark} = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const googleProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

  const mapRef = useRef<MapView>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleGetLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Xin quyền vị trí',
            message: 'Ứng dụng cần quyền vị trí để tự động cập nhật bản đồ.',
            buttonNeutral: 'Để sau',
            buttonNegative: 'Từ chối',
            buttonPositive: 'Đồng ý',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Lỗi', 'Bạn đã từ chối quyền lấy vị trí (Location Permission).');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    setIsLocating(true);
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setUserLocation({latitude, longitude});
        setIsLocating(false);

        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.018,
            longitudeDelta: 0.018,
          },
          1000,
        );
      },
      error => {
        setIsLocating(false);
        Alert.alert('Lỗi mạng', `Không thể lấy toạ độ: ${error.message}`);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />

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

        <View
          style={[
            styles.badge,
            {
              backgroundColor: alpha(theme.accent, dark ? 0.18 : 0.12),
              borderColor: alpha(theme.accent, 0.26),
            },
          ]}>
          <Text style={[styles.badgeLabel, {color: theme.accent}]}>MAP EXAM</Text>
        </View>
      </View>

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: alpha(theme.panel, 0.96),
            borderColor: alpha(theme.border, 0.94),
          },
        ]}>
        <Text style={[styles.eyebrow, {color: theme.accent}]}>MAPS SETUP</Text>
        <Text style={[styles.title, {color: theme.text}]}>
          Ho Chi Minh City map showcase
        </Text>
        <Text style={[styles.body, {color: theme.textMuted}]}>
          The map starts at a fixed valid region in District 1 and includes one
          marker with a meaningful title and description, matching the chapter 9
          practice requirement.
        </Text>
      </View>

      <View
        style={[
          styles.mapCard,
          {
            backgroundColor: alpha(theme.panel, 0.98),
            borderColor: alpha(theme.border, 0.92),
          },
        ]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={googleProvider}
          initialRegion={INITIAL_REGION}
          showsCompass
          rotateEnabled
          pitchEnabled>
          <Marker
            coordinate={MAIN_MARKER}
            title="TP.HCM Study Marker"
            description="Fixed marker near Nguyen Hue / District 1 for the map exam screen."
          />
          {userLocation ? (
            <Marker
              coordinate={userLocation}
              title="Vị trí của bạn"
              pinColor="blue"
            />
          ) : null}
        </MapView>

        <View
          pointerEvents="none"
          style={[
            styles.mapInfoCard,
            {
              backgroundColor: dark
                ? alpha(theme.surface, 0.94)
                : alpha('#FFFFFF', 0.96),
              borderColor: alpha(theme.border, 0.86),
            },
          ]}>
          <Text style={[styles.mapInfoTitle, {color: theme.text}]}>
            Initial Region
          </Text>
          <Text style={[styles.mapInfoBody, {color: theme.textMuted}]}>
            Lat {INITIAL_REGION.latitude.toFixed(5)} | Lng {INITIAL_REGION.longitude.toFixed(5)}
          </Text>
          {userLocation ? (
            <Text
              style={[
                styles.mapInfoBody,
                {color: theme.accent, marginTop: 4, fontWeight: '700'},
              ]}>
              Vị trí của bạn: {userLocation.latitude.toFixed(5)} |{' '}
              {userLocation.longitude.toFixed(5)}
            </Text>
          ) : null}

          <Pressable
            disabled={isLocating}
            onPress={handleGetLocation}
            style={[
              styles.locationBtn,
              {backgroundColor: theme.accent},
              isLocating && {opacity: 0.7},
            ]}>
            {isLocating ? (
              <ActivityIndicator color="#061018" size="small" />
            ) : (
              <Text style={styles.locationBtnText}>Lấy vị trí hiện tại</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  mapCard: {
    flex: 1,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapInfoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mapInfoTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  mapInfoBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  locationBtn: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  locationBtnText: {
    color: '#061018',
    fontSize: 14,
    fontWeight: '800',
  },
});

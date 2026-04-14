import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import type {NavigationState, PartialState} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import EmbeddedShopApp from '../EmbeddedShopApp';
import {AppIcon} from '../components/AppIcon';
import {AppAlertProvider} from '../components/common/AppAlertProvider';
import Loading from '../components/common/Loading';
import type {RootStackParamList, MainTabParamList} from './types';
import ProductDetailScreen from '../screens/product/ProductDetailScreen';
import CheckoutScreen from '../screens/product/CheckoutScreen';
import OrderHistoryScreen from '../screens/profile/OrderHistoryScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ShippingAddressesScreen from '../screens/profile/ShippingAddressesScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import {ShopAppProvider, ShopTabId, useShopApp} from '../store/shopAppContext';
import {trackScreenVisit} from '../store/monitorStore';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../theme';
import {appLinking} from './linking';
import AdvancedLabScreen from '../screens/tools/AdvancedLabScreen';
import DiagnosticsScreen from '../screens/tools/DiagnosticsScreen';
import NotFoundScreen from '../screens/tools/NotFoundScreen';
import PostsExamScreen from '../screens/tools/PostsExamScreen';
import MapExamScreen from '../screens/tools/MapExamScreen';
import AIChatExamScreen from '../screens/tools/AIChatExamScreen';
import AuthNavigator from './AuthNavigator';
import ProductManagerScreen from '../screens/admin/ProductManagerScreen';
import {useAuthStore} from '../store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ROUTE_BY_ID: Record<ShopTabId, keyof MainTabParamList> = {
  home: 'Home',
  catalog: 'Search',
  saved: 'Favorites',
  cart: 'Cart',
  profile: 'Profile',
};

const TAB_LABEL_BY_ID: Record<Exclude<ShopTabId, 'profile'>, string> = {
  home: 'Home',
  catalog: 'Search',
  saved: 'Favorites',
  cart: 'Cart',
};

const TAB_ICON_BY_ID: Record<Exclude<ShopTabId, 'profile'>, 'home' | 'catalog' | 'saved' | 'cart'> = {
  home: 'home',
  catalog: 'catalog',
  saved: 'saved',
  cart: 'cart',
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

const getActiveRouteName = (
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | null => {
  if (!state?.routes?.length) {
    return null;
  }

  const route = state.routes[state.index ?? 0];

  if (route.state) {
    return getActiveRouteName(route.state) ?? route.name;
  }

  return route.name;
};

function ShopTabScene({
  tabId,
  stackNavigation,
}: {
  tabId: ShopTabId;
  stackNavigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
}): React.JSX.Element {
  const {dark} = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [profileTabLoading, setProfileTabLoading] = useState(false);
  const [tabTransitionTarget, setTabTransitionTarget] =
    useState<Exclude<ShopTabId, 'profile'> | null>(null);
  const profileTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabTransitionResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionTranslateY = useRef(new Animated.Value(12)).current;
  const transitionScale = useRef(new Animated.Value(0.96)).current;
  const profileLoadingOverlayStyle = {
    backgroundColor: dark ? theme.overlay : 'rgba(12, 24, 33, 0.18)',
  };
  const transitionOverlayStyle = {
    backgroundColor: dark ? alpha(theme.bg, 0.18) : 'rgba(12, 24, 33, 0.08)',
  };

  useEffect(() => {
    return () => {
      if (profileTransitionTimer.current) {
        clearTimeout(profileTransitionTimer.current);
      }
      if (tabTransitionTimer.current) {
        clearTimeout(tabTransitionTimer.current);
      }
      if (tabTransitionResetTimer.current) {
        clearTimeout(tabTransitionResetTimer.current);
      }
    };
  }, []);

  const handleTabChange = (nextTab: ShopTabId) => {
    if (nextTab === tabId) {
      return;
    }

    if (nextTab === 'profile' && tabId !== 'profile') {
      if (profileTransitionTimer.current) {
        clearTimeout(profileTransitionTimer.current);
      }

      setProfileTabLoading(true);
      profileTransitionTimer.current = setTimeout(() => {
        setProfileTabLoading(false);
        tabNavigation.navigate(TAB_ROUTE_BY_ID[nextTab]);
      }, 760);
      return;
    }

    if (nextTab !== 'profile' && tabId !== 'profile') {
      if (tabTransitionTimer.current) {
        clearTimeout(tabTransitionTimer.current);
      }
      if (tabTransitionResetTimer.current) {
        clearTimeout(tabTransitionResetTimer.current);
      }

      setTabTransitionTarget(nextTab);
      transitionOpacity.setValue(0);
      transitionTranslateY.setValue(12);
      transitionScale.setValue(0.96);

      Animated.parallel([
        Animated.timing(transitionOpacity, {
          toValue: 1,
          duration: 170,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(transitionTranslateY, {
          toValue: 0,
          speed: 16,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(transitionScale, {
          toValue: 1,
          speed: 16,
          bounciness: 7,
          useNativeDriver: true,
        }),
      ]).start();

      tabTransitionTimer.current = setTimeout(() => {
        tabNavigation.navigate(TAB_ROUTE_BY_ID[nextTab]);
        tabTransitionResetTimer.current = setTimeout(() => {
          setTabTransitionTarget(null);
          transitionOpacity.setValue(0);
        }, 260);
      }, 170);
      return;
    }

    tabNavigation.navigate(TAB_ROUTE_BY_ID[nextTab]);
  };

  return (
    <View style={styles.scene}>
    <EmbeddedShopApp
        activeTab={tabId}
        onTabChange={handleTabChange}
        onOpenProductDetail={(productId, tab) =>
          stackNavigation.navigate('ProductDetail', {productId, tab})
        }
        onOpenCheckout={(tab, params) =>
          stackNavigation.navigate('Checkout', {tab, ...params})
        }
        onOpenOrders={tab => stackNavigation.navigate('OrderHistory', {tab})}
        onOpenEditProfile={tab => stackNavigation.navigate('EditProfile', {tab})}
        onOpenShippingAddresses={tab =>
          stackNavigation.navigate('ShippingAddresses', {tab})
        }
        onOpenPaymentMethods={tab =>
          stackNavigation.navigate('PaymentMethods', {tab})
        }
        onOpenSettings={tab => stackNavigation.navigate('Settings', {tab})}
        onLogout={() => stackNavigation.reset({index: 0, routes: [{name: 'Auth'}]})}
      />

      {profileTabLoading ? (
        <View
          style={[
            styles.profileLoadingOverlay,
            profileLoadingOverlayStyle,
          ]}>
          <View
            style={[
              styles.profileLoadingPanel,
              {
                backgroundColor: dark ? theme.surface : theme.surfaceRaised,
                borderColor: theme.border,
              },
            ]}>
            <Loading
              label="Loading profile"
              detail="Syncing account stats, saved settings, and procurement preferences."
              color={theme.accent}
              secondaryColor={theme.lime}
              textColor={theme.text}
              detailColor={theme.textMuted}
              trackColor={dark ? 'rgba(65, 215, 255, 0.14)' : 'rgba(14, 134, 255, 0.14)'}
            />
          </View>
        </View>
      ) : null}

      {tabTransitionTarget ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabTransitionOverlay,
            transitionOverlayStyle,
            {opacity: transitionOpacity},
          ]}>
          <Animated.View
            style={[
              styles.tabTransitionCard,
              {
                backgroundColor: dark ? theme.surface : theme.surfaceRaised,
                borderColor: theme.border,
                transform: [
                  {translateY: transitionTranslateY},
                  {scale: transitionScale},
                ],
              },
            ]}>
            <View
              style={[
                styles.tabTransitionIconWrap,
                {backgroundColor: alpha(theme.accent, dark ? 0.16 : 0.1)},
              ]}>
              <AppIcon
                name={TAB_ICON_BY_ID[tabTransitionTarget]}
                size={18}
                color={theme.accent}
              />
            </View>
            <Text style={[styles.tabTransitionLabel, {color: theme.text}]}>
              {TAB_LABEL_BY_ID[tabTransitionTarget]}
            </Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function MainTabs(): React.JSX.Element {
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'MainTabs'>>();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {display: 'none'},
        animation: 'fade',
      }}>
      <Tab.Screen name="Home">
        {() => <ShopTabScene tabId="home" stackNavigation={stackNavigation} />}
      </Tab.Screen>
      <Tab.Screen name="Search">
        {() => <ShopTabScene tabId="catalog" stackNavigation={stackNavigation} />}
      </Tab.Screen>
      <Tab.Screen name="Favorites">
        {() => <ShopTabScene tabId="saved" stackNavigation={stackNavigation} />}
      </Tab.Screen>
      <Tab.Screen name="Cart">
        {() => <ShopTabScene tabId="cart" stackNavigation={stackNavigation} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <ShopTabScene tabId="profile" stackNavigation={stackNavigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator(): React.JSX.Element {
  const lastRouteNameRef = React.useRef<string | null>(null);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <ShopAppProvider>
      <AppAlertProvider>
        <NavigationContainer
          linking={appLinking}
          fallback={<Loading compact label="Resolving route" />}
          onReady={() => {
            lastRouteNameRef.current = 'Splash';
            trackScreenVisit('Splash');
          }}
          onStateChange={state => {
            const routeName = getActiveRouteName(state);

            if (routeName && routeName !== lastRouteNameRef.current) {
              lastRouteNameRef.current = routeName;
              trackScreenVisit(routeName);
            }
          }}>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Splash">
              {({navigation}) => (
                <SplashScreen
                  isAuthenticated={isAuthenticated}
                  onReady={authenticated =>
                    navigation.replace(authenticated ? 'MainTabs' : 'Auth')
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen
              name="ShippingAddresses"
              component={ShippingAddressesScreen}
            />
            <Stack.Screen
              name="PaymentMethods"
              component={PaymentMethodsScreen}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ProductManager" component={ProductManagerScreen} />
            <Stack.Screen name="AdvancedLab" component={AdvancedLabScreen} />
            <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} />
            <Stack.Screen name="PostsExam" component={PostsExamScreen} />
            <Stack.Screen name="MapExam" component={MapExamScreen} />
            <Stack.Screen name="AIChatExam" component={AIChatExamScreen} />
            <Stack.Screen name="NotFound" component={NotFoundScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppAlertProvider>
    </ShopAppProvider>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
  profileLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 30,
  },
  profileLoadingPanel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  tabTransitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 24,
  },
  tabTransitionCard: {
    minWidth: 136,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTransitionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tabTransitionLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

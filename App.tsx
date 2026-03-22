/**
 * EmbeddedShop - Modern E-Commerce UI (Shopify-style)
 */
/* eslint-disable react-native/no-inline-styles, react/no-unstable-nested-components */
import React, { useState, createContext, useContext, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput,
  Image, Animated, useColorScheme, Switch, Modal, Dimensions,
  AccessibilityInfo, KeyboardAvoidingView, Platform, StatusBar,
  ActivityIndicator, Alert, Share, RefreshControl,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// ─── ALL IMAGES AT MODULE LEVEL (fixes require() in component hooks issue) ────
const IMG_HEADPHONES = require('./assets/images/product_headphones.png');
const IMG_WATCH = require('./assets/images/product_smartwatch.png');
const IMG_SNEAKERS = require('./assets/images/product_sneakers.png');
const IMG_SUNGLASSES = require('./assets/images/product_sunglasses.png');
const IMG_BAG = require('./assets/images/product_bag.png');
const IMG_PERFUME = require('./assets/images/product_perfume.png');
const IMG_HERO = require('./assets/images/hero_banner.png');

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = (W - 16 * 2 - 10) / 2;

// ─── TOKENS ───────────────────────────────────────────────────────────────────
// ─── MODERN E-COMMERCE PALETTE ────────────────────────────────────────────────
const T_LIGHT = {
  bg: '#FFFFFF',         // Nền chính trắng
  surface: '#F8F8FD',    // Nền card hơi phớt tím siêu nhẹ
  surfaceEl: '#EFEBFA',  // Nút nhạt, element nổi
  text: '#1A1829',       // Chữ đen ám tím
  textMuted: '#716A8C',  // Chữ xám tím
  border: '#E8E5F2',     // Viền nhạt
  accent: '#A800FF',     // MÀU NHẤN: Tím Neon chói
  accentSoft: '#F4E5FF', // Nền tím siêu nhạt
  primary: '#7B00FF',    // Tím đậm hơn
  tag: '#F3E8FF',        // Nền tag
  tagText: '#A800FF',    // Chữ tím trong tag
  success: '#10B981',    // Xanh lá báo hiệu
  star: '#FFB800',       // Vàng sao
  old: '#A09CBD',        // Gạch ngang giá cũ
};

const T_DARK = {
  bg: '#050D14',         // Nền siêu tối hơi ngả xanh dương/đen
  surface: '#0B1521',    // Nền card
  surfaceEl: '#132233',  // Element nổi
  text: '#E0F2FE',       // Chữ trắng ngả xanh
  textMuted: '#6B8A9E',  // Chữ xám xanh
  border: '#1E2F3F',     // Viền xanh tối
  accent: '#8cdea8ff',     // MÀU NHẤN: Cyan Neon rực rỡ
  accentSoft: '#002B33', // Nền xanh cyan siêu tối
  primary: '#00CCFF',    // Xanh dương nhạt rực
  tag: '#0D2B36',        // Nền tag xanh rêu
  tagText: '#00FFE5',    // Chữ tag
  success: '#39FF14',    // Xanh Neon chói lọi
  star: '#FFE600',       // Vàng sao rực rỡ
  old: '#4F6C85',        // Gạch ngang
};
type Tok = typeof T_LIGHT;

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const ThemeCtx = createContext<{ tok: Tok; dark: boolean; toggle: () => void }>({
  tok: T_LIGHT, dark: false, toggle: () => { },
});
const useTok = () => useContext(ThemeCtx);

// ─── TOAST GLOBAL ─────────────────────────────────────────────────────────────
let _toast: (m: string, k?: 'ok' | 'err' | 'info') => void = () => { };
const showToast = (m: string, k?: 'ok' | 'err' | 'info') => _toast(m, k);

// ─── PRODUCT DATA ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: '1', name: 'Pro Wireless Headphones', brand: 'SoundElite', price: 199.99, orig: 259.99, rating: 4.8, sold: 3240, badge: 'HOT', image: IMG_HEADPHONES },
  { id: '2', name: 'Smart Watch S3 Ultra', brand: 'Timex Pro', price: 299.99, orig: 399.99, rating: 4.9, sold: 1870, badge: 'NEW', image: IMG_WATCH },
  { id: '3', name: 'Urban Street Kicks', brand: 'KickLux', price: 129.99, orig: 159.99, rating: 4.6, sold: 5001, badge: 'SALE', image: IMG_SNEAKERS },
  { id: '4', name: 'Gold Aviator Shades', brand: 'Vista Ray', price: 89.99, orig: 89.99, rating: 4.7, sold: 740, badge: null, image: IMG_SUNGLASSES },
  { id: '5', name: 'Leather Crossbody Bag', brand: 'Maren', price: 159.99, orig: 219.99, rating: 4.8, sold: 1260, badge: null, image: IMG_BAG },
  { id: '6', name: 'Luxe Noir Perfume', brand: 'Maison Éclat', price: 249.99, orig: 299.99, rating: 4.9, sold: 930, badge: 'LUXURY', image: IMG_PERFUME },
];
const CATS = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'tech', label: 'Tech', icon: '🎧' },
  { id: 'fashion', label: 'Fashion', icon: '👟' },
  { id: 'beauty', label: 'Beauty', icon: '🌸' },
  { id: 'bags', label: 'Bags', icon: '👜' },
  { id: 'luxury', label: 'Luxury', icon: '💎' },
];
const BADGE_COLOR: Record<string, string> = {
  HOT: '#E94560', NEW: '#34C759', SALE: '#FF8C00', LUXURY: '#9B59B6',
};

const ORDERS = [
  { id: 'ORD-8291', date: 'Oct 14, 2023', status: 'Delivered', total: 199.99, items: 1, items_list: [{ ...PRODUCTS[0], qty: 1 }] },
  { id: 'ORD-7724', date: 'Sep 28, 2023', status: 'In Transit', total: 429.98, items: 2, items_list: [{ ...PRODUCTS[1], qty: 1 }, { ...PRODUCTS[2], qty: 1 }] },
  { id: 'ORD-6102', date: 'Sep 15, 2023', status: 'Processing', total: 89.99, items: 1, items_list: [{ ...PRODUCTS[3], qty: 1 }] },
  { id: 'ORD-5501', date: 'Aug 30, 2023', status: 'Cancelled', total: 159.99, items: 1, items_list: [{ ...PRODUCTS[4], qty: 1 }] },
];

const ORDER_STATUS_COLOR: Record<string, string> = {
  Delivered: '#10B981',
  'In Transit': '#3B82F6',
  Processing: '#F59E0B',
  Cancelled: '#EF4444',
};

const disc = (o: number, p: number) => Math.round(((o - p) / o) * 100);
const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
const Stars = ({ r }: { r: number }) => {
  const { tok } = useTok();
  return <Text style={{ color: tok.star, fontSize: 11, letterSpacing: 1 }}>{[1, 2, 3, 4, 5].map(s => s <= Math.round(r) ? '★' : '☆').join('')}</Text>;
};

const BadgePill = ({ label }: { label: string }) => (
  <View style={[s.badge, { backgroundColor: BADGE_COLOR[label] ?? '#888' }]}>
    <Text style={s.badgeTxt}>{label}</Text>
  </View>
);

// ─── ADVANCED MICRO COMPONENTS ───────────────────────────────────────────────
const CButton = ({
  label, onPress, variant = 'primary', size = 'md', loading, disabled, leftIcon, rightIcon, style
}: any) => {
  const { tok } = useTok();

  const bg = variant === 'primary' ? tok.accent : variant === 'secondary' ? tok.surfaceEl : 'transparent';
  const color = variant === 'primary' ? '#fff' : tok.text;
  const border = variant === 'outline' ? 1.5 : 0;
  const borderColor = variant === 'outline' ? tok.accent : 'transparent';

  const py = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const px = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  const fz = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[{
        backgroundColor: bg, borderRadius: 12, paddingVertical: py, paddingHorizontal: px,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: border, borderColor: borderColor, opacity: disabled ? 0.5 : 1
      }, style]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : (
        <>
          {!!leftIcon && <Text style={{ fontSize: fz }}>{leftIcon}</Text>}
          <Text style={{ color: color, fontWeight: '800', fontSize: fz }}>{label}</Text>
          {!!rightIcon && <Text style={{ fontSize: fz }}>{rightIcon}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
};

const CInput = ({ label, value, onChange, placeholder, error, helperText, leftIcon, rightIcon, ...props }: any) => {
  const { tok } = useTok();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      {!!label && <Text style={{ fontSize: 13, fontWeight: '700', color: tok.text, marginBottom: 8, marginLeft: 4 }}>{label}</Text>}
      <View style={{
        flexDirection: 'row', alignItems: 'center', backgroundColor: tok.surface, borderRadius: 16,
        borderWidth: 1.5, borderColor: error ? '#FF4444' : (isFocused ? tok.accent : tok.border),
        paddingHorizontal: 12, height: 56
      }}>
        {!!leftIcon && <Text style={{ fontSize: 18, marginRight: 10 }}>{leftIcon}</Text>}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={tok.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ flex: 1, color: tok.text, fontSize: 15, fontWeight: '600' }}
          {...props}
        />
        {!!rightIcon && <Text style={{ fontSize: 18, marginLeft: 10 }}>{rightIcon}</Text>}
      </View>
      {error ? (
        <Text style={{ color: '#FF4444', fontSize: 11, marginTop: 4, marginLeft: 4, fontWeight: '700' }}>{error}</Text>
      ) : helperText ? (
        <Text style={{ color: tok.textMuted, fontSize: 11, marginTop: 4, marginLeft: 4 }}>{helperText}</Text>
      ) : null}
    </View>
  );
};

// ─── SKELETON ────────────────────────────────────────────────────────────────
const Skel = ({ w, h, br = 8, style }: any) => {
  const { tok } = useTok();
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.9, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View style={[{ width: w, height: h, borderRadius: br, backgroundColor: tok.border, opacity: anim }, style]} />
  );
};

// ─── VOICE SEARCH MODAL ──────────────────────────────────────────────────────
const VoiceSearchModal = ({ visible, onClose, onResult }: any) => {
  const { tok } = useTok();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      );
      loop.start();

      const timer = setTimeout(() => {
        onResult('Wireless Headphones');
        onClose();
      }, 2500);
      return () => {
        loop.stop();
        clearTimeout(timer);
        anim.setValue(0);
      };
    }
  }, [anim, onClose, onResult, visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[s.modalBackdrop, { backgroundColor: 'rgba(5,13,20,0.92)' }]}>
        <Animated.View style={{ scaleX: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }), scaleY: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }), opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }) }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: tok.accent }} />
        </Animated.View>
        <TouchableOpacity style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: tok.accent, alignItems: 'center', justifyContent: 'center', elevation: 10 }}>
          <Text style={{ fontSize: 32 }}>🎙️</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 140 }}>Listening...</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 10 }}>Try saying "Wireless Headphones"</Text>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 40, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
          <Text style={{ color: '#fff' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ─── BOTTOM SHEET ────────────────────────────────────────────────────────────
const Sheet = ({ visible, onClose, title, children }: any) => {
  const { tok } = useTok();
  const slide = useRef(new Animated.Value(H)).current;
  // Always call the effect, just respond to visible change
  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : H,
      useNativeDriver: true,
      damping: 22,
      stiffness: 200,
    }).start();
  }, [slide, visible]);

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <TouchableOpacity style={[s.backdrop]} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[s.sheet, { backgroundColor: tok.surface, transform: [{ translateY: slide }] }]}>
        <View style={[s.sheetPill, { backgroundColor: tok.border }]} />
        <View style={[s.sheetHead, { borderBottomColor: tok.border }]}>
          <Text style={[s.sheetTitle, { color: tok.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close"><Text style={{ color: tok.accent, fontSize: 18, fontWeight: '700' }}>✕</Text></TouchableOpacity>
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
const Toast = () => {
  const { tok } = useTok();
  const [msg, setMsg] = useState('');
  const [kind, setKind] = useState<'ok' | 'err' | 'info'>('info');
  const [show, setShow] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    _toast = (m, k = 'info') => {
      setMsg(m);
      setKind(k as any);
      setShow(true);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.spring(ty, { toValue: 0, useNativeDriver: true, speed: 30 }),
        ]),
        Animated.delay(2400),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(ty, { toValue: 30, duration: 220, useNativeDriver: true }),
        ]),
      ]).start(() => setShow(false));
    };
  }, [opacity, ty]);

  if (!show) return null;
  const bg = kind === 'ok' ? tok.success : kind === 'err' ? tok.accent : tok.primary;
  const icon = kind === 'ok' ? '✓' : kind === 'err' ? '✕' : '✦';
  return (
    <Animated.View style={[s.toast, { backgroundColor: bg, opacity, transform: [{ translateY: ty }] }]}>
      <Text style={{ color: '#fff', fontSize: 15, marginRight: 8 }}>{icon}</Text>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{msg}</Text>
    </Animated.View>
  );
};

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
const Navbar = ({ cartCount, onCart, dark, toggle }: any) => {
  const { tok } = useTok();
  return (
    <View style={[s.navbar, { backgroundColor: tok.surface, borderBottomColor: tok.border }]}>
      <View>
        <Text style={[s.navLogo, { color: tok.accent }]}>Embedded<Text style={{ color: tok.text }}>Shop</Text></Text>
        <Text style={[s.navSub, { color: tok.textMuted }]}>Curated Collection</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity
          onPress={toggle}
          style={[s.iconCircle, { backgroundColor: tok.surfaceEl }]}
          accessibilityLabel="Toggle theme"
        >
          <Text style={{ fontSize: 16 }}>{dark ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCart} style={{ position: 'relative' }} accessibilityLabel="Cart">
          <Text style={{ fontSize: 24 }}>🛍️</Text>
          {!!(cartCount > 0) && (
            <View style={[s.cartDot, { backgroundColor: tok.accent }]}>
              <Text style={s.cartDotTxt}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};


// ─── FLASH SALE TIMER ────────────────────────────────────────────────────────
const FlashSaleSegment = ({ value, bgColor, textColor }: { value: string; bgColor: string; textColor: string }) => (
  <View style={[s.timerSeg, { backgroundColor: bgColor }]}>
    <Text style={[s.timerDig, { color: textColor }]}>{value}</Text>
  </View>
);

const FlashSale = () => {
  const { tok } = useTok();
  const [secs, setSecs] = useState(2 * 3600 + 47 * 60 + 23);
  useEffect(() => {
    const id = setInterval(() => setSecs(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = Math.floor(secs / 3600).toString().padStart(2, '0');
  const mm = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const ss2 = (secs % 60).toString().padStart(2, '0');
  return (
    <View style={[s.flashRow, { backgroundColor: tok.accentSoft, borderColor: tok.accent }]}>
      <Text style={{ fontSize: 16 }}>⚡</Text>
      <Text style={[s.flashLabel, { color: tok.accent }]}>Flash Sale</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <FlashSaleSegment value={hh} bgColor={tok.text} textColor={tok.bg} /><Text style={[s.colon, { color: tok.accent }]}>:</Text>
        <FlashSaleSegment value={mm} bgColor={tok.text} textColor={tok.bg} /><Text style={[s.colon, { color: tok.accent }]}>:</Text>
        <FlashSaleSegment value={ss2} bgColor={tok.text} textColor={tok.bg} />
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={() => showToast('Opening flash sale...')}><Text style={{ color: tok.accent, fontSize: 13, fontWeight: '700' }}>See All →</Text></TouchableOpacity>
    </View>
  );
};

// ─── HERO BANNER ─────────────────────────────────────────────────────────────
const Hero = () => {
  const { tok } = useTok();
  const SLIDES = [
    { title: 'New Season\nArrivals 2025', sub: 'Discover premium curated collection', cta: 'Shop Now' },
    { title: 'Flash Sale\nUp to 50% Off 🔥', sub: 'Limited time offer. Grab it fast!', cta: 'Grab Deal' },
    { title: 'Free Shipping\nOn All Orders', sub: 'No minimum purchase required.', cta: 'Start Exploring' },
  ];
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View style={s.heroWrap}>
      <View style={[s.heroBox, { overflow: 'hidden' }]}>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={{ width: W - 32, height: 200 }}>
              <Image source={IMG_HERO} style={s.heroImg} resizeMode="cover" />
              <View style={[s.heroOverlay, { backgroundColor: 'rgba(10,10,30,0.68)' }]} />
              <View style={s.heroContent}>
                <View style={[s.heroPill, { backgroundColor: tok.accent }]}>
                  <Text style={s.heroPillTxt}>✦  EXCLUSIVE OFFER</Text>
                </View>
                <Text style={s.heroTitle}>{slide.title}</Text>
                <Text style={s.heroSub}>{slide.sub}</Text>
                <TouchableOpacity style={s.heroCta} onPress={() => showToast(slide.cta)}>
                  <Text style={s.heroCtaTxt}>{slide.cta} →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Animated.ScrollView>
        {/* Dots */}
        <View style={s.dotRow}>
          {SLIDES.map((_, i) => {
            const width = scrollX.interpolate({
              inputRange: [(i - 1) * (W - 32), i * (W - 32), (i + 1) * (W - 32)],
              outputRange: [8, 20, 8],
              extrapolate: 'clamp'
            });
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * (W - 32), i * (W - 32), (i + 1) * (W - 32)],
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp'
            });
            return (
              <Animated.View key={i} style={[s.dot, { backgroundColor: '#fff', width, opacity }]} />
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ─── COMPACT CATEGORIES ──────────────────────────────────────────────────────
const CategoriesHorizontal = ({ selected, setSelected }: any) => {
  const { tok } = useTok();
  return (
    <View style={{ paddingVertical: 12 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, alignItems: 'center' }}
      >
        {CATS.map(c => {
          const active = selected === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelected(c.id)}
              style={{
                alignItems: 'center',
                gap: 4
              }}
            >
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: active ? tok.text : tok.surface,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: active ? tok.text : tok.border,
                shadowColor: active ? tok.accent : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.3 : 0.05,
                shadowRadius: 4,
                elevation: 2
              }}>
                <Text style={{ fontSize: 24 }}>{c.icon}</Text>
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: active ? tok.text : tok.textMuted
              }}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── PRODUCT CARD ────────────────────────────────────────────────────────────
const ProductCard = ({ item, onAdd, onPress, favorites, setFavorites }: any) => {
  const { tok } = useTok();
  const scale = useRef(new Animated.Value(1)).current;
  const isLiked = favorites?.some((f: any) => f.id === item.id) || false;
  const hasDisc = item.orig > item.price;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const handleLike = () => {
    const willLike = !isLiked;
    if (willLike) {
      setFavorites([...(favorites || []), item]);
    } else {
      setFavorites((favorites || []).filter((f: any) => f.id !== item.id));
    }
    showToast(willLike ? 'Added to wishlist ❤️' : 'Removed from wishlist', 'ok');
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: CARD_W, marginBottom: 10 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[s.card, { backgroundColor: tok.surface }]}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} $${item.price}`}
      >
        {/* Image */}
        <View style={s.cardImgWrap}>
          <Image source={item.image} style={s.cardImg} resizeMode="cover" />
          {item.badge && <BadgePill label={item.badge} />}
          {hasDisc && (
            <View style={[s.discPill, { backgroundColor: tok.accent }]}>
              <Text style={s.discTxt}>-{disc(item.orig, item.price)}%</Text>
            </View>
          )}
          <TouchableOpacity
            style={s.heartBtn}
            onPress={handleLike}
            accessibilityLabel="Wishlist"
          >
            <Text style={{ fontSize: 15 }}>{isLiked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={s.cardBody}>
          <Text style={[s.cardBrand, { color: tok.textMuted }]}>{item.brand}</Text>
          <Text style={[s.cardName, { color: tok.text }]} numberOfLines={2}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Stars r={item.rating} />
            <Text style={{ fontSize: 10, color: tok.textMuted }}> {fmtNum(item.sold)} sold</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <View>
              <Text style={[s.price, { color: tok.accent }]}>${item.price.toFixed(2)}</Text>
              {hasDisc && <Text style={[s.priceOld, { color: tok.old }]}>${item.orig.toFixed(2)}</Text>}
            </View>
            <TouchableOpacity style={[s.addBtn, { backgroundColor: tok.text }]} onPress={() => onAdd(item)} accessibilityLabel="Add to cart">
              <Text style={{ color: tok.bg, fontSize: 20, fontWeight: '900', lineHeight: 24 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
const SearchBar = ({ onFilter }: any) => {
  const { tok } = useTok();
  const [query, setQuery] = useState('');
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      <View style={[s.searchBox, { backgroundColor: tok.surfaceEl, borderColor: tok.border }]}>
        <Text style={{ fontSize: 16, marginRight: 8, color: tok.textMuted }}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={[s.searchInput, { color: tok.text }]}
          placeholder="Search products..."
          placeholderTextColor={tok.textMuted}
          accessibilityRole="search"
        />
        {!!(query.length > 0) && (
          <TouchableOpacity onPress={() => setQuery('')}><Text style={{ color: tok.textMuted }}>✕</Text></TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={[s.filterBtn, { backgroundColor: tok.text }]} onPress={onFilter} accessibilityLabel="Filter">
        <Text style={{ fontSize: 16 }}>⚡</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── FILTER SHEET ────────────────────────────────────────────────────────────
const FilterSheet = ({ visible, onClose }: any) => {
  const { tok } = useTok();
  const [sort, setSort] = useState('Popular');
  const SORTS = ['Popular', 'Price ↑', 'Price ↓', 'Top Rated', 'Newest'];
  return (
    <Sheet visible={visible} onClose={onClose} title="Filter & Sort">
      <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <Text style={[s.filterLabel, { color: tok.textMuted }]}>SORT BY</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SORTS.map(o => (
            <TouchableOpacity key={o} onPress={() => setSort(o)} style={[s.filterChip, { backgroundColor: sort === o ? tok.text : tok.surfaceEl, borderColor: sort === o ? tok.text : tok.border }]}>
              <Text style={{ color: sort === o ? tok.bg : tok.textMuted, fontSize: 13, fontWeight: '600' }}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[s.applyBtn, { backgroundColor: tok.accent, marginTop: 24 }]}
          onPress={() => { onClose(); showToast('Filters applied!', 'ok'); }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
};
// ─── QUICK ADD SHEET ───────────────────────────────────────────────────────────
const QuickAddSheet = ({ visible, onClose, item, setCart }: any) => {
  const { tok } = useTok();
  const [size, setSize] = useState('M');
  const [qty, setQty] = useState(1);
  const outOfStock = size === 'XXL';
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (visible) { setSize('M'); setQty(1); setIsAdding(false); }
  }, [visible]);

  if (!item) return null;

  const handleAdd = () => {
    if (outOfStock) return;
    setIsAdding(true);
    setTimeout(() => {
      setCart((c: CartItem[]) => {
        const exIndex = c.findIndex((x: CartItem) => x.id === item.id && x.selectedSize === size);
        if (exIndex > -1) {
          const newCart = [...c];
          newCart[exIndex] = { ...newCart[exIndex], qty: newCart[exIndex].qty + qty };
          return newCart;
        }
        return [...c, { ...item, qty, selectedSize: size }];
      });
      setIsAdding(false);
      showToast(`Added ${qty} ${item.name} to cart 🎉`, 'ok');
      onClose();
    }, 500);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Quick Add">
      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
          <Image source={item.image} style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: tok.surface }} resizeMode="contain" />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: tok.text }}>{item.name}</Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: tok.accent, marginTop: 4 }}>${item.price.toFixed(2)}</Text>
          </View>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: tok.text, marginBottom: 8 }}>Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
              <TouchableOpacity
                key={s} onPress={() => setSize(s)}
                style={{
                  width: 40, height: 40, borderRadius: 20, borderWidth: 1,
                  justifyContent: 'center', alignItems: 'center',
                  backgroundColor: size === s ? tok.text : tok.surface,
                  borderColor: size === s ? tok.text : tok.border,
                  opacity: s === 'XXL' ? 0.3 : 1
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: size === s ? tok.bg : tok.text }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: tok.text, marginBottom: 8 }}>Quantity</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: tok.surface, borderRadius: 999, padding: 4, width: 120 }}>
            <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={[s.iconCircle, { backgroundColor: tok.bg, width: 32, height: 32 }]}>
              <Text style={{ fontSize: 16, color: tok.text, fontWeight: '800' }}>−</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: tok.text }}>{qty}</Text>
            <TouchableOpacity onPress={() => setQty(Math.min(10, qty + 1))} style={[s.iconCircle, { backgroundColor: tok.bg, width: 32, height: 32 }]}>
              <Text style={{ fontSize: 16, color: tok.text, fontWeight: '800' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          disabled={outOfStock || isAdding}
          style={{ backgroundColor: outOfStock ? tok.border : tok.text, paddingVertical: 16, borderRadius: 999, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          onPress={handleAdd}
        >
          {isAdding ? <ActivityIndicator color={tok.bg} /> : <Text style={{ color: tok.bg, fontSize: 16, fontWeight: '800' }}>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</Text>}
        </TouchableOpacity>
      </View>
    </Sheet>
  );
};

// ─── CART SHEET ──────────────────────────────────────────────────────────────
type CartItem = typeof PRODUCTS[0] & { qty: number; selectedSize?: string; selectedColor?: string };

// ─── PRODUCT DETAILS SCREEN ────────────────────────────────────────────────────
const ProductDetailsScreen = ({ route, navigation, setCart, favorites, setFavorites }: any) => {
  const { product } = route.params;
  const onBack = () => navigation.goBack();
  const onSelectRelated = (p: any) => navigation.push('ProductDetails', { product: p });
  const { tok } = useTok();
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('#000');
  const [qty, setQty] = useState(1);
  const [loadingImg, setLoadingImg] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Add to Cart states
  const [isAdding, setIsAdding] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  // Favorite states
  const isLiked = favorites.some((f: any) => f.id === product.id);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    const willLike = !isLiked;
    if (willLike) {
      setFavorites([...favorites, product]);
    } else {
      setFavorites(favorites.filter((f: any) => f.id !== product.id));
    }
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20 })
    ]).start();
    showToast(willLike ? 'Added to wishlist ❤️' : 'Removed from wishlist', 'ok');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing ${product.name} on EmbeddedShop! Only $${product.price} 🔥`,
        title: product.name,
      });
    } catch {
      showToast('Error sharing product', 'err');
    }
  };

  // Mocking multiple images & data
  const gallery = [product.image, product.image, product.image];
  const REVIEWS = [
    { id: '1', user: 'Alex D.', avatar: 'https://i.pravatar.cc/100?img=11', rating: 5, date: 'Oct 12, 2023', text: 'Absolutely love this product! The quality is outstanding and it fits perfectly.' },
    { id: '2', user: 'Sarah W.', avatar: 'https://i.pravatar.cc/100?img=5', rating: 4, date: 'Sep 28, 2023', text: 'Really good, but took a while to arrive. Still worth the wait.' },
  ];
  const relatedList = PRODUCTS.filter(p => p.id !== product.id).slice(0, 3);
  const specs = [
    { label: 'Brand', value: product.brand },
    { label: 'Condition', value: 'Brand New' },
    { label: 'Material', value: 'Premium Alloy & Leather' },
    { label: 'Warranty', value: '12 Months' },
  ];
  const tags = ['Premium', 'Best Seller', product.badge].filter(Boolean);
  const outOfStock = size === 'XXL'; // Simulate out of stock condition

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const handleAddCart = () => {
    if (outOfStock) return;
    setIsAdding(true);
    // Simulate network delay and success animation
    setTimeout(() => {
      setCart((c: CartItem[]) => {
        const exIndex = c.findIndex((x: CartItem) => x.id === product.id && x.selectedSize === size);
        if (exIndex > -1) {
          const newCart = [...c];
          newCart[exIndex] = { ...newCart[exIndex], qty: newCart[exIndex].qty + qty };
          return newCart;
        }
        return [...c, { ...product, qty, selectedSize: size }];
      });
      setIsAdding(false);
      showToast(`Added ${qty} ${product.name} to cart 🎉`, 'ok');
      onBack();
    }, 600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: tok.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: tok.bg, zIndex: 10 }}>
        <TouchableOpacity onPress={onBack} style={[s.iconCircle, { backgroundColor: tok.surface }]}>
          <Text style={{ color: tok.text, fontWeight: '800', fontSize: 20 }}>{'←'}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={handleShare} style={[s.iconCircle, { backgroundColor: tok.surface }]}>
            <Text style={{ fontSize: 16 }}>{'🔗'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLike} style={[s.iconCircle, { backgroundColor: tok.surface }]}>
            <Animated.Text style={{ fontSize: 16, transform: [{ scale: heartScale }] }}>
              {isLiked ? '❤️' : '🤍'}
            </Animated.Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 1. Image Gallery */}
        <View style={{ height: H * 0.45, backgroundColor: tok.surface }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            maximumZoomScale={3}
            minimumZoomScale={1}
            centerContent
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            scrollEventThrottle={16}
          >
            {gallery.map((img, i) => (
              <View key={i} style={{ width: W, height: H * 0.45, justifyContent: 'center', alignItems: 'center' }}>
                {loadingImg && !imgErr ? <ActivityIndicator size="large" color={tok.accent} style={{ position: 'absolute' }} /> : null}
                {imgErr ? (
                  <Text style={{ color: tok.textMuted }}>Failed to load image</Text>
                ) : (
                  <Image
                    source={img}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                    onLoadEnd={() => setLoadingImg(false)}
                    onError={() => setImgErr(true)}
                  />
                )}
              </View>
            ))}
          </ScrollView>
          {/* Indicators */}
          <View style={{ position: 'absolute', bottom: 16, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {gallery.map((_, i) => {
              const opacity = scrollX.interpolate({ inputRange: [(i - 1) * W, i * W, (i + 1) * W], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
              return <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tok.accent, opacity }} />;
            })}
          </View>
        </View>

        {/* 2. Product Information */}
        <View style={{ padding: 20, backgroundColor: tok.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: tok.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{product.brand}</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: tok.text, lineHeight: 30 }}>{product.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: tok.text }}>${product.price}</Text>
              {product.orig > product.price ? <Text style={{ fontSize: 13, textDecorationLine: 'line-through', color: tok.old }}>${product.orig}</Text> : null}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Stars r={product.rating} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: tok.text }}>{product.rating}</Text>
              <Text style={{ fontSize: 12, color: tok.textMuted }}>({product.sold} reviews)</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {tags.map(t => (
                <View key={t} style={{ backgroundColor: tok.tag, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: tok.tagText, fontWeight: '800' }}>#{t}</Text>
                </View>
              ))}
            </View>
          </View>

          <ScrollView style={{ maxHeight: 100, marginTop: 16 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
            <Text style={{ fontSize: 15, color: tok.textMuted, lineHeight: 24 }}>
              Experience premium quality with {product.name}. Designed for maximum comfort, durability, and a stunning aesthetic that fits your lifestyle perfectly. Features top-tier materials and cutting-edge craftsmanship. The ultimate choice for those who accept no compromises.
            </Text>
          </ScrollView>

          {/* Specifications */}
          <View style={{ marginTop: 20, backgroundColor: tok.surface, borderRadius: 12, padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: tok.text, marginBottom: 4 }}>Specifications</Text>
            {specs.map(sp => (
              <View key={sp.label} style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tok.border, paddingBottom: 6 }}>
                <Text style={{ color: tok.textMuted, fontSize: 13 }}>{sp.label}</Text>
                <Text style={{ color: tok.text, fontSize: 13, fontWeight: '600' }}>{sp.value}</Text>
              </View>
            ))}
          </View>

          {/* 3. Variant Selection */}
          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: tok.text }}>Select Size</Text>
              {outOfStock && <Text style={{ fontSize: 12, color: '#FF4444', fontWeight: '700' }}>Size XXL is out of stock</Text>}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSize(s)}
                  style={{
                    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: size === s ? tok.text : tok.surface,
                    borderColor: size === s ? tok.text : tok.border,
                    opacity: s === 'XXL' ? 0.3 : 1
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: size === s ? tok.bg : tok.text }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: tok.text, marginBottom: 12 }}>Color</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {['#111', '#B400FF', '#39FF14'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      width: 36, height: 36, borderRadius: 18, backgroundColor: c,
                      borderWidth: color === c ? 2 : 0, borderColor: tok.text,
                      padding: 2
                    }}
                  >
                    <View style={{ flex: 1, borderRadius: 16, backgroundColor: c, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: tok.text, marginBottom: 12 }}>Quantity</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: tok.surface, borderRadius: 999, padding: 4 }}>
                <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={[s.iconCircle, { backgroundColor: tok.bg }]}>
                  <Text style={{ fontSize: 18, color: tok.text, fontWeight: '800' }}>−</Text>
                </TouchableOpacity>
                <TextInput
                  value={qty.toString()}
                  onChangeText={t => {
                    const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                    if (!isNaN(n)) setQty(Math.min(10, Math.max(1, n)));
                  }}
                  keyboardType="numeric"
                  style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: '800', color: tok.text, padding: 0 }}
                />
                <TouchableOpacity onPress={() => setQty(Math.min(10, qty + 1))} style={[s.iconCircle, { backgroundColor: tok.bg }]}>
                  <Text style={{ fontSize: 18, color: tok.text, fontWeight: '800' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 4. Reviews Section */}
          <View style={{ marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: tok.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: tok.text }}>Reviews (128)</Text>
              <Text style={{ fontSize: 14, color: tok.accent, fontWeight: '700' }}>See All</Text>
            </View>
            {REVIEWS.map(rev => (
              <View key={rev.id} style={{ marginBottom: 16, backgroundColor: tok.surface, padding: 16, borderRadius: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image source={{ uri: rev.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: tok.text }}>{rev.user}</Text>
                      <Text style={{ fontSize: 11, color: tok.textMuted }}>{rev.date}</Text>
                    </View>
                  </View>
                  <Stars r={rev.rating} />
                </View>
                <Text style={{ fontSize: 14, color: tok.text, lineHeight: 20 }}>{rev.text}</Text>
              </View>
            ))}
            <TouchableOpacity style={{ paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: tok.border, borderRadius: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: tok.text }}>Load More Reviews</Text>
            </TouchableOpacity>
          </View>

          {/* 5. Related Products */}
          <View style={{ marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: tok.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: tok.text }}>You Might Also Like</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {relatedList.map(p => (
                <TouchableOpacity key={p.id} style={{ width: 140 }} onPress={() => onSelectRelated?.(p)}>
                  <View style={{ width: 140, height: 140, backgroundColor: tok.surface, borderRadius: 12, padding: 10, marginBottom: 8 }}>
                    <Image source={p.image} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  </View>
                  <Text style={{ fontSize: 12, color: tok.textMuted, marginBottom: 2 }} numberOfLines={1}>{p.brand}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: tok.text, marginBottom: 4 }} numberOfLines={1}>{p.name}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: tok.accent }}>${p.price.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{ height: 110 }} /> {/* Spacer */}
        </View>
      </ScrollView>

      {/* Floating Add to Cart */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, backgroundColor: tok.surface, borderTopWidth: 1, borderColor: tok.border, flexDirection: 'row', gap: 12 }}>
        <View style={{ justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, color: tok.textMuted, fontWeight: '600' }}>Total Price</Text>
          <Text style={{ fontSize: 22, color: tok.text, fontWeight: '900' }}>${(product.price * qty).toFixed(2)}</Text>
        </View>
        <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={outOfStock || isAdding}
            style={{
              flex: 1,
              backgroundColor: outOfStock ? tok.border : tok.text,
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
              height: 54
            }}
            onPress={handleAddCart}
          >
            {isAdding ? <ActivityIndicator color={tok.bg} /> : <Text style={{ color: tok.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</Text>}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation, setCart, favorites, setFavorites }: any) => {
  const { tok } = useTok();
  const [cat, setCat] = useState('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [quickAdd, setQuickAdd] = useState<typeof PRODUCTS[0] | null>(null);
  const [localProducts, setLocalProducts] = useState(PRODUCTS);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Feed updated! 🔄', 'ok');
    }, 1500);
  }, []);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      if (!loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setLocalProducts(prev => [...prev, ...PRODUCTS.slice(0, 2)]);
          setLoadingMore(false);
        }, 1500);
      }
    }
  };

  const addToCart = useCallback((item: typeof PRODUCTS[0]) => {
    setQuickAdd(item);
  }, []);

  const displayedProducts = cat === 'all' ? localProducts : localProducts.filter(p => PRODUCTS.indexOf(PRODUCTS.find(x => x.id === p.id)!) % 2 === (cat.length % 2));

  const GridItems = () => {
    if (loading) {
      return (
        <View style={s.grid}>
          {Array(6).fill(0).map((_, i) => (
            <View key={i} style={[s.card, { width: CARD_W, marginBottom: 10, backgroundColor: tok.surface }]}>
              <Skel w="100%" h={160} br={14} />
              <View style={{ padding: 8, gap: 6 }}>
                <Skel w="55%" h={12} />
                <Skel w="85%" h={15} />
                <Skel w="40%" h={18} />
              </View>
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={s.grid}>
        {displayedProducts.map((p, idx) => <ProductCard key={`${p.id}-${idx}`} item={p} onAdd={addToCart} onPress={() => navigation.navigate('ProductDetails', { product: p })} favorites={favorites} setFavorites={setFavorites} />)}
      </View>
    );
  };

  const HorizontalSection = ({ title, products }: { title: string; products: typeof PRODUCTS }) => (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: tok.text }}>{title}</Text>
        <TouchableOpacity><Text style={{ color: tok.accent, fontWeight: '700', fontSize: 13 }}>See All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {products.map(p => (
          <TouchableOpacity
            key={p.id}
            style={{ width: 140 }}
            onPress={() => navigation.navigate('ProductDetails', { product: p })}
          >
            <View style={{ width: 140, height: 140, backgroundColor: tok.surface, borderRadius: 12, padding: 10, marginBottom: 8 }}>
              <Image source={p.image} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </View>
            <Text style={{ fontSize: 11, color: tok.textMuted, marginBottom: 2 }}>{p.brand}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tok.text, marginBottom: 4 }} numberOfLines={1}>{p.name}</Text>
            <Text style={{ fontSize: 14, fontWeight: '900', color: tok.accent }}>${p.price.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tok.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        stickyHeaderIndices={[2]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tok.accent]} tintColor={tok.accent} />}
      >
        {/* 0: hero */}
        <Hero />

        {/* 1: flash sale */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <FlashSale />
        </View>

        {/* 2: sticky search */}
        <View style={{ backgroundColor: tok.bg, paddingHorizontal: 16, paddingTop: 8 }}>
          <SearchBar onFilter={() => setFilterVisible(true)} />
        </View>

        {/* Categories Horizontal */}
        <CategoriesHorizontal selected={cat} setSelected={setCat} />

        {/* New Arrivals Section */}
        <HorizontalSection title="New Arrivals" products={PRODUCTS.slice(0, 4)} />

        {/* 3: section header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginTop: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: tok.text }}>Featured Products</Text>
          <TouchableOpacity onPress={() => showToast('Viewing all...')}><Text style={{ color: tok.accent, fontWeight: '700', fontSize: 14 }}>View All →</Text></TouchableOpacity>
        </View>

        {/* 4: products */}
        <View style={{ paddingHorizontal: 16 }}>
          <GridItems />
        </View>

        {/* Best Sellers Section */}
        <HorizontalSection title="Best Sellers" products={PRODUCTS.slice(2, 6)} />

        {/* 5: promo */}
        <View style={[s.promo, { backgroundColor: tok.primary, marginHorizontal: 16, marginTop: 24 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>EXCLUSIVE DEAL</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28, marginBottom: 12 }}>
              Get 15% off{'\n'}your first order
            </Text>
            <TouchableOpacity style={s.promoCta} onPress={() => showToast('Coupon FIRST15 applied! 🎉', 'ok')}>
              <Text style={{ color: tok.primary === '#FFFFFF' ? '#1A1A2E' : tok.primary, fontWeight: '800', fontSize: 13 }}>Use code FIRST15</Text>
            </TouchableOpacity>
          </View>
          <Image source={IMG_PERFUME} style={s.promoImg} resizeMode="contain" />
        </View>

        {loadingMore && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator color={tok.accent} />
          </View>
        )}

        <FilterSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />
        <QuickAddSheet visible={!!quickAdd} onClose={() => setQuickAdd(null)} item={quickAdd} setCart={setCart} />
      </ScrollView>
    </View>
  );
};

// ─── SEARCH SCREEN ───────────────────────────────────────────────────────────
const SearchScreen = ({ setCart, favorites, setFavorites, navigation }: any) => {
  const { tok } = useTok();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>(['Wireless', 'Smart Watch', 'Nike']);
  const [isGrid, setIsGrid] = useState(true);
  const [isVoice, setIsVoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sort, setSort] = useState('Popular');

  const TRENDING = ['Headphones', 'Smart Watch', 'Sneakers', 'Bag', 'Perfume'];

  const addToCart = useCallback((item: typeof PRODUCTS[0]) => {
    setCart((prev: CartItem[]) => {
      const found = prev.find(i => i.id === item.id);
      if (found) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(`${item.name} added! 🛒`, 'ok');
  }, [setCart]);

  const handleSearch = (q: string) => {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    if (!history.includes(term)) {
      setHistory(prev => [term, ...prev.slice(0, 4)]);
    }
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.brand.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => {
    if (sort === 'Price ↑') return a.price - b.price;
    if (sort === 'Price ↓') return b.price - a.price;
    if (sort === 'Top Rated') return b.rating - a.rating;
    return 0;
  });

  const SearchHeader = () => (
    <View style={{ gap: 12, marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[s.searchBox, { backgroundColor: tok.surfaceEl, borderColor: tok.border }]}>
          <Text style={{ fontSize: 16, marginRight: 8, color: tok.textMuted }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            style={[s.searchInput, { color: tok.text }]}
            placeholder="Search products..."
            placeholderTextColor={tok.textMuted}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ marginRight: 8 }}><Text style={{ color: tok.textMuted }}>✕</Text></TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setIsVoice(true)}><Text style={{ fontSize: 18 }}>🎙️</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={[s.filterBtn, { backgroundColor: tok.text }]} onPress={() => setFilterVisible(true)}>
          <Text style={{ fontSize: 16 }}>⚡</Text>
        </TouchableOpacity>
      </View>

      {query.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: tok.textMuted, fontSize: 13 }}>{filtered.length} results found</Text>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setIsGrid(!isGrid)}><Text style={{ fontSize: 18 }}>{isGrid ? '☰' : '▦'}</Text></TouchableOpacity>
            <View style={{ width: 1, height: 16, backgroundColor: tok.border }} />
            <TouchableOpacity onPress={() => setFilterVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: tok.text }}>{sort}</Text>
              <Text style={{ fontSize: 10 }}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tok.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <SearchHeader />

        {query.length === 0 ? (
          <>
            {history.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: tok.text }}>Recent Searches</Text>
                  <TouchableOpacity onPress={() => setHistory([])}><Text style={{ color: tok.accent, fontSize: 13, fontWeight: '700' }}>Clear</Text></TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {history.map(h => (
                    <TouchableOpacity key={h} style={{ backgroundColor: tok.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: tok.border }} onPress={() => handleSearch(h)}>
                      <Text style={{ color: tok.text, fontSize: 14 }}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={{ fontSize: 18, fontWeight: '800', color: tok.text, marginBottom: 16 }}>Trending Now 🔥</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {TRENDING.map(tag => (
                <TouchableOpacity key={tag} style={[s.trendTag, { backgroundColor: tok.tag }]} onPress={() => handleSearch(tag)}>
                  <Text style={{ color: tok.tagText, fontWeight: '700', fontSize: 13 }}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <ActivityIndicator size="large" color={tok.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: tok.text }}>No Results Found</Text>
            <Text style={{ color: tok.textMuted, marginTop: 4 }}>Try a different keyword</Text>
            <TouchableOpacity onPress={() => setQuery('')} style={{ marginTop: 20, backgroundColor: tok.surface, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99 }}>
              <Text style={{ color: tok.accent, fontWeight: '700' }}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : isGrid ? (
          <View style={s.grid}>
            {filtered.map(p => <ProductCard key={p.id} item={p} onAdd={addToCart} onPress={() => navigation.navigate('ProductDetails', { product: p })} favorites={favorites} setFavorites={setFavorites} />)}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {filtered.map(p => (
              <TouchableOpacity key={p.id} style={[s.listCard, { backgroundColor: tok.surface }]} onPress={() => navigation.navigate('ProductDetails', { product: p })}>
                <Image source={p.image} style={s.listImg} resizeMode="contain" />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, color: tok.textMuted, marginBottom: 2 }}>{p.brand}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: tok.text, marginBottom: 6 }} numberOfLines={2}>{p.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Stars r={p.rating} />
                    <Text style={{ fontSize: 11, color: tok.textMuted }}>{fmtNum(p.sold)} sold</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: tok.accent }}>${p.price.toFixed(2)}</Text>
                    <TouchableOpacity style={[s.addBtn, { backgroundColor: tok.text }]} onPress={() => addToCart(p)}>
                      <Text style={{ color: tok.bg, fontSize: 18, fontWeight: '800' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={filterVisible} onClose={() => setFilterVisible(false)} title="Sort Results">
        <View style={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          {['Popular', 'Price ↑', 'Price ↓', 'Top Rated'].map(o => (
            <TouchableOpacity key={o} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: sort === o ? tok.surfaceEl : 'transparent', borderRadius: 12 }} onPress={() => { setSort(o); setFilterVisible(false); }}>
              <Text style={{ fontSize: 16, fontWeight: sort === o ? '800' : '500', color: sort === o ? tok.accent : tok.text }}>{o}</Text>
              {sort === o && <Text style={{ fontSize: 16, color: tok.accent }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Sheet>

      <VoiceSearchModal visible={isVoice} onClose={() => setIsVoice(false)} onResult={(res: string) => handleSearch(res)} />
    </View>
  );
};

// ─── SAMPLE AVATARS ───────────────────────────────────────────────────────
const SAMPLE_AVATARS = [
  {
    id: 'av1',
    label: 'Tech Blue',
    uri: 'https://ui-avatars.com/api/?name=AJ&background=0D8ABC&color=fff&size=160&bold=true&rounded=true',
  },
  {
    id: 'av2',
    label: 'Purple Pro',
    uri: 'https://ui-avatars.com/api/?name=AJ&background=B400FF&color=fff&size=160&bold=true&rounded=true',
  },
  {
    id: 'av3',
    label: 'Cyber Cyan',
    uri: 'https://ui-avatars.com/api/?name=AJ&background=00C9C8&color=fff&size=160&bold=true&rounded=true',
  },
];

const ProfileField = ({
  label, value, onChange, placeholder, keyboardType, multiline, errKey,
  tok, errors, setErrors,
}: {
  label: string; value: string; onChange: (t: string) => void;
  placeholder: string; keyboardType?: any; multiline?: boolean; errKey: string;
  tok: Tok; errors: Record<string, string>; setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={[s.fieldLabel, { color: tok.textMuted }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={(t) => { onChange(t); if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: '' })); }}
      placeholder={placeholder}
      placeholderTextColor={tok.textMuted}
      keyboardType={keyboardType ?? 'default'}
      multiline={multiline}
      style={[
        s.formInput,
        {
          backgroundColor: tok.surfaceEl,
          color: tok.text,
          borderColor: errors[errKey] ? '#FF4444' : tok.border,
          minHeight: multiline ? 72 : 46,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
    />
    {!!errors[errKey] && (
      <Text style={{ color: '#FF4444', fontSize: 11, marginTop: 3 }}>⚠ {errors[errKey]}</Text>
    )}
  </View>
);

// ─── PROFILE SCREEN ──────────────────────────────────────────────────────────
const ProfileScreen = ({ dark, toggle }: { dark: boolean; toggle: () => void }) => {
  const { tok } = useTok();
  const navigation = useNavigation<any>();

  // Form state
  const [name, setName] = useState('Alex Johnson');
  const [email, setEmail] = useState('alex@example.com');
  const [phone, setPhone] = useState('+84 901 234 567');
  const [address, setAddress] = useState('123 Nguyễn Huệ, Q.1, TP.HCM');
  const [bio, setBio] = useState('Đam mê thời trang & công nghệ 🎧✨');

  // Saved snapshot for Cancel
  const [saved, setSaved] = useState({ name: 'Alex Johnson', email: 'alex@example.com', phone: '+84 901 234 567', address: '123 Nguyễn Huệ, Q.1, TP.HCM', bio: 'Đam mê thời trang & công nghệ 🎧✨' });

  // Avatar
  const defaultAvatar = `https://ui-avatars.com/api/?name=Alex+Johnson&background=0D8ABC&color=fff&size=160&bold=true&rounded=true`;
  const [avatarUri, setAvatarUri] = useState(defaultAvatar);
  const [showAvatarPick, setShowAvatarPick] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    // Simulate initial profile data fetch
    const t = setTimeout(() => { setIsLoadingProfile(false); }, 800);
    return () => clearTimeout(t);
  }, []);

  // Modals & loading
  const [logoutModal, setLogoutModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState<{ visible: boolean; title: string; content: string }>({ visible: false, title: '', content: '' });

  // Switches
  const [notif, setNotif] = useState(true);
  const [pubEmail, setPubEmail] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\d][\d\s\-()]{7,19}$/;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Tên không được để trống';
    if (!email.trim()) e.email = 'Email không được để trống';
    else if (!EMAIL_RE.test(email)) e.email = 'Email không hợp lệ';
    if (!phone.trim()) e.phone = 'Số điện thoại không được để trống';
    else if (!PHONE_RE.test(phone)) e.phone = 'Số điện thoại không hợp lệ';
    if (!address.trim()) e.address = 'Địa chỉ không được để trống';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) { showToast('Vui lòng kiểm tra lại thông tin', 'err'); return; }
    setIsSaving(true);
    setTimeout(() => {
      setSaved({ name, email, phone, address, bio });
      setIsEditing(false);
      setIsSaving(false);
      showToast('Đã lưu thay đổi ✓', 'ok');
    }, 1200); // Simulate network latency
  };

  const handleCancel = () => {
    setName(saved.name); setEmail(saved.email);
    setPhone(saved.phone); setAddress(saved.address);
    setBio(saved.bio); setErrors({});
    setIsEditing(false);
    showToast('Đã hủy thay đổi', 'info');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Xóa Tài Khoản",
      "Bạn có chắc chắn muốn xóa tài khoản vĩnh viễn không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", onPress: () => showToast("Tài khoản đã được đưa vào hàng đợi xóa", "err"), style: "destructive" }
      ]
    );
  };

  const SETTINGS_LIST = [
    { icon: '👤', title: 'Cài đặt tài khoản', desc: 'Thông tin cá nhân, bảo mật danh tính' },
    { icon: '🔔', title: 'Cài đặt thông báo', desc: 'Quản lý thông báo đẩy & email' },
    { icon: '🔒', title: 'Cài đặt bảo mật', desc: 'Đổi mật khẩu, xác thực 2 bước' },
    { icon: '🌐', title: 'Ngôn ngữ', desc: 'Tiếng Việt' },
    { icon: '❓', title: 'Giúp đỡ & Hỗ trợ', desc: 'FAQ, Liên hệ CSKH' },
    { icon: 'ℹ️', title: 'Về ứng dụng', desc: 'Phiên bản 1.0.4' },
  ];

  // --- Custom Loading Animation ---
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isLoadingProfile) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isLoadingProfile, pulseAnim]);

  if (isLoadingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tok.bg }}>
        <Animated.View style={{
          width: 50, height: 50, borderRadius: 25,
          backgroundColor: tok.accent + '30',
          justifyContent: 'center', alignItems: 'center',
          transform: [{ scale: pulseAnim }]
        }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: tok.accent }} />
        </Animated.View>
        <Text style={{ marginTop: 24, color: tok.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
          LOADING PROFILE...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

      {/* ── PROFILE HEADER ── */}
      <View style={[s.profileCard, { backgroundColor: tok.surface }]}>
        {/* Avatar – chỉ bấm được khi đang ở chế độ edit */}
        <TouchableOpacity
          style={s.avatarWrap}
          onPress={isEditing ? () => setShowAvatarPick(true) : undefined}
          accessibilityLabel={isEditing ? 'Đổi avatar' : undefined}
          activeOpacity={isEditing ? 0.8 : 1}
        >
          <Image source={{ uri: avatarUri }} style={s.avatarImg} />
          {isEditing && (
            <View style={[s.avatarBadge, { backgroundColor: tok.accent }]}>
              <Text style={{ fontSize: 10, color: '#fff' }}>📷</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[s.profileName, { color: tok.text }]}>{saved.name}</Text>
        <Text style={{ color: tok.textMuted, fontSize: 13, marginTop: 2 }}>
          {isEditing || pubEmail ? saved.email : saved.email.replace(/^(.{1,2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)}
        </Text>
        {!!saved.bio && (
          <Text style={{ color: tok.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center', fontStyle: 'italic' }}>{saved.bio}</Text>
        )}

        {/* Edit Profile button – chỉ hiện khi KHÔNG đang edit */}
        {!isEditing && (
          <TouchableOpacity
            style={[s.editProfileBtn, { borderColor: tok.accent }]}
            onPress={() => setIsEditing(true)}
            accessibilityLabel="Chỉnh sửa hồ sơ"
          >
            <Text style={{ color: tok.accent, fontWeight: '700', fontSize: 14 }}>✎  Edit Profile</Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', gap: 32, marginTop: 16 }}>
          {[['23', 'Orders'], ['8', 'Reviews'], ['1.2k', 'Points']].map(([v, lbl]) => (
            <View key={lbl} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: tok.accent }}>{v}</Text>
              <Text style={{ fontSize: 12, color: tok.textMuted, fontWeight: '600' }}>{lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── EDIT PROFILE FORM – chỉ render khi isEditing ── */}
      {isEditing && (
        <View style={[s.sectionCard, { backgroundColor: tok.surface }]}>
          <Text style={[s.sectionTitle, { color: tok.text }]}>✎  Chỉnh sửa hồ sơ</Text>

          <ProfileField label="Tên *" value={name} onChange={setName} placeholder="Nhập tên của bạn" errKey="name" tok={tok} errors={errors} setErrors={setErrors} />
          <ProfileField label="Email *" value={email} onChange={setEmail} placeholder="example@email.com" keyboardType="email-address" errKey="email" tok={tok} errors={errors} setErrors={setErrors} />
          <ProfileField label="Số điện thoại *" value={phone} onChange={setPhone} placeholder="+84 9xx xxx xxx" keyboardType="phone-pad" errKey="phone" tok={tok} errors={errors} setErrors={setErrors} />
          <ProfileField label="Địa chỉ *" value={address} onChange={setAddress} placeholder="Nhập địa chỉ của bạn" errKey="address" tok={tok} errors={errors} setErrors={setErrors} />
          <ProfileField label="Bio" value={bio} onChange={setBio} placeholder="Giới thiệu bản thân..." multiline errKey="bio" tok={tok} errors={errors} setErrors={setErrors} />

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              style={[s.actionBtn, { flex: 1, backgroundColor: tok.surfaceEl, borderColor: tok.border, borderWidth: 1 }]}
              onPress={handleCancel}
              accessibilityLabel="Hủy"
            >
              <Text style={{ color: tok.textMuted, fontWeight: '700', fontSize: 15 }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { flex: 2, backgroundColor: tok.accent, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
              onPress={handleSave}
              accessibilityLabel="Lưu thay đổi"
              disabled={isSaving}
            >
              {isSaving && <ActivityIndicator size="small" color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── PREFERENCES (Switches) ── */}
      {!isEditing && (
        <View style={[s.sectionCard, { backgroundColor: tok.surface }]}>
          <Text style={[s.sectionTitle, { color: tok.text }]}>⚙  Tuỳ chọn</Text>

          {/* Dark Mode */}
          <View style={[s.switchRow, { borderBottomColor: tok.border }]}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tok.text }}>Chế độ tối</Text>
              <Text style={{ fontSize: 12, color: tok.textMuted }}>{dark ? 'Đang bật' : 'Đang tắt'}</Text>
            </View>
            <Switch
              value={dark}
              onValueChange={toggle}
              thumbColor={dark ? tok.accent : '#f4f3f4'}
              trackColor={{ false: tok.border, true: tok.accent + '60' }}
            />
          </View>

          {/* Nhận thông báo */}
          <View style={[s.switchRow, { borderBottomColor: tok.border }]}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tok.text }}>Nhận thông báo</Text>
              <Text style={{ fontSize: 12, color: tok.textMuted }}>{notif ? 'Đang bật' : 'Đang tắt'}</Text>
            </View>
            <Switch
              value={notif}
              onValueChange={v => { setNotif(v); showToast(v ? 'Đã bật thông báo 🔔' : 'Đã tắt thông báo', 'info'); }}
              thumbColor={notif ? tok.accent : '#f4f3f4'}
              trackColor={{ false: tok.border, true: tok.accent + '60' }}
            />
          </View>

          {/* Hiển thị email công khai */}
          <View style={s.switchRow}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>👁</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tok.text }}>Hiển thị email công khai</Text>
              <Text style={{ fontSize: 12, color: tok.textMuted }}>{pubEmail ? 'Email hiển thị' : 'Đang ẩn'}</Text>
            </View>
            <Switch
              value={pubEmail}
              onValueChange={v => { setPubEmail(v); showToast(v ? 'Email đã công khai' : 'Email đã ẩn', 'info'); }}
              thumbColor={pubEmail ? tok.accent : '#f4f3f4'}
              trackColor={{ false: tok.border, true: tok.accent + '60' }}
            />
          </View>
        </View>
      )}

      {/* ── ACCOUNT MANAGEMENT ── */}
      {!isEditing && (
        <View style={[s.sectionCard, { backgroundColor: tok.surface, paddingBottom: 8 }]}>
          <Text style={[s.sectionTitle, { color: tok.text }]}>👤  Account Management</Text>
          {[
            { title: 'My Orders', icon: '📦', desc: 'Track, return or buy again', route: 'OrderHistory' },
            { title: 'Shipping Addresses', icon: '📍', desc: 'Manage delivery locations', route: 'Addresses' },
            { title: 'Payment Methods', icon: '💳', desc: 'Manage your cards and wallets', route: 'Payments' },
          ].map((item, idx) => (
            <TouchableOpacity
              key={item.title}
              style={[s.settingRow, { borderBottomWidth: idx < 2 ? 1 : 0, borderBottomColor: tok.border }]}
              onPress={() => navigation.navigate(item.route)}
            >
              <Text style={{ fontSize: 20, marginRight: 16 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: tok.text }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: tok.textMuted, marginTop: 2 }}>{item.desc}</Text>
              </View>
              <Text style={{ color: tok.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── SETTINGS LIST (Full requirements) ── */}
      {!isEditing && (
        <View style={[s.settingsCard, { backgroundColor: tok.surface }]}>
          <Text style={[s.sectionTitle, { color: tok.text, paddingHorizontal: 16, paddingTop: 16, marginBottom: 8 }]}>⚙  Settings</Text>
          {SETTINGS_LIST.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[s.settingRow, index < SETTINGS_LIST.length - 1 && { borderBottomWidth: 1, borderBottomColor: tok.border }]}
              onPress={() => {
                setDetailsModal({ visible: true, title: item.title, content: `Đang hiển thị thông tin chi tiết cho tính năng:\n\n${item.title}` });
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 16 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: tok.text }}>{item.title}</Text>
                {!!item.desc && <Text style={{ fontSize: 12, color: tok.textMuted, marginTop: 2 }}>{item.desc}</Text>}
              </View>
              <Text style={{ color: tok.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── LOGOUT & DELETE ACCOUNT ── */}
      <TouchableOpacity
        style={[s.logoutBtn, { borderColor: tok.border, marginTop: 8 }]}
        onPress={() => setLogoutModal(true)}
        accessibilityLabel="Đăng xuất"
      >
        <Text style={{ color: tok.text, fontSize: 16, fontWeight: '800' }}>🚪  Đăng xuất</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
        onPress={handleDeleteAccount}
      >
        <Text style={{ color: '#FF4444', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' }}>
          Xóa tài khoản vĩnh viễn
        </Text>
      </TouchableOpacity>

      {/* ── MODALS ── */}
      {/* 1. Modal đăng xuất */}
      <Modal transparent visible={logoutModal} animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalBox, { backgroundColor: tok.surface, borderColor: tok.border }]}>
            <Text style={[s.modalTitle, { color: tok.text }]}>Đăng Xuất</Text>
            <Text style={[s.modalContent, { color: tok.textMuted }]}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={[s.modalBtn, { flex: 1, backgroundColor: tok.surfaceEl }]} onPress={() => setLogoutModal(false)}>
                <Text style={{ color: tok.text, fontWeight: '700' }}>Thoát</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { flex: 1, backgroundColor: '#FF4444' }]} onPress={() => { setLogoutModal(false); showToast('Đã đăng xuất', 'info'); }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Modal chi tiết */}
      <Modal transparent visible={detailsModal.visible} animationType="fade" onRequestClose={() => setDetailsModal(prev => ({ ...prev, visible: false }))}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalBox, { backgroundColor: tok.surface, borderColor: tok.border }]}>
            <Text style={[s.modalTitle, { color: tok.text }]}>{detailsModal.title}</Text>
            <Text style={[s.modalContent, { color: tok.textMuted }]}>{detailsModal.content}</Text>
            <TouchableOpacity style={[s.modalBtn, { backgroundColor: tok.accent, marginTop: 24 }]} onPress={() => setDetailsModal(prev => ({ ...prev, visible: false }))}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── AVATAR PICKER SHEET ── */}
      <Sheet visible={showAvatarPick} onClose={() => setShowAvatarPick(false)} title="Chọn Avatar">
        <View style={{ paddingHorizontal: 16, paddingBottom: 36 }}>
          <Text style={{ color: tok.textMuted, fontSize: 13, marginBottom: 20 }}>
            Chọn 1 trong 3 avatar mẫu bên dưới:
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {SAMPLE_AVATARS.map(av => {
              const selected = avatarUri === av.uri;
              return (
                <TouchableOpacity
                  key={av.id}
                  onPress={() => {
                    setAvatarUri(av.uri);
                    setShowAvatarPick(false);
                    showToast('Avatar đã được cập nhật! ✅', 'ok');
                  }}
                  style={{ alignItems: 'center', gap: 8 }}
                  accessibilityLabel={av.label}
                  activeOpacity={0.8}
                >
                  <View style={[
                    s.avatarPickerWrap,
                    { borderColor: selected ? tok.accent : tok.border, borderWidth: selected ? 3 : 1.5 },
                  ]}>
                    <Image source={{ uri: av.uri }} style={s.avatarPickerImg} />
                    {selected && (
                      <View style={[s.avatarPickerCheck, { backgroundColor: tok.accent }]}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{
                    color: selected ? tok.accent : tok.textMuted,
                    fontSize: 12,
                    fontWeight: '700',
                  }}>{av.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Sheet>

    </ScrollView>
  );
};

// ─── CART TAB SCREEN ─────────────────────────────────────────────────────────
// ─── CART TAB SCREEN ─────────────────────────────────────────────────────────
const CartTabScreen = ({ cart, setCart, navigation }: any) => {
  const { tok } = useTok();
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shipType, setShipType] = useState('Standard');

  const subtotal = cart.reduce((s: number, i: CartItem) => s + i.price * i.qty, 0);
  const shipCost = shipType === 'Express' ? 15 : 0;
  const total = subtotal + shipCost - discount;

  const applyPromo = () => {
    if (promo.toUpperCase() === 'FIRST15') {
      setDiscount(subtotal * 0.15);
      showToast('15% discount applied! 🎊', 'ok');
    } else {
      showToast('Invalid promo code', 'err');
    }
  };

  const removeItem = (id: string, size?: string) => {
    setCart((prev: CartItem[]) => prev.filter(i => !(i.id === id && i.selectedSize === size)));
    showToast('Item removed', 'info');
  };

  const updateQty = (id: string, size: string | undefined, delta: number) => {
    setCart((prev: CartItem[]) => prev.map(i => {
      if (i.id === id && i.selectedSize === size) {
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    }));
  };

  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tok.bg, padding: 32 }}>
        <Text style={{ fontSize: 72, marginBottom: 20 }}>🛍️</Text>
        <Text style={{ fontSize: 22, fontWeight: '900', color: tok.text, marginBottom: 8 }}>Your cart is empty</Text>
        <Text style={{ color: tok.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
          Looks like you haven't added anything to your cart yet. Go ahead and explore our latest collections!
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: tok.accent, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 99 }}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tok.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: tok.text }}>My Cart</Text>
          <Text style={{ color: tok.textMuted, fontWeight: '700' }}>{cart.length} Items</Text>
        </View>

        {/* Cart Items */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          {cart.map((item: CartItem, idx: number) => (
            <View key={`${item.id}-${item.selectedSize}-${idx}`} style={{ flexDirection: 'row', backgroundColor: tok.surface, borderRadius: 20, padding: 12, gap: 12 }}>
              <View style={{ width: 90, height: 90, backgroundColor: tok.bg, borderRadius: 16, padding: 8 }}>
                <Image source={item.image} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: tok.textMuted, fontWeight: '700' }}>{item.brand}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: tok.text }} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item.id, item.selectedSize)}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 12, color: tok.textMuted, marginTop: 4 }}>
                  Variant: <Text style={{ color: tok.text, fontWeight: '700' }}>{item.selectedSize || 'Standard'}</Text>
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: tok.accent }}>${item.price.toFixed(2)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: tok.bg, borderRadius: 99, padding: 2 }}>
                    <TouchableOpacity onPress={() => updateQty(item.id, item.selectedSize, -1)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: tok.surface, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontWeight: '800', color: tok.text }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ paddingHorizontal: 12, fontWeight: '800', color: tok.text, minWidth: 34, textAlign: 'center' }}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => updateQty(item.id, item.selectedSize, 1)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: tok.text, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontWeight: '800', color: tok.bg }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Promo Code */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: tok.text, marginBottom: 12 }}>Promo Code</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={{ flex: 1, height: 50, backgroundColor: tok.surface, borderRadius: 12, paddingHorizontal: 16, color: tok.text, borderWidth: 1, borderColor: tok.border }}
              placeholder="Enter code (e.g. FIRST15)"
              placeholderTextColor={tok.textMuted}
              value={promo}
              onChangeText={setPromo}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={{ backgroundColor: tok.text, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' }}
              onPress={applyPromo}
            >
              <Text style={{ color: tok.bg, fontWeight: '800' }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shipping Options */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: tok.text, marginBottom: 12 }}>Shipping Method</Text>
          <View style={{ gap: 10 }}>
            {[
              { id: 'Standard', label: 'Standard Delivery', time: '3-5 days', price: 'Free' },
              { id: 'Express', label: 'Express Delivery', time: '1-2 days', price: '$15.00' }
            ].map(method => (
              <TouchableOpacity
                key={method.id}
                onPress={() => setShipType(method.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: tok.surface,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: shipType === method.id ? tok.accent : tok.border
                }}
              >
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: shipType === method.id ? tok.accent : tok.textMuted, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  {shipType === method.id && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tok.accent }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: tok.text }}>{method.label}</Text>
                  <Text style={{ fontSize: 12, color: tok.textMuted }}>{method.time}</Text>
                </View>
                <Text style={{ fontWeight: '900', color: method.price === 'Free' ? tok.success : tok.text }}>{method.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={{ backgroundColor: tok.surface, borderRadius: 24, padding: 20, gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: tok.text, marginBottom: 8 }}>Order Summary</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: tok.textMuted }}>Subtotal</Text>
            <Text style={{ fontWeight: '700', color: tok.text }}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: tok.textMuted }}>Shipping</Text>
            <Text style={{ fontWeight: '700', color: tok.text }}>{shipCost === 0 ? 'Free' : `$${shipCost.toFixed(2)}`}</Text>
          </View>
          {discount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: tok.success }}>Promo Discount</Text>
              <Text style={{ fontWeight: '700', color: tok.success }}>−${discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={{ height: 1, backgroundColor: tok.border, marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: tok.text }}>Total Amount</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: tok.accent }}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: tok.text, paddingVertical: 18, borderRadius: 99, alignItems: 'center', marginTop: 32 }}
          onPress={() => navigation.navigate('Checkout', { cart, total })}
        >
          <Text style={{ color: tok.bg, fontSize: 18, fontWeight: '900' }}>Checkout Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={{ color: tok.accent, fontWeight: '700' }}>Continue Shopping</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

// ─── NAVIGATION SETUP ────────────────────────────────────────────────────────
export type RootStackParamList = {
  MainTabs: undefined;
  ProductDetails: { product: typeof PRODUCTS[0] };
  Checkout: { cart: CartItem[], total: number };
  OrderHistory: undefined;
  OrderDetail: { order: any };
  Addresses: undefined;
  Payments: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Cart: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ─── FAVORITES TAB SCREEN ────────────────────────────────────────────────────
// ─── FAVORITES TAB SCREEN ────────────────────────────────────────────────────
const FavoritesTabScreen = ({ favorites, setFavorites, setCart, navigation }: any) => {
  const { tok } = useTok();
  const [isGrid, setIsGrid] = useState(true);

  const handleShare = async (p: any) => {
    try {
      await Share.share({
        message: `Check out this amazing product: ${p.name} on EmbeddedShop! Only $${p.price.toFixed(2)}`,
        title: p.name,
      });
    } catch {
      showToast('Could not share', 'err');
    }
  };

  const handleMoveToCart = (p: any) => {
    setCart((prev: CartItem[]) => {
      const found = prev.find(i => i.id === p.id);
      if (found) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
    setFavorites((prev: any) => prev.filter((f: any) => f.id !== p.id));
    showToast('Moved to cart! 🛒', 'ok');
  };

  if (favorites.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tok.bg, padding: 32 }}>
        <Text style={{ fontSize: 72, marginBottom: 20 }}>💖</Text>
        <Text style={{ fontSize: 22, fontWeight: '900', color: tok.text, marginBottom: 8 }}>Your favorites is empty</Text>
        <Text style={{ color: tok.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
          Tap the heart on any product to save it here for later!
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: tok.accent, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 99 }}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Explore Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tok.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: tok.text }}>My Favorites</Text>
            <Text style={{ color: tok.textMuted, fontWeight: '700' }}>{favorites.length} Items</Text>
          </View>
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: tok.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: tok.border }}
            onPress={() => setIsGrid(!isGrid)}
          >
            <Text style={{ fontSize: 20 }}>{isGrid ? '☰' : '▦'}</Text>
          </TouchableOpacity>
        </View>

        {isGrid ? (
          <View style={s.grid}>
            {favorites.map((p: any) => (
              <ProductCard
                key={p.id}
                item={p}
                onAdd={() => handleMoveToCart(p)}
                onPress={() => navigation.navigate('ProductDetails', { product: p })}
                favorites={favorites}
                setFavorites={setFavorites}
              />
            ))}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {favorites.map((p: any) => (
              <TouchableOpacity key={p.id} style={{ flexDirection: 'row', backgroundColor: tok.surface, padding: 12, borderRadius: 16, gap: 12 }} onPress={() => navigation.navigate('ProductDetails', { product: p })}>
                <Image source={p.image} style={{ width: 85, height: 85, borderRadius: 12, backgroundColor: tok.bg }} resizeMode="contain" />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, color: tok.textMuted, fontWeight: '700' }}> {p.brand}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: tok.text, marginBottom: 4 }} numberOfLines={1}>{p.name}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: tok.accent }}>${p.price.toFixed(2)}</Text>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <TouchableOpacity onPress={() => handleMoveToCart(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tok.text, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, color: tok.bg, fontWeight: '800' }}>Move to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleShare(p)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: tok.surfaceEl, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14 }}>🖇️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFavorites((prev: any) => prev.filter((f: any) => f.id !== p.id))} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: tok.surfaceEl, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─── TAB NAVIGATOR ───────────────────────────────────────────────────────────
const MainTabsScreen = ({ cart, setCart, favorites, setFavorites, dark, toggle, navigation }: any) => {
  const { tok } = useTok();
  return (
    <>
      <Navbar cartCount={cart.reduce((s: number, i: CartItem) => s + i.qty, 0)} onCart={() => navigation.navigate('MainTabs', { screen: 'Cart' })} dark={dark} toggle={toggle} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: tok.accent,
          tabBarInactiveTintColor: tok.textMuted,
          tabBarStyle: {
            backgroundColor: tok.bg,
            borderTopWidth: 1,
            borderTopColor: tok.border,
            elevation: 0,
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          tabBarIcon: ({ color }) => {
            let icon = '';
            if (route.name === 'Home') icon = '🏠';
            else if (route.name === 'Search') icon = '🔍';
            else if (route.name === 'Cart') icon = '🛒';
            else if (route.name === 'Favorites') icon = '❤️';
            else if (route.name === 'Profile') icon = '👤';
            return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
          },
        })}
      >
        <Tab.Screen name="Home">
          {(props) => <HomeScreen {...props} cart={cart} setCart={setCart} favorites={favorites} setFavorites={setFavorites} />}
        </Tab.Screen>
        <Tab.Screen name="Search">
          {(props) => <SearchScreen {...props} setCart={setCart} favorites={favorites} setFavorites={setFavorites} />}
        </Tab.Screen>
        <Tab.Screen name="Cart" options={{ tabBarBadge: cart.length > 0 ? cart.length : undefined, tabBarBadgeStyle: { backgroundColor: tok.accent, color: '#fff' } }}>
          {(props) => <CartTabScreen {...props} cart={cart} setCart={setCart} />}
        </Tab.Screen>
        <Tab.Screen name="Favorites">
          {(props) => <FavoritesTabScreen {...props} favorites={favorites} setFavorites={setFavorites} setCart={setCart} />}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {(props) => <ProfileScreen {...props} dark={dark} toggle={toggle} />}
        </Tab.Screen>
      </Tab.Navigator>
    </>
  );
};


// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const sys = useColorScheme();
  const [dark, setDark] = useState(sys === 'dark');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<typeof PRODUCTS[0][]>([]);

  useEffect(() => {
    AccessibilityInfo.isHighTextContrastEnabled().catch(() => { });
  }, []);

  const toggle = useCallback(() => setDark(d => !d), []);
  const tok = dark ? T_DARK : T_LIGHT;

  const CustomNavTheme = {
    ...DefaultTheme,
    dark: dark,
    colors: {
      ...DefaultTheme.colors,
      background: tok.bg,
      card: tok.bg,
      text: tok.text,
      border: tok.border,
      primary: tok.accent,
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeCtx.Provider value={{ tok, dark, toggle }}>
        <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={tok.bg} />
        <NavigationContainer theme={CustomNavTheme}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tok.bg } }}>
              <Stack.Screen name="MainTabs">
                {(props) => <MainTabsScreen {...props} cart={cart} setCart={setCart} favorites={favorites} setFavorites={setFavorites} dark={dark} toggle={toggle} />}
              </Stack.Screen>
              <Stack.Screen name="ProductDetails" options={{ animation: 'slide_from_right' }}>
                {(props) => <ProductDetailsScreen {...props} route={props.route} navigation={props.navigation} setCart={setCart} favorites={favorites} setFavorites={setFavorites} />}
              </Stack.Screen>
              <Stack.Screen name="Checkout" options={{ animation: 'slide_from_right' }}>
                {(props) => <CheckoutScreen {...props} />}
              </Stack.Screen>
              <Stack.Screen name="OrderHistory" options={{ animation: 'slide_from_right' }}>
                {(props) => <OrderHistoryScreen {...props} />}
              </Stack.Screen>
              <Stack.Screen name="OrderDetail" options={{ animation: 'slide_from_right' }}>
                {(props) => <OrderDetailScreen {...props} />}
              </Stack.Screen>
              <Stack.Screen name="Addresses" options={{ animation: 'slide_from_right' }}>
                {(props) => <PlaceholderScreen {...props} title="Shipping Addresses" />}
              </Stack.Screen>
              <Stack.Screen name="Payments" options={{ animation: 'slide_from_right' }}>
                {(props) => <PlaceholderScreen {...props} title="Payment Methods" />}
              </Stack.Screen>
              <Stack.Screen name="Settings" options={{ animation: 'slide_from_right' }}>
                {(props) => <PlaceholderScreen {...props} title="Settings" />}
              </Stack.Screen>
            </Stack.Navigator>
          </KeyboardAvoidingView>
          <Toast />
        </NavigationContainer>
      </ThemeCtx.Provider>
    </SafeAreaProvider>
  );
}

// ─── CHECKOUT SCREEN (MULTI-STEP) ───────────────────────────────────────────
const CheckoutScreen = ({ route, navigation }: any) => {
  const { tok } = useTok();
  const { cart, total } = route.params;
  const [step, setStep] = useState(0); // 0: Address, 1: Payment, 2: Review

  // Form States
  const [addr, setAddr] = useState({ name: '', phone: '', street: '', city: '' });
  const [pay, setPay] = useState('Credit Card');
  const [card, setCard] = useState({ num: '', exp: '', cvv: '' });
  const [loading, setLoading] = useState(false);

  const steps = ['Shipping', 'Payment', 'Review'];

  const validateAddr = () => addr.name && addr.phone && addr.street && addr.city;
  const validateCard = () => pay !== 'Credit Card' || (card.num && card.exp && card.cvv);

  const next = () => {
    if (step === 0 && !validateAddr()) return Alert.alert('Missing Info', 'Please fill all shipping fields.');
    if (step === 1 && !validateCard()) return Alert.alert('Missing Info', 'Please fill card details.');
    if (step === 2) return handlePlaceOrder();
    setStep(step + 1);
  };

  const back = () => {
    if (step === 0) return navigation.goBack();
    setStep(step - 1);
  };

  const handlePlaceOrder = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Order Confirmed!', 'Your neon-style gear is on the way! 🚀', [
        { text: 'Great!', onPress: () => navigation.navigate('MainTabs') }
      ]);
    }, 2000);
  };

  const StepIndicator = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: step >= i ? tok.accent : tok.border,
              backgroundColor: step >= i ? tok.accent : tok.surface, justifyContent: 'center', alignItems: 'center'
            }}>
              <Text style={{ color: step >= i ? '#fff' : tok.textMuted, fontWeight: '800', fontSize: 13 }}>{i + 1}</Text>
            </View>
            <Text style={{ position: 'absolute', top: 36, fontSize: 10, color: step >= i ? tok.text : tok.textMuted, fontWeight: '700', width: 60, textAlign: 'center' }}>{s}</Text>
          </View>
          {i < steps.length - 1 && <View style={{ width: 50, height: 2, backgroundColor: step > i ? tok.accent : tok.border, marginHorizontal: 8, marginTop: -10 }} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tok.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tok.border, backgroundColor: tok.bg }}>
          <TouchableOpacity onPress={back} style={{ width: 40, height: 40, justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, color: tok.text }}>←</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: tok.text }}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <StepIndicator />

        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <View style={{ gap: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: tok.text }}>Shipping Address</Text>
              <CInput label="Full Name" value={addr.name} onChange={(v: string) => setAddr({ ...addr, name: v })} placeholder="John Doe" leftIcon="👤" />
              <CInput label="Phone Number" value={addr.phone} onChange={(v: string) => setAddr({ ...addr, phone: v })} placeholder="+1 234 567 890" keyboardType="phone-pad" leftIcon="📞" />
              <CInput label="Street Address" value={addr.street} onChange={(v: string) => setAddr({ ...addr, street: v })} placeholder="123 Neon St." leftIcon="🏠" />
              <CInput label="City/State" value={addr.city} onChange={(v: string) => setAddr({ ...addr, city: v })} placeholder="Cybercity" leftIcon="🏙️" />
            </View>
          )}

          {step === 1 && (
            <View style={{ gap: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: tok.text }}>Payment Method</Text>
              {['Credit Card', 'PayPal', 'Cash on Delivery'].map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPay(m)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: tok.surface,
                    borderRadius: 16, borderWidth: 1.5, borderColor: pay === m ? tok.accent : tok.border
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: pay === m ? tok.accent : tok.textMuted, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                    {pay === m && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tok.accent }} />}
                  </View>
                  <Text style={{ flex: 1, fontWeight: '800', color: tok.text, fontSize: 16 }}>{m}</Text>
                  <Text style={{ fontSize: 20 }}>{m === 'PayPal' ? '🅿️' : m === 'Credit Card' ? '💳' : '💵'}</Text>
                </TouchableOpacity>
              ))}

              {pay === 'Credit Card' && (
                <View style={{ marginTop: 10, gap: 16, padding: 16, backgroundColor: tok.surfaceEl, borderRadius: 16 }}>
                  <CInput label="Card Number" value={card.num} onChange={(v: string) => setCard({ ...card, num: v })} placeholder="xxxx xxxx xxxx xxxx" keyboardType="numeric" leftIcon="💳" />
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1 }}><CInput label="Expiry" value={card.exp} onChange={(v: string) => setCard({ ...card, exp: v })} placeholder="MM/YY" /></View>
                    <View style={{ flex: 1 }}><CInput label="CVV" value={card.cvv} onChange={(v: string) => setCard({ ...card, cvv: v })} placeholder="***" keyboardType="numeric" secureTextEntry /></View>
                  </View>
                </View>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: tok.text }}>Review Order</Text>

              <View style={{ backgroundColor: tok.surface, borderRadius: 20, padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '800', color: tok.text }}>Shipping to:</Text>
                  <TouchableOpacity onPress={() => setStep(0)}><Text style={{ color: tok.accent, fontSize: 12 }}>Edit</Text></TouchableOpacity>
                </View>
                <Text style={{ color: tok.textMuted, fontSize: 14, lineHeight: 20 }}>{addr.name}{'\n'}{addr.street}, {addr.city}</Text>
              </View>

              <View style={{ backgroundColor: tok.surface, borderRadius: 20, padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '800', color: tok.text }}>Payment:</Text>
                  <TouchableOpacity onPress={() => setStep(1)}><Text style={{ color: tok.accent, fontSize: 12 }}>Edit</Text></TouchableOpacity>
                </View>
                <Text style={{ color: tok.textMuted, fontSize: 14 }}>{pay} {pay === 'Credit Card' ? `(**** ${card.num.slice(-4)})` : ''}</Text>
              </View>

              <View style={{ gap: 12 }}>
                <Text style={{ fontWeight: '800', color: tok.text }}>Items ({cart.length})</Text>
                {cart.map((i: any, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: tok.textMuted, flex: 1 }} numberOfLines={1}>{i.qty}x {i.name}</Text>
                    <Text style={{ color: tok.text, fontWeight: '700' }}>${(i.price * i.qty).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: tok.border }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: tok.text }}>Total Amount</Text>
                <Text style={{ fontSize: 24, fontWeight: '900', color: tok.accent }}>${total.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Bar */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: tok.bg, borderTopWidth: 1, borderTopColor: tok.border }}>
          <CButton
            label={step === 2 ? `Pay $${total.toFixed(2)}` : 'Continue'}
            onPress={next}
            loading={loading}
            variant="primary"
            rightIcon={step === 2 ? '⚡' : '→'}
            style={{ borderRadius: 28 }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};



// ─── ORDER HISTORY SCREEN ───────────────────────────────────────────────────
const OrderHistoryScreen = ({ navigation }: any) => {
  const { tok } = useTok();
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? ORDERS : ORDERS.filter(o => o.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: tok.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tok.border }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Text style={{ fontSize: 24, color: tok.text }}>←</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: tok.text }}>My Orders</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 60, paddingVertical: 10, paddingHorizontal: 16 }}>
          {['All', 'Delivered', 'In Transit', 'Processing', 'Cancelled'].map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                backgroundColor: filter === f ? tok.accent : tok.surface,
                borderWidth: 1, borderColor: filter === f ? tok.accent : tok.border
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: filter === f ? '#fff' : tok.text }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {filtered.map(order => (
            <TouchableOpacity
              key={order.id}
              style={{ backgroundColor: tok.surface, padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: tok.border }}
              onPress={() => navigation.navigate('OrderDetail', { order })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: tok.text }}>{order.id}</Text>
                  <Text style={{ fontSize: 12, color: tok.textMuted, marginTop: 2 }}>Placed on {order.date}</Text>
                </View>
                <View style={{ backgroundColor: ORDER_STATUS_COLOR[order.status] + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: ORDER_STATUS_COLOR[order.status] }}>{order.status}</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: tok.border, marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: tok.textMuted }}>{order.items} Items</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: tok.text }}>${order.total.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── ORDER DETAIL SCREEN ────────────────────────────────────────────────────
const OrderDetailScreen = ({ route, navigation }: any) => {
  const { tok } = useTok();
  const { order } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: tok.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tok.border }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Text style={{ fontSize: 24, color: tok.text }}>←</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: tok.text }}>Order Details</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ backgroundColor: tok.surface, padding: 20, borderRadius: 100, marginBottom: 16 }}>
              <Text style={{ fontSize: 40 }}>📦</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: tok.text }}>Order {order.id}</Text>
            <Text style={{ color: tok.textMuted, marginTop: 4 }}>Status: <Text style={{ color: ORDER_STATUS_COLOR[order.status], fontWeight: '800' }}>{order.status}</Text></Text>
          </View>

          {/* Tracking Animation Simulation */}
          <View style={{ backgroundColor: tok.surface, padding: 20, borderRadius: 24, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: tok.text, marginBottom: 20 }}>Order Tracking</Text>
            <View style={{ gap: 20 }}>
              {[
                { label: 'Order Placed', time: order.date, active: true },
                { label: 'Processing', time: 'Completed', active: order.status !== 'Cancelled' },
                { label: 'Shipped', time: 'In Transit', active: ['Delivered', 'In Transit'].includes(order.status) },
                { label: 'Out for Delivery', time: 'Expected Today', active: order.status === 'Delivered' },
              ].map((s, i, arr) => (
                <View key={s.label} style={{ flexDirection: 'row', gap: 15 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: s.active ? tok.success : tok.border, alignItems: 'center', justifyContent: 'center' }}>
                      {s.active && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                    </View>
                    {i < arr.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: s.active ? tok.success : tok.border, marginVertical: 4 }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: s.active ? tok.text : tok.textMuted }}>{s.label}</Text>
                    <Text style={{ fontSize: 12, color: tok.textMuted }}>{s.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ backgroundColor: tok.surface, padding: 20, borderRadius: 24, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: tok.text, marginBottom: 16 }}>Order Summary</Text>
            {order.items_list.map((item: any, idx: number) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Image source={item.image} style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: tok.bg }} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: tok.text }} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: tok.textMuted }}>Qty: {item.qty} · ${item.price.toFixed(2)}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: tok.border, marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: tok.text }}>Total Paid</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: tok.accent }}>${order.total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: tok.text, paddingVertical: 18, borderRadius: 99, alignItems: 'center' }}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={{ color: tok.bg, fontSize: 16, fontWeight: '900' }}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── PLACEHOLDER SCREEN FOR UNIMPLEMENTED STACKS ─────────────────────────────
const PlaceholderScreen = ({ navigation, title }: any) => {
  const { tok } = useTok();
  return (
    <View style={{ flex: 1, backgroundColor: tok.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: tok.text, marginBottom: 16 }}>{title}</Text>
      <TouchableOpacity style={{ backgroundColor: tok.surface, padding: 12, borderRadius: 8 }} onPress={() => navigation.goBack()}>
        <Text style={{ color: tok.accent, fontWeight: '700' }}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Navbar
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  navLogo: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  navSub: { fontSize: 10, fontWeight: '500', letterSpacing: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cartDot: { position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cartDotTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Tab bar
  tabBar: { flexDirection: 'row', borderTopWidth: 1 },
  tabItem: { flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 2, position: 'relative' },
  tabDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 0 },

  // Hero
  heroWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  heroBox: { height: H * 0.27, borderRadius: 24 },
  heroImg: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, gap: 6 },
  heroPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  heroPillTxt: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 32 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 17 },
  heroCta: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  heroCtaTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dotRow: { position: 'absolute', top: 12, right: 16, flexDirection: 'row', gap: 4 },
  dot: { height: 8, borderRadius: 4 },

  // Flash sale timer
  flashRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  flashLabel: { fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  timerSeg: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  timerDig: { fontSize: 13, fontWeight: '900', minWidth: 22, textAlign: 'center' },
  colon: { fontSize: 15, fontWeight: '900' },

  // Category pill
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },

  // Product card
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  cardImgWrap: { height: 160, position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  discPill: { position: 'absolute', bottom: 8, left: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  discTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
  heartBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 10, gap: 3 },
  cardBrand: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  cardName: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  price: { fontSize: 17, fontWeight: '900' },
  priceOld: { fontSize: 11, textDecorationLine: 'line-through' },
  addBtn: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  // Search
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 999, paddingHorizontal: 16, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  filterBtn: { width: 46, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  // Filter sheet
  filterLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  applyBtn: { paddingVertical: 16, borderRadius: 999, alignItems: 'center' },

  // Bottom sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: H * 0.9, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 20 },
  sheetPill: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { fontSize: 18, fontWeight: '800' },

  // Cart
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, gap: 10 },
  cartThumb: { width: 65, height: 65, borderRadius: 10 },
  cartName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },

  // Promo
  promo: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  promoCta: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  promoImg: { width: 100, height: 100 },

  // Toast
  toast: { position: 'absolute', bottom: 72, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 12 },

  // Profile
  profileCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  avatarWrap: { width: 88, height: 88, marginBottom: 10, position: 'relative' },
  avatarImg: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#334' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0D0D1A' },
  profileName: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  sectionCard: { borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  formInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1.5 },
  actionBtn: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  settingsCard: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  logoutBtn: { paddingVertical: 16, borderRadius: 999, alignItems: 'center', borderWidth: 1 },
  editProfileBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  avatarPickerWrap: { width: 84, height: 84, borderRadius: 42, overflow: 'hidden', position: 'relative' },
  avatarPickerImg: { width: 84, height: 84, borderRadius: 42 },
  avatarPickerCheck: { position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 12 },
  modalContent: { fontSize: 14, lineHeight: 22 },
  modalBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Trending
  trendTag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  // Results List
  listCard: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', padding: 12, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  listImg: { width: 100, height: 100, borderRadius: 12 },
  // Voice Modal
  voiceBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  voiceDot: { width: 12, height: 12, borderRadius: 6, opacity: 0.6 },
});

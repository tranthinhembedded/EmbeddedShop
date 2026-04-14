import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {CATEGORIES, PRODUCT_INDEX, PRODUCTS, type Product} from '../../catalog';
import {
  GestureBottomSheet,
  LoadingSkeleton,
  PinchZoomPanel,
  SwipeActionRow,
} from '../../components/advanced';
import {AppIcon} from '../../components/AppIcon';
import {HardwareGlyph} from '../../components/HardwareGlyph';
import {useRenderMetric} from '../../hooks/useRenderMetric';
import type {RootStackParamList} from '../../navigation/types';
import {useProductStore} from '../../store/productStore';
import {useShopApp} from '../../store/shopAppContext';
import {pushNotification, pushToast} from '../../store/uiStore';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdvancedLab'>;
type ViewMode = 'grid' | 'list';

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

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const sortProducts = (items: Product[], mode: string) => {
  const clone = [...items];
  if (mode === 'price-asc') {
    return clone.sort((a, b) => a.price - b.price);
  }
  if (mode === 'price-desc') {
    return clone.sort((a, b) => b.price - a.price);
  }
  if (mode === 'rating') {
    return clone.sort((a, b) => b.rating - a.rating);
  }
  return clone.sort((a, b) => b.reviews - a.reviews);
};

export default function AdvancedLabScreen({
  navigation,
}: Props): React.JSX.Element {
  useRenderMetric('AdvancedLab');

  const {width} = useWindowDimensions();
  const {
    dark,
    category,
    setCategory,
    sortMode,
    setSortMode,
    inStockOnly,
    setInStockOnly,
    favorites,
    toggleFavorite,
    addToCart,
  } = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const selectedBrand = useProductStore(state => state.selectedBrand);
  const setSelectedBrand = useProductStore(state => state.setSelectedBrand);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(PRODUCTS[0].id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saleEndsAt, setSaleEndsAt] = useState(Date.now() + 4 * 60 * 60 * 1000);
  const drawerX = useRef(new Animated.Value(320)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<Record<string, number>>({});

  const breakpointLabel =
    width >= 1024 ? 'Desktop' : width >= 768 ? 'Tablet' : 'Mobile';
  const listingWidth =
    viewMode === 'list' ? '100%' : width >= 1024 ? '23%' : width >= 768 ? '31%' : '48%';
  const featured = useMemo(() => PRODUCTS.slice(0, 5), []);
  const newArrivals = useMemo(() => [...PRODUCTS].reverse().slice(0, 5), []);
  const brandOptions = useMemo(
    () => ['all', ...Array.from(new Set(PRODUCTS.map(product => product.vendor))).sort()],
    [],
  );

  const filteredProducts = useMemo(
    () =>
      sortProducts(
        PRODUCTS.filter(product =>
          category === 'all' ? true : product.category === category,
        )
          .filter(product => (selectedBrand === 'all' ? true : product.vendor === selectedBrand))
          .filter(product => (inStockOnly ? product.stock > 0 : true)),
        sortMode,
      ),
    [category, inStockOnly, selectedBrand, sortMode],
  );

  const masonry = useMemo(
    () => [
      filteredProducts.slice(0, 3),
      filteredProducts.slice(3, 6),
    ],
    [filteredProducts],
  );

  const selectedProduct = PRODUCT_INDEX[selectedProductId];
  const saleLabel = useMemo(() => {
    const totalSeconds = Math.max(Math.floor((saleEndsAt - Date.now()) / 1000), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [saleEndsAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (saleEndsAt < Date.now()) {
        setSaleEndsAt(Date.now() + 4 * 60 * 60 * 1000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [saleEndsAt]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(drawerOpacity, {
        toValue: drawerOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(drawerX, {
        toValue: drawerOpen ? 0 : 320,
        useNativeDriver: true,
        speed: 18,
        bounciness: 7,
      }),
    ]).start();
  }, [drawerOpen, drawerOpacity, drawerX]);

  const handleRefresh = () => {
    setRefreshing(true);
    setShowSkeleton(true);

    setTimeout(() => {
      setRefreshing(false);
      setShowSkeleton(false);
      pushToast({
        title: 'Advanced lab refreshed',
        message: 'Skeleton and progressive loading demo completed.',
        tone: 'success',
        durationMs: 1800,
      });
    }, 900);
  };

  const handleProductPress = (product: Product) => {
    const now = Date.now();
    const previousTap = lastTapRef.current[product.id] ?? 0;

    if (now - previousTap < 260) {
      toggleFavorite(product.id);
      pushToast({
        title: 'Double tap like',
        message: `${product.name} was added to favorites.`,
        tone: 'success',
        durationMs: 1800,
      });
      lastTapRef.current[product.id] = 0;
      return;
    }

    lastTapRef.current[product.id] = now;
    setSelectedProductId(product.id);
    setSheetOpen(true);
  };

  const renderRailCard = (product: Product) => (
    <Pressable
      key={product.id}
      onPress={() => handleProductPress(product)}
      onLongPress={() => setMenuProduct(product)}
      style={[
        styles.railCard,
        {
          backgroundColor: alpha(theme.panel, 0.96),
          borderColor: alpha(theme.border, 0.88),
        },
      ]}>
      <View style={[styles.artwork, {backgroundColor: product.panel}]}>
        <HardwareGlyph product={product} theme={theme} size={94} />
      </View>
      <Text numberOfLines={2} style={[styles.cardTitle, {color: theme.text}]}>
        {product.name}
      </Text>
      <Text style={[styles.meta, {color: theme.lime}]}>{formatPrice(product.price)}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.headerButton, {borderColor: alpha(theme.border, 0.88), backgroundColor: alpha(theme.panelAlt, 0.92)}]}>
            <Text style={[styles.headerButtonLabel, {color: theme.text}]}>Back</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setDrawerOpen(true)} style={[styles.iconButton, {borderColor: alpha(theme.border, 0.88), backgroundColor: alpha(theme.panelAlt, 0.92)}]}>
              <AppIcon name="settings" size={18} color={theme.text} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Diagnostics')} style={[styles.iconButton, {borderColor: alpha(theme.border, 0.88), backgroundColor: alpha(theme.panelAlt, 0.92)}]}>
              <AppIcon name="info" size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.hero, {backgroundColor: alpha(theme.panel, 0.96), borderColor: alpha(theme.border, 0.92)}]}>
          <Text style={[styles.eyebrow, {color: theme.accent}]}>ADVANCED LAB</Text>
          <Text style={[styles.heroTitle, {color: theme.text, fontSize: width >= 768 ? 32 : 26}]}>
            Responsive layout, list patterns, gestures, animations, and loading states.
          </Text>
          <Text style={[styles.meta, {color: theme.textMuted}]}>
            Breakpoint: {breakpointLabel} • Flash sale: {saleLabel}
          </Text>
        </View>

        <View style={styles.categoryWrap}>
          {CATEGORIES.filter(item => item.id !== 'all').map(item => (
            <Pressable
              key={item.id}
              onPress={() => setCategory(item.id)}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: category === item.id ? alpha(theme.accent, 0.16) : alpha(theme.panelAlt, 0.92),
                  borderColor: category === item.id ? alpha(theme.accent, 0.3) : alpha(theme.border, 0.88),
                },
              ]}>
              <Text style={[styles.cardTitle, {color: theme.text}]}>{item.label}</Text>
              <Text style={[styles.meta, {color: theme.textMuted}]}>{item.summary}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.panel, {backgroundColor: alpha(theme.panel, 0.96), borderColor: alpha(theme.border, 0.92)}]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pillRow}>
              {brandOptions.map(brand => (
                <Pressable
                  key={brand}
                  onPress={() => setSelectedBrand(brand)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selectedBrand === brand ? alpha(theme.text, 0.96) : alpha(theme.panelAlt, 0.92),
                      borderColor: selectedBrand === brand ? alpha(theme.text, 0.2) : alpha(theme.border, 0.88),
                    },
                  ]}>
                  <Text style={[styles.pillLabel, {color: selectedBrand === brand ? theme.bg : theme.text}]}>
                    {brand}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={styles.toolbarRow}>
            <View style={styles.segmented}>
              {(['grid', 'list'] as ViewMode[]).map(mode => (
                <Pressable key={mode} onPress={() => setViewMode(mode)} style={[styles.segment, {backgroundColor: viewMode === mode ? alpha(theme.accent, 0.18) : 'transparent'}]}>
                  <Text style={[styles.pillLabel, {color: viewMode === mode ? theme.accent : theme.text}]}>
                    {mode}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.segmented}>
              {['popularity', 'price-desc', 'rating'].map(mode => (
                <Pressable key={mode} onPress={() => setSortMode(mode as typeof sortMode)} style={[styles.segment, {backgroundColor: sortMode === mode ? alpha(theme.accent, 0.18) : 'transparent'}]}>
                  <Text style={[styles.pillLabel, {color: sortMode === mode ? theme.accent : theme.text}]}>
                    {mode === 'price-desc' ? 'price' : mode === 'rating' ? 'rating' : 'popular'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable onPress={() => setInStockOnly(previous => !previous)} style={[styles.stockToggle, {borderColor: alpha(theme.border, 0.88), backgroundColor: inStockOnly ? alpha(theme.lime, 0.14) : alpha(theme.panelAlt, 0.92)}]}>
            <Text style={[styles.pillLabel, {color: inStockOnly ? theme.lime : theme.text}]}>
              {inStockOnly ? 'Showing in-stock only' : 'Showing all stock states'}
            </Text>
          </Pressable>
        </View>

        <FlatList horizontal data={featured} keyExtractor={item => `featured-${item.id}`} renderItem={({item}) => renderRailCard(item)} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railList} />
        <FlatList horizontal data={newArrivals} keyExtractor={item => `new-${item.id}`} renderItem={({item}) => renderRailCard(item)} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railList} />

        <Text style={[styles.sectionTitle, {color: theme.text}]}>Virtualized listing</Text>
        {showSkeleton ? (
          <View style={styles.grid}>
            {Array.from({length: 4}, (_, index) => (
              <View key={`skeleton-${index}`} style={[styles.listingCard, {width: listingWidth, backgroundColor: alpha(theme.panel, 0.96), borderColor: alpha(theme.border, 0.88)}]}>
                <LoadingSkeleton height={120} rounded={18} />
                <LoadingSkeleton height={14} style={{marginTop: 12}} />
                <LoadingSkeleton height={12} width="60%" style={{marginTop: 8}} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.slice(0, 8).map(product => (
              <Pressable
                key={product.id}
                onPress={() => handleProductPress(product)}
                onLongPress={() => setMenuProduct(product)}
                style={[
                  styles.listingCard,
                  {width: listingWidth, backgroundColor: alpha(theme.panel, 0.96), borderColor: alpha(theme.border, 0.88)},
                ]}>
                <View style={[styles.artwork, {backgroundColor: product.panel}]}>
                  <HardwareGlyph product={product} theme={theme} size={viewMode === 'list' ? 96 : 82} />
                </View>
                <Text numberOfLines={2} style={[styles.cardTitle, {color: theme.text}]}>
                  {product.name}
                </Text>
                <Text style={[styles.meta, {color: theme.textMuted}]}>
                  {product.vendor} • {favorites.includes(product.id) ? 'liked' : 'double tap to like'}
                </Text>
                <Text style={[styles.meta, {color: theme.lime}]}>{formatPrice(product.price)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, {color: theme.text}]}>Masonry layout</Text>
        <View style={styles.masonryWrap}>
          {masonry.map((column, columnIndex) => (
            <View key={`column-${columnIndex}`} style={styles.masonryColumn}>
              {column.map((item, index) => (
                <View key={item.id} style={[styles.masonryCard, {minHeight: 150 + ((index + columnIndex) % 2) * 44, backgroundColor: alpha(theme.panel, 0.96), borderColor: alpha(theme.border, 0.88)}]}>
                  <Text style={[styles.cardTitle, {color: theme.text}]}>{item.name}</Text>
                  <Text style={[styles.meta, {color: theme.textMuted}]}>{item.highlight}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, {color: theme.text}]}>Swipe actions</Text>
        <View style={styles.stack}>
          {featured.slice(0, 3).map(product => (
            <SwipeActionRow
              key={product.id}
              actions={[
                {label: 'Share', tone: 'info', onPress: () => pushToast({title: 'Share action', message: product.name, tone: 'info', durationMs: 1500})},
                {label: favorites.includes(product.id) ? 'Saved' : 'Favorite', tone: 'success', onPress: () => toggleFavorite(product.id)},
                {label: 'Delete', tone: 'error', onPress: () => pushNotification('Swipe delete', `${product.name} was removed from the gesture lab.`)},
              ]}>
              <View style={[styles.swipeSurface, {backgroundColor: alpha(theme.panelAlt, 0.9), borderColor: alpha(theme.border, 0.88)}]}>
                <Text style={[styles.cardTitle, {color: theme.text}]}>{product.name}</Text>
                <Text style={[styles.meta, {color: theme.textMuted}]}>Swipe left to reveal actions.</Text>
              </View>
            </SwipeActionRow>
          ))}
        </View>

        <Text style={[styles.sectionTitle, {color: theme.text}]}>Pinch zoom</Text>
        <View style={[styles.zoomCard, {backgroundColor: alpha(theme.panel, 0.96), borderColor: alpha(theme.border, 0.88)}]}>
          <PinchZoomPanel>
            <View style={[styles.zoomStage, {backgroundColor: selectedProduct.panel}]}>
              <HardwareGlyph product={selectedProduct} theme={theme} size={220} />
            </View>
          </PinchZoomPanel>
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, {backgroundColor: alpha(theme.surface, dark ? 0.98 : 0.96), borderTopColor: alpha(theme.border, 0.88)}]}>
        <View style={{flex: 1}}>
          <Text style={[styles.meta, {color: theme.textMuted}]}>Sticky checkout button</Text>
          <Text style={[styles.cardTitle, {color: theme.text}]}>{filteredProducts.length} items ready</Text>
        </View>
        <Pressable onPress={() => addToCart(selectedProduct.id, 1)} style={[styles.primaryButton, {backgroundColor: theme.accent}]}>
          <Text style={styles.primaryButtonLabel}>Add selected</Text>
        </Pressable>
      </View>

      <GestureBottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>{selectedProduct.name}</Text>
        <Text style={[styles.meta, {color: theme.textMuted}]}>Drag down to dismiss this bottom sheet.</Text>
        <View style={[styles.sheetStage, {backgroundColor: selectedProduct.panel}]}>
          <HardwareGlyph product={selectedProduct} theme={theme} size={180} />
        </View>
      </GestureBottomSheet>

      <Modal transparent visible={Boolean(menuProduct)} animationType="fade" onRequestClose={() => setMenuProduct(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuProduct(null)} />
          <View style={[styles.modalCard, {backgroundColor: theme.surface, borderColor: alpha(theme.border, 0.92)}]}>
            <Text style={[styles.sectionTitle, {color: theme.text}]}>{menuProduct?.name}</Text>
            <Text style={[styles.meta, {color: theme.textMuted}]}>Long press menu for contextual actions.</Text>
            <Pressable onPress={() => { if (menuProduct) { toggleFavorite(menuProduct.id); } setMenuProduct(null); }} style={[styles.modalAction, {backgroundColor: alpha(theme.panelAlt, 0.92), borderColor: alpha(theme.border, 0.88)}]}>
              <Text style={[styles.pillLabel, {color: theme.text}]}>Toggle favorite</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View pointerEvents={drawerOpen ? 'auto' : 'none'} style={styles.drawerOverlay}>
        <Animated.View style={[styles.drawerBackdrop, {opacity: drawerOpacity}]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} />
        </Animated.View>
        <Animated.View style={[styles.drawer, {backgroundColor: theme.surface, borderColor: alpha(theme.border, 0.92), transform: [{translateX: drawerX}]}]}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>Animated drawer</Text>
          <Text style={[styles.meta, {color: theme.textMuted}]}>Use this panel for diagnostics shortcuts and quick actions.</Text>
          <Pressable onPress={() => { navigation.navigate('Diagnostics'); setDrawerOpen(false); }} style={[styles.modalAction, {backgroundColor: alpha(theme.panelAlt, 0.92), borderColor: alpha(theme.border, 0.88)}]}>
            <Text style={[styles.pillLabel, {color: theme.text}]}>Open diagnostics</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 108, gap: 18},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headerActions: {flexDirection: 'row', gap: 10},
  headerButton: {paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1},
  headerButtonLabel: {fontSize: 14, fontWeight: '700'},
  iconButton: {width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  hero: {borderRadius: 26, borderWidth: 1, padding: 20},
  eyebrow: {fontSize: 12, fontWeight: '900', letterSpacing: 1.6, marginBottom: 10},
  heroTitle: {fontWeight: '900', lineHeight: 38},
  sectionTitle: {fontSize: 20, fontWeight: '900'},
  meta: {fontSize: 13, lineHeight: 19, marginTop: 6},
  categoryWrap: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  categoryCard: {width: '48%', borderRadius: 20, borderWidth: 1, padding: 14, marginBottom: 12},
  panel: {borderRadius: 24, borderWidth: 1, padding: 16, gap: 12},
  pillRow: {flexDirection: 'row', gap: 10},
  pill: {borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9},
  pillLabel: {fontSize: 12, fontWeight: '800', textTransform: 'capitalize'},
  toolbarRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  segmented: {flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: 'rgba(148, 163, 184, 0.08)'},
  segment: {paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12},
  stockToggle: {borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12},
  railList: {paddingBottom: 4},
  railCard: {width: 180, marginRight: 12, borderRadius: 22, borderWidth: 1, padding: 12},
  artwork: {height: 112, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  cardTitle: {fontSize: 14, lineHeight: 20, fontWeight: '800'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  listingCard: {borderRadius: 22, borderWidth: 1, padding: 12, marginBottom: 12},
  masonryWrap: {flexDirection: 'row', gap: 12},
  masonryColumn: {flex: 1, gap: 12},
  masonryCard: {borderRadius: 22, borderWidth: 1, padding: 14, justifyContent: 'space-between'},
  stack: {gap: 12},
  swipeSurface: {borderRadius: 18, borderWidth: 1, padding: 16},
  zoomCard: {borderRadius: 24, borderWidth: 1, padding: 18},
  zoomStage: {height: 280, borderRadius: 24, alignItems: 'center', justifyContent: 'center'},
  stickyFooter: {position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12},
  primaryButton: {minHeight: 52, borderRadius: 18, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center'},
  primaryButtonLabel: {color: '#061018', fontSize: 14, fontWeight: '900'},
  sheetStage: {height: 220, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 16},
  modalBackdrop: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: 'rgba(7, 17, 26, 0.6)'},
  modalCard: {width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, padding: 18},
  modalAction: {minHeight: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 12},
  drawerOverlay: {...StyleSheet.absoluteFillObject, justifyContent: 'flex-end'},
  drawerBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7, 17, 26, 0.4)'},
  drawer: {position: 'absolute', top: 0, right: 0, bottom: 0, width: 288, borderLeftWidth: 1, paddingTop: 72, paddingHorizontal: 18},
});

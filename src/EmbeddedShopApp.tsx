import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {
  CATEGORIES,
  CategoryId,
  HOME_COLLECTIONS,
  Order,
  PRODUCT_INDEX,
  PRODUCTS,
  Product,
  SortMode,
  TRENDING_TERMS,
} from './catalog';
import Loading from './components/common/Loading';
import {useAppAlert} from './components/common/AppAlertProvider';
import {AppIcon} from './components/AppIcon';
import {HardwareGlyph} from './components/HardwareGlyph';
import SearchCameraModal, {
  type SearchImageAsset,
} from './components/search/SearchCameraModal';
import type {CheckoutRouteParams} from './navigation/types';
import {getProductImageSource, HOME_HERO_BANNER_SOURCE} from './productImages';
import {CartEntry, ShopTabId, useShopApp} from './store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from './theme';
import {useAuthStore} from './store/authStore';

type BubblePoint = {x: number; y: number};
type CatalogViewMode = 'grid' | 'list';
type HeroArtworkMode = 'banner' | 'cutout';
type ShippingOptionId = 'standard' | 'express' | 'pickup';
type CheckoutStepId = 'shipping' | 'payment' | 'review';
type PaymentMethodId = 'credit-card' | 'debit-card' | 'paypal' | 'cash-on-delivery';
type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  product: Product;
  artworkSource?: ImageSourcePropType;
  artworkMode?: HeroArtworkMode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

const ORDER_STATUS_COLORS: Record<Order['status'], string> = {
  Delivered: '#5BCB7F',
  Processing: '#FFBA49',
  'Ready to ship': '#41D7FF',
  'Awaiting payment': '#FF6B7C',
  'Cancellation review pending': '#FF7A98',
};

const SHIPPING_OPTIONS: Array<{
  id: ShippingOptionId;
  label: string;
  description: string;
  fee: number;
}> = [
  {
    id: 'standard',
    label: 'Standard dispatch',
    description: 'Bench prep in 2-4 business days',
    fee: 185000,
  },
  {
    id: 'express',
    label: 'Priority dispatch',
    description: 'Fast-track packing and release',
    fee: 320000,
  },
  {
    id: 'pickup',
    label: 'Lab pickup',
    description: 'Collect directly from the HCMC desk',
    fee: 0,
  },
];

const PROMO_CODE_DESCRIPTIONS: Record<string, string> = {
  LAB10: '10% off modules, capped at 250.000 đ',
  FREESHIP: 'Free shipping on the selected option',
  EDGE150: '150.000 đ off the order total',
};

const CHECKOUT_STEPS: Array<{id: CheckoutStepId; label: string}> = [
  {id: 'shipping', label: 'Shipping'},
  {id: 'payment', label: 'Payment'},
  {id: 'review', label: 'Review'},
];

const PAYMENT_METHODS: Array<{
  id: PaymentMethodId;
  label: string;
  description: string;
}> = [
  {
    id: 'credit-card',
    label: 'Credit card',
    description: 'Visa, Mastercard, or Amex via simulated checkout.',
  },
  {
    id: 'debit-card',
    label: 'Debit card',
    description: 'Domestic or international debit cards.',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Simulated PayPal express approval.',
  },
  {
    id: 'cash-on-delivery',
    label: 'Cash on delivery',
    description: 'Pay when the shipment is delivered.',
  },
];

const ADDRESS_PRESETS = [
  {
    id: 'lab-hcm',
    label: 'Lab desk',
    company: 'Embedded Robotics Lab',
    contactName: 'Tran Thinh',
    email: 'thinh@example.com',
    address: '12 Nguyen Van Cu, District 5, Ho Chi Minh City',
  },
  {
    id: 'factory-bd',
    label: 'Factory gate',
    company: 'Embedded Shop Factory',
    contactName: 'Operations Team',
    email: 'ops@embeddedshop.vn',
    address: 'Lot B2, VSIP 1, Thuan An, Binh Duong',
  },
  {
    id: 'r-and-d-hn',
    label: 'R&D office',
    company: 'Control Systems Group',
    contactName: 'Ha Nguyen',
    email: 'ha.nguyen@example.com',
    address: '85 Duy Tan, Cau Giay, Ha Noi',
  },
] as const;

const SEARCH_SORT_OPTIONS: Array<{id: SortMode; label: string}> = [
  {id: 'popularity', label: 'Popularity'},
  {id: 'price-asc', label: 'Price low-high'},
  {id: 'price-desc', label: 'Price high-low'},
  {id: 'newest', label: 'Newest'},
  {id: 'rating', label: 'Rating'},
];

const SEARCH_HISTORY_SEED = ['Raspberry Pi', 'Lidar', 'Motor driver'];
const VOICE_SEARCH_TERMS = ['Jetson', 'CAN bus', 'FPGA', 'Raspberry Pi', 'Lidar'];
const RATING_FILTER_OPTIONS = [0, 4, 4.5, 4.8] as const;
const PRICE_MARK_COUNT = 6;
const CATALOG_PAGE_SIZE = 6;
const CATALOG_SEARCH_DEBOUNCE_MS = 350;
const CATALOG_LIST_ROW_HEIGHT = 252;
const CATALOG_GRID_ROW_HEIGHT = 344;
const IMAGE_SEARCH_STOP_WORDS = new Set([
  'camera',
  'capture',
  'copy',
  'edit',
  'file',
  'image',
  'img',
  'jpeg',
  'jpg',
  'photo',
  'png',
  'screenshot',
  'search',
  'temp',
  'upload',
  'webp',
]);

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

const formatCompactCount = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : `${value}`;

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

const tokenizeImageSearch = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[^a-z0-9]+/g)
    .filter(token => token.length > 2 && !IMAGE_SEARCH_STOP_WORDS.has(token));

const inferCatalogTermFromImage = (asset: SearchImageAsset) => {
  const sourceText = [asset.fileName, asset.uri].filter(Boolean).join(' ');
  const tokens = Array.from(new Set(tokenizeImageSearch(sourceText)));

  const matches = tokens
    .map(token => {
      const score = PRODUCTS.reduce((count, product) => {
        const haystack = [
          product.name,
          product.vendor,
          product.highlight,
          product.shortDescription,
          ...product.tags,
          ...product.applications,
          ...product.compatibility,
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(token) ? count + 1 : count;
      }, 0);

      return {token, score};
    })
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || right.token.length - left.token.length);

  return matches[0]?.token ?? '';
};

const formatSearchImageMeta = (asset: SearchImageAsset) => {
  const parts = [asset.source === 'camera' ? 'Camera photo' : 'Library photo'];

  if (asset.width && asset.height) {
    parts.push(`${asset.width}x${asset.height}`);
  }

  return parts.join(' | ');
};

const maskEmail = (email: string) => {
  const [localPart = '', domain = 'example.com'] = email.split('@');
  const safeLocal = localPart.trim();

  if (!safeLocal) {
    return `hidden@${domain}`;
  }

  const visible = safeLocal.slice(0, Math.min(2, safeLocal.length));
  return `${visible}${'*'.repeat(Math.max(safeLocal.length - visible.length, 3))}@${domain}`;
};

const getRatingStars = (rating: number) => {
  const filled = Math.max(1, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
};

const getDiscountPercent = (product: Pick<Product, 'price' | 'previousPrice'>) =>
  product.previousPrice && product.previousPrice > product.price
    ? Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)
    : 0;

const takeUniqueProducts = (items: Product[], count: number, used: Set<string>) => {
  const result: Product[] = [];

  for (const item of items) {
    if (used.has(item.id)) {
      continue;
    }

    used.add(item.id);
    result.push(item);

    if (result.length === count) {
      break;
    }
  }

  return result;
};

const sortProducts = (items: Product[], mode: SortMode) => {
  const clone = [...items];
  switch (mode) {
    case 'price-asc':
      return clone.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return clone.sort((a, b) => b.price - a.price);
    case 'newest':
      return clone.reverse();
    case 'rating':
      return clone.sort((a, b) => b.rating - a.rating);
    case 'stock':
      return clone.sort((a, b) => b.stock - a.stock);
    case 'popularity':
    default:
      return clone.sort((a, b) => b.reviews - a.reviews);
  }
};

const getPromoDiscount = (
  promoCode: string | null,
  subtotal: number,
  shippingFee: number,
) => {
  switch (promoCode) {
    case 'LAB10':
      return Math.min(Math.round(subtotal * 0.1), 250000);
    case 'FREESHIP':
      return shippingFee;
    case 'EDGE150':
      return 150000;
    default:
      return 0;
  }
};

const measureViewInWindow = (ref: React.RefObject<View | null>) =>
  new Promise<{x: number; y: number; width: number; height: number} | null>(
    resolve => {
      if (!ref.current) {
        resolve(null);
        return;
      }

      ref.current.measureInWindow((x, y, width, height) => {
        resolve({x, y, width, height});
      });
    },
  );

type EmbeddedShopAppProps = {
  activeTab?: ShopTabId;
  onTabChange?: (tab: ShopTabId) => void;
  onOpenProductDetail?: (productId: string, tab: ShopTabId) => void;
  onOpenCheckout?: (tab: ShopTabId, params: Omit<CheckoutRouteParams, 'tab'>) => void;
  onOpenOrders?: (tab: ShopTabId) => void;
  onOpenEditProfile?: (tab: ShopTabId) => void;
  onOpenShippingAddresses?: (tab: ShopTabId) => void;
  onOpenPaymentMethods?: (tab: ShopTabId) => void;
  onOpenSettings?: (tab: ShopTabId) => void;
  onLogout?: () => void;
  showBottomBar?: boolean;
  initialProductId?: string | null;
  initialCheckoutOpen?: boolean;
  initialOrdersOpen?: boolean;
  onCloseProductDetail?: () => void;
  onCloseCheckout?: () => void;
  onCloseOrders?: () => void;
};

export default function EmbeddedShopApp({
  activeTab,
  onTabChange,
  onOpenProductDetail,
  onOpenCheckout,
  onOpenOrders,
  onOpenEditProfile,
  onOpenShippingAddresses,
  onOpenPaymentMethods,
  onOpenSettings,
  onLogout,
  showBottomBar = true,
  initialProductId = null,
  initialCheckoutOpen = false,
  initialOrdersOpen = false,
  onCloseProductDetail,
  onCloseCheckout,
  onCloseOrders,
}: EmbeddedShopAppProps): React.JSX.Element {
  const {width: screenWidth} = useWindowDimensions();
  const {
    dark,
    setDark,
    query,
    setQuery,
    category,
    setCategory,
    sortMode,
    setSortMode,
    inStockOnly,
    setInStockOnly,
    favorites,
    cart,
    orders,
    notifications,
    setNotifications,
    profile,
    emailPublic,
    setEmailPublic,
    checkoutResetVersion,
    cartTotal,
    addToCart,
    toggleFavorite,
    updateCartQuantity,
    removeFromCart,
    placeOrder,
    markCheckoutCompleted,
  } = useShopApp();
  const {showAlert} = useAppAlert();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const [internalTab, setInternalTab] = useState<ShopTabId>('home');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialProductId);
  const [checkoutOpen, setCheckoutOpen] = useState(initialCheckoutOpen);
  const [ordersOpen, setOrdersOpen] = useState(initialOrdersOpen);
  const [cartBubbleVisible, setCartBubbleVisible] = useState(false);
  const [favoriteBubbleVisible, setFavoriteBubbleVisible] = useState(false);
  const screenRef = useRef<View>(null);
  const heroCarouselRef = useRef<ScrollView>(null);
  const cartActionRef = useRef<View>(null);
  const savedTabRef = useRef<View>(null);
  const cartBubbleX = useRef(new Animated.Value(-999)).current;
  const cartBubbleY = useRef(new Animated.Value(-999)).current;
  const cartBubbleScale = useRef(new Animated.Value(0.6)).current;
  const cartBubbleOpacity = useRef(new Animated.Value(0)).current;
  const favoriteBubbleX = useRef(new Animated.Value(-999)).current;
  const favoriteBubbleY = useRef(new Animated.Value(-999)).current;
  const favoriteBubbleScale = useRef(new Animated.Value(0.6)).current;
  const favoriteBubbleOpacity = useRef(new Animated.Value(0)).current;
  const cartIconScale = useRef(new Animated.Value(1)).current;
  const savedIconScale = useRef(new Animated.Value(1)).current;
  const [homeCarouselIndex, setHomeCarouselIndex] = useState(0);
  const [homeRefreshing, setHomeRefreshing] = useState(false);
  const [homeFeedCount, setHomeFeedCount] = useState(4);
  const [homeLoadingMore, setHomeLoadingMore] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<CatalogViewMode>('grid');
  const [favoritesViewMode, setFavoritesViewMode] = useState<CatalogViewMode>('grid');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearchInput, setCatalogSearchInput] = useState(query);
  const [searchCameraOpen, setSearchCameraOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(SEARCH_HISTORY_SEED);
  const [selectedSearchImage, setSelectedSearchImage] =
    useState<SearchImageAsset | null>(null);
  const [recentSearchImages, setRecentSearchImages] = useState<SearchImageAsset[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [minimumRating, setMinimumRating] = useState<number>(0);
  const [priceHandleFocus, setPriceHandleFocus] = useState<'min' | 'max'>('max');
  const [catalogPriceMinIndex, setCatalogPriceMinIndex] = useState(0);
  const [catalogPriceMaxIndex, setCatalogPriceMaxIndex] = useState(PRICE_MARK_COUNT - 1);
  const [catalogVisibleCount, setCatalogVisibleCount] = useState(CATALOG_PAGE_SIZE);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const [shippingOptionId, setShippingOptionId] = useState<ShippingOptionId>('standard');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const catalogSearchPrimedRef = useRef(false);
  const voiceSampleIndexRef = useRef(0);
  const tab = activeTab ?? internalTab;
  const searchText = query;
  const selectedProduct = selectedProductId ? PRODUCT_INDEX[selectedProductId] : null;
  const heroCarouselWidth = Math.max(screenWidth - 20, 280);
  const brandOptions = useMemo(
    () => ['all', ...Array.from(new Set(PRODUCTS.map(product => product.vendor))).sort()],
    [],
  );
  const priceMarks = useMemo(() => {
    const values = PRODUCTS.map(product => product.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / Math.max(PRICE_MARK_COUNT - 1, 1);

    return Array.from({length: PRICE_MARK_COUNT}, (_, index) =>
      Math.round((min + step * index) / 50000) * 50000,
    );
  }, []);
  const selectedPriceMin = priceMarks[catalogPriceMinIndex] ?? priceMarks[0];
  const selectedPriceMax =
    priceMarks[catalogPriceMaxIndex] ?? priceMarks[priceMarks.length - 1];
  const selectedShippingOption =
    SHIPPING_OPTIONS.find(option => option.id === shippingOptionId) ?? SHIPPING_OPTIONS[0];
  const shippingFee = selectedShippingOption.fee;
  const promoDiscount = useMemo(
    () => getPromoDiscount(appliedPromoCode, cartTotal, shippingFee),
    [appliedPromoCode, cartTotal, shippingFee],
  );
  const orderTotal = Math.max(cartTotal - promoDiscount, 0) + shippingFee;

  useEffect(() => {
    setSelectedProductId(initialProductId);
  }, [initialProductId]);

  useEffect(() => {
    setCheckoutOpen(initialCheckoutOpen);
  }, [initialCheckoutOpen]);

  useEffect(() => {
    setOrdersOpen(initialOrdersOpen);
  }, [initialOrdersOpen]);

  useEffect(() => {
    setShippingOptionId('standard');
    setPromoCodeInput('');
    setAppliedPromoCode(null);
    setCheckoutOpen(false);
  }, [checkoutResetVersion]);

  useEffect(() => {
    setCatalogSearchInput(query);
  }, [query]);

  useEffect(() => {
    if (catalogSearchInput === query) {
      return;
    }

    const timer = setTimeout(() => {
      setQuery(catalogSearchInput);
    }, CATALOG_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [catalogSearchInput, query, setQuery]);

  const handleTabChange = (nextTab: ShopTabId) => {
    if (onTabChange) {
      onTabChange(nextTab);
      return;
    }

    setInternalTab(nextTab);
  };

  const openProductDetail = (productId: string) => {
    if (onOpenProductDetail) {
      onOpenProductDetail(productId, tab);
      return;
    }

    setSelectedProductId(productId);
  };

  const closeProductDetail = () => {
    setSelectedProductId(null);
    onCloseProductDetail?.();
  };

  const openCheckout = () => {
    if (onOpenCheckout) {
      onOpenCheckout(tab, {
        subtotal: cartTotal,
        shippingLabel: selectedShippingOption.label,
        shippingFee,
        discountAmount: promoDiscount,
        appliedPromoCode,
        total: orderTotal,
      });
      return;
    }

    setCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    onCloseCheckout?.();
  };

  const openOrders = () => {
    if (onOpenOrders) {
      onOpenOrders(tab);
      return;
    }

    setOrdersOpen(true);
  };

  const closeOrders = () => {
    setOrdersOpen(false);
    onCloseOrders?.();
  };

  const openEditProfile = () => {
    onOpenEditProfile?.(tab);
  };

  const openShippingAddresses = () => {
    onOpenShippingAddresses?.(tab);
  };

  const openPaymentMethods = () => {
    onOpenPaymentMethods?.(tab);
  };

  const openSettings = () => {
    onOpenSettings?.(tab);
  };
  
  const handleMoveToCart = (productId: string) => {
    addToCart(productId, 1);
    toggleFavorite(productId);
    showAlert({
      tone: 'success',
      eyebrow: 'SAVED ITEMS',
      title: 'Moved to cart',
      message: 'Product has been moved from favorites to your cart.',
    });
  };

  const handleLogout = () => {
    showAlert({
      tone: 'danger',
      eyebrow: 'SIGN OUT',
      title: 'Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await useAuthStore.getState().logout();
            } catch {
              // ignore network errors — session is cleared regardless
            } finally {
              onLogout?.();
            }
          },
        },
      ],
    });
  };

  const products = useMemo(() => {
    const lowered = searchText.trim().toLowerCase();
    const byCategory = PRODUCTS.filter(product =>
      category === 'all' ? true : product.category === category,
    );
    const byStock = byCategory.filter(product =>
      inStockOnly ? product.availability !== 'Pre-order' && product.stock > 0 : true,
    );
    const byQuery = byStock.filter(product => {
      if (!lowered) {
        return true;
      }
      const haystack = [
        product.name,
        product.vendor,
        product.highlight,
        product.shortDescription,
        ...product.tags,
        ...product.applications,
        ...product.compatibility,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(lowered);
    });
    const byBrand = byQuery.filter(product =>
      selectedBrand === 'all' ? true : product.vendor === selectedBrand,
    );
    const byRating = byBrand.filter(product =>
      minimumRating > 0 ? product.rating >= minimumRating : true,
    );
    const byPrice = byRating.filter(
      product =>
        product.price >= selectedPriceMin && product.price <= selectedPriceMax,
    );
    return sortProducts(byPrice, sortMode);
  }, [
    category,
    inStockOnly,
    minimumRating,
    searchText,
    selectedBrand,
    selectedPriceMax,
    selectedPriceMin,
    sortMode,
  ]);

  const heroCollection =
    HOME_COLLECTIONS.find(item => item.id === 'rapid-proto') ?? HOME_COLLECTIONS[0];
  const heroProduct = PRODUCT_INDEX['pi5-lab-kit'];
  const homeSections = useMemo(() => {
    const used = new Set<string>();
    const featuredProducts = takeUniqueProducts(
      sortProducts(
        PRODUCTS.filter(product => product.availability === 'In stock'),
        'rating',
      ),
      4,
      used,
    );
    const flashSaleProducts = takeUniqueProducts(
      [...PRODUCTS]
        .filter(product => getDiscountPercent(product) > 0)
        .sort((left, right) => getDiscountPercent(right) - getDiscountPercent(left)),
      4,
      used,
    );
    const newArrivalProducts = takeUniqueProducts([...PRODUCTS].reverse(), 4, used);
    const bestSellerProducts = takeUniqueProducts(sortProducts(PRODUCTS, 'popularity'), 4, used);
    const feedProducts = sortProducts(PRODUCTS, 'popularity').filter(product => !used.has(product.id));

    return {
      featuredProducts,
      flashSaleProducts,
      newArrivalProducts,
      bestSellerProducts,
      feedProducts,
    };
  }, []);
  const homeFeedProducts = useMemo(
    () => homeSections.feedProducts.slice(0, homeFeedCount),
    [homeFeedCount, homeSections.feedProducts],
  );
  const homeHeroSlides: HeroSlide[] = [
    {
      id: 'innovation',
      eyebrow: 'EMBEDDED SHOP',
      title: 'Embedded Solutions for Innovation',
      description:
        'Discover development kits, modules, and tools for building the next wave of embedded and AI applications.',
      product: heroProduct,
      artworkSource: HOME_HERO_BANNER_SOURCE,
      primaryLabel: 'Shop Now',
      onPrimary: () => {
        handleTabChange('catalog');
        setCategory(heroCollection.category);
        setQuery('');
      },
    },
    {
      id: 'ai-lab',
      eyebrow: 'EDGE AI',
      title: 'AI Dev Kits Ready for Field Testing',
      description:
        'Jetson, Raspberry Pi, and vision-ready platforms assembled for robotics perception and industrial edge compute.',
      product: PRODUCT_INDEX['jetson-orin-nano-dev-kit'] ?? heroProduct,
      artworkSource: getProductImageSource('jetson-orin-nano-dev-kit'),
      artworkMode: 'cutout',
      primaryLabel: 'View AI Kits',
      onPrimary: () => {
        handleTabChange('catalog');
        setCategory('sbc');
        setQuery('Jetson');
      },
      secondaryLabel: 'Details',
      onSecondary: () => openProductDetail('jetson-orin-nano-dev-kit'),
    },
    {
      id: 'robotics-stack',
      eyebrow: 'ROBOTICS STACK',
      title: 'Sensors and Motion for Fast Prototyping',
      description:
        'Lidar, stereo vision, motor drivers, and robot bases grouped to help your team bring up a full stack faster.',
      product: PRODUCT_INDEX['lidar-slam-core'] ?? heroProduct,
      artworkSource: getProductImageSource('lidar-slam-core'),
      artworkMode: 'cutout',
      primaryLabel: 'Explore Robotics',
      onPrimary: () => {
        handleTabChange('catalog');
        setCategory('robotics');
        setQuery('');
      },
      secondaryLabel: 'Open sensor',
      onSecondary: () => openProductDetail('lidar-slam-core'),
    },
  ];

  useEffect(() => {
    setHomeFeedCount(4);
  }, [tab]);

  useEffect(() => {
    if (tab !== 'home' || homeHeroSlides.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setHomeCarouselIndex(previous => {
        const nextIndex = (previous + 1) % homeHeroSlides.length;
        heroCarouselRef.current?.scrollTo({
          x: nextIndex * heroCarouselWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 4200);

    return () => clearInterval(timer);
  }, [heroCarouselWidth, homeHeroSlides.length, tab]);

  const handleHomeRefresh = () => {
    if (homeRefreshing) {
      return;
    }

    setHomeRefreshing(true);
    setHomeCarouselIndex(0);
    setHomeFeedCount(4);
    heroCarouselRef.current?.scrollTo({x: 0, animated: true});

    setTimeout(() => {
      setHomeRefreshing(false);
    }, 900);
  };

  const loadMoreHomeFeed = () => {
    if (
      homeLoadingMore ||
      homeFeedCount >= homeSections.feedProducts.length ||
      tab !== 'home'
    ) {
      return;
    }

    setHomeLoadingMore(true);

    setTimeout(() => {
      setHomeFeedCount(previous =>
        Math.min(previous + 4, homeSections.feedProducts.length),
      );
      setHomeLoadingMore(false);
    }, 550);
  };

  const loadMoreCatalogResults = () => {
    if (
      catalogLoading ||
      catalogLoadingMore ||
      catalogVisibleCount >= products.length ||
      tab !== 'catalog'
    ) {
      return;
    }

    setCatalogLoadingMore(true);

    setTimeout(() => {
      setCatalogVisibleCount(previous =>
        Math.min(previous + CATALOG_PAGE_SIZE, products.length),
      );
      setCatalogLoadingMore(false);
    }, 500);
  };

  const handleMainScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 360;

    if (tab === 'home' && isNearBottom) {
      loadMoreHomeFeed();
      return;
    }

    if (tab === 'catalog' && isNearBottom) {
      loadMoreCatalogResults();
    }
  };

  useEffect(() => {
    if (tab !== 'catalog') {
      return;
    }

    if (!catalogSearchPrimedRef.current) {
      catalogSearchPrimedRef.current = true;
      return;
    }

    setCatalogLoading(true);
    const timer = setTimeout(() => {
      setCatalogLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, [
    category,
    catalogPriceMaxIndex,
    catalogPriceMinIndex,
    inStockOnly,
    minimumRating,
    searchText,
    selectedBrand,
    sortMode,
    tab,
  ]);

  useEffect(() => {
    if (tab !== 'catalog') {
      return;
    }

    setCatalogVisibleCount(CATALOG_PAGE_SIZE);
    setCatalogLoadingMore(false);
  }, [
    category,
    catalogPriceMaxIndex,
    catalogPriceMinIndex,
    inStockOnly,
    minimumRating,
    searchText,
    selectedBrand,
    sortMode,
    tab,
  ]);

  useEffect(() => {
    if (cart.length) {
      return;
    }

    setShippingOptionId('standard');
    setPromoCodeInput('');
    setAppliedPromoCode(null);
  }, [cart.length]);

  const commitSearchTerm = (rawValue: string) => {
    const normalized = rawValue.trim();

    if (!normalized) {
      return;
    }

    setSearchHistory(previous => {
      const next = previous.filter(
        item => item.toLowerCase() !== normalized.toLowerCase(),
      );
      return [normalized, ...next].slice(0, 6);
    });
  };

  const applySearchTerm = (term: string) => {
    setCatalogSearchInput(term);
    setQuery(term);
    commitSearchTerm(term);
  };

  const clearCatalogSearch = () => {
    setCatalogSearchInput('');
    setQuery('');
  };

  const openSearchCamera = () => {
    setSearchCameraOpen(true);
  };

  const simulateVoiceSearch = () => {
    const term =
      VOICE_SEARCH_TERMS[voiceSampleIndexRef.current % VOICE_SEARCH_TERMS.length];
    voiceSampleIndexRef.current += 1;
    applySearchTerm(term);
    showAlert({
      tone: 'info',
      eyebrow: 'VOICE SEARCH',
      title: 'Voice search',
      message: `Recognized "${term}" (simulated).`,
    });
  };

  const resetCatalogResults = () => {
    setCatalogSearchInput('');
    setQuery('');
    setCategory('all');
    setSortMode('popularity');
    setInStockOnly(false);
    setSelectedBrand('all');
    setMinimumRating(0);
    setCatalogPriceMinIndex(0);
    setCatalogPriceMaxIndex(priceMarks.length - 1);
    setPriceHandleFocus('max');
  };

  const handleSearchImageSelected = (asset: SearchImageAsset) => {
    const inferredTerm = inferCatalogTermFromImage(asset);

    setSelectedSearchImage(asset);
    setRecentSearchImages(previous => {
      const next = previous.filter(item => item.uri !== asset.uri);
      return [asset, ...next].slice(0, 6);
    });
    setSearchCameraOpen(false);

    if (inferredTerm) {
      applySearchTerm(inferredTerm);
    }

    showAlert({
      tone: 'success',
      eyebrow: 'IMAGE SEARCH',
      title: inferredTerm ? 'Photo matched to Search' : 'Photo added to Search',
      message: inferredTerm
        ? `The selected image matched the keyword "${inferredTerm}". You can refine the results with more text or replace the photo any time.`
        : 'The selected image is now attached to Search. Add text keywords if you want to narrow the catalog further.',
    });
  };

  const handlePriceMarkPress = (index: number) => {
    if (priceHandleFocus === 'min') {
      setCatalogPriceMinIndex(Math.min(index, catalogPriceMaxIndex));
      return;
    }

    setCatalogPriceMaxIndex(Math.max(index, catalogPriceMinIndex));
  };

  const animateBubbleToCart = async (point: BubblePoint) => {
    const [screenLayout, cartLayout] = await Promise.all([
      measureViewInWindow(screenRef),
      measureViewInWindow(cartActionRef),
    ]);

    if (!screenLayout) {
      return;
    }

    cartBubbleX.stopAnimation();
    cartBubbleY.stopAnimation();
    cartBubbleScale.stopAnimation();
    cartBubbleOpacity.stopAnimation();
    cartIconScale.stopAnimation();

    const bubbleSize = 34;
    const startX = point.x - screenLayout.x - bubbleSize / 2;
    const startY = point.y - screenLayout.y - bubbleSize / 2;
    const endX = cartLayout
      ? cartLayout.x - screenLayout.x + cartLayout.width / 2 - bubbleSize / 2
      : startX;
    const endY = cartLayout
      ? cartLayout.y - screenLayout.y + cartLayout.height / 2 - bubbleSize / 2
      : startY - 80;

    setCartBubbleVisible(true);
    cartBubbleX.setValue(startX);
    cartBubbleY.setValue(startY);
    cartBubbleScale.setValue(0.72);
    cartBubbleOpacity.setValue(0);
    cartIconScale.setValue(1);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(cartBubbleOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(cartBubbleScale, {
          toValue: 1.05,
          friction: 6,
          tension: 160,
          useNativeDriver: true,
        }),
        Animated.timing(cartBubbleY, {
          toValue: startY - 20,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cartBubbleX, {
          toValue: endX,
          duration: 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cartBubbleY, {
          toValue: endY,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cartBubbleScale, {
          toValue: 0.56,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cartBubbleOpacity, {
          toValue: 0.24,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.sequence([
          Animated.spring(cartIconScale, {
            toValue: 1.16,
            friction: 5,
            tension: 190,
            useNativeDriver: true,
          }),
          Animated.spring(cartIconScale, {
            toValue: 1,
            friction: 5,
            tension: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(cartBubbleOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setCartBubbleVisible(false);
    });
  };

  const animateBubbleToSaved = async (point: BubblePoint) => {
    const [screenLayout, savedLayout] = await Promise.all([
      measureViewInWindow(screenRef),
      measureViewInWindow(savedTabRef),
    ]);

    if (!screenLayout) {
      return;
    }

    favoriteBubbleX.stopAnimation();
    favoriteBubbleY.stopAnimation();
    favoriteBubbleScale.stopAnimation();
    favoriteBubbleOpacity.stopAnimation();
    savedIconScale.stopAnimation();

    const bubbleSize = 34;
    const startX = point.x - screenLayout.x - bubbleSize / 2;
    const startY = point.y - screenLayout.y - bubbleSize / 2;
    const endX = savedLayout
      ? savedLayout.x - screenLayout.x + savedLayout.width / 2 - bubbleSize / 2
      : startX;
    const endY = savedLayout
      ? savedLayout.y - screenLayout.y + savedLayout.height / 2 - bubbleSize / 2
      : startY + 120;

    setFavoriteBubbleVisible(true);
    favoriteBubbleX.setValue(startX);
    favoriteBubbleY.setValue(startY);
    favoriteBubbleScale.setValue(0.72);
    favoriteBubbleOpacity.setValue(0);
    savedIconScale.setValue(1);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(favoriteBubbleOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(favoriteBubbleScale, {
          toValue: 1.04,
          friction: 6,
          tension: 160,
          useNativeDriver: true,
        }),
        Animated.timing(favoriteBubbleY, {
          toValue: startY - 18,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(favoriteBubbleX, {
          toValue: endX,
          duration: 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(favoriteBubbleY, {
          toValue: endY,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(favoriteBubbleScale, {
          toValue: 0.56,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(favoriteBubbleOpacity, {
          toValue: 0.22,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.sequence([
          Animated.spring(savedIconScale, {
            toValue: 1.16,
            friction: 5,
            tension: 190,
            useNativeDriver: true,
          }),
          Animated.spring(savedIconScale, {
            toValue: 1,
            friction: 5,
            tension: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(favoriteBubbleOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFavoriteBubbleVisible(false);
    });
  };

  const applyPromoCode = () => {
    const normalized = promoCodeInput.trim().toUpperCase();

    if (!normalized) {
      showAlert({
        tone: 'warning',
        eyebrow: 'PROMO CODE',
        title: 'Promo code',
        message: 'Enter a promo code before applying it.',
      });
      return;
    }

    if (!PROMO_CODE_DESCRIPTIONS[normalized]) {
      showAlert({
        tone: 'warning',
        eyebrow: 'PROMO CODE',
        title: 'Promo code',
        message: 'This promo code is not available.',
      });
      return;
    }

    setPromoCodeInput(normalized);
    setAppliedPromoCode(normalized);
    showAlert({
      tone: 'success',
      eyebrow: 'PROMO APPLIED',
      title: 'Promo applied',
      message: PROMO_CODE_DESCRIPTIONS[normalized],
    });
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
    setPromoCodeInput('');
  };

  const handlePlaceOrder = (contactName: string) => {
    const result = placeOrder(contactName, {
      shippingFee,
      discountAmount: promoDiscount,
    });

    if (!result.success) {
      showAlert({
        tone: 'warning',
        eyebrow: 'CHECK CART',
        title: 'Cart is empty',
        message: 'Add hardware to the cart before placing an order.',
      });
      return;
    }

    markCheckoutCompleted();
    closeCheckout();
    showAlert({
      tone: 'success',
      eyebrow: 'ORDER CONFIRMED',
      title: 'Order placed',
      message: `Order ${result.orderId} created for ${contactName}.`,
      code: result.orderId,
      codeLabel: 'ORDER ID',
    });
  };

  const getCardFlagTone = (product: Product) => {
    const discount = getDiscountPercent(product);

    if (product.availability === 'Low stock' || product.reviews >= 90) {
      return {label: 'HOT', color: theme.amber, discount};
    }

    if (product.stock >= 20) {
      return {label: 'NEW', color: theme.lime, discount};
    }

    if (discount) {
      return {label: 'SALE', color: theme.accent, discount};
    }

    return {label: 'LAB', color: product.accent, discount};
  };

  const renderCard = (product: Product) => {
    const isFavorite = favorites.includes(product.id);
    const {discount, ...flagTone} = getCardFlagTone(product);

    return (
      <Pressable
        onPress={() => openProductDetail(product.id)}
        style={[
          styles.card,
          {
            backgroundColor: alpha(theme.surface, 0.98),
            borderColor: alpha(theme.border, 0.92),
            shadowColor: alpha(theme.accent, 0.12),
          },
        ]}>
        <View
          style={[
            styles.catalogCardMedia,
            {
              backgroundColor: alpha(product.accent, 0.14),
              borderColor: alpha(theme.border, 0.84),
            },
          ]}>
          <View style={styles.catalogCardTopRow}>
            <View
              style={[
                styles.catalogCardBadge,
                {backgroundColor: alpha(flagTone.color, 0.18)},
              ]}>
              <Text style={[styles.catalogCardBadgeText, {color: flagTone.color}]}>
                {flagTone.label}
              </Text>
            </View>
            <FavoriteToggleButton
              active={isFavorite}
              theme={theme}
              onPress={() => toggleFavorite(product.id)}
              onAnimate={animateBubbleToSaved}
            />
          </View>
          {discount ? (
            <View
              style={[
                styles.catalogCardDiscountBadge,
                {backgroundColor: alpha(theme.lime, 0.18)},
              ]}>
              <Text style={[styles.catalogCardDiscountText, {color: theme.lime}]}>
                -{discount}%
              </Text>
            </View>
          ) : null}
          <HardwareGlyph product={product} theme={theme} size={92} />
        </View>
        <View style={styles.catalogCardContent}>
          <Text
            numberOfLines={1}
            style={[styles.catalogCardVendor, {color: theme.textMuted}]}>
            {product.vendor.toUpperCase()}
          </Text>
          <Text numberOfLines={2} style={[styles.catalogCardTitle, {color: theme.text}]}>
            {product.name}
          </Text>
          <Pressable
            onPress={() => openProductDetail(product.id)}
            style={[
              styles.catalogQuickViewButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.86),
                borderColor: alpha(theme.border, 0.88),
              },
            ]}>
            <Text style={[styles.catalogQuickViewLabel, {color: theme.text}]}>
              Quick view
            </Text>
          </Pressable>
          <View style={styles.catalogCardRatingRow}>
            <Text style={[styles.catalogCardStars, {color: theme.amber}]}>
              {getRatingStars(product.rating)}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.catalogCardRatingText, {color: theme.textMuted}]}>
              {product.rating.toFixed(1)} | {formatCompactCount(product.reviews)} reviews
            </Text>
          </View>
          <View style={styles.catalogCardMetaRow}>
            <AvailabilityBadge product={product} theme={theme} />
            <Pressable
              onPress={() =>
                Share.share({
                  message: `${product.name} - ${product.highlight} - ${formatPrice(product.price)}`,
                })
              }
              style={[
                styles.catalogFavoriteButton,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.8),
                  borderColor: alpha(theme.border, 0.88),
                  width: 28,
                  height: 28,
                },
              ]}>
              <AppIcon name="share" size={14} color={theme.textMuted} />
            </Pressable>
          </View>
          <View style={styles.catalogCardFooter}>
            <View style={styles.flexFill}>
              <Text style={[styles.catalogCardPrice, {color: theme.lime}]}>
                {formatPrice(product.price)}
              </Text>
              {product.previousPrice ? (
                <Text style={[styles.catalogCardPreviousPrice, {color: theme.textMuted}]}>
                  {formatPrice(product.previousPrice)}
                </Text>
              ) : null}
            </View>
            <AddToCartButton
              theme={theme}
              onPress={() => addToCart(product.id, 1)}
              onAnimate={animateBubbleToCart}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderProductGrid = (items: Product[]) => (
    <View style={[styles.catalogList, styles.gridWrap]}>
      {items.map(product => (
        <View key={product.id} style={styles.gridCell}>
          {renderCard(product)}
        </View>
      ))}
    </View>
  );

  const renderProductListRow = (product: Product) => {
    const isFavorite = favorites.includes(product.id);
    const {discount, ...flagTone} = getCardFlagTone(product);

    return (
      <Pressable
        key={product.id}
        onPress={() => openProductDetail(product.id)}
        style={[
          styles.catalogListCard,
          {
            backgroundColor: alpha(theme.surface, 0.98),
            borderColor: alpha(theme.border, 0.92),
            shadowColor: alpha(theme.accent, 0.12),
          },
        ]}>
        <View
          style={[
            styles.catalogListMedia,
            {
              backgroundColor: alpha(product.accent, 0.14),
              borderColor: alpha(theme.border, 0.84),
            },
          ]}>
          <View style={styles.catalogCardTopRow}>
            <View
              style={[
                styles.catalogCardBadge,
                {backgroundColor: alpha(flagTone.color, 0.18)},
              ]}>
              <Text style={[styles.catalogCardBadgeText, {color: flagTone.color}]}>
                {flagTone.label}
              </Text>
            </View>
            <FavoriteToggleButton
              active={isFavorite}
              theme={theme}
              onPress={() => toggleFavorite(product.id)}
              onAnimate={animateBubbleToSaved}
            />
          </View>
          {discount ? (
            <View
              style={[
                styles.catalogCardDiscountBadge,
                {backgroundColor: alpha(theme.lime, 0.18)},
              ]}>
              <Text style={[styles.catalogCardDiscountText, {color: theme.lime}]}>
                -{discount}%
              </Text>
            </View>
          ) : null}
          <HardwareGlyph product={product} theme={theme} size={74} />
        </View>

        <View style={styles.catalogListContent}>
          <Text
            numberOfLines={1}
            style={[styles.catalogCardVendor, {color: theme.textMuted}]}>
            {product.vendor.toUpperCase()}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.catalogListTitle, {color: theme.text}]}>
            {product.name}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.catalogListBody, {color: theme.textMuted}]}>
            {product.shortDescription}
          </Text>
          <Pressable
            onPress={() => openProductDetail(product.id)}
            style={[
              styles.catalogQuickViewButton,
              styles.catalogQuickViewButtonList,
              {
                backgroundColor: alpha(theme.panelAlt, 0.86),
                borderColor: alpha(theme.border, 0.88),
              },
            ]}>
            <Text style={[styles.catalogQuickViewLabel, {color: theme.text}]}>
              Quick view
            </Text>
          </Pressable>
          <View style={styles.catalogCardRatingRow}>
            <Text style={[styles.catalogCardStars, {color: theme.amber}]}>
              {getRatingStars(product.rating)}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.catalogCardRatingText, {color: theme.textMuted}]}>
              {product.rating.toFixed(1)} | {formatCompactCount(product.reviews)} reviews
            </Text>
          </View>
          <View style={styles.catalogCardMetaRow}>
            <AvailabilityBadge product={product} theme={theme} />
            <Pressable
              onPress={() =>
                Share.share({
                  message: `${product.name} - ${product.highlight} - ${formatPrice(product.price)}`,
                })
              }
              style={[
                styles.catalogFavoriteButton,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.8),
                  borderColor: alpha(theme.border, 0.88),
                  width: 28,
                  height: 28,
                },
              ]}>
              <AppIcon name="share" size={14} color={theme.textMuted} />
            </Pressable>
          </View>
          <View style={styles.catalogCardFooter}>
            <View style={styles.flexFill}>
              <Text style={[styles.catalogCardPrice, {color: theme.lime}]}>
                {formatPrice(product.price)}
              </Text>
              {product.previousPrice ? (
                <Text
                  style={[
                    styles.catalogCardPreviousPrice,
                    {color: theme.textMuted},
                  ]}>
                  {formatPrice(product.previousPrice)}
                </Text>
              ) : null}
            </View>
            <AddToCartButton
              theme={theme}
              onPress={() =>
                tab === 'saved' ? handleMoveToCart(product.id) : addToCart(product.id, 1)
              }
              onAnimate={animateBubbleToCart}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderProductList = (items: Product[]) => (
    <View style={styles.catalogList}>
      {items.map(product => renderProductListRow(product))}
    </View>
  );

  const renderCatalogFlatListItem = ({item}: {item: Product}) =>
    catalogViewMode === 'list' ? (
      <View style={styles.catalogListFlatCell}>{renderProductListRow(item)}</View>
    ) : (
      <View style={styles.catalogGridFlatCell}>{renderCard(item)}</View>
    );

  const getCatalogItemLayout = (
    _data: ArrayLike<Product> | null | undefined,
    index: number,
  ) => {
    const length =
      catalogViewMode === 'grid' ? CATALOG_GRID_ROW_HEIGHT : CATALOG_LIST_ROW_HEIGHT;
    const rowIndex = catalogViewMode === 'grid' ? Math.floor(index / 2) : index;

    return {
      length,
      offset: length * rowIndex,
      index,
    };
  };

  const renderProductRail = (items: Product[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowScroll}>
      {items.map(product => (
        <View key={product.id} style={styles.homeRailCell}>
          {renderCard(product)}
        </View>
      ))}
    </ScrollView>
  );

  const tabs = [
    {id: 'home' as const, code: 'HM', label: 'Home', icon: 'home' as const},
    {id: 'catalog' as const, code: 'CT', label: 'Search', icon: 'catalog' as const},
    {id: 'saved' as const, code: 'SV', label: 'Favorites', icon: 'saved' as const},
    {id: 'cart' as const, code: 'CR', label: 'Cart', icon: 'cart' as const},
    {id: 'profile' as const, code: 'ID', label: 'Profile', icon: 'profile' as const},
  ];
  const secondaryHeaders = {
    home: 'Boards, sensors, FPGA kits, and robotics hardware.',
    catalog: 'Search and filter embedded hardware.',
    saved: 'Products in your favorites list.',
    cart: 'Review selected modules before checkout.',
    profile: 'Preferences, order history, and shop settings.',
  } as const;
  const activeTabGlyphStyle = {
    borderColor: alpha(theme.accent, 0.3),
    backgroundColor: alpha(theme.accent, 0.14),
  };
  const activeTabMeta = tabs.find(item => item.id === tab) ?? tabs[0];
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const catalogSpotlight = products[0] ?? heroProduct;
  const activeCategoryLabel =
    CATEGORIES.find(item => item.id === category)?.label ?? 'All Systems';
  const activeSortLabel =
    SEARCH_SORT_OPTIONS.find(option => option.id === sortMode)?.label ?? 'Popularity';
  const catalogVisibleProducts = products.slice(0, catalogVisibleCount);

  const renderCatalogFlatListHeader = () => (
    <>
      <HighlightBanner
        eyebrow="FEATURED MODULE"
        title={catalogSpotlight.name}
        description={catalogSpotlight.shortDescription}
        product={catalogSpotlight}
        theme={theme}
        primaryLabel="View item"
        onPrimary={() => openProductDetail(catalogSpotlight.id)}
      />

      <Section title="Search embedded hardware" theme={theme} />
      <View style={styles.catalogToolbar}>
        <View
          style={[
            styles.searchBox,
            styles.catalogSearchBox,
            {
              backgroundColor: alpha(theme.panel, 0.94),
              borderColor: alpha(theme.border, 0.92),
            },
          ]}>
          <View style={styles.catalogSearchIcon}>
            <AppIcon name="catalog" size={16} color={theme.accent} />
          </View>
          <TextInput
            value={catalogSearchInput}
            onChangeText={setCatalogSearchInput}
            onSubmitEditing={event => commitSearchTerm(event.nativeEvent.text)}
            onBlur={() => commitSearchTerm(catalogSearchInput)}
            placeholder="Try Raspberry Pi, CAN, lidar, FPGA..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, {color: theme.text}]}
          />
          <View style={styles.catalogSearchActions}>
            {catalogSearchInput.trim().length ? (
              <Pressable
                onPress={clearCatalogSearch}
                style={[
                  styles.catalogSearchActionButton,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.86),
                    borderColor: alpha(theme.border, 0.9),
                  },
                ]}>
                <Text
                  style={[
                    styles.catalogSearchActionLabel,
                    {color: theme.textMuted},
                  ]}>
                  Clear
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={openSearchCamera}
              accessibilityRole="button"
              accessibilityLabel="Open search camera"
              style={[
                styles.catalogSearchActionButton,
                styles.catalogSearchActionButtonIconOnly,
                {
                  backgroundColor: alpha(theme.accent, 0.14),
                  borderColor: alpha(theme.accent, 0.3),
                },
              ]}>
              <AppIcon name="camera" size={15} color={theme.accent} />
            </Pressable>
            <Pressable
              onPress={simulateVoiceSearch}
              style={[
                styles.catalogSearchActionButton,
                styles.catalogSearchActionButtonAccent,
                {
                  backgroundColor: alpha(theme.accent, 0.14),
                  borderColor: alpha(theme.accent, 0.3),
                },
              ]}>
              <Text
                style={[
                  styles.catalogSearchActionLabel,
                  {color: theme.accent},
                ]}>
                Voice
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          style={[
            styles.catalogFilterButton,
            {
              backgroundColor: alpha(theme.panelAlt, 0.9),
              borderColor: alpha(theme.border, 0.9),
            },
          ]}>
          <AppIcon name="filter" size={18} color={theme.text} />
        </Pressable>
      </View>
      {selectedSearchImage ? (
        <View
          style={[
            styles.catalogImageSearchCard,
            {
              backgroundColor: alpha(theme.panel, 0.96),
              borderColor: alpha(theme.border, 0.92),
            },
          ]}>
          <Image
            source={{uri: selectedSearchImage.uri}}
            style={styles.catalogImageSearchThumb}
            resizeMode="cover"
          />
          <View style={styles.catalogImageSearchContent}>
            <Text
              style={[styles.catalogImageSearchEyebrow, {color: theme.accent}]}>
              IMAGE SEARCH
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.catalogImageSearchTitle, {color: theme.text}]}>
              {selectedSearchImage.fileName}
            </Text>
            <Text
              style={[styles.catalogImageSearchBody, {color: theme.textMuted}]}>
              Keep this photo while you browse, or replace it with a new capture.
            </Text>
            <Text
              style={[styles.catalogImageSearchMeta, {color: theme.textMuted}]}>
              {formatSearchImageMeta(selectedSearchImage)}
            </Text>
            <View style={styles.catalogImageSearchActions}>
              <Pressable
                onPress={openSearchCamera}
                style={[
                  styles.catalogImageSearchButton,
                  {backgroundColor: alpha(theme.accent, 0.14)},
                ]}>
                <Text
                  style={[
                    styles.catalogImageSearchButtonLabel,
                    {color: theme.accent},
                  ]}>
                  Replace
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedSearchImage(null)}
                style={[
                  styles.catalogImageSearchButton,
                  styles.catalogImageSearchButtonGhost,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.92),
                    borderColor: alpha(theme.border, 0.92),
                  },
                ]}>
                <Text
                  style={[
                    styles.catalogImageSearchButtonLabel,
                    {color: theme.textMuted},
                  ]}>
                  Remove
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      <View style={styles.catalogSectionHeader}>
        <Text style={[styles.catalogSectionTitle, {color: theme.text}]}>
          Search history
        </Text>
        {searchHistory.length ? (
          <Pressable onPress={() => setSearchHistory([])}>
            <Text style={[styles.catalogInlineAction, {color: theme.textMuted}]}>
              Clear all
            </Text>
          </Pressable>
        ) : null}
      </View>
      {searchHistory.length ? (
        <View style={styles.wrapRow}>
          {searchHistory.map(term => (
            <Chip
              key={term}
              label={term}
              selected={query.toLowerCase() === term.toLowerCase()}
              onPress={() => applySearchTerm(term)}
              theme={theme}
            />
          ))}
        </View>
      ) : (
        <Text style={[styles.catalogHintText, {color: theme.textMuted}]}>
          Your recent searches will appear here.
        </Text>
      )}
      <View style={styles.catalogSectionHeader}>
        <Text style={[styles.catalogSectionTitle, {color: theme.text}]}>
          Trending searches
        </Text>
      </View>
      <View style={styles.wrapRow}>
        {TRENDING_TERMS.map(term => (
          <Chip
            key={term}
            label={term}
            selected={query.toLowerCase() === term.toLowerCase()}
            onPress={() => applySearchTerm(term)}
            theme={theme}
          />
        ))}
      </View>
      <View
        style={[
          styles.catalogSummary,
          {
            backgroundColor: alpha(theme.panel, 0.94),
            borderColor: alpha(theme.border, 0.92),
          },
        ]}>
        <Text style={[styles.catalogSummaryTitle, {color: theme.text}]}>
          {products.length} matching modules
        </Text>
        <Text style={[styles.catalogSummaryText, {color: theme.textMuted}]}>
          {activeCategoryLabel} | {selectedBrand === 'all' ? 'All brands' : selectedBrand}
        </Text>
        <Text style={[styles.catalogSummaryText, {color: theme.textMuted}]}>
          Sort: {activeSortLabel} | {minimumRating ? `${minimumRating}+ stars` : 'All ratings'} |{' '}
          {formatPrice(selectedPriceMin)} - {formatPrice(selectedPriceMax)} |{' '}
          {inStockOnly ? 'Available now' : 'All stock states'}
        </Text>
      </View>
      <View style={styles.catalogResultsToolbar}>
        <View style={styles.catalogResultsMeta}>
          <Text style={[styles.catalogSectionTitle, {color: theme.text}]}>
            Search results
          </Text>
          <Text style={[styles.catalogHintText, {color: theme.textMuted}]}>
            Filter with the panel, then switch between compact cards and detail rows.
          </Text>
        </View>
        <View
          style={[
            styles.catalogViewToggle,
            {
              backgroundColor: alpha(theme.panel, 0.92),
              borderColor: alpha(theme.border, 0.92),
            },
          ]}>
          {(['grid', 'list'] as CatalogViewMode[]).map(mode => {
            const active = catalogViewMode === mode;

            return (
              <Pressable
                key={mode}
                onPress={() => setCatalogViewMode(mode)}
                style={[
                  styles.catalogViewToggleButton,
                  active
                    ? {
                        backgroundColor: alpha(theme.accent, 0.16),
                        borderColor: alpha(theme.accent, 0.3),
                      }
                    : null,
                ]}>
                <Text
                  style={[
                    styles.catalogViewToggleLabel,
                    {color: active ? theme.text : theme.textMuted},
                  ]}>
                  {mode === 'grid' ? 'Grid' : 'List'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.wrapRow}>
        {SEARCH_SORT_OPTIONS.map(option => (
          <Chip
            key={option.id}
            label={option.label}
            selected={sortMode === option.id}
            onPress={() => setSortMode(option.id)}
            theme={theme}
          />
        ))}
      </View>
    </>
  );

  const renderCatalogFlatListFooter = () => {
    if (catalogLoading || !products.length) {
      return null;
    }

    return (
      <View style={styles.catalogInfiniteFooter}>
        {catalogLoadingMore ? (
          <Loading
            compact={true}
            label="Loading more results..."
            color={theme.accent}
            secondaryColor={theme.lime}
            textColor={theme.text}
            detailColor={theme.textMuted}
            trackColor={alpha(theme.accent, 0.14)}
          />
        ) : catalogVisibleProducts.length < products.length ? (
          <Text
            style={[
              styles.catalogInfiniteFooterText,
              {color: theme.textMuted},
            ]}>
            Scroll to load more products
          </Text>
        ) : (
          <Text
            style={[
              styles.catalogInfiniteFooterText,
              {color: theme.textMuted},
            ]}>
            End of catalog results
          </Text>
        )}
      </View>
    );
  };

  const renderCatalogFlatListEmpty = () =>
    catalogLoading ? (
      <View
        style={[
          styles.catalogStateCard,
          {
            backgroundColor: alpha(theme.panel, 0.94),
            borderColor: alpha(theme.border, 0.92),
          },
        ]}>
        <Loading
          label="Refreshing results"
          detail="Scanning embedded modules that match your current query and filters."
          color={theme.accent}
          secondaryColor={theme.lime}
          textColor={theme.text}
          detailColor={theme.textMuted}
          trackColor={alpha(theme.accent, 0.14)}
        />
      </View>
    ) : (
      <View
        style={[
          styles.catalogStateCard,
          {
            backgroundColor: alpha(theme.panel, 0.94),
            borderColor: alpha(theme.border, 0.92),
          },
        ]}>
        <Text style={[styles.catalogStateTitle, {color: theme.text}]}>
          No matching hardware found
        </Text>
        <Text style={[styles.catalogStateBody, {color: theme.textMuted}]}>
          Try a broader keyword or reset filters to return to the full lab catalog.
        </Text>
        <Pressable
          onPress={resetCatalogResults}
          style={[
            styles.catalogStateButton,
            {backgroundColor: theme.accent},
          ]}>
          <Text style={[styles.buttonLabel, styles.buttonTextDark]}>
            Reset search
          </Text>
        </Pressable>
      </View>
    );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]} edges={['top']}>
        <StatusBar backgroundColor={theme.bg} barStyle={dark ? 'light-content' : 'dark-content'} />
        <View ref={screenRef} style={[styles.screen, {backgroundColor: theme.bg}]}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.glowLarge, {backgroundColor: theme.heroGlow}]} />
            <View style={[styles.glowSmall, {backgroundColor: alpha(theme.lime, 0.12)}]} />
          </View>

          <View style={styles.header}>
            <View style={styles.flexFill}>
              <Text style={[styles.brand, {color: theme.accent}]}>EMBEDDED SHOP</Text>
              <Text style={[styles.shopHeaderTitle, {color: theme.text}]}>
                {tab === 'home' ? 'Embedded hardware shop' : activeTabMeta.label}
              </Text>
              <Text style={[styles.shopHeaderBody, {color: theme.textMuted}]}>
                {secondaryHeaders[tab]}
              </Text>
            </View>
            <View ref={cartActionRef}>
              <Pressable
                onPress={() => handleTabChange('cart')}
                style={[
                  styles.shopHeaderAction,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.8),
                    borderColor: alpha(theme.border, 0.9),
                  },
                ]}>
              <Animated.View
                style={[
                  styles.shopHeaderCartIconWrap,
                  {
                    backgroundColor: alpha(theme.accent, 0.1),
                    transform: [{scale: cartIconScale}],
                  },
                ]}>
                <TabIcon kind="cart" active={true} theme={theme} />
              </Animated.View>
              {cartItemCount > 0 ? (
                <View
                  style={[
                    styles.shopHeaderCartBadge,
                    {backgroundColor: theme.lime},
                  ]}>
                  <Text style={styles.shopHeaderCartBadgeText}>{cartItemCount}</Text>
                </View>
              ) : null}
              </Pressable>
            </View>
          </View>

          {tab === 'catalog' ? (
            <FlatList
              key={catalogViewMode}
              data={catalogLoading ? [] : catalogVisibleProducts}
              renderItem={renderCatalogFlatListItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.catalogFlatListContent}
              ListHeaderComponent={renderCatalogFlatListHeader()}
              ListFooterComponent={renderCatalogFlatListFooter()}
              ListEmptyComponent={renderCatalogFlatListEmpty()}
              numColumns={catalogViewMode === 'grid' ? 2 : 1}
              columnWrapperStyle={
                catalogViewMode === 'grid' ? styles.catalogGridColumn : undefined
              }
              onEndReached={loadMoreCatalogResults}
              onEndReachedThreshold={0.45}
              // Stable ids let FlatList recycle item rows correctly.
              keyExtractor={item => item.id}
              // Render a small first batch for quicker first paint.
              initialNumToRender={CATALOG_PAGE_SIZE}
              // Keep follow-up batches compact to reduce jank.
              maxToRenderPerBatch={CATALOG_PAGE_SIZE}
              // Limit the offscreen render window to a few screens.
              windowSize={7}
              // Remove clipped rows outside the viewport on native lists.
              removeClippedSubviews={Platform.OS === 'android'}
              // Fixed row heights allow precise scroll offsets for virtualization.
              getItemLayout={getCatalogItemLayout}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              onScroll={handleMainScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={tab === 'home' ? homeRefreshing : false}
                  onRefresh={tab === 'home' ? handleHomeRefresh : () => undefined}
                />
              }
              contentContainerStyle={[
                styles.scrollContent,
                tab === 'home' ? styles.homeScrollContent : styles.standardScrollContent,
              ]}>
            {tab === 'home' ? (
              <>
                <View style={styles.heroCarouselWrap}>
                  <ScrollView
                    ref={heroCarouselRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={heroCarouselWidth}
                    onMomentumScrollEnd={event => {
                      const nextIndex = Math.round(
                        event.nativeEvent.contentOffset.x / heroCarouselWidth,
                      );
                      setHomeCarouselIndex(nextIndex);
                    }}
                    contentContainerStyle={styles.heroCarouselTrack}>
                    {homeHeroSlides.map(slide => (
                      <View
                        key={slide.id}
                        style={[styles.heroCarouselPage, {width: heroCarouselWidth}]}>
                        <HighlightBanner
                          variant="hero"
                          eyebrow={slide.eyebrow}
                          title={slide.title}
                          description={slide.description}
                          product={slide.product}
                          artworkSource={slide.artworkSource}
                          artworkMode={slide.artworkMode}
                          theme={theme}
                          primaryLabel={slide.primaryLabel}
                          onPrimary={slide.onPrimary}
                          secondaryLabel={slide.secondaryLabel}
                          onSecondary={slide.onSecondary}
                        />
                      </View>
                    ))}
                  </ScrollView>
                  <View style={styles.heroCarouselDots}>
                    {homeHeroSlides.map((slide, index) => (
                      <View
                        key={slide.id}
                        style={[
                          styles.heroCarouselDot,
                          {
                            backgroundColor:
                              index === homeCarouselIndex
                                ? theme.accent
                                : alpha(theme.border, 0.72),
                          },
                          index === homeCarouselIndex
                            ? styles.heroCarouselDotActive
                            : null,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <Section
                  title="Shop by category"
                  theme={theme}
                  action="Search"
                  onPress={() => handleTabChange('catalog')}
                />
                <View style={styles.homeCategoryGrid}>
                  {CATEGORIES.filter(item => item.id !== 'all').map(item => (
                    <View key={item.id} style={styles.homeCategoryCell}>
                      <InventoryTile
                        item={item}
                        theme={theme}
                        fullWidth={true}
                        onPress={() => {
                          handleTabChange('catalog');
                          setCategory(item.id);
                        }}
                      />
                    </View>
                  ))}
                </View>

                <Section
                  title="Featured products"
                  theme={theme}
                  action="See all"
                  onPress={() => handleTabChange('catalog')}
                />
                {renderProductRail(homeSections.featuredProducts)}

                <Section
                  title="Flash sale"
                  theme={theme}
                  action="Shop deals"
                  onPress={() => handleTabChange('catalog')}
                />
                {renderProductRail(homeSections.flashSaleProducts)}

                <Section
                  title="New arrivals"
                  theme={theme}
                  action="Browse"
                  onPress={() => handleTabChange('catalog')}
                />
                {renderProductRail(homeSections.newArrivalProducts)}

                <Section
                  title="Best sellers"
                  theme={theme}
                  action="See all"
                  onPress={() => handleTabChange('catalog')}
                />
                {renderProductRail(homeSections.bestSellerProducts)}

                <Section
                  title="Explore more"
                  theme={theme}
                  action={`${homeFeedProducts.length}/${homeSections.feedProducts.length}`}
                />
                {homeFeedProducts.length ? (
                  <>
                    {renderProductGrid(homeFeedProducts)}
                    {homeLoadingMore ? (
                      <View style={styles.homeInfiniteFooter}>
                        <Loading
                          compact={true}
                          label="Loading more hardware..."
                          color={theme.accent}
                          secondaryColor={theme.lime}
                          textColor={theme.text}
                          detailColor={theme.textMuted}
                          trackColor={alpha(theme.accent, 0.14)}
                        />
                      </View>
                    ) : homeFeedCount < homeSections.feedProducts.length ? (
                      <View style={styles.homeInfiniteFooter}>
                        <Text
                          style={[
                            styles.homeInfiniteFooterText,
                            {color: theme.textMuted},
                          ]}>
                          Scroll to load more modules
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.homeInfiniteFooter}>
                        <Text
                          style={[
                            styles.homeInfiniteFooterText,
                            {color: theme.textMuted},
                          ]}>
                          End of embedded catalog feed
                        </Text>
                      </View>
                    )}
                  </>
                ) : null}
              </>
            ) : null}

            {tab === 'saved' ? (
              <>
                <View style={styles.catalogResultsToolbar}>
                  <View style={styles.catalogResultsMeta}>
                    <Section title="Favorites" theme={theme} />
                    <Text style={[styles.catalogHintText, {color: theme.textMuted}]}>
                      {favorites.length} products in your list. Move items to cart to proceed.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.catalogViewToggle,
                      {
                        backgroundColor: alpha(theme.panel, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    {(['grid', 'list'] as CatalogViewMode[]).map(mode => {
                      const active = favoritesViewMode === mode;

                      return (
                        <Pressable
                          key={mode}
                          onPress={() => setFavoritesViewMode(mode)}
                          style={[
                            styles.catalogViewToggleButton,
                            active
                              ? {
                                  backgroundColor: alpha(theme.accent, 0.16),
                                  borderColor: alpha(theme.accent, 0.3),
                                }
                              : null,
                          ]}>
                          <Text
                            style={[
                              styles.catalogViewToggleLabel,
                              {color: active ? theme.text : theme.textMuted},
                            ]}>
                            {mode === 'grid' ? 'Grid' : 'List'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.spacer12} />
                {favorites.length === 0 ? (
                  <View
                    style={[
                      styles.catalogStateCard,
                      {
                        backgroundColor: alpha(theme.panel, 0.94),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    <Text style={[styles.catalogStateTitle, {color: theme.text}]}>
                      No favorites yet
                    </Text>
                    <Text style={[styles.catalogStateBody, {color: theme.textMuted}]}>
                      Items you save while browsing will appear here for quick procurement.
                    </Text>
                    <Pressable
                      onPress={() => handleTabChange('catalog')}
                      style={[
                        styles.catalogStateButton,
                        {backgroundColor: theme.accent},
                      ]}>
                      <Text style={[styles.buttonLabel, styles.buttonTextDark]}>
                        Explore catalog
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  favoritesViewMode === 'list' 
                    ? renderProductList(PRODUCTS.filter(product => favorites.includes(product.id)))
                    : renderProductGrid(PRODUCTS.filter(product => favorites.includes(product.id)))
                )}
              </>
            ) : null}

            {tab === 'cart' ? (
              <>
                <Section title="Procurement bench" theme={theme} />
                {cart.length === 0 ? (
                  <Panel theme={theme}>
                    <Text style={[styles.cardTitle, {color: theme.text}]}>Your cart is empty</Text>
                    <Text style={[styles.meta, {color: theme.textMuted}]}>
                      Add boards, drivers, or sensors to prepare a complete embedded stack.
                    </Text>
                    <View style={styles.spacer12} />
                    <Pressable
                      onPress={() => handleTabChange('catalog')}
                      style={[styles.button, {backgroundColor: theme.accent}]}>
                      <Text style={[styles.buttonLabel, styles.buttonTextDark]}>
                        Continue shopping
                      </Text>
                    </Pressable>
                  </Panel>
                ) : (
                  <>
                    {cart.map(item => (
                      <CartPanel
                        key={item.productId}
                        entry={item}
                        theme={theme}
                        onUpdate={updateCartQuantity}
                        onRemove={removeFromCart}
                      />
                    ))}
                    <Panel theme={theme}>
                      <Text style={[styles.sectionKicker, {color: theme.accent}]}>PROMO CODE</Text>
                      <View style={styles.cartPromoRow}>
                        <TextInput
                          value={promoCodeInput}
                          onChangeText={setPromoCodeInput}
                          autoCapitalize="characters"
                          placeholder="LAB10, FREESHIP, EDGE150"
                          placeholderTextColor={theme.textMuted}
                          style={[
                            styles.field,
                            styles.cartPromoInput,
                            {
                              color: theme.text,
                              backgroundColor: alpha(theme.panelAlt, 0.9),
                              borderColor: alpha(theme.border, 0.9),
                            },
                          ]}
                        />
                        <Pressable
                          onPress={applyPromoCode}
                          style={[styles.cartPromoButton, {backgroundColor: theme.accent}]}>
                          <Text style={[styles.buttonLabel, styles.buttonTextDark]}>
                            Apply
                          </Text>
                        </Pressable>
                      </View>
                      {appliedPromoCode ? (
                        <View
                          style={[
                            styles.cartAppliedPromo,
                            {
                              backgroundColor: alpha(theme.lime, 0.12),
                              borderColor: alpha(theme.lime, 0.26),
                            },
                          ]}>
                          <View style={styles.flexFill}>
                            <Text style={[styles.smallCode, {color: theme.lime}]}>
                              {appliedPromoCode}
                            </Text>
                            <Text style={[styles.meta, {color: theme.textMuted}]}>
                              {PROMO_CODE_DESCRIPTIONS[appliedPromoCode]}
                            </Text>
                          </View>
                          <Pressable onPress={removePromoCode}>
                            <Text style={[styles.smallCode, {color: theme.textMuted}]}>
                              REMOVE
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </Panel>
                    <Panel theme={theme}>
                      <Text style={[styles.sectionKicker, {color: theme.accent}]}>SHIPPING OPTIONS</Text>
                      {SHIPPING_OPTIONS.map(option => {
                        const active = shippingOptionId === option.id;

                        return (
                          <Pressable
                            key={option.id}
                            onPress={() => setShippingOptionId(option.id)}
                            style={[
                              styles.shippingOptionCard,
                              {
                                backgroundColor: active
                                  ? alpha(theme.accent, 0.12)
                                  : alpha(theme.panelAlt, 0.88),
                                borderColor: active
                                  ? alpha(theme.accent, 0.32)
                                  : alpha(theme.border, 0.9),
                              },
                            ]}>
                            <View style={styles.shippingOptionTopRow}>
                              <View
                                style={[
                                  styles.shippingOptionRadio,
                                  {
                                    borderColor: active
                                      ? theme.accent
                                      : alpha(theme.border, 0.86),
                                  },
                                ]}>
                                {active ? (
                                  <View
                                    style={[
                                      styles.shippingOptionRadioFill,
                                      {backgroundColor: theme.accent},
                                    ]}
                                  />
                                ) : null}
                              </View>
                              <View style={styles.flexFill}>
                                <Text style={[styles.cartOptionTitle, {color: theme.text}]}>
                                  {option.label}
                                </Text>
                                <Text style={[styles.meta, {color: theme.textMuted}]}>
                                  {option.description}
                                </Text>
                              </View>
                              <Text style={[styles.cartOptionPrice, {color: theme.lime}]}>
                                {option.fee ? formatPrice(option.fee) : 'Free'}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </Panel>
                    <Panel theme={theme}>
                      <Text style={[styles.sectionKicker, {color: theme.accent}]}>ORDER SUMMARY</Text>
                      <View style={styles.cartSummaryRow}>
                        <Text style={[styles.meta, {color: theme.textMuted}]}>Subtotal</Text>
                        <Text style={[styles.meta, {color: theme.text}]}>{formatPrice(cartTotal)}</Text>
                      </View>
                      <View style={styles.cartSummaryRow}>
                        <Text style={[styles.meta, {color: theme.textMuted}]}>
                          Shipping
                        </Text>
                        <Text style={[styles.meta, {color: theme.text}]}>
                          {shippingFee ? formatPrice(shippingFee) : 'Free'}
                        </Text>
                      </View>
                      <View style={styles.cartSummaryRow}>
                        <Text style={[styles.meta, {color: theme.textMuted}]}>Discount</Text>
                        <Text style={[styles.meta, {color: promoDiscount ? theme.lime : theme.textMuted}]}>
                          {promoDiscount ? `-${formatPrice(promoDiscount)}` : formatPrice(0)}
                        </Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.cartSummaryRow}>
                        <Text style={[styles.cartSummaryTotalLabel, {color: theme.text}]}>
                          Total
                        </Text>
                        <Text style={[styles.cartSummaryTotalValue, {color: theme.lime}]}>
                          {formatPrice(orderTotal)}
                        </Text>
                      </View>
                    </Panel>
                    <Pressable onPress={openCheckout} style={[styles.button, {backgroundColor: theme.accent}]}>
                      <Text style={[styles.buttonLabel, styles.buttonTextDark]}>
                        Proceed to checkout
                      </Text>
                    </Pressable>
                    <View style={styles.spacer10} />
                    <Pressable
                      onPress={() => handleTabChange('catalog')}
                      style={[
                        styles.button,
                        styles.buttonOutline,
                        {borderColor: alpha(theme.border, 0.92)},
                      ]}>
                      <Text style={[styles.buttonLabel, {color: theme.text}]}>
                        Continue shopping
                      </Text>
                    </Pressable>
                  </>
                )}
              </>
            ) : null}

            {tab === 'profile' ? (
              <>
                <ProfileSectionHeader title="" icon="user" theme={theme} hidden />
                <Panel theme={theme}>
                  <View style={[styles.profileRow, {alignItems: 'center', paddingBottom: 16, flexDirection: 'column'}]}>
                    <View style={[styles.avatar, {width: 72, height: 72, borderRadius: 36, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12}]}>
                      <Text style={[styles.avatarLabel, {fontSize: 28, color: '#FFFFFF', fontWeight: 'bold'}]}>
                        {getInitials(profile.fullName)}
                      </Text>
                    </View>
                    <View style={{alignItems: 'center'}}>
                      <Text style={[styles.cardTitle, {color: theme.text, fontSize: 22, fontWeight: 'bold', marginBottom: 4}]}>
                        {profile.fullName}
                      </Text>
                      <Text style={[styles.meta, {color: theme.textMuted, fontSize: 13}]}>
                        {emailPublic ? profile.email : maskEmail(profile.email)}
                      </Text>
                      <Text style={[styles.meta, {color: theme.textMuted, marginTop: 6, fontStyle: 'italic', fontSize: 12}]}>{profile.title}</Text>
                      <Text style={[styles.meta, {color: theme.textMuted, marginTop: 6, fontSize: 12}]}>{profile.bio}</Text>
                      
                      <Pressable 
                        style={[styles.buttonOutline, {borderColor: theme.accent, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 16, flexDirection: 'row', alignItems: 'center'}]}
                        onPress={openEditProfile}
                      >
                        <AppIcon name="edit-2" size={14} color={theme.accent} />
                        <Text style={[styles.buttonLabel, {color: theme.accent, fontSize: 13, marginLeft: 6}]}>Edit Profile</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={[styles.metricsRow, {borderTopWidth: 1, borderTopColor: alpha(theme.border, 0.4), paddingTop: 16, paddingBottom: 8}]}>
                    <Metric label="Orders" value="23" theme={theme} />
                    <Metric label="Reviews" value="8" theme={theme} />
                    <Metric label="Points" value="1.2k" theme={theme} />
                  </View>
                </Panel>

                <ProfileSectionHeader title="Preferences" icon="settings" theme={theme} />
                <Panel theme={theme}>
                  <ProfileToggleItem icon="moon" title="Dark mode" subtitle={dark ? "Enabled" : "Disabled"} value={dark} onValueChange={() => setDark(previous => !previous)} theme={theme} />
                  <ProfileToggleItem icon="bell" title="Notifications" subtitle={notifications ? "Enabled" : "Disabled"} value={notifications} onValueChange={setNotifications} theme={theme} />
                  <ProfileToggleItem icon="eye" title="Public email visibility" subtitle={emailPublic ? "Enabled" : "Hidden"} value={emailPublic} onValueChange={setEmailPublic} theme={theme} />
                </Panel>
                
                <ProfileSectionHeader title="Account Management" icon="user" theme={theme} />
                <Panel theme={theme}>
                  <ProfileMenuItem icon="package" title="My Orders" subtitle="Track, return or buy again" onPress={openOrders} theme={theme} />
                  <ProfileMenuItem icon="map-pin" title="Shipping Addresses" subtitle="Manage delivery locations" onPress={openShippingAddresses} theme={theme} />
                  <ProfileMenuItem icon="credit-card" title="Payment Methods" subtitle="Manage your cards and wallets" onPress={openPaymentMethods} theme={theme} />
                </Panel>

                <ProfileSectionHeader title="Settings" icon="settings" theme={theme} />
                <Panel theme={theme}>
                  <ProfileMenuItem icon="user" title="Account settings" subtitle="Personal info and identity security" onPress={openSettings} theme={theme} />
                  <ProfileMenuItem icon="bell" title="Notification settings" subtitle="Manage push and email alerts" onPress={openSettings} theme={theme} />
                  <ProfileMenuItem icon="lock" title="Security settings" subtitle="Password and two-step verification" onPress={openSettings} theme={theme} />
                  <ProfileMenuItem
                    icon="globe"
                    title="Language"
                    subtitle="English"
                    onPress={() =>
                      showAlert({
                        tone: 'info',
                        eyebrow: 'SETTINGS',
                        title: 'Language',
                        message: 'Coming soon',
                      })
                    }
                    theme={theme}
                  />
                  <ProfileMenuItem
                    icon="help-circle"
                    title="Help & Support"
                    subtitle="FAQ and customer support"
                    onPress={() =>
                      showAlert({
                        tone: 'info',
                        eyebrow: 'SUPPORT',
                        title: 'Help & Support',
                        message: 'Coming soon',
                      })
                    }
                    theme={theme}
                  />
                  <ProfileMenuItem
                    icon="info"
                    title="About app"
                    subtitle="Version 1.0.4"
                    onPress={() =>
                      showAlert({
                        tone: 'info',
                        eyebrow: 'APP INFO',
                        title: 'About',
                        message: 'Version 1.0.4',
                      })
                    }
                    theme={theme}
                  />
                  
                  <View style={styles.spacer12} />
                  <Pressable
                    onPress={handleLogout}
                    style={[
                      styles.button,
                      {backgroundColor: 'transparent', borderColor: alpha(theme.danger, 0.4), borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 24, paddingVertical: 14, marginTop: 8},
                    ]}>
                    <AppIcon name="log-out" size={18} color={theme.danger} />
                    <Text style={[styles.buttonLabel, {color: theme.danger, marginLeft: 8}]}>
                      Log out
                    </Text>
                  </Pressable>
                </Panel>

                <Pressable
                  onPress={() =>
                    showAlert({
                      tone: 'danger',
                      eyebrow: 'ACCOUNT',
                      title: 'Delete account',
                      message: 'Delete account logic is not connected yet.',
                    })
                  }
                  style={{alignItems: 'center', paddingTop: 8, paddingBottom: 32}}>
                  <Text style={{color: theme.danger, fontWeight: '600', fontSize: 13}}>Delete account permanently</Text>
                </Pressable>
              </>
            ) : null}
            </ScrollView>
          )}

          {showBottomBar ? (
            <View
              style={[
                styles.tabBar,
                {
                  backgroundColor: alpha(theme.tabBar, 0.98),
                  borderTopColor: alpha(theme.border, 0.9),
                },
              ]}>
              {tabs.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => handleTabChange(item.id)}
                  style={styles.tabItem}>
                  <View
                    ref={item.id === 'saved' ? savedTabRef : undefined}
                    style={[
                      styles.tabGlyph,
                      tab === item.id ? activeTabGlyphStyle : styles.tabGlyphIdle,
                    ]}>
                    <Animated.View
                      style={
                        item.id === 'saved'
                          ? {transform: [{scale: savedIconScale}]}
                          : undefined
                      }>
                      <TabIcon
                        kind={item.icon}
                        active={tab === item.id}
                        theme={theme}
                      />
                    </Animated.View>
                    {item.id === 'saved' && favorites.length > 0 ? (
                      <View
                        style={[
                          styles.tabSavedBadge,
                          {backgroundColor: theme.lime},
                        ]}>
                        <Text style={styles.tabSavedBadgeText}>{favorites.length}</Text>
                      </View>
                    ) : null}
                    {item.id === 'cart' && cartItemCount > 0 ? (
                      <View
                        style={[
                          styles.tabCartBadge,
                          {backgroundColor: theme.lime},
                        ]}>
                        <Text style={styles.tabCartBadgeText}>{cartItemCount}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.tabText,
                      {color: tab === item.id ? theme.text : theme.textMuted},
                    ]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {cartBubbleVisible ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cartBubble,
                {
                  backgroundColor: alpha(theme.accent, 0.18),
                  borderColor: alpha(theme.accent, 0.38),
                  opacity: cartBubbleOpacity,
                  transform: [
                    {translateX: cartBubbleX},
                    {translateY: cartBubbleY},
                    {scale: cartBubbleScale},
                  ],
                },
              ]}>
              <AppIcon name="addCart" size={16} color={theme.accent} />
            </Animated.View>
          ) : null}

          {favoriteBubbleVisible ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cartBubble,
                {
                  backgroundColor: alpha(theme.lime, 0.16),
                  borderColor: alpha(theme.lime, 0.34),
                  opacity: favoriteBubbleOpacity,
                  transform: [
                    {translateX: favoriteBubbleX},
                    {translateY: favoriteBubbleY},
                    {scale: favoriteBubbleScale},
                  ],
                },
              ]}>
              <AppIcon name="saved" size={16} color={theme.lime} />
            </Animated.View>
          ) : null}
        </View>

        <SearchCameraModal
          visible={searchCameraOpen}
          recentImages={recentSearchImages}
          onClose={() => setSearchCameraOpen(false)}
          onSelectImage={handleSearchImageSelected}
        />

        <FilterModal
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          theme={theme}
          category={category}
          sortMode={sortMode}
          inStockOnly={inStockOnly}
          selectedBrand={selectedBrand}
          brands={brandOptions}
          minimumRating={minimumRating}
          priceMarks={priceMarks}
          priceMinIndex={catalogPriceMinIndex}
          priceMaxIndex={catalogPriceMaxIndex}
          priceHandleFocus={priceHandleFocus}
          onCategoryChange={setCategory}
          onSortChange={setSortMode}
          onStockChange={setInStockOnly}
          onBrandChange={setSelectedBrand}
          onRatingChange={setMinimumRating}
          onPriceHandleFocusChange={setPriceHandleFocus}
          onPriceMarkPress={handlePriceMarkPress}
          onReset={resetCatalogResults}
        />

        <ProductModal
          product={selectedProduct}
          theme={theme}
          favorite={selectedProduct ? favorites.includes(selectedProduct.id) : false}
          onClose={closeProductDetail}
          onToggleFavorite={toggleFavorite}
          onAddToCart={addToCart}
        />

        <CheckoutModal
          visible={checkoutOpen}
          theme={theme}
          cart={cart}
          subtotal={cartTotal}
          shippingLabel={selectedShippingOption.label}
          shippingFee={shippingFee}
          discountAmount={promoDiscount}
          total={orderTotal}
          appliedPromoCode={appliedPromoCode}
          onClose={closeCheckout}
          onPlaceOrder={handlePlaceOrder}
        />

        <OrdersModal
          visible={ordersOpen}
          theme={theme}
          orders={orders}
          onClose={closeOrders}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Panel({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: alpha(theme.panel, 0.94),
          borderColor: alpha(theme.border, 0.92),
          shadowColor: alpha(theme.accent, 0.24),
        },
      ]}>
      {children}
    </View>
  );
}

function Section({
  title,
  theme,
  action,
  onPress,
}: {
  title: string;
  theme: typeof CONTROL_ROOM_THEME;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>{title}</Text>
      {action && onPress ? (
        <Pressable onPress={onPress}>
          <Text style={[styles.sectionAction, {color: theme.lime}]}>
            {action.toUpperCase()}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Metric({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: alpha(theme.panelAlt, 0.88),
          borderColor: alpha(theme.border, 0.84),
        },
      ]}>
      <Text style={[styles.metricValue, {color: theme.text}]}>{value}</Text>
      <Text style={[styles.metricLabel, {color: theme.textMuted}]}>{label}</Text>
    </View>
  );
}

function ProfileMenuItem({
  icon,
  title,
  subtitle,
  onPress,
  theme,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.preference, {paddingVertical: 14}]}>
      <View style={{marginRight: 16, width: 24, alignItems: 'center'}}>
        <AppIcon name={icon} size={20} color={theme.accent} />
      </View>
      <View style={styles.flexFill}>
        <Text style={[styles.prefTitle, {color: theme.text, fontSize: 16, fontWeight: '600'}]}>{title}</Text>
        <Text style={[styles.prefBody, {color: theme.textMuted, fontSize: 13, marginTop: 4}]}>{subtitle}</Text>
      </View>
      <AppIcon name="chevron-right" size={20} color={alpha(theme.textMuted, 0.6)} />
    </Pressable>
  );
}

function ProfileToggleItem({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  theme,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  return (
    <View style={[styles.preference, {paddingVertical: 14}]}>
      <View style={{marginRight: 16, width: 24, alignItems: 'center'}}>
        <AppIcon name={icon} size={20} color={theme.accent} />
      </View>
      <View style={styles.flexFill}>
        <Text style={[styles.prefTitle, {color: theme.text, fontSize: 16, fontWeight: '600'}]}>{title}</Text>
        <Text style={[styles.prefBody, {color: theme.textMuted, fontSize: 13, marginTop: 4}]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: alpha(theme.border, 0.4), true: theme.lime}}
        thumbColor={theme.surface}
      />
    </View>
  );
}

function ProfileSectionHeader({
  title,
  icon,
  theme,
  hidden = false,
}: {
  title: string;
  icon: React.ComponentProps<typeof AppIcon>['name'];
  theme: typeof CONTROL_ROOM_THEME;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <View style={[styles.sectionRow, {paddingLeft: 4, marginTop: 12}]}>
      <AppIcon name={icon} size={16} color={theme.accent} />
      <Text style={[styles.sectionTitle, {color: theme.text, marginLeft: 8, fontSize: 14, fontWeight: 'bold'}]}>
        {title}
      </Text>
    </View>
  );
}

function HighlightBanner({
  variant = 'default',
  eyebrow,
  title,
  description,
  product,
  artworkSource,
  artworkMode = 'banner',
  theme,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  variant?: 'default' | 'hero';
  eyebrow: string;
  title: string;
  description: string;
  product: Product;
  artworkSource?: ImageSourcePropType;
  artworkMode?: HeroArtworkMode;
  theme: typeof CONTROL_ROOM_THEME;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  if (variant === 'hero') {
    return (
      <View
        style={[
          styles.highlightBanner,
          styles.highlightBannerHero,
          styles.highlightBannerHeroSurface,
          {
            borderColor: alpha('#FFFFFF', 0.52),
            shadowColor: alpha('#3A6A7A', 0.22),
          },
        ]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.highlightBannerHeroBaseGlow} />
          <View style={styles.highlightBannerHeroLeftWash} />
          <View style={styles.highlightBannerHeroWhiteBloom} />
        </View>

        {artworkSource ? (
          artworkMode === 'cutout' ? (
            <View style={styles.highlightBannerHeroProductVisual}>
              <View style={styles.highlightBannerHeroProductHalo} />
              <Image
                source={artworkSource}
                style={styles.highlightBannerHeroProductImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <Image
              source={artworkSource}
              style={styles.highlightBannerHeroImage}
              resizeMode="contain"
            />
          )
        ) : (
          <View style={styles.highlightBannerHeroFallback}>
            <LabArtwork product={product} theme={theme} variant="hero" />
          </View>
        )}

        <View style={styles.highlightBannerHeroCopy}>
          <Text style={styles.highlightBannerHeroEyebrow}>{eyebrow}</Text>
          <Text style={styles.highlightBannerHeroTitle}>{title}</Text>
          <Text style={styles.highlightBannerHeroBody}>{description}</Text>

          <View style={styles.highlightBannerHeroFooter}>
            <Pressable
              onPress={onPrimary}
              style={[
                styles.highlightBannerHeroButton,
                styles.highlightBannerHeroButtonAccent,
              ]}>
              <Text style={styles.highlightBannerHeroButtonLabel}>
                {primaryLabel}
              </Text>
            </Pressable>
            {secondaryLabel && onSecondary ? (
              <Pressable
                onPress={onSecondary}
                style={styles.highlightBannerHeroSecondary}>
                <Text style={styles.highlightBannerHeroSecondaryLabel}>
                  {secondaryLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.highlightBanner,
        {
          backgroundColor: alpha(theme.panel, 0.96),
          borderColor: alpha(theme.border, 0.92),
          shadowColor: alpha(theme.accent, 0.16),
        },
      ]}>
      <View style={styles.highlightBannerCopy}>
        <Text style={[styles.highlightBannerEyebrow, {color: theme.accent}]}>
          {eyebrow}
        </Text>
        <Text style={[styles.highlightBannerTitle, {color: theme.text}]}>{title}</Text>
        <Text style={[styles.highlightBannerBody, {color: theme.textMuted}]}>
          {description}
        </Text>
        <View style={styles.highlightBannerFooter}>
          <View style={styles.flexFill}>
            <Text style={[styles.highlightBannerPrice, {color: theme.text}]}>
              {formatPrice(product.price)}
            </Text>
            <Text style={[styles.highlightBannerMeta, {color: theme.textMuted}]}>
              {product.vendor} | {product.leadTime}
            </Text>
          </View>
          <Pressable
            onPress={onPrimary}
            style={[
              styles.highlightBannerButton,
              {backgroundColor: theme.accent},
            ]}>
            <Text style={[styles.highlightBannerButtonLabel, styles.buttonTextDark]}>
              {primaryLabel}
            </Text>
          </Pressable>
        </View>
        {secondaryLabel && onSecondary ? (
          <Pressable onPress={onSecondary} style={styles.highlightBannerSecondary}>
            <Text style={[styles.highlightBannerSecondaryLabel, {color: theme.lime}]}>
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View
        style={[
          styles.highlightBannerArtwork,
          {
            backgroundColor: alpha(theme.surfaceRaised, 0.9),
            borderColor: alpha(theme.border, 0.84),
          },
        ]}>
        {artworkSource ? (
          <Image source={artworkSource} style={styles.highlightBannerArtworkImage} resizeMode="cover" />
        ) : (
          <LabArtwork product={product} theme={theme} variant="card" />
        )}
      </View>
    </View>
  );
}

function AddToCartButton({
  theme,
  onPress,
  onAnimate,
}: {
  theme: typeof CONTROL_ROOM_THEME;
  onPress: () => void;
  onAnimate: (point: BubblePoint) => void;
}) {
  const buttonRef = useRef<View>(null);

  const handlePress = async () => {
    const buttonLayout = await measureViewInWindow(buttonRef);
    if (buttonLayout) {
      onAnimate({
        x: buttonLayout.x + buttonLayout.width / 2,
        y: buttonLayout.y + buttonLayout.height / 2,
      });
    }
    onPress();
  };

  return (
    <View ref={buttonRef}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.catalogCardButton,
          {backgroundColor: theme.accent},
        ]}>
        <View style={styles.catalogCardButtonContent}>
          <AppIcon name="addCart" size={16} color="#061018" />
        </View>
      </Pressable>
    </View>
  );
}

function FavoriteToggleButton({
  active,
  theme,
  onPress,
  onAnimate,
}: {
  active: boolean;
  theme: typeof CONTROL_ROOM_THEME;
  onPress: () => void;
  onAnimate: (point: BubblePoint) => void;
}) {
  const buttonRef = useRef<View>(null);

  const handlePress = async () => {
    if (!active) {
      const buttonLayout = await measureViewInWindow(buttonRef);
      if (buttonLayout) {
        onAnimate({
          x: buttonLayout.x + buttonLayout.width / 2,
          y: buttonLayout.y + buttonLayout.height / 2,
        });
      }
    }
    onPress();
  };

  return (
    <View ref={buttonRef}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.catalogFavoriteButton,
          {
            backgroundColor: active
              ? alpha(theme.lime, 0.14)
              : alpha('#FFFFFF', 0.94),
            borderColor: active ? alpha(theme.lime, 0.32) : alpha('#FFFFFF', 0.28),
          },
        ]}>
        <AppIcon
          name="saved"
          size={15}
          color={active ? theme.lime : theme.textMuted}
        />
      </Pressable>
    </View>
  );
}

function AvailabilityBadge({
  product,
  theme,
}: {
  product: Product;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  const tones =
    product.availability === 'In stock'
      ? {backgroundColor: alpha(theme.lime, 0.14), color: theme.lime}
      : product.availability === 'Low stock'
        ? {backgroundColor: alpha(theme.amber, 0.14), color: theme.amber}
        : {backgroundColor: alpha(theme.danger, 0.14), color: theme.danger};

  return (
    <View
      style={[
        styles.availabilityBadge,
        {backgroundColor: tones.backgroundColor},
      ]}>
      <Text style={[styles.availabilityBadgeLabel, {color: tones.color}]}>
        {product.availability}
      </Text>
    </View>
  );
}

function InventoryTile({
  item,
  theme,
  fullWidth = false,
  onPress,
}: {
  item: (typeof CATEGORIES)[number];
  theme: typeof CONTROL_ROOM_THEME;
  fullWidth?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.inventoryTile,
        fullWidth ? styles.inventoryTileFullWidth : null,
        {
          backgroundColor: alpha(theme.panelAlt, 0.92),
          borderColor: alpha(theme.border, 0.92),
        },
      ]}>
      <View
        style={[
          styles.inventoryTileIcon,
          {
            backgroundColor: alpha(theme.bg, 0.38),
            borderColor: alpha(theme.border, 0.88),
          },
        ]}>
        <Text style={[styles.inventoryTileCode, {color: theme.text}]}>
          {item.shortCode}
        </Text>
      </View>
      <Text style={[styles.inventoryTileLabel, {color: theme.text}]} numberOfLines={2}>
        {item.label}
      </Text>
      <Text style={[styles.inventoryTileSummary, {color: theme.textMuted}]}>
        {item.summary}
      </Text>
    </Pressable>
  );
}

function LabArtwork({
  product,
  theme,
  variant,
}: {
  product: Pick<Product, 'accent' | 'code' | 'id' | 'name'>;
  theme: typeof CONTROL_ROOM_THEME;
  variant: 'hero' | 'card' | 'compact';
}) {
  const shellStyle =
    variant === 'hero'
      ? styles.labArtworkHero
      : variant === 'compact'
        ? styles.labArtworkCompact
        : styles.labArtworkCard;
  const boardStyle =
    variant === 'hero'
      ? styles.labBoardHero
      : variant === 'compact'
        ? styles.labBoardCompact
        : styles.labBoardCard;
  const monochrome = variant !== 'hero';
  const boardTone = monochrome ? '#363D44' : '#212A33';
  const traceTone = monochrome ? 'rgba(255,255,255,0.15)' : alpha(theme.accent, 0.22);
  const chipTone = monochrome ? '#B4BDC5' : '#7F8A95';
  const portTone = monochrome ? 'rgba(245,247,250,0.45)' : alpha(theme.text, 0.24);
  const sceneTone = monochrome ? '#F0F2F4' : '#0A141D';
  const frameTone = monochrome ? '#D9DFE4' : alpha(theme.border, 0.72);
  const imageSource = getProductImageSource(product.id);
  const imagePaddingStyle =
    variant === 'compact' ? styles.labArtworkImagePadCompact : styles.labArtworkImagePadRegular;

  if (imageSource) {
    return (
      <View
        style={[
          styles.labArtworkShell,
          shellStyle,
          imagePaddingStyle,
          {
            borderColor: frameTone,
          },
        ]}>
        <Image source={imageSource} style={styles.labArtworkImage} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.labArtworkShell,
        shellStyle,
        {
          backgroundColor: sceneTone,
          borderColor: frameTone,
        },
      ]}>
      <View style={[styles.labArtworkGlow, {backgroundColor: alpha('#FFFFFF', 0.38)}]} />
      <View style={[styles.labArtworkLine, styles.labArtworkLineTop, {backgroundColor: traceTone}]} />
      <View
        style={[
          styles.labArtworkLine,
          styles.labArtworkLineBottom,
          {backgroundColor: traceTone},
        ]}
      />
      <View
        style={[
          styles.labBoard,
          boardStyle,
          {backgroundColor: boardTone, shadowColor: alpha('#000000', 0.45)},
        ]}>
        <View style={[styles.labPort, styles.labPortLeftTop, {backgroundColor: portTone}]} />
        <View style={[styles.labPort, styles.labPortLeftBottom, {backgroundColor: portTone}]} />
        <View style={[styles.labPortWide, styles.labPortWideRight, {backgroundColor: portTone}]} />
        <View
          style={[
            styles.labTraceHorizontal,
            styles.labTraceHorizontalTop,
            {backgroundColor: traceTone},
          ]}
        />
        <View
          style={[
            styles.labTraceHorizontal,
            styles.labTraceHorizontalBottom,
            {backgroundColor: traceTone},
          ]}
        />
        <View
          style={[
            styles.labTraceVertical,
            styles.labTraceVerticalLeft,
            {backgroundColor: traceTone},
          ]}
        />
        <View
          style={[
            styles.labTraceVertical,
            styles.labTraceVerticalRight,
            {backgroundColor: traceTone},
          ]}
        />
        <View
          style={[
            styles.labChip,
            variant === 'compact' ? styles.labChipCompact : styles.labChipRegular,
            {backgroundColor: chipTone},
          ]}>
          {variant === 'compact' ? null : (
            <Text style={styles.labChipCode}>{product.code}</Text>
          )}
        </View>
      </View>
      {variant === 'hero' ? (
        <View style={[styles.labDock, {backgroundColor: alpha('#FFFFFF', 0.08)}]} />
      ) : null}
    </View>
  );
}

function TabIcon({
  kind,
  active,
  theme,
}: {
  kind: 'home' | 'catalog' | 'saved' | 'cart' | 'profile';
  active: boolean;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  const tone = active ? theme.text : theme.textMuted;
  const iconName =
    kind === 'catalog'
      ? 'catalog'
      : kind === 'saved'
        ? 'saved'
        : kind === 'cart'
          ? 'cart'
          : kind === 'profile'
            ? 'profile'
            : 'home';

  return (
    <View style={styles.tabIconFrame}>
      <AppIcon name={iconName} size={18} color={tone} />
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? alpha(theme.accent, 0.16) : alpha(theme.panelAlt, 0.84),
          borderColor: selected ? theme.accent : alpha(theme.border, 0.9),
        },
      ]}>
      <Text style={[styles.chipLabel, {color: selected ? theme.text : theme.textMuted}]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Preference({
  title,
  description,
  value,
  onValueChange,
  theme,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  return (
    <View style={styles.preference}>
      <View style={styles.flexFill}>
        <Text style={[styles.prefTitle, {color: theme.text}]}>{title}</Text>
        <Text style={[styles.prefBody, {color: theme.textMuted}]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: alpha(theme.border, 0.7), true: theme.accent}}
        thumbColor={theme.surface}
      />
    </View>
  );
}

function CartPanel({
  entry,
  theme,
  onUpdate,
  onRemove,
}: {
  entry: CartEntry;
  theme: typeof CONTROL_ROOM_THEME;
  onUpdate: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  const product = PRODUCT_INDEX[entry.productId];
  const variantInfo = `${product.code} • ${
    product.specs[0]?.value ?? product.tags[0] ?? product.highlight
  }`;
  const lineTotal = product.price * entry.quantity;

  return (
    <Panel theme={theme}>
      <View style={styles.cartRow}>
        <HardwareGlyph product={product} theme={theme} size={84} />
        <View style={styles.flexFill}>
          <View style={styles.rowSpace}>
            <Text style={[styles.cartTitle, {color: theme.text}]}>{product.name}</Text>
            <Pressable
              onPress={() => onRemove(product.id)}
              style={[
                styles.cartRemoveButton,
                {
                  backgroundColor: alpha(theme.danger, 0.12),
                  borderColor: alpha(theme.danger, 0.28),
                },
              ]}>
              <Text style={[styles.cartRemoveButtonLabel, {color: theme.danger}]}>-</Text>
            </Pressable>
          </View>
          <Text style={[styles.meta, {color: theme.textMuted}]}>
            {product.vendor} | {product.leadTime}
          </Text>
          <Text style={[styles.cartVariantInfo, {color: theme.textMuted}]}>
            Variant: {variantInfo}
          </Text>
          <View style={styles.cartPriceMetaRow}>
            <Text style={[styles.meta, {color: theme.textMuted}]}>Unit price</Text>
            <Text style={[styles.meta, {color: theme.text}]}>{formatPrice(product.price)}</Text>
          </View>
          <View style={styles.rowSpace}>
            <View
              style={[
                styles.stepper,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.88),
                  borderColor: alpha(theme.border, 0.88),
                },
              ]}>
              <Pressable style={styles.stepperBtn} onPress={() => onUpdate(product.id, Math.max(1, entry.quantity - 1))}>
                <Text style={[styles.buttonLabel, {color: theme.text}]}>-</Text>
              </Pressable>
              <Text style={[styles.stepperValue, {color: theme.text}]}>{entry.quantity}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => onUpdate(product.id, entry.quantity + 1)}>
                <Text style={[styles.buttonLabel, {color: theme.text}]}>+</Text>
              </Pressable>
            </View>
            <View style={styles.cartLineTotalWrap}>
              <Text style={[styles.cartLineTotalLabel, {color: theme.textMuted}]}>Total</Text>
              <Text style={[styles.price, {color: theme.lime}]}>
                {formatPrice(lineTotal)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Panel>
  );
}

function FilterCheckboxRow({
  label,
  selected,
  description,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  description?: string;
  onPress: () => void;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  const checkboxTone = selected
    ? {backgroundColor: alpha(theme.accent, 0.18), borderColor: theme.accent}
    : {backgroundColor: 'transparent', borderColor: alpha(theme.border, 0.82)};

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterCheckboxRow,
        {
          backgroundColor: alpha(theme.panelAlt, 0.9),
          borderColor: selected ? alpha(theme.accent, 0.34) : alpha(theme.border, 0.88),
        },
      ]}>
      <View
        style={[
          styles.filterCheckbox,
          checkboxTone,
        ]}>
        {selected ? (
          <View
            style={[
              styles.filterCheckboxMark,
              {backgroundColor: theme.accent},
            ]}
          />
        ) : null}
      </View>
      <View style={styles.flexFill}>
        <Text style={[styles.filterCheckboxLabel, {color: theme.text}]}>
          {label}
        </Text>
        {description ? (
          <Text style={[styles.filterCheckboxDescription, {color: theme.textMuted}]}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function PriceRangeSlider({
  marks,
  minIndex,
  maxIndex,
  activeHandle,
  onHandleChange,
  onMarkPress,
  theme,
}: {
  marks: number[];
  minIndex: number;
  maxIndex: number;
  activeHandle: 'min' | 'max';
  onHandleChange: (value: 'min' | 'max') => void;
  onMarkPress: (index: number) => void;
  theme: typeof CONTROL_ROOM_THEME;
}) {
  return (
    <View
      style={[
        styles.priceRangeCard,
        {
          backgroundColor: alpha(theme.panelAlt, 0.9),
          borderColor: alpha(theme.border, 0.88),
        },
      ]}>
      <View style={styles.priceRangeHeader}>
        <Pressable
          onPress={() => onHandleChange('min')}
          style={[
            styles.priceRangePill,
            activeHandle === 'min'
              ? {
                  backgroundColor: alpha(theme.accent, 0.16),
                  borderColor: alpha(theme.accent, 0.32),
                }
              : {
                  backgroundColor: alpha(theme.surface, 0.6),
                  borderColor: alpha(theme.border, 0.84),
                },
          ]}>
          <Text style={[styles.priceRangePillLabel, {color: theme.textMuted}]}>Min</Text>
          <Text style={[styles.priceRangePillValue, {color: theme.text}]}>
            {formatPrice(marks[minIndex] ?? marks[0])}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onHandleChange('max')}
          style={[
            styles.priceRangePill,
            activeHandle === 'max'
              ? {
                  backgroundColor: alpha(theme.accent, 0.16),
                  borderColor: alpha(theme.accent, 0.32),
                }
              : {
                  backgroundColor: alpha(theme.surface, 0.6),
                  borderColor: alpha(theme.border, 0.84),
                },
          ]}>
          <Text style={[styles.priceRangePillLabel, {color: theme.textMuted}]}>Max</Text>
          <Text style={[styles.priceRangePillValue, {color: theme.text}]}>
            {formatPrice(marks[maxIndex] ?? marks[marks.length - 1])}
          </Text>
        </Pressable>
      </View>

      <View style={styles.priceRangeTrackRow}>
        {marks.map((mark, index) => {
          const active = index >= minIndex && index <= maxIndex;
          const isHandle = index === minIndex || index === maxIndex;
          const nextActive = index >= minIndex && index < maxIndex;
          const railTone = {
            backgroundColor:
              index === marks.length - 1
                ? 'transparent'
                : nextActive
                  ? theme.accent
                  : alpha(theme.border, 0.56),
          };

          return (
            <Pressable
              key={`${mark}-${index}`}
              onPress={() => onMarkPress(index)}
              style={styles.priceRangeStep}>
              <View style={[styles.priceRangeRail, railTone]} />
              <View
                style={[
                  styles.priceRangeDot,
                  {
                    backgroundColor: active ? alpha(theme.accent, 0.18) : theme.surface,
                    borderColor: active ? theme.accent : alpha(theme.border, 0.8),
                  },
                ]}>
                {isHandle ? (
                  <View
                    style={[
                      styles.priceRangeDotCore,
                      {backgroundColor: theme.accent},
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.priceRangeMarkLabel,
                  {color: active ? theme.text : theme.textMuted},
                ]}>
                {(mark / 1000000).toFixed(mark >= 10000000 ? 0 : 1)}M
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FilterModal({
  visible,
  onClose,
  theme,
  category,
  sortMode,
  inStockOnly,
  selectedBrand,
  brands,
  minimumRating,
  priceMarks,
  priceMinIndex,
  priceMaxIndex,
  priceHandleFocus,
  onCategoryChange,
  onSortChange,
  onStockChange,
  onBrandChange,
  onRatingChange,
  onPriceHandleFocusChange,
  onPriceMarkPress,
  onReset,
}: {
  visible: boolean;
  onClose: () => void;
  theme: typeof CONTROL_ROOM_THEME;
  category: CategoryId;
  sortMode: SortMode;
  inStockOnly: boolean;
  selectedBrand: string;
  brands: string[];
  minimumRating: number;
  priceMarks: number[];
  priceMinIndex: number;
  priceMaxIndex: number;
  priceHandleFocus: 'min' | 'max';
  onCategoryChange: (value: CategoryId) => void;
  onSortChange: (value: SortMode) => void;
  onStockChange: (value: boolean) => void;
  onBrandChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onPriceHandleFocusChange: (value: 'min' | 'max') => void;
  onPriceMarkPress: (index: number) => void;
  onReset: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: theme.overlay}]}>
        <ScrollView
          style={[styles.sheet, {backgroundColor: theme.surface, borderColor: alpha(theme.border, 0.92)}]}
          contentContainerStyle={styles.sheetContent}>
          <View style={styles.rowSpace}>
            <View style={styles.flexFill}>
              <Text style={[styles.sectionTitle, {color: theme.text}]}>Product filters</Text>
              <Text style={[styles.meta, {color: theme.textMuted}]}>
                Refine the listing by price, category, brand, rating, availability, and sort mode.
              </Text>
            </View>
            <Pressable onPress={onReset}>
              <Text style={[styles.smallCode, {color: theme.lime}]}>RESET</Text>
            </Pressable>
          </View>

          <View style={styles.filterBlock}>
            <Text style={[styles.filterBlockTitle, {color: theme.text}]}>Price range slider</Text>
            <PriceRangeSlider
              marks={priceMarks}
              minIndex={priceMinIndex}
              maxIndex={priceMaxIndex}
              activeHandle={priceHandleFocus}
              onHandleChange={onPriceHandleFocusChange}
              onMarkPress={onPriceMarkPress}
              theme={theme}
            />
          </View>

          <View style={styles.filterBlock}>
            <Text style={[styles.filterBlockTitle, {color: theme.text}]}>Category checkboxes</Text>
            {CATEGORIES.map(item => (
              <FilterCheckboxRow
                key={item.id}
                label={item.label}
                description={item.summary}
                selected={category === item.id}
                onPress={() => onCategoryChange(item.id)}
                theme={theme}
              />
            ))}
          </View>

          <View style={styles.filterBlock}>
            <Text style={[styles.filterBlockTitle, {color: theme.text}]}>Brand selection</Text>
            <View style={styles.wrapRow}>
              {brands.map(brand => (
                <Chip
                  key={brand}
                  label={brand === 'all' ? 'All brands' : brand}
                  selected={selectedBrand === brand}
                  onPress={() => onBrandChange(brand)}
                  theme={theme}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterBlock}>
            <Text style={[styles.filterBlockTitle, {color: theme.text}]}>Rating filter</Text>
            <View style={styles.wrapRow}>
              {RATING_FILTER_OPTIONS.map(value => (
                <Chip
                  key={value}
                  label={value === 0 ? 'All ratings' : `${value}+ stars`}
                  selected={minimumRating === value}
                  onPress={() => onRatingChange(value)}
                  theme={theme}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterBlock}>
            <Text style={[styles.filterBlockTitle, {color: theme.text}]}>Availability toggle</Text>
            <Preference
              title="Available now"
              description="Show only in-stock or low-stock hardware that can be sourced immediately."
              value={inStockOnly}
              onValueChange={onStockChange}
              theme={theme}
            />
          </View>

          <View style={styles.filterBlock}>
            <Text style={[styles.filterBlockTitle, {color: theme.text}]}>Sort options</Text>
            <View style={styles.wrapRow}>
              {SEARCH_SORT_OPTIONS.map(option => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={sortMode === option.id}
                  onPress={() => onSortChange(option.id)}
                  theme={theme}
                />
              ))}
            </View>
          </View>

          <View style={styles.spacer12} />
          <Pressable onPress={onClose} style={[styles.button, {backgroundColor: theme.accent}]}>
            <Text style={[styles.buttonLabel, styles.buttonTextDark]}>Apply filters</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ProductModal({
  product,
  theme,
  favorite,
  onClose,
  onToggleFavorite,
  onAddToCart,
}: {
  product: Product | null;
  theme: typeof CONTROL_ROOM_THEME;
  favorite: boolean;
  onClose: () => void;
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (productId: string, quantity?: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const {showAlert} = useAppAlert();

  if (!product) {
    return null;
  }

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: theme.overlay}]}>
        <ScrollView contentContainerStyle={[styles.sheet, {backgroundColor: theme.surface, borderColor: alpha(theme.border, 0.92)}]}>
          <View style={styles.rowSpace}>
            <Text style={[styles.sectionTitle, {color: theme.text}]}>{product.name}</Text>
            <Pressable onPress={onClose}>
              <Text style={[styles.smallCode, {color: theme.textMuted}]}>CLOSE</Text>
            </Pressable>
          </View>
          <HardwareGlyph product={product} theme={theme} size={180} />
          <Text style={[styles.price, {color: theme.text}]}>{formatPrice(product.price)}</Text>
          <Text style={[styles.heroBody, {color: theme.textMuted}]}>{product.overview}</Text>
          <View style={styles.wrapRow}>
            {product.tags.map(tag => (
              <Chip key={tag} label={tag} selected={false} onPress={() => undefined} theme={theme} />
            ))}
          </View>
          {product.specs.map(spec => (
            <View key={spec.label} style={styles.specRow}>
              <Text style={[styles.smallCode, {color: theme.textMuted}]}>
                {spec.label.toUpperCase()}
              </Text>
              <Text style={[styles.meta, {color: theme.text}]}>{spec.value}</Text>
            </View>
          ))}
          <View style={styles.spacer12} />
          <View
            style={[
              styles.stepper,
              {
                backgroundColor: alpha(theme.panelAlt, 0.88),
                borderColor: alpha(theme.border, 0.88),
              },
              styles.stepperStart,
            ]}>
            <Pressable style={styles.stepperBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Text style={[styles.buttonLabel, {color: theme.text}]}>-</Text>
            </Pressable>
            <Text style={[styles.stepperValue, {color: theme.text}]}>{quantity}</Text>
            <Pressable style={styles.stepperBtn} onPress={() => setQuantity(quantity + 1)}>
              <Text style={[styles.buttonLabel, {color: theme.text}]}>+</Text>
            </Pressable>
          </View>
          <View style={styles.spacer12} />
          <Pressable
            onPress={() => {
              onAddToCart(product.id, quantity);
              showAlert({
                tone: 'success',
                eyebrow: 'CART UPDATED',
                title: 'Added to cart',
                message: `${quantity} x ${product.name} added to cart.`,
              });
            }}
            style={[styles.button, {backgroundColor: theme.accent}]}>
            <Text style={[styles.buttonLabel, styles.buttonTextDark]}>Add to cart</Text>
          </Pressable>
          <View style={styles.spacer10} />
          <Pressable
            onPress={() => onToggleFavorite(product.id)}
            style={[styles.button, {backgroundColor: alpha(theme.panelAlt, 0.9)}]}>
            <Text style={[styles.buttonLabel, {color: theme.text}]}>
              {favorite ? 'In favorites' : 'Add to favorites'}
            </Text>
          </Pressable>
          <View style={styles.spacer10} />
          <Pressable
            onPress={() =>
              Share.share({
                message: `${product.name} - ${product.highlight} - ${formatPrice(product.price)}`,
              })
            }
            style={[
              styles.button,
              styles.buttonOutline,
              {borderColor: alpha(theme.border, 0.92)},
            ]}>
            <Text style={[styles.buttonLabel, {color: theme.text}]}>Share</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function CheckoutModal({
  visible,
  theme,
  cart,
  subtotal,
  shippingLabel,
  shippingFee,
  discountAmount,
  total,
  appliedPromoCode,
  onClose,
  onPlaceOrder,
}: {
  visible: boolean;
  theme: typeof CONTROL_ROOM_THEME;
  cart: CartEntry[];
  subtotal: number;
  shippingLabel: string;
  shippingFee: number;
  discountAmount: number;
  total: number;
  appliedPromoCode: string | null;
  onClose: () => void;
  onPlaceOrder: (contactName: string) => void;
}) {
  type CheckoutFieldErrorKey =
    | 'contactName'
    | 'email'
    | 'address'
    | 'paymentMethod'
    | 'cardHolder'
    | 'cardNumber'
    | 'cardExpiry';

  const reviewLines = cart.map(item => ({
    entry: item,
    product: PRODUCT_INDEX[item.productId],
  }));
  const [company, setCompany] = useState('Embedded Robotics Lab');
  const [contactName, setContactName] = useState('Tran Thinh');
  const [email, setEmail] = useState('thinh@example.com');
  const [address, setAddress] = useState('12 Nguyen Van Cu, District 5, Ho Chi Minh City');
  const [selectedAddressPresetId, setSelectedAddressPresetId] = useState<string>(
    ADDRESS_PRESETS[0].id,
  );
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStepId>('shipping');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodId>('credit-card');
  const [cardHolder, setCardHolder] = useState('Tran Thinh');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CheckoutFieldErrorKey, string>>
  >({});

  useEffect(() => {
    if (!visible) {
      return;
    }

    setCheckoutStep('shipping');
    setFieldErrors({});
  }, [visible]);

  const selectedPaymentMethod =
    PAYMENT_METHODS.find(method => method.id === paymentMethod) ??
    PAYMENT_METHODS[0];

  const selectAddressPreset = (presetId: string) => {
    const preset = ADDRESS_PRESETS.find(item => item.id === presetId);
    if (!preset) {
      return;
    }

    setSelectedAddressPresetId(presetId);
    setCompany(preset.company);
    setContactName(preset.contactName);
    setEmail(preset.email);
    setAddress(preset.address);
    setFieldErrors(previous => ({
      ...previous,
      contactName: undefined,
      email: undefined,
      address: undefined,
    }));
  };

  const validateShippingStep = () => {
    const nextErrors: Partial<Record<CheckoutFieldErrorKey, string>> = {};

    if (!contactName.trim()) {
      nextErrors.contactName = 'Contact name is required.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!address.trim() || address.trim().length < 10) {
      nextErrors.address = 'Enter a complete shipping address.';
    }

    setFieldErrors(previous => ({
      ...previous,
      contactName: nextErrors.contactName,
      email: nextErrors.email,
      address: nextErrors.address,
    }));
    return Object.keys(nextErrors).length === 0;
  };

  const validatePaymentStep = () => {
    const nextErrors: Partial<Record<CheckoutFieldErrorKey, string>> = {};

    if (!paymentMethod) {
      nextErrors.paymentMethod = 'Select a payment method.';
    }

    if (paymentMethod === 'credit-card' || paymentMethod === 'debit-card') {
      if (!cardHolder.trim()) {
        nextErrors.cardHolder = 'Card holder name is required.';
      }
      if (cardNumber.replace(/\s+/g, '').length < 12) {
        nextErrors.cardNumber = 'Enter a valid card number.';
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
        nextErrors.cardExpiry = 'Use MM/YY format.';
      }
    }

    setFieldErrors(previous => ({
      ...previous,
      paymentMethod: nextErrors.paymentMethod,
      cardHolder: nextErrors.cardHolder,
      cardNumber: nextErrors.cardNumber,
      cardExpiry: nextErrors.cardExpiry,
    }));
    return Object.keys(nextErrors).length === 0;
  };

  const goToNextStep = () => {
    if (checkoutStep === 'shipping') {
      if (!validateShippingStep()) {
        return;
      }

      setCheckoutStep('payment');
      return;
    }

    if (checkoutStep === 'payment') {
      if (!validatePaymentStep()) {
        return;
      }

      setCheckoutStep('review');
    }
  };

  const goToPreviousStep = () => {
    if (checkoutStep === 'review') {
      setCheckoutStep('payment');
      return;
    }

    if (checkoutStep === 'payment') {
      setCheckoutStep('shipping');
    }
  };

  const handleSubmitOrder = () => {
    const shippingValid = validateShippingStep();
    const paymentValid = validatePaymentStep();

    if (!shippingValid || !paymentValid) {
      setCheckoutStep(!shippingValid ? 'shipping' : 'payment');
      return;
    }

    onPlaceOrder(contactName);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: theme.overlay}]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.sheet,
              {backgroundColor: theme.surface, borderColor: alpha(theme.border, 0.92)},
            ]}>
            <View style={styles.rowSpace}>
              <View style={styles.flexFill}>
                <Text style={[styles.sectionTitle, {color: theme.text}]}>
                  Engineering checkout
                </Text>
                <Text style={[styles.meta, {color: theme.textMuted}]}>
                  Complete shipping, payment, and final review before dispatch.
                </Text>
              </View>
              <Pressable onPress={onClose}>
                <Text style={[styles.smallCode, {color: theme.textMuted}]}>CLOSE</Text>
              </Pressable>
            </View>

            <View style={styles.checkoutStepRow}>
              {CHECKOUT_STEPS.map((step, index) => {
                const currentIndex = CHECKOUT_STEPS.findIndex(
                  item => item.id === checkoutStep,
                );
                const active = step.id === checkoutStep;
                const completed = index < currentIndex;

                return (
                  <View key={step.id} style={styles.checkoutStepItem}>
                    <View
                      style={[
                        styles.checkoutStepMarker,
                        {
                          backgroundColor: active || completed
                            ? alpha(theme.accent, 0.18)
                            : alpha(theme.panelAlt, 0.9),
                          borderColor: active || completed
                            ? alpha(theme.accent, 0.34)
                            : alpha(theme.border, 0.88),
                        },
                      ]}>
                      <Text
                        style={[
                          styles.checkoutStepMarkerLabel,
                          {
                            color: active || completed ? theme.accent : theme.textMuted,
                          },
                        ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.checkoutStepLabel,
                        {color: active ? theme.text : theme.textMuted},
                      ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {checkoutStep === 'shipping' ? (
              <>
                <Text style={[styles.sectionKicker, {color: theme.accent}]}>
                  STEP 1: SHIPPING ADDRESS
                </Text>
                <Text style={[styles.meta, {color: theme.textMuted}]}>
                  Choose a saved address or enter a new shipping destination.
                </Text>
                <View style={styles.wrapRow}>
                  {ADDRESS_PRESETS.map(preset => (
                    <Chip
                      key={preset.id}
                      label={preset.label}
                      selected={selectedAddressPresetId === preset.id}
                      onPress={() => selectAddressPreset(preset.id)}
                      theme={theme}
                    />
                  ))}
                </View>
                {[
                  {label: 'Company', value: company, setter: setCompany},
                  {label: 'Contact', value: contactName, setter: setContactName, error: fieldErrors.contactName},
                  {label: 'Email', value: email, setter: setEmail, error: fieldErrors.email},
                  {
                    label: 'Address',
                    value: address,
                    setter: setAddress,
                    multiline: true,
                    error: fieldErrors.address,
                  },
                ].map(field => (
                  <View key={field.label} style={styles.spacer12}>
                    <Text style={[styles.smallCode, {color: theme.textMuted}]}>
                      {field.label.toUpperCase()}
                    </Text>
                    <TextInput
                      value={field.value}
                      onChangeText={value => {
                        field.setter(value);
                        if (field.label === 'Contact') {
                          setFieldErrors(previous => ({
                            ...previous,
                            contactName: undefined,
                          }));
                        }
                        if (field.label === 'Email') {
                          setFieldErrors(previous => ({
                            ...previous,
                            email: undefined,
                          }));
                        }
                        if (field.label === 'Address') {
                          setSelectedAddressPresetId('custom');
                          setFieldErrors(previous => ({
                            ...previous,
                            address: undefined,
                          }));
                        }
                      }}
                      multiline={field.multiline}
                      style={[
                        styles.field,
                        field.multiline ? styles.fieldMultiline : null,
                        {
                          color: theme.text,
                          backgroundColor: alpha(theme.panelAlt, 0.9),
                          borderColor: field.error
                            ? theme.danger
                            : alpha(theme.border, 0.9),
                        },
                      ]}
                      placeholderTextColor={theme.textMuted}
                    />
                    {field.error ? (
                      <Text style={[styles.formErrorText, {color: theme.danger}]}>
                        {field.error}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </>
            ) : null}

            {checkoutStep === 'payment' ? (
              <>
                <Text style={[styles.sectionKicker, {color: theme.accent}]}>
                  STEP 2: PAYMENT METHOD
                </Text>
                <Text style={[styles.meta, {color: theme.textMuted}]}>
                  Select how your team would like to settle this order.
                </Text>
                {PAYMENT_METHODS.map(method => {
                  const active = paymentMethod === method.id;

                  return (
                    <Pressable
                      key={method.id}
                      onPress={() => {
                        setPaymentMethod(method.id);
                        setFieldErrors(previous => ({
                          ...previous,
                          paymentMethod: undefined,
                        }));
                      }}
                      style={[
                        styles.checkoutOptionCard,
                        {
                          backgroundColor: active
                            ? alpha(theme.accent, 0.12)
                            : alpha(theme.panelAlt, 0.9),
                          borderColor: active
                            ? alpha(theme.accent, 0.34)
                            : alpha(theme.border, 0.88),
                        },
                      ]}>
                      <View style={styles.shippingOptionTopRow}>
                        <View
                          style={[
                            styles.shippingOptionRadio,
                            {
                              borderColor: active
                                ? theme.accent
                                : alpha(theme.border, 0.86),
                            },
                          ]}>
                          {active ? (
                            <View
                              style={[
                                styles.shippingOptionRadioFill,
                                {backgroundColor: theme.accent},
                              ]}
                            />
                          ) : null}
                        </View>
                        <View style={styles.flexFill}>
                          <Text style={[styles.cartOptionTitle, {color: theme.text}]}>
                            {method.label}
                          </Text>
                          <Text style={[styles.meta, {color: theme.textMuted}]}>
                            {method.description}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
                {fieldErrors.paymentMethod ? (
                  <Text style={[styles.formErrorText, {color: theme.danger}]}>
                    {fieldErrors.paymentMethod}
                  </Text>
                ) : null}

                {paymentMethod === 'credit-card' || paymentMethod === 'debit-card' ? (
                  <>
                    <View style={styles.spacer12}>
                      <Text style={[styles.smallCode, {color: theme.textMuted}]}>
                        CARD HOLDER
                      </Text>
                      <TextInput
                        value={cardHolder}
                        onChangeText={value => {
                          setCardHolder(value);
                          setFieldErrors(previous => ({
                            ...previous,
                            cardHolder: undefined,
                          }));
                        }}
                        style={[
                          styles.field,
                          {
                            color: theme.text,
                            backgroundColor: alpha(theme.panelAlt, 0.9),
                            borderColor: fieldErrors.cardHolder
                              ? theme.danger
                              : alpha(theme.border, 0.9),
                          },
                        ]}
                        placeholderTextColor={theme.textMuted}
                      />
                      {fieldErrors.cardHolder ? (
                        <Text style={[styles.formErrorText, {color: theme.danger}]}>
                          {fieldErrors.cardHolder}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.spacer12}>
                      <Text style={[styles.smallCode, {color: theme.textMuted}]}>
                        CARD NUMBER
                      </Text>
                      <TextInput
                        value={cardNumber}
                        onChangeText={value => {
                          setCardNumber(value);
                          setFieldErrors(previous => ({
                            ...previous,
                            cardNumber: undefined,
                          }));
                        }}
                        keyboardType="number-pad"
                        style={[
                          styles.field,
                          {
                            color: theme.text,
                            backgroundColor: alpha(theme.panelAlt, 0.9),
                            borderColor: fieldErrors.cardNumber
                              ? theme.danger
                              : alpha(theme.border, 0.9),
                          },
                        ]}
                        placeholderTextColor={theme.textMuted}
                      />
                      {fieldErrors.cardNumber ? (
                        <Text style={[styles.formErrorText, {color: theme.danger}]}>
                          {fieldErrors.cardNumber}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.spacer12}>
                      <Text style={[styles.smallCode, {color: theme.textMuted}]}>
                        EXPIRY
                      </Text>
                      <TextInput
                        value={cardExpiry}
                        onChangeText={value => {
                          setCardExpiry(value);
                          setFieldErrors(previous => ({
                            ...previous,
                            cardExpiry: undefined,
                          }));
                        }}
                        placeholder="MM/YY"
                        style={[
                          styles.field,
                          {
                            color: theme.text,
                            backgroundColor: alpha(theme.panelAlt, 0.9),
                            borderColor: fieldErrors.cardExpiry
                              ? theme.danger
                              : alpha(theme.border, 0.9),
                          },
                        ]}
                        placeholderTextColor={theme.textMuted}
                      />
                      {fieldErrors.cardExpiry ? (
                        <Text style={[styles.formErrorText, {color: theme.danger}]}>
                          {fieldErrors.cardExpiry}
                        </Text>
                      ) : null}
                    </View>
                  </>
                ) : (
                  <Panel theme={theme}>
                    <Text style={[styles.meta, {color: theme.textMuted}]}>
                      {paymentMethod === 'paypal'
                        ? 'PayPal approval is simulated in this prototype and will complete on the next step.'
                        : 'Cash on delivery is available for eligible shipment destinations.'}
                    </Text>
                  </Panel>
                )}
              </>
            ) : null}

            {checkoutStep === 'review' ? (
              <>
                <Text style={[styles.sectionKicker, {color: theme.accent}]}>
                  STEP 3: REVIEW ORDER
                </Text>
                <Text style={[styles.meta, {color: theme.textMuted}]}>
                  Confirm shipping details, payment method, and order total before placing the order.
                </Text>
                <Panel theme={theme}>
                  <Text style={[styles.smallCode, {color: theme.textMuted}]}>SHIPPING TO</Text>
                  <Text style={[styles.cartOptionTitle, {color: theme.text}]}>
                    {contactName}
                  </Text>
                  <Text style={[styles.meta, {color: theme.textMuted}]}>
                    {company || 'No company specified'}
                  </Text>
                  <Text style={[styles.meta, {color: theme.textMuted}]}>{email}</Text>
                  <Text style={[styles.meta, {color: theme.textMuted}]}>{address}</Text>
                </Panel>
                <Panel theme={theme}>
                  <Text style={[styles.smallCode, {color: theme.textMuted}]}>PAYMENT</Text>
                  <Text style={[styles.cartOptionTitle, {color: theme.text}]}>
                    {selectedPaymentMethod.label}
                  </Text>
                  <Text style={[styles.meta, {color: theme.textMuted}]}>
                    {selectedPaymentMethod.description}
                  </Text>
                </Panel>
                <Panel theme={theme}>
                  <Text style={[styles.smallCode, {color: theme.textMuted}]}>ORDER ITEMS</Text>
                  {reviewLines.map(({entry, product}) => (
                    <View key={product.id} style={styles.checkoutReviewRow}>
                      <View style={styles.flexFill}>
                        <Text style={[styles.meta, {color: theme.text}]}>
                          {product.name}
                        </Text>
                        <Text style={[styles.smallCode, {color: theme.textMuted}]}>
                          Qty {entry.quantity}
                        </Text>
                      </View>
                      <Text style={[styles.meta, {color: theme.text}]}>
                        {formatPrice(product.price * entry.quantity)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.summaryDivider} />
                  <View style={styles.cartSummaryRow}>
                    <Text style={[styles.meta, {color: theme.textMuted}]}>Subtotal</Text>
                    <Text style={[styles.meta, {color: theme.text}]}>
                      {formatPrice(subtotal)}
                    </Text>
                  </View>
                  <View style={styles.cartSummaryRow}>
                    <Text style={[styles.meta, {color: theme.textMuted}]}>
                      Shipping ({shippingLabel})
                    </Text>
                    <Text style={[styles.meta, {color: theme.text}]}>
                      {shippingFee ? formatPrice(shippingFee) : 'Free'}
                    </Text>
                  </View>
                  <View style={styles.cartSummaryRow}>
                    <Text style={[styles.meta, {color: theme.textMuted}]}>
                      Discount {appliedPromoCode ? `(${appliedPromoCode})` : ''}
                    </Text>
                    <Text
                      style={[
                        styles.meta,
                        {color: discountAmount ? theme.lime : theme.textMuted},
                      ]}>
                      {discountAmount
                        ? `-${formatPrice(discountAmount)}`
                        : formatPrice(0)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.cartSummaryRow}>
                    <Text style={[styles.cartSummaryTotalLabel, {color: theme.text}]}>
                      Order total
                    </Text>
                    <Text
                      style={[styles.cartSummaryTotalValue, {color: theme.lime}]}>
                      {formatPrice(total)}
                    </Text>
                  </View>
                </Panel>
              </>
            ) : null}

            <View style={styles.spacer12} />
            <View style={styles.checkoutActionRow}>
              {checkoutStep !== 'shipping' ? (
                <Pressable
                  onPress={goToPreviousStep}
                  style={[
                    styles.button,
                    styles.checkoutSecondaryAction,
                    {
                      backgroundColor: alpha(theme.panelAlt, 0.9),
                      borderColor: alpha(theme.border, 0.92),
                    },
                  ]}>
                  <Text style={[styles.buttonLabel, {color: theme.text}]}>Back</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={onClose}
                  style={[
                    styles.button,
                    styles.checkoutSecondaryAction,
                    {
                      backgroundColor: alpha(theme.panelAlt, 0.9),
                      borderColor: alpha(theme.border, 0.92),
                    },
                  ]}>
                  <Text style={[styles.buttonLabel, {color: theme.text}]}>Cancel</Text>
                </Pressable>
              )}
              <Pressable
                onPress={checkoutStep === 'review' ? handleSubmitOrder : goToNextStep}
                style={[
                  styles.button,
                  styles.checkoutPrimaryAction,
                  {backgroundColor: theme.accent},
                ]}>
                <Text style={[styles.buttonLabel, styles.buttonTextDark]}>
                  {checkoutStep === 'review' ? 'Place order' : 'Continue'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function OrdersModal({
  visible,
  theme,
  orders,
  onClose,
}: {
  visible: boolean;
  theme: typeof CONTROL_ROOM_THEME;
  orders: Order[];
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: theme.overlay}]}>
        <ScrollView contentContainerStyle={[styles.sheet, {backgroundColor: theme.surface, borderColor: alpha(theme.border, 0.92)}]}>
          <View style={styles.rowSpace}>
            <Text style={[styles.sectionTitle, {color: theme.text}]}>Order history</Text>
            <Pressable onPress={onClose}>
              <Text style={[styles.smallCode, {color: theme.textMuted}]}>CLOSE</Text>
            </Pressable>
          </View>
          {orders.map(order => (
            <Panel key={order.id} theme={theme}>
              <View style={styles.rowSpace}>
                <View style={styles.flexFill}>
                  <Text style={[styles.cardTitle, {color: theme.text}]}>{order.id}</Text>
                  <Text style={[styles.meta, {color: theme.textMuted}]}>
                    {order.date} | {order.items} items
                  </Text>
                </View>
                <Text style={[styles.smallCode, {color: ORDER_STATUS_COLORS[order.status]}]}>
                  {order.status}
                </Text>
              </View>
              <Text style={[styles.price, {color: theme.lime}]}>{formatPrice(order.total)}</Text>
            </Panel>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  screen: {flex: 1},
  flexFill: {flex: 1},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  consoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
  },
  consoleBrandRow: {flexDirection: 'row', alignItems: 'center'},
  consoleBrandMark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  consoleBrandPulse: {width: 5, height: 5, borderRadius: 3},
  consoleBrand: {fontSize: 11, fontWeight: '900', letterSpacing: 0.9},
  consoleHeaderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  consoleHeaderDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },
  consoleHeaderStatusLabel: {fontSize: 9, fontWeight: '900', letterSpacing: 1.1},
  brand: {fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6},
  headerTitle: {fontSize: 22, lineHeight: 29, fontWeight: '900', maxWidth: 280},
  shopHeaderTitle: {fontSize: 20, lineHeight: 25, fontWeight: '900', marginBottom: 4},
  shopHeaderBody: {fontSize: 12, lineHeight: 18, maxWidth: 240},
  shopHeaderAction: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  shopHeaderCartIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopHeaderCartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  shopHeaderCartBadgeText: {
    color: '#061018',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  cartBubble: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipLabel: {fontSize: 11, fontWeight: '900', letterSpacing: 1},
  scrollContent: {paddingHorizontal: 10, paddingBottom: 110},
  catalogFlatListContent: {paddingHorizontal: 10, paddingTop: 18, paddingBottom: 110},
  homeScrollContent: {paddingTop: 10},
  standardScrollContent: {paddingTop: 18},
  panel: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 5,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {fontSize: 20, lineHeight: 26, fontWeight: '900'},
  sectionAction: {fontSize: 11, fontWeight: '900', letterSpacing: 1.2},
  sectionKicker: {fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8},
  heroTitle: {fontSize: 24, lineHeight: 31, fontWeight: '900', marginBottom: 10},
  heroBody: {fontSize: 14, lineHeight: 20},
  metricsRow: {flexDirection: 'row', marginBottom: 18},
  metric: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginRight: 10,
  },
  metricValue: {fontSize: 20, fontWeight: '900', marginBottom: 6},
  metricLabel: {fontSize: 10, fontWeight: '800', letterSpacing: 1},
  rowScroll: {paddingBottom: 10},
  categoryCard: {width: 190, borderRadius: 24, borderWidth: 1, padding: 18, marginRight: 12},
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 10,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  railItem: {width: 292, marginRight: 12},
  homeRailCell: {width: 204, paddingRight: 12},
  gridWrap: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  gridCell: {width: '48.4%', paddingBottom: 12},
  rowSpace: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  smallCode: {fontSize: 11, fontWeight: '900', letterSpacing: 1.2},
  meta: {fontSize: 13, lineHeight: 18},
  cardTitle: {fontSize: 17, lineHeight: 22, fontWeight: '800', marginBottom: 6},
  price: {fontSize: 16, fontWeight: '900', marginBottom: 4},
  button: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {fontSize: 14, fontWeight: '900', letterSpacing: 0.6},
  buttonTextDark: {color: '#061018'},
  buttonOutline: {borderWidth: 1},
  spacer10: {height: 10},
  spacer12: {height: 12},
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  chipLabel: {fontSize: 12, fontWeight: '800', letterSpacing: 0.4},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  searchInput: {flex: 1, fontSize: 15, fontWeight: '700'},
  wrapRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginBottom: 4},
  highlightBanner: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 7,
  },
  highlightBannerHero: {
    minHeight: 260,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  highlightBannerHeroSurface: {backgroundColor: '#A8CBDA'},
  highlightBannerHeroBaseGlow: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  highlightBannerHeroLeftWash: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '54%',
    backgroundColor: 'rgba(94, 153, 175, 0.34)',
  },
  highlightBannerHeroWhiteBloom: {
    position: 'absolute',
    left: -54,
    bottom: -60,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  highlightBannerHeroCopy: {
    width: '56%',
    minHeight: 216,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  highlightBannerHeroEyebrow: {
    color: '#F4FCFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 10,
    textShadowColor: 'rgba(26, 59, 73, 0.24)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  highlightBannerHeroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    marginBottom: 12,
    textShadowColor: 'rgba(26, 59, 73, 0.26)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 6,
  },
  highlightBannerHeroBody: {
    color: '#F3FAFF',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 190,
    textShadowColor: 'rgba(26, 59, 73, 0.18)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  highlightBannerHeroFooter: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  highlightBannerHeroButton: {
    minWidth: 144,
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#487A12',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },
  highlightBannerHeroButtonAccent: {backgroundColor: '#73C316'},
  highlightBannerHeroButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  highlightBannerHeroSecondary: {
    marginTop: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  highlightBannerHeroSecondaryLabel: {
    color: '#F4FCFF',
    fontSize: 12,
    fontWeight: '800',
    textShadowColor: 'rgba(26, 59, 73, 0.24)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  highlightBannerHeroImage: {
    position: 'absolute',
    right: -86,
    bottom: -12,
    width: 336,
    height: 236,
  },
  highlightBannerHeroProductVisual: {
    position: 'absolute',
    right: -20,
    bottom: 6,
    width: 208,
    height: 202,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBannerHeroProductHalo: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  highlightBannerHeroProductImage: {
    width: 196,
    height: 176,
    shadowColor: 'rgba(21, 45, 58, 0.38)',
    shadowOffset: {width: 0, height: 18},
    shadowOpacity: 0.28,
    shadowRadius: 22,
  },
  highlightBannerHeroFallback: {
    position: 'absolute',
    right: -30,
    bottom: 0,
    width: 260,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBannerCopy: {marginBottom: 14},
  highlightBannerEyebrow: {fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8},
  highlightBannerTitle: {fontSize: 22, lineHeight: 28, fontWeight: '900', marginBottom: 8},
  highlightBannerBody: {fontSize: 13, lineHeight: 19, marginBottom: 14},
  highlightBannerFooter: {flexDirection: 'row', alignItems: 'center'},
  highlightBannerPrice: {fontSize: 20, lineHeight: 24, fontWeight: '900', marginBottom: 2},
  highlightBannerMeta: {fontSize: 11, lineHeight: 16},
  highlightBannerButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
  highlightBannerButtonLabel: {fontSize: 12, fontWeight: '900', letterSpacing: 0.5},
  highlightBannerSecondary: {marginTop: 10, alignSelf: 'flex-start'},
  highlightBannerSecondaryLabel: {fontSize: 11, fontWeight: '800'},
  highlightBannerArtwork: {
    height: 132,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  highlightBannerArtworkImage: {width: '100%', height: '100%'},
  heroCarouselWrap: {marginBottom: 8},
  heroCarouselTrack: {paddingBottom: 2},
  heroCarouselPage: {marginRight: 0},
  heroCarouselDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginBottom: 10,
  },
  heroCarouselDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginHorizontal: 4,
  },
  heroCarouselDotActive: {
    width: 22,
  },
  availabilityBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  availabilityBadgeLabel: {fontSize: 9, fontWeight: '800'},
  homeHeroCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 0,
    marginBottom: 10,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
    overflow: 'hidden',
  },
  homeHeroKicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  homeHeroTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 10,
    maxWidth: 200,
  },
  homeHeroBody: {fontSize: 11, lineHeight: 17, maxWidth: 220, marginBottom: 16},
  homeHeroActions: {flexDirection: 'row', marginBottom: 18},
  homePrimaryButton: {
    minWidth: 72,
    minHeight: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
  },
  homePrimaryButtonLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  homeSecondaryButton: {
    minWidth: 72,
    minHeight: 46,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  homeSecondaryButtonLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  homeHeroArtworkWrap: {marginHorizontal: -16, marginTop: 8},
  homeStatusCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 14,
  },
  homeMetricRow: {
    minHeight: 45,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeMetricLabel: {fontSize: 9, fontWeight: '900', letterSpacing: 1},
  homeMetricValueWrap: {flexDirection: 'row', alignItems: 'center'},
  homeMetricIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  homeMetricValue: {fontSize: 22, lineHeight: 26, fontWeight: '900'},
  homeStatusFooter: {
    marginTop: 12,
    minHeight: 34,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  homeStatusFooterMark: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  homeStatusFooterPulse: {width: 5, height: 5, borderRadius: 2.5},
  homeStatusFooterLabel: {fontSize: 8, fontWeight: '800', letterSpacing: 0.7},
  homeLabelRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  homeSectionLabel: {fontSize: 9, fontWeight: '900', letterSpacing: 1.3},
  homeSectionRule: {flex: 1, height: 1, marginLeft: 10},
  homeInventoryRow: {paddingBottom: 10},
  homeCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  homeCategoryCell: {width: '48.4%', paddingBottom: 12},
  homeInfiniteFooter: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  homeInfiniteFooterText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  storeCategoryRow: {paddingBottom: 10},
  inventoryTile: {
    width: 124,
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    marginRight: 10,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 9},
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  inventoryTileFullWidth: {width: '100%', minHeight: 104, marginRight: 0},
  inventoryTileIcon: {
    width: 32,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  inventoryTileCode: {fontSize: 10, fontWeight: '900', letterSpacing: 0.5},
  inventoryTileLabel: {fontSize: 13, fontWeight: '800', marginBottom: 2},
  inventoryTileSummary: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'left',
    paddingHorizontal: 0,
  },
  collectionRow: {paddingBottom: 8},
  collectionCard: {
    width: 230,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5,
  },
  collectionCardEyebrow: {fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8},
  collectionCardTitle: {fontSize: 18, lineHeight: 23, fontWeight: '900', marginBottom: 8},
  collectionCardBody: {fontSize: 12, lineHeight: 18, marginBottom: 16},
  collectionCardAction: {fontSize: 11, fontWeight: '800'},
  homeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  homeSectionTitle: {fontSize: 22, lineHeight: 27, fontWeight: '900'},
  homeSectionDescription: {fontSize: 11, lineHeight: 16, marginTop: 2, maxWidth: 170},
  homeSectionAction: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 3,
    marginLeft: 10,
    textAlign: 'right',
  },
  homeFeatureCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  homeFeatureArtworkFrame: {
    height: 170,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  homeAvailabilityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  homeAvailabilityBadgeLabel: {fontSize: 7, fontWeight: '900', letterSpacing: 0.8},
  homeFeatureMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  homeFeatureMicro: {fontSize: 8, fontWeight: '800', letterSpacing: 0.8},
  homeFeatureTitle: {fontSize: 14, lineHeight: 19, fontWeight: '800', marginBottom: 8},
  homeFeatureInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  homeFeatureInfoText: {fontSize: 8, fontWeight: '800', letterSpacing: 0.5},
  homeFeatureSpecRow: {flexDirection: 'row', marginBottom: 12},
  homeFeatureSpecPill: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginRight: 6,
  },
  homeFeatureSpecLabel: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  homeFeatureSpecValue: {fontSize: 10, fontWeight: '800', lineHeight: 13},
  homeFeatureFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  homeFeaturePrice: {fontSize: 22, lineHeight: 26, fontWeight: '900'},
  homeFeatureCartButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeFeatureCartLabel: {fontSize: 22, lineHeight: 22, fontWeight: '900', color: '#061018'},
  homeCompactStack: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 18,
  },
  compactStackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compactStackThumb: {
    width: 50,
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 10,
  },
  compactStackTitle: {fontSize: 12, lineHeight: 16, fontWeight: '800', marginBottom: 4},
  compactStackMeta: {fontSize: 8, fontWeight: '800', letterSpacing: 0.5},
  compactStackPriceWrap: {marginLeft: 10, alignItems: 'flex-end'},
  compactStackPrice: {fontSize: 12, fontWeight: '900', marginBottom: 4},
  labArtworkShell: {
    width: '100%',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labArtworkImage: {width: '100%', height: '100%'},
  labArtworkImagePadRegular: {padding: 6},
  labArtworkImagePadCompact: {padding: 2},
  labArtworkHero: {height: 156, borderRadius: 0},
  labArtworkCard: {height: 170, borderRadius: 4},
  labArtworkCompact: {height: 42, borderRadius: 5},
  labArtworkGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    top: -12,
    left: -10,
  },
  labArtworkLine: {position: 'absolute', left: 0, right: 0, height: 1},
  labArtworkLineTop: {top: '34%'},
  labArtworkLineBottom: {bottom: '16%'},
  labBoard: {
    position: 'absolute',
    borderRadius: 14,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 4,
  },
  labBoardHero: {
    width: 184,
    height: 88,
    bottom: 14,
    transform: [{rotate: '-5deg'}],
  },
  labBoardCard: {width: 124, height: 92, transform: [{rotate: '-8deg'}]},
  labBoardCompact: {width: 38, height: 26, transform: [{rotate: '-8deg'}]},
  labPort: {position: 'absolute', width: 10, height: 10, borderRadius: 2},
  labPortLeftTop: {left: 10, top: 12},
  labPortLeftBottom: {left: 10, bottom: 12},
  labPortWide: {position: 'absolute', width: 26, height: 10, borderRadius: 2},
  labPortWideRight: {right: 10, top: 16},
  labTraceHorizontal: {position: 'absolute', left: 0, right: 0, height: 1},
  labTraceHorizontalTop: {top: '26%'},
  labTraceHorizontalBottom: {bottom: '22%'},
  labTraceVertical: {position: 'absolute', top: 0, bottom: 0, width: 1},
  labTraceVerticalLeft: {left: '27%'},
  labTraceVerticalRight: {right: '24%'},
  labChip: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{translateX: -18}, {translateY: -18}],
  },
  labChipRegular: {width: 36, height: 36, borderRadius: 8},
  labChipCompact: {
    width: 12,
    height: 12,
    borderRadius: 3,
    transform: [{translateX: -6}, {translateY: -6}],
  },
  labChipCode: {fontSize: 9, fontWeight: '900', letterSpacing: 0.8, color: '#101417'},
  labDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
  },
  tabItem: {flex: 1, alignItems: 'center'},
  tabGlyph: {
    width: 42,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabCartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  tabCartBadgeText: {
    color: '#061018',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  tabSavedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  tabSavedBadgeText: {
    color: '#061018',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  tabGlyphIdle: {borderColor: 'transparent', backgroundColor: 'transparent'},
  tabIconFrame: {width: 20, height: 18, alignItems: 'center', justifyContent: 'center'},
  tabHomeGrid: {
    width: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabHomeCell: {width: 5, height: 5, borderRadius: 1, marginBottom: 2},
  tabCatalogStack: {width: 14},
  tabCatalogLine: {height: 2, borderRadius: 1, marginBottom: 3},
  tabSavedBody: {
    width: 12,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  tabSavedNotch: {width: 5, height: 4, marginBottom: -1},
  tabCartWrap: {alignItems: 'center'},
  tabCartHandle: {
    width: 9,
    height: 4,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  tabCartBody: {
    width: 14,
    height: 9,
    borderWidth: 1.5,
    borderRadius: 2,
    marginTop: -1,
  },
  tabProfileWrap: {alignItems: 'center'},
  tabProfileHead: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderRadius: 4,
    marginBottom: 1,
  },
  tabProfileBody: {
    width: 14,
    height: 8,
    borderWidth: 1.5,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tabGlyphLabel: {fontSize: 11, fontWeight: '900', letterSpacing: 1.2},
  tabText: {fontSize: 10, fontWeight: '800'},
  catalogToolbar: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  catalogSearchBox: {flex: 1, marginRight: 8},
  catalogSearchIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  catalogSearchActions: {flexDirection: 'row', alignItems: 'center', marginLeft: 8},
  catalogSearchActionButton: {
    minHeight: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  catalogSearchActionButtonAccent: {
    minWidth: 58,
  },
  catalogSearchActionButtonIconOnly: {
    width: 38,
    minWidth: 38,
    paddingHorizontal: 0,
  },
  catalogSearchActionLabel: {fontSize: 11, fontWeight: '900', letterSpacing: 0.4},
  catalogFilterButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  catalogSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  catalogSectionTitle: {fontSize: 13, fontWeight: '900', letterSpacing: 0.6},
  catalogInlineAction: {fontSize: 11, fontWeight: '800'},
  catalogHintText: {fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 4},
  catalogImageSearchCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  catalogImageSearchThumb: {
    width: 92,
    height: 92,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#12212D',
  },
  catalogImageSearchContent: {
    flex: 1,
  },
  catalogImageSearchEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  catalogImageSearchTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  catalogImageSearchBody: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  catalogImageSearchMeta: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  catalogImageSearchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  catalogImageSearchButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  catalogImageSearchButtonGhost: {
    borderWidth: 1,
  },
  catalogImageSearchButtonLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  catalogSummary: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  catalogSummaryTitle: {fontSize: 18, lineHeight: 23, fontWeight: '900', marginBottom: 4},
  catalogSummaryText: {fontSize: 12, lineHeight: 18},
  catalogResultsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catalogResultsMeta: {flex: 1, paddingRight: 10},
  catalogViewToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  catalogViewToggleButton: {
    minWidth: 58,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  catalogViewToggleLabel: {fontSize: 11, fontWeight: '900', letterSpacing: 0.5},
  catalogStateCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 26,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  catalogStateTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  catalogStateBody: {fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280},
  catalogStateButton: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  catalogList: {paddingBottom: 6},
  catalogGridColumn: {justifyContent: 'space-between'},
  catalogGridFlatCell: {width: '48.4%', height: CATALOG_GRID_ROW_HEIGHT},
  catalogListFlatCell: {height: CATALOG_LIST_ROW_HEIGHT},
  catalogListCard: {
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  catalogListMedia: {
    width: 112,
    height: 112,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  catalogListContent: {flex: 1, minHeight: 112, justifyContent: 'space-between'},
  catalogListTitle: {fontSize: 16, lineHeight: 20, fontWeight: '800', marginTop: 6},
  catalogListBody: {fontSize: 12, lineHeight: 17, marginTop: 6},
  catalogInfiniteFooter: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  catalogInfiniteFooterText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  catalogCardRow: {flexDirection: 'row', alignItems: 'stretch'},
  catalogCardMedia: {
    width: '100%',
    height: 148,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  catalogCardTopRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  catalogCardBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  catalogCardBadgeText: {fontSize: 9, fontWeight: '900', letterSpacing: 0.8},
  catalogCardDiscountBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  catalogCardDiscountText: {fontSize: 10, fontWeight: '900'},
  catalogCardContent: {minHeight: 126, justifyContent: 'space-between'},
  catalogCardVendor: {fontSize: 10, fontWeight: '900', letterSpacing: 0.8},
  catalogQuickViewButton: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  catalogQuickViewButtonList: {marginTop: 8, marginBottom: 2},
  catalogQuickViewLabel: {fontSize: 11, fontWeight: '900', letterSpacing: 0.4},
  catalogFavoriteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  catalogCardTitle: {fontSize: 16, lineHeight: 20, fontWeight: '800', marginTop: 6, minHeight: 40},
  catalogCardRatingRow: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  catalogCardStars: {fontSize: 10, letterSpacing: 0.5},
  catalogCardRatingText: {fontSize: 10, fontWeight: '700', marginLeft: 6, flex: 1},
  catalogCardBody: {fontSize: 12, lineHeight: 18, marginTop: 6},
  catalogCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  catalogCardLead: {fontSize: 9, fontWeight: '700', marginLeft: 8, flex: 1, textAlign: 'right'},
  catalogCardFooter: {flexDirection: 'row', alignItems: 'flex-end', marginTop: 12},
  catalogCardPrice: {fontSize: 17, lineHeight: 21, fontWeight: '900'},
  catalogCardPreviousPrice: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
    textDecorationLine: 'line-through',
  },
  catalogCardButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  catalogCardButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogCardButtonLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginLeft: 6,
  },
  profileRow: {flexDirection: 'row', alignItems: 'center'},
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: '#41D7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLabel: {color: '#05111A', fontSize: 26, fontWeight: '900', letterSpacing: 2},
  preference: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(125, 150, 170, 0.22)',
  },
  prefTitle: {fontSize: 15, fontWeight: '800', marginBottom: 5},
  prefBody: {fontSize: 13, lineHeight: 18},
  cartRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 14},
  cartTitle: {flex: 1, fontSize: 17, lineHeight: 22, fontWeight: '800', marginRight: 10},
  cartRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cartRemoveButtonLabel: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
    marginTop: -1,
  },
  cartVariantInfo: {fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 6},
  cartPriceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cartLineTotalWrap: {alignItems: 'flex-end', marginLeft: 12},
  cartLineTotalLabel: {fontSize: 11, fontWeight: '800', marginBottom: 2},
  cartPromoRow: {flexDirection: 'row', alignItems: 'center'},
  cartPromoInput: {flex: 1, minHeight: 54, marginRight: 10},
  cartPromoButton: {
    minWidth: 92,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  cartAppliedPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  shippingOptionCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  shippingOptionTopRow: {flexDirection: 'row', alignItems: 'center'},
  shippingOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shippingOptionRadioFill: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  cartOptionTitle: {fontSize: 14, fontWeight: '800', marginBottom: 4},
  cartOptionPrice: {fontSize: 13, fontWeight: '900', marginLeft: 10},
  cartSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cartSummaryTotalLabel: {fontSize: 15, fontWeight: '900'},
  cartSummaryTotalValue: {fontSize: 20, fontWeight: '900'},
  checkoutStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 18,
  },
  checkoutStepItem: {flex: 1, alignItems: 'center'},
  checkoutStepMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkoutStepMarkerLabel: {fontSize: 13, fontWeight: '900'},
  checkoutStepLabel: {fontSize: 11, fontWeight: '800', textAlign: 'center'},
  formErrorText: {fontSize: 11, fontWeight: '700', marginTop: 6},
  checkoutOptionCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  checkoutReviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(125, 150, 170, 0.22)',
  },
  checkoutActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutSecondaryAction: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
  },
  checkoutPrimaryAction: {
    flex: 1.25,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepperStart: {alignSelf: 'flex-start'},
  stepperBtn: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center'},
  stepperValue: {minWidth: 38, textAlign: 'center', fontSize: 15, fontWeight: '800'},
  overlay: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 28,
  },
  sheetContent: {paddingBottom: 28},
  filterBlock: {marginTop: 18},
  filterBlockTitle: {fontSize: 14, fontWeight: '900', marginBottom: 12},
  filterCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  filterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  filterCheckboxMark: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  filterCheckboxLabel: {fontSize: 13, fontWeight: '800', marginBottom: 4},
  filterCheckboxDescription: {fontSize: 11, lineHeight: 16},
  priceRangeCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  priceRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceRangePill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceRangePillLabel: {fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4},
  priceRangePillValue: {fontSize: 13, fontWeight: '900'},
  priceRangeTrackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  priceRangeStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  priceRangeRail: {
    position: 'absolute',
    top: 7,
    left: '50%',
    right: '-50%',
    height: 2,
  },
  priceRangeDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  priceRangeDotCore: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  priceRangeMarkLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 8,
  },
  field: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '700',
    textAlignVertical: 'top',
  },
  fieldMultiline: {height: 96},
  specRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(125, 150, 170, 0.22)',
  },
  summaryDivider: {height: 1, backgroundColor: 'rgba(125, 150, 170, 0.24)', marginVertical: 14},
  glowLarge: {position: 'absolute', top: -72, right: -72, width: 220, height: 220, borderRadius: 110},
  glowSmall: {position: 'absolute', bottom: 140, left: -44, width: 150, height: 150, borderRadius: 75},
});

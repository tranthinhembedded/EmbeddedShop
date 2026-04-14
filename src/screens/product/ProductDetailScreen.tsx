import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {PRODUCT_INDEX, PRODUCTS, Product} from '../../catalog';
import {AppIcon} from '../../components/AppIcon';
import ErrorState from '../../components/common/ErrorState';
import {HardwareGlyph} from '../../components/HardwareGlyph';
import type {RootStackParamList} from '../../navigation/types';
import {getProductImageSource} from '../../productImages';
import {useShopApp} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

type ProductReview = {
  id: string;
  author: string;
  date: string;
  rating: number;
  body: string;
};

const BUNDLE_OPTIONS: Record<Product['category'], string[]> = {
  sbc: ['Core', 'Dev', 'Lab', 'AI'],
  fpga: ['Logic', 'Control', 'Lab', 'Signal'],
  robotics: ['Base', 'Control', 'Field', 'Pro'],
  sensors: ['Core', 'ROS', 'Field', 'Vision'],
  power: ['Base', 'CAN', '24V', 'Rack'],
  connectivity: ['Edge', 'Bus', 'Field', 'Cell'],
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

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const getRatingStars = (rating: number) => {
  const filled = Math.max(1, Math.min(5, Math.round(rating)));
  const fullStar = String.fromCharCode(9733);
  const emptyStar = String.fromCharCode(9734);
  return `${fullStar.repeat(filled)}${emptyStar.repeat(5 - filled)}`;
};

const getMonogram = (product: Product) => {
  const source = `${product.code}${product.vendor}`.replace(/[^a-z0-9]/gi, '');
  return source.slice(0, 2).toUpperCase() || 'ES';
};

const getUseCaseOptions = (product: Product) => {
  const options = [...product.applications, ...product.compatibility, ...product.tags];
  return Array.from(new Set(options)).slice(0, 3);
};

const getReviewSamples = (product: Product): ProductReview[] => {
  const primaryApplication = product.applications[0]?.toLowerCase() ?? 'embedded lab';
  const primaryCompatibility = product.compatibility[0] ?? 'existing toolchains';
  const primaryHighlight = product.highlight.toLowerCase();

  return [
    {
      id: `${product.id}-review-1`,
      author: 'Alex D.',
      date: 'Oct 12, 2023',
      rating: 5,
      body: `Super stable in our ${primaryApplication} workflow. Setup was quick and the bring-up guide felt production ready.`,
    },
    {
      id: `${product.id}-review-2`,
      author: 'Sarah W.',
      date: 'Sep 28, 2023',
      rating: 4,
      body: `Really strong value for the price. Shipping took a bit longer than expected, but the hardware arrived in perfect shape.`,
    },
    {
      id: `${product.id}-review-3`,
      author: 'Minh T.',
      date: 'Aug 02, 2023',
      rating: 5,
      body: `We integrated it with ${primaryCompatibility} on day one. Performance and documentation both exceeded expectations.`,
    },
    {
      id: `${product.id}-review-4`,
      author: 'Chris L.',
      date: 'Jul 11, 2023',
      rating: 4,
      body: `Excellent hardware finish and a dependable ${primaryHighlight}. I would buy it again for the next bench refresh.`,
    },
  ];
};

const getRelatedProducts = (product: Product) => {
  const sameCategory = PRODUCTS.filter(
    item => item.category === product.category && item.id !== product.id,
  );
  const fallback = PRODUCTS.filter(
    item => item.category !== product.category && item.id !== product.id,
  );
  return [...sameCategory, ...fallback].slice(0, 4);
};

export default function ProductDetailScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {dark, favorites, toggleFavorite, addToCart} = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const product = PRODUCT_INDEX[route.params.productId];

  const [quantity, setQuantity] = useState(1);
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(1);
  const [selectedUseCaseIndex, setSelectedUseCaseIndex] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const ctaScale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTranslateY = useRef(new Animated.Value(12)).current;
  const bubbleScale = useRef(new Animated.Value(0.72)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.84)).current;

  useEffect(() => {
    if (!justAdded) {
      return;
    }

    const timeout = setTimeout(() => setJustAdded(false), 1400);
    return () => clearTimeout(timeout);
  }, [justAdded]);

  const isFavorite = product ? favorites.includes(product.id) : false;
  const bundleOptions = useMemo(
    () => (product ? BUNDLE_OPTIONS[product.category] : []),
    [product],
  );
  const useCaseOptions = useMemo(
    () => (product ? getUseCaseOptions(product) : []),
    [product],
  );
  const reviews = useMemo(() => (product ? getReviewSamples(product) : []), [product]);
  const visibleReviews = expandedReviews ? reviews : reviews.slice(0, 2);
  const relatedProducts = useMemo(
    () => (product ? getRelatedProducts(product) : []),
    [product],
  );
  const totalPrice = product ? product.price * quantity : 0;

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
        <ErrorState
          title="Product not found"
          description="We could not load this hardware module. Please go back and try another item."
          actionLabel="Go back"
          onRetry={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const imageSource = getProductImageSource(product.id);
  const selectedBundle = bundleOptions[selectedBundleIndex] ?? bundleOptions[0] ?? 'Core';
  const selectedUseCase = useCaseOptions[selectedUseCaseIndex] ?? useCaseOptions[0] ?? 'Bench';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} | ${product.highlight} | ${formatPrice(product.price)}`,
      });
    } catch {
      return;
    }
  };

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
    setJustAdded(true);

    ctaScale.setValue(1);
    bubbleOpacity.setValue(0);
    bubbleTranslateY.setValue(12);
    bubbleScale.setValue(0.72);
    ringOpacity.setValue(0);
    ringScale.setValue(0.84);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(ctaScale, {
          toValue: 0.97,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(ctaScale, {
          toValue: 1.04,
          speed: 18,
          bounciness: 12,
          useNativeDriver: true,
        }),
        Animated.spring(ctaScale, {
          toValue: 1,
          speed: 18,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bubbleOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScale, {
            toValue: 1,
            speed: 18,
            bounciness: 12,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleTranslateY, {
            toValue: -34,
            duration: 460,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bubbleOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleScale, {
            toValue: 0.92,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.timing(ringOpacity, {
          toValue: 0.38,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 1.18,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  };

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />
      <View style={styles.container}>
        <View
          style={[
            styles.floatingToolbarWrap,
            {backgroundColor: alpha(theme.bg, dark ? 0.84 : 0.72)},
          ]}>
          <View
            style={[
              styles.toolbar,
              styles.toolbarFloating,
              {
                backgroundColor: alpha(theme.surface, 0.94),
                borderColor: alpha(theme.border, 0.9),
              },
            ]}>
            <View style={styles.toolbarLeft}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.92),
                    borderColor: alpha(theme.border, 0.88),
                  },
                ]}>
                <Text style={[styles.backButtonLabel, {color: theme.text}]}>
                  {'<'}
                </Text>
              </Pressable>

              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.92),
                    borderColor: alpha(theme.border, 0.88),
                  },
                ]}>
                <Text style={[styles.heroBadgeLabel, {color: theme.text}]}>
                  {getMonogram(product)}
                </Text>
              </View>
            </View>

            <View style={styles.toolbarActions}>
              <Pressable
                onPress={handleShare}
                style={[
                  styles.toolbarAction,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.92),
                    borderColor: alpha(theme.border, 0.88),
                  },
                ]}>
                <AppIcon name="share" size={18} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => toggleFavorite(product.id)}
                style={[
                  styles.toolbarAction,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.92),
                    borderColor: alpha(theme.border, 0.88),
                  },
                ]}>
                <AppIcon
                  name="saved"
                  size={18}
                  color={isFavorite ? theme.lime : theme.text}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.heroShell,
              {
                backgroundColor: theme.surface,
                borderColor: alpha(theme.border, 0.9),
              },
            ]}>
            <View style={[styles.heroStage, {backgroundColor: product.panel}]}>
              <View
                style={[
                  styles.heroGlowLarge,
                  {backgroundColor: alpha(product.accent, dark ? 0.28 : 0.18)},
                ]}
              />
              <View
                style={[
                  styles.heroGlowSmall,
                  {backgroundColor: alpha(theme.accent, dark ? 0.16 : 0.1)},
                ]}
              />
              <View
                style={[
                  styles.heroGlowBottom,
                  {backgroundColor: alpha(theme.text, dark ? 0.08 : 0.2)},
                ]}
              />
              <View
                style={[
                  styles.heroShadow,
                  {backgroundColor: alpha(theme.bg, dark ? 0.36 : 0.14)},
                ]}
              />
              {imageSource ? (
                <Image
                  source={imageSource}
                  resizeMode="contain"
                  style={styles.heroImage}
                />
              ) : (
                <HardwareGlyph product={product} theme={theme} size={286} />
              )}
            </View>

            <View style={styles.heroCopy}>
              <View style={styles.headlineRow}>
                <View style={styles.headlineCopy}>
                  <Text style={[styles.vendorLabel, {color: alpha(theme.lime, 0.88)}]}>
                    {product.vendor.toUpperCase()}
                  </Text>
                  <Text style={[styles.productTitle, {color: theme.text}]}>
                    {product.name}
                  </Text>
                </View>

                <View style={styles.priceColumn}>
                  <Text style={[styles.currentPrice, {color: theme.text}]}>
                    {formatPrice(product.price)}
                  </Text>
                  {product.previousPrice ? (
                    <Text style={[styles.previousPrice, {color: theme.textMuted}]}>
                      {formatPrice(product.previousPrice)}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.ratingRow}>
                <Text style={[styles.ratingStars, {color: theme.amber}]}>
                  {getRatingStars(product.rating)}
                </Text>
                <Text style={[styles.ratingMeta, {color: theme.textMuted}]}>
                  {product.rating.toFixed(1)} ({product.reviews} reviews)
                </Text>
              </View>

              <View style={styles.tagRow}>
                {product.tags.slice(0, 3).map(tag => (
                  <View
                    key={tag}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: alpha(theme.accent, 0.12),
                        borderColor: alpha(theme.accent, 0.26),
                      },
                    ]}>
                    <Text style={[styles.tagChipLabel, {color: theme.accent}]}>#{tag}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.overview, {color: theme.textMuted}]}>
                {product.overview}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.sectionPanel,
              {
                backgroundColor: alpha(theme.panel, 0.96),
                borderColor: alpha(theme.border, 0.9),
              },
            ]}>
            <Text style={[styles.sectionTitle, {color: theme.text}]}>Specifications</Text>
            {product.specs.slice(0, 4).map((spec, index, array) => (
              <View key={spec.label}>
                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, {color: theme.textMuted}]}>
                    {spec.label}
                  </Text>
                  <Text style={[styles.specValue, {color: theme.text}]}>{spec.value}</Text>
                </View>
                {index < array.length - 1 ? (
                  <View
                    style={[
                      styles.divider,
                      {backgroundColor: alpha(theme.border, 0.72)},
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, {color: theme.text}]}>Select Bundle</Text>
          <View style={styles.bundleRow}>
            {bundleOptions.map((option, index) => {
              const selected = index === selectedBundleIndex;
              return (
                <Pressable
                  key={option}
                  onPress={() => setSelectedBundleIndex(index)}
                  style={[
                    styles.bundleChip,
                    {
                      backgroundColor: selected
                        ? alpha(theme.text, 0.96)
                        : alpha(theme.panelAlt, 0.9),
                      borderColor: selected
                        ? alpha(theme.text, 0.96)
                        : alpha(theme.border, 0.9),
                    },
                  ]}>
                  <Text
                    style={[
                      styles.bundleChipLabel,
                      {color: selected ? theme.bg : theme.text},
                    ]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.optionMatrix}>
            <View
              style={[
                styles.optionPanel,
                {
                  backgroundColor: alpha(theme.panel, 0.86),
                  borderColor: alpha(theme.border, 0.88),
                },
              ]}>
              <Text style={[styles.optionTitle, {color: theme.text}]}>Bench Focus</Text>
              <View style={styles.useCaseRow}>
                {useCaseOptions.map((option, index) => {
                  const selected = index === selectedUseCaseIndex;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setSelectedUseCaseIndex(index)}
                      style={[
                        styles.useCaseChip,
                        {
                          backgroundColor: selected
                            ? alpha(theme.text, 0.96)
                            : alpha(theme.panelAlt, 0.9),
                          borderColor: selected
                            ? alpha(theme.text, 0.96)
                            : alpha(theme.border, 0.9),
                        },
                      ]}>
                      <Text
                        style={[
                          styles.useCaseChipLabel,
                          {color: selected ? theme.bg : theme.text},
                        ]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.optionHelperText, {color: theme.textMuted}]}>
                Optimized for {selectedUseCase.toLowerCase()} deployments.
              </Text>
            </View>

            <View
              style={[
                styles.optionPanel,
                styles.quantityPanel,
                {
                  backgroundColor: alpha(theme.panel, 0.86),
                  borderColor: alpha(theme.border, 0.88),
                },
              ]}>
              <Text style={[styles.optionTitle, {color: theme.text}]}>Quantity</Text>
              <View
                style={[
                  styles.quantityWrap,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.96),
                    borderColor: alpha(theme.border, 0.88),
                  },
                ]}>
                <Pressable
                  onPress={() => setQuantity(previous => Math.max(1, previous - 1))}
                  style={[
                    styles.quantityButton,
                    {backgroundColor: alpha(theme.bg, dark ? 0.22 : 0.06)},
                  ]}>
                  <Text style={[styles.quantityButtonLabel, {color: theme.text}]}>-</Text>
                </Pressable>
                <Text style={[styles.quantityValue, {color: theme.text}]}>{quantity}</Text>
                <Pressable
                  onPress={() => setQuantity(previous => previous + 1)}
                  style={[
                    styles.quantityButton,
                    {backgroundColor: alpha(theme.bg, dark ? 0.22 : 0.06)},
                  ]}>
                  <Text style={[styles.quantityButtonLabel, {color: theme.text}]}>+</Text>
                </Pressable>
              </View>
              <Text style={[styles.optionHelperText, {color: theme.textMuted}]}>
                Bundle: {selectedBundle}
              </Text>
            </View>
          </View>

          <View
            style={[styles.sectionDivider, {backgroundColor: alpha(theme.border, 0.72)}]}
          />

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.inlineTitle, {color: theme.text}]}>
              Reviews ({product.reviews})
            </Text>
            <Pressable onPress={() => setExpandedReviews(true)}>
              <Text style={[styles.sectionLink, {color: alpha(theme.lime, 0.92)}]}>
                See All
              </Text>
            </Pressable>
          </View>

          {visibleReviews.map(review => (
            <View
              key={review.id}
              style={[
                styles.reviewCard,
                {
                  backgroundColor: alpha(theme.panel, 0.92),
                  borderColor: alpha(theme.border, 0.88),
                },
              ]}>
              <View style={styles.reviewHeader}>
                <View
                  style={[
                    styles.reviewAvatar,
                    {backgroundColor: alpha(product.accent, 0.24)},
                  ]}>
                  <Text style={[styles.reviewAvatarLabel, {color: theme.text}]}>
                    {review.author.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reviewCopy}>
                  <Text style={[styles.reviewAuthor, {color: theme.text}]}>
                    {review.author}
                  </Text>
                  <Text style={[styles.reviewDate, {color: theme.textMuted}]}>
                    {review.date}
                  </Text>
                </View>
                <Text style={[styles.reviewStars, {color: theme.amber}]}>
                  {getRatingStars(review.rating)}
                </Text>
              </View>
              <Text style={[styles.reviewBody, {color: theme.textMuted}]}>
                {review.body}
              </Text>
            </View>
          ))}

          {!expandedReviews ? (
            <Pressable
              onPress={() => setExpandedReviews(true)}
              style={[
                styles.secondaryButton,
                {borderColor: alpha(theme.border, 0.82)},
              ]}>
              <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
                Load More Reviews
              </Text>
            </Pressable>
          ) : null}

          <View
            style={[styles.sectionDivider, {backgroundColor: alpha(theme.border, 0.72)}]}
          />

          <Text style={[styles.sectionTitle, {color: theme.text}]}>You Might Also Like</Text>
          <ScrollView
            horizontal
            contentContainerStyle={styles.relatedRow}
            showsHorizontalScrollIndicator={false}>
            {relatedProducts.map(item => {
              const relatedImageSource = getProductImageSource(item.id);

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    navigation.push('ProductDetail', {
                      productId: item.id,
                      tab: route.params.tab,
                    })
                  }
                  style={[
                    styles.relatedCard,
                    {
                      backgroundColor: alpha(theme.panel, 0.9),
                      borderColor: alpha(theme.border, 0.88),
                    },
                  ]}>
                  <View
                    style={[
                      styles.relatedMediaWrap,
                      {backgroundColor: alpha(item.panel, dark ? 0.86 : 0.72)},
                    ]}>
                    {relatedImageSource ? (
                      <Image
                        source={relatedImageSource}
                        resizeMode="contain"
                        style={styles.relatedMedia}
                      />
                    ) : (
                      <HardwareGlyph product={item} theme={theme} size={108} />
                    )}
                  </View>
                  <Text style={[styles.relatedVendor, {color: theme.textMuted}]}>
                    {item.vendor}
                  </Text>
                  <Text numberOfLines={2} style={[styles.relatedName, {color: theme.text}]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.relatedPrice, {color: alpha(theme.lime, 0.92)}]}>
                    {formatPrice(item.price)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </ScrollView>

        <View
          style={[
            styles.stickyBar,
            {
              backgroundColor: alpha(theme.surface, dark ? 0.98 : 0.96),
              borderTopColor: alpha(theme.border, 0.88),
            },
          ]}>
          <View style={styles.stickyCopy}>
            <Text style={[styles.stickyLabel, {color: theme.textMuted}]}>Total Price</Text>
            <Text style={[styles.stickyValue, {color: theme.text}]}>
              {formatPrice(totalPrice)}
            </Text>
          </View>

          <View style={styles.primaryButtonWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ctaRing,
                {
                  borderColor: alpha(theme.text, 0.22),
                  opacity: ringOpacity,
                  transform: [{scale: ringScale}],
                },
              ]}
            />

            <Animated.View
              pointerEvents="none"
              style={[
                styles.cartBurst,
                {
                  backgroundColor: alpha(theme.accent, 0.96),
                  opacity: bubbleOpacity,
                  transform: [
                    {translateY: bubbleTranslateY},
                    {scale: bubbleScale},
                  ],
                },
              ]}>
              <AppIcon name="addCart" size={15} color={theme.bg} />
              <Text style={[styles.cartBurstLabel, {color: theme.bg}]}>+{quantity}</Text>
            </Animated.View>

            <Animated.View style={{transform: [{scale: ctaScale}]}}>
              <Pressable
                onPress={handleAddToCart}
                style={[
                  styles.primaryButton,
                  {backgroundColor: alpha(theme.text, 0.96)},
                ]}>
                <Text style={[styles.primaryButtonLabel, {color: theme.bg}]}>
                  {justAdded ? 'Added to Cart' : 'Add to Cart'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 94,
    paddingBottom: 140,
  },
  floatingToolbarWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  heroShell: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  toolbarFloating: {
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonLabel: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: -2,
  },
  heroBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeLabel: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStage: {
    height: 348,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: 22,
    right: -28,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    left: -34,
    top: 32,
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -66,
    left: '18%',
  },
  heroShadow: {
    position: 'absolute',
    width: 248,
    height: 34,
    borderRadius: 17,
    bottom: 34,
    left: '50%',
    marginLeft: -124,
  },
  heroImage: {
    width: '88%',
    height: '88%',
  },
  heroCopy: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headlineCopy: {
    flex: 1,
  },
  vendorLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '900',
  },
  priceColumn: {
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '900',
  },
  previousPrice: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  ratingStars: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  ratingMeta: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  overview: {
    fontSize: 15,
    lineHeight: 27,
    marginTop: 18,
  },
  sectionPanel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 12,
  },
  inlineTitle: {
    marginTop: 0,
    marginBottom: 0,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 11,
  },
  specLabel: {
    fontSize: 15,
    lineHeight: 22,
  },
  specValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  divider: {
    height: 1,
  },
  bundleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bundleChip: {
    minWidth: 70,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundleChipLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  optionMatrix: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 18,
  },
  optionPanel: {
    flex: 1.45,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  quantityPanel: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 14,
  },
  useCaseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  useCaseChip: {
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useCaseChipLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionHelperText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  quantityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 24,
    padding: 6,
  },
  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonLabel: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  sectionDivider: {
    height: 1,
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
  },
  sectionLink: {
    fontSize: 15,
    fontWeight: '800',
  },
  reviewCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarLabel: {
    fontSize: 14,
    fontWeight: '900',
  },
  reviewCopy: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 17,
    fontWeight: '800',
  },
  reviewDate: {
    fontSize: 13,
    marginTop: 4,
  },
  reviewStars: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  reviewBody: {
    fontSize: 15,
    lineHeight: 28,
    marginTop: 14,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  relatedRow: {
    gap: 14,
    paddingBottom: 6,
  },
  relatedCard: {
    width: 164,
    borderRadius: 22,
    borderWidth: 1,
    padding: 10,
  },
  relatedMediaWrap: {
    height: 132,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedMedia: {
    width: '100%',
    height: '100%',
  },
  relatedVendor: {
    fontSize: 13,
    marginTop: 12,
  },
  relatedName: {
    minHeight: 44,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  relatedPrice: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  stickyCopy: {
    minWidth: 96,
  },
  stickyLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  stickyValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonWrap: {
    flex: 1,
    position: 'relative',
  },
  ctaRing: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 29,
    borderWidth: 1,
  },
  cartBurst: {
    position: 'absolute',
    top: -18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 2,
  },
  cartBurstLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButtonLabel: {
    fontSize: 18,
    fontWeight: '900',
  },
});

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Controller, useFieldArray, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {CATEGORIES} from '../../catalog';
import {AppIcon} from '../../components/AppIcon';
import {
  Badge,
  Button,
  Card,
  Container,
  Input,
  Stack,
  Text,
} from '../../design-system';
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductQuery,
  useProductsQuery,
  useUpdateProductMutation,
} from '../../hooks/useProductManagement';
import type {RootStackParamList} from '../../navigation/types';
import {
  PRODUCT_IMAGE_LIBRARY,
  PRODUCT_TAG_OPTIONS,
} from '../../services/productManagementApi';
import {getApiErrorMessage} from '../../services/httpClient';
import {useAuthStore} from '../../store/authStore';
import {useProductManagementStore} from '../../store/productManagementStore';
import type {ManagedProduct, ManagedProductImage} from '../../types/productManagement';
import {
  productSchema,
  type ProductFormValues,
} from '../../validation/productSchemas';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductManager'>;

const EMPTY_PRODUCT_FORM: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  price: 0,
  category: 'sbc',
  tags: ['ROS2'],
  images: [],
  stockQuantity: 0,
};

function ProductChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      className={`rounded-full border px-4 py-2 ${
        selected
          ? 'border-primary bg-primary-soft'
          : 'border-border bg-surface'
      }`}
      onPress={onPress}>
      <Text
        variant="caption"
        weight="semibold"
        className={selected ? 'text-primary' : 'text-foreground'}>
        {label}
      </Text>
    </Pressable>
  );
}

function SortableImageCard({
  image,
  index,
  total,
  onMove,
  onRemove,
}: {
  image: ManagedProductImage;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}): React.JSX.Element {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > 6,
        onPanResponderMove: Animated.event([null, {dx: translateX}], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dx > 60 && index < total - 1) {
            onMove(index, index + 1);
          } else if (gestureState.dx < -60 && index > 0) {
            onMove(index, index - 1);
          }

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 16,
            bounciness: 6,
          }).start();
        },
      }),
    [index, onMove, total, translateX],
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      className="mr-3 w-[132px] rounded-lg border border-border bg-card p-3"
      style={{transform: [{translateX}]}}>
      <Image
        source={{uri: image.uri}}
        className="h-[84px] w-full rounded-md bg-surface"
        resizeMode="cover"
      />
      <Text className="mt-3" variant="caption" weight="semibold">
        {image.name}
      </Text>
      <Text variant="caption" color="muted">
        {image.sizeInMb.toFixed(1)}MB
      </Text>

      <Stack direction="horizontal" gap="sm" className="mt-3">
        <Button
          fullWidth={false}
          size="sm"
          variant="outline"
          disabled={index === 0}
          onPress={() => onMove(index, index - 1)}>
          Left
        </Button>
        <Button
          fullWidth={false}
          size="sm"
          variant="outline"
          disabled={index === total - 1}
          onPress={() => onMove(index, index + 1)}>
          Right
        </Button>
      </Stack>

      <Button
        className="mt-3"
        size="sm"
        variant="ghost"
        onPress={() => onRemove(index)}>
        Remove
      </Button>
    </Animated.View>
  );
}

function ProductListCard({
  id,
  name,
  sku,
  price,
  stockQuantity,
  updatedAt,
  onEdit,
  onDelete,
}: {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  updatedAt: string;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}): React.JSX.Element {
  return (
    <Card variant="outlined" className="gap-3">
      <Stack direction="horizontal" align="start" justify="between" gap="sm">
        <Stack gap="sm" className="flex-1">
          <Text weight="bold">{name}</Text>
          <Text variant="caption" color="muted">
            SKU {sku} | Stock {stockQuantity}
          </Text>
        </Stack>
        <Badge variant="info">{new Intl.NumberFormat('vi-VN').format(price)} VND</Badge>
      </Stack>

      <Text variant="caption" color="muted">
        Updated {new Date(updatedAt).toLocaleString()}
      </Text>

      <Stack direction="horizontal" gap="sm">
        <Button fullWidth={false} size="sm" variant="outline" onPress={() => onEdit(id)}>
          Edit
        </Button>
        <Button fullWidth={false} size="sm" variant="ghost" onPress={() => onDelete(id)}>
          Delete
        </Button>
      </Stack>
    </Card>
  );
}

const richTextSnippets = [
  {label: 'Bullet list', value: '\n- Key feature\n- Integration note'},
  {label: 'Specs', value: '\n\n**Specs**\n- Voltage:\n- Interface:\n- Lead time:'},
  {label: 'Use case', value: '\n\n**Use case**\nDesigned for '},
] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value);

export default function ProductManagerScreen({
  navigation,
}: Props): React.JSX.Element {
  const user = useAuthStore(state => state.user);
  const page = useProductManagementStore(state => state.page);
  const pageSize = useProductManagementStore(state => state.pageSize);
  const search = useProductManagementStore(state => state.search);
  const category = useProductManagementStore(state => state.category);
  const sortBy = useProductManagementStore(state => state.sortBy);
  const selectedProductId = useProductManagementStore(state => state.selectedProductId);
  const setPage = useProductManagementStore(state => state.setPage);
  const setSearch = useProductManagementStore(state => state.setSearch);
  const setCategory = useProductManagementStore(state => state.setCategory);
  const setSortBy = useProductManagementStore(state => state.setSortBy);
  const setSelectedProductId = useProductManagementStore(
    state => state.setSelectedProductId,
  );
  const resetFilters = useProductManagementStore(state => state.resetFilters);
  const productsQuery = useProductsQuery({
    page,
    pageSize,
    query: search,
    category,
    sortBy,
  });
  const productQuery = useProductQuery(selectedProductId);
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const deleteMutation = useDeleteProductMutation();
  const [draftImageUri, setDraftImageUri] = useState('');
  const [draftImageName, setDraftImageName] = useState('');
  const [draftImageSize, setDraftImageSize] = useState('1.2');
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: {errors},
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT_FORM,
  });
  const {fields: imageFields, append, remove, move} = useFieldArray({
    control,
    name: 'images',
    keyName: 'fieldId',
  });
  const descriptionValue = watch('description');
  const selectedTags = watch('tags');

  useEffect(() => {
    if (productQuery.data) {
      reset({
        sku: productQuery.data.sku,
        name: productQuery.data.name,
        description: productQuery.data.description,
        price: productQuery.data.price,
        category: productQuery.data.category,
        tags: productQuery.data.tags,
        images: productQuery.data.images,
        stockQuantity: productQuery.data.stockQuantity,
      });
      return;
    }

    if (!selectedProductId) {
      reset(EMPTY_PRODUCT_FORM);
    }
  }, [productQuery.data, reset, selectedProductId]);

  const editing = Boolean(selectedProductId);
  const loadingSubmit = createMutation.isPending || updateMutation.isPending;

  const addImage = (image: ManagedProductImage) => {
    if (imageFields.length >= 5) {
      setError('images', {
        type: 'max',
        message: 'You can attach up to 5 images.',
      });
      return;
    }

    clearErrors('images');
    append({
      ...image,
      id: `${image.id}-${Date.now()}`,
    });
  };

  const addManualImage = () => {
    const normalizedUri = draftImageUri.trim();
    const normalizedName = draftImageName.trim() || 'custom-image.png';
    const parsedSize = Number.parseFloat(draftImageSize);

    if (!normalizedUri) {
      setError('images', {
        type: 'manual',
        message: 'Please enter an image URL before adding it.',
      });
      return;
    }

    if (Number.isNaN(parsedSize) || parsedSize <= 0 || parsedSize > 10) {
      setError('images', {
        type: 'manual',
        message: 'Image size must be between 0.1MB and 10MB.',
      });
      return;
    }

    addImage({
      id: `manual-${Date.now()}`,
      uri: normalizedUri,
      name: normalizedName,
      sizeInMb: parsedSize,
    });
    setDraftImageUri('');
    setDraftImageName('');
    setDraftImageSize('1.2');
  };

  const toggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter(item => item !== tag)
      : [...selectedTags, tag];
    setValue('tags', nextTags, {shouldValidate: true});
  };

  const submit = handleSubmit(async values => {
    if (editing && selectedProductId) {
      await updateMutation.mutateAsync({
        productId: selectedProductId,
        payload: values,
      });
    } else {
      await createMutation.mutateAsync(values);
      setPage(1);
    }

    setSelectedProductId(null);
    reset(EMPTY_PRODUCT_FORM);
  });

  const startCreateMode = () => {
    setSelectedProductId(null);
    reset(EMPTY_PRODUCT_FORM);
  };

  const deleteProduct = async (productId: string) => {
    await deleteMutation.mutateAsync(productId);

    if (selectedProductId === productId) {
      setSelectedProductId(null);
      reset(EMPTY_PRODUCT_FORM);
    }
  };

  const totalPages = productsQuery.data?.totalPages ?? 1;
  const totalItems = productsQuery.data?.total ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 bg-background">
        <Container size="lg" className="py-6">
          <Stack gap="lg">
            <Stack direction="horizontal" align="center" justify="between">
              <Stack gap="sm" className="flex-1">
                <Badge variant="warning">PRODUCT MANAGEMENT</Badge>
                <Text variant="heading" weight="bold">
                  Manage product records
                </Text>
                <Text color="muted">
                  CRUD products with React Hook Form, Zod validation, Axios
                  interceptors, TanStack Query caching, and MMKV-backed state.
                </Text>
              </Stack>
              <Button
                fullWidth={false}
                variant="ghost"
                onPress={() => navigation.goBack()}>
                Back
              </Button>
            </Stack>

            <Card variant="outlined">
              <Stack direction="horizontal" align="center" justify="between" gap="sm">
                <Stack gap="sm" className="flex-1">
                  <Text variant="caption" color="muted" weight="semibold">
                    ACTIVE SESSION
                  </Text>
                  <Text weight="bold">{user?.fullName ?? 'Unknown user'}</Text>
                  <Text variant="caption" color="muted">
                    {user?.email ?? 'No email'} | role {user?.role ?? 'member'}
                  </Text>
                </Stack>
                <Badge variant="success">Authenticated</Badge>
              </Stack>
            </Card>

            <Card variant="outlined" className="gap-4">
              <Stack gap="sm">
                <Text variant="caption" color="muted" weight="semibold">
                  PRODUCT FILTERS
                </Text>
                <Input
                  label="Search"
                  placeholder="Search by name, SKU, or tag"
                  value={search}
                  onChangeText={setSearch}
                  leftIcon={<AppIcon name="catalog" size={16} color="#667A89" />}
                />

                <Stack gap="sm">
                  <Text variant="caption" color="muted" weight="semibold">
                    Category
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <ProductChip
                      label="All"
                      selected={category === 'all'}
                      onPress={() => setCategory('all')}
                    />
                    {CATEGORIES.filter(item => item.id !== 'all').map(item => (
                      <ProductChip
                        key={item.id}
                        label={item.label}
                        selected={category === item.id}
                        onPress={() => setCategory(item.id)}
                      />
                    ))}
                  </View>
                </Stack>

                <Stack gap="sm">
                  <Text variant="caption" color="muted" weight="semibold">
                    Sort
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      {label: 'Newest', value: 'updated-desc'},
                      {label: 'Oldest', value: 'updated-asc'},
                      {label: 'Price asc', value: 'price-asc'},
                      {label: 'Price desc', value: 'price-desc'},
                      {label: 'Stock', value: 'stock-desc'},
                    ].map(option => (
                      <ProductChip
                        key={option.value}
                        label={option.label}
                        selected={sortBy === option.value}
                        onPress={() =>
                          setSortBy(
                            option.value as ReturnType<
                              typeof useProductManagementStore.getState
                            >['sortBy'],
                          )
                        }
                      />
                    ))}
                  </View>
                </Stack>

                <Stack direction="horizontal" gap="sm" wrap>
                  <Button fullWidth={false} size="sm" variant="outline" onPress={startCreateMode}>
                    New product
                  </Button>
                  <Button fullWidth={false} size="sm" variant="ghost" onPress={resetFilters}>
                    Reset filters
                  </Button>
                </Stack>
              </Stack>
            </Card>

            <Card variant="elevated" className="gap-4">
              <Stack direction="horizontal" align="center" justify="between">
                <Stack gap="sm" className="flex-1">
                  <Text variant="caption" color="muted" weight="semibold">
                    PRODUCT FORM
                  </Text>
                  <Text weight="bold">
                    {editing ? 'Edit selected product' : 'Create a new product'}
                  </Text>
                  <Text variant="caption" color="muted">
                    {editing
                      ? 'Changes are pushed through update mutation with optimistic cache updates.'
                      : 'New records are validated before optimistic creation and persisted through the mock API.'}
                  </Text>
                </Stack>
                {editing ? <Badge variant="info">Editing</Badge> : <Badge>Draft</Badge>}
              </Stack>

              {(productQuery.error || createMutation.error || updateMutation.error) ? (
                <Text color="error">
                  {getApiErrorMessage(
                    productQuery.error ?? createMutation.error ?? updateMutation.error,
                  )}
                </Text>
              ) : null}

              <Controller
                control={control}
                name="sku"
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    label="SKU"
                    placeholder="PI5-CONTROL-01"
                    autoCapitalize="characters"
                    value={value}
                    onChangeText={text => onChange(text.toUpperCase())}
                    onBlur={onBlur}
                    error={errors.sku?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="name"
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    label="Product name"
                    placeholder="Industrial Edge Controller Kit"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    label="Description"
                    placeholder="Describe the product, positioning, and integration notes..."
                    multiline
                    helperText="Rich-text friendly field with markdown-style snippets. Maximum 2000 characters."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.description?.message}
                  />
                )}
              />

              <View className="flex-row flex-wrap gap-2">
                {richTextSnippets.map(snippet => (
                  <Button
                    key={snippet.label}
                    fullWidth={false}
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      setValue(
                        'description',
                        `${descriptionValue}${snippet.value}`.trim(),
                        {shouldValidate: true},
                      )
                    }>
                    {snippet.label}
                  </Button>
                ))}
              </View>

              <Stack direction="horizontal" gap="md" wrap>
                <Controller
                  control={control}
                  name="price"
                  render={({field: {onChange, onBlur, value}}) => (
                    <View className="min-w-[220px] flex-1">
                      <Input
                        label="Price"
                        keyboardType="numeric"
                        helperText={`Preview: ${formatCurrency(Number(value || 0))} VND`}
                        value={String(value)}
                        onChangeText={text => onChange(Number(text || 0))}
                        onBlur={onBlur}
                        error={errors.price?.message}
                      />
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="stockQuantity"
                  render={({field: {onChange, onBlur, value}}) => (
                    <View className="min-w-[220px] flex-1">
                      <Input
                        label="Stock quantity"
                        keyboardType="numeric"
                        value={String(value)}
                        onChangeText={text => onChange(Number(text || 0))}
                        onBlur={onBlur}
                        error={errors.stockQuantity?.message}
                      />
                    </View>
                  )}
                />
              </Stack>

              <Controller
                control={control}
                name="category"
                render={({field: {value, onChange}}) => (
                  <Stack gap="sm">
                    <Text variant="caption" color="muted" weight="semibold">
                      Category
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {CATEGORIES.filter(item => item.id !== 'all').map(item => (
                        <ProductChip
                          key={item.id}
                          label={item.label}
                          selected={value === item.id}
                          onPress={() => onChange(item.id)}
                        />
                      ))}
                    </View>
                    {errors.category?.message ? (
                      <Text variant="caption" color="error">
                        {errors.category.message}
                      </Text>
                    ) : null}
                  </Stack>
                )}
              />

              <Stack gap="sm">
                <Text variant="caption" color="muted" weight="semibold">
                  Tags
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PRODUCT_TAG_OPTIONS.map(tag => (
                    <ProductChip
                      key={tag}
                      label={tag}
                      selected={selectedTags.includes(tag)}
                      onPress={() => toggleTag(tag)}
                    />
                  ))}
                </View>
                {errors.tags?.message ? (
                  <Text variant="caption" color="error">
                    {errors.tags.message}
                  </Text>
                ) : null}
              </Stack>

              <Stack gap="sm">
                <Text variant="caption" color="muted" weight="semibold">
                  Images
                </Text>
                <Text variant="caption" color="muted">
                  Add up to 5 images. Swipe a card left or right to reorder the gallery.
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {PRODUCT_IMAGE_LIBRARY.map(image => (
                    <Button
                      key={image.id}
                      fullWidth={false}
                      size="sm"
                      variant="outline"
                      onPress={() => addImage({...image})}>
                      Add {image.name}
                    </Button>
                  ))}
                </View>

                <Stack direction="horizontal" gap="sm" wrap>
                  <View className="min-w-[220px] flex-1">
                    <Input
                      label="Image URL"
                      placeholder="https://example.com/image.png"
                      value={draftImageUri}
                      onChangeText={setDraftImageUri}
                    />
                  </View>
                  <View className="min-w-[180px] flex-1">
                    <Input
                      label="Image name"
                      placeholder="hero.png"
                      value={draftImageName}
                      onChangeText={setDraftImageName}
                    />
                  </View>
                </Stack>

                <Stack direction="horizontal" gap="sm" wrap>
                  <View className="min-w-[120px]">
                    <Input
                      label="Size (MB)"
                      keyboardType="numeric"
                      value={draftImageSize}
                      onChangeText={setDraftImageSize}
                    />
                  </View>
                  <Button fullWidth={false} variant="secondary" onPress={addManualImage}>
                    Add custom image
                  </Button>
                </Stack>

                {imageFields.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {imageFields.map((field, index) => (
                      <SortableImageCard
                        key={field.fieldId}
                        image={field}
                        index={index}
                        total={imageFields.length}
                        onMove={move}
                        onRemove={remove}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Card variant="outlined">
                    <Text color="muted">
                      No images yet. Add sample assets or paste your own image URL.
                    </Text>
                  </Card>
                )}

                {errors.images?.message ? (
                  <Text variant="caption" color="error">
                    {errors.images.message}
                  </Text>
                ) : null}
              </Stack>

              <Stack direction="horizontal" gap="sm" wrap>
                <Button loading={loadingSubmit} onPress={submit}>
                  {editing ? 'Update product' : 'Create product'}
                </Button>
                <Button variant="outline" onPress={startCreateMode}>
                  Clear form
                </Button>
                {editing && selectedProductId ? (
                  <Button
                    variant="ghost"
                    loading={deleteMutation.isPending}
                    onPress={() => deleteProduct(selectedProductId)}>
                    Delete product
                  </Button>
                ) : null}
              </Stack>
            </Card>

            <Card variant="outlined" className="gap-4">
              <Stack direction="horizontal" align="center" justify="between">
                <Stack gap="sm" className="flex-1">
                  <Text variant="caption" color="muted" weight="semibold">
                    PRODUCT LIST
                  </Text>
                  <Text weight="bold">
                    {totalItems} product{totalItems === 1 ? '' : 's'} found
                  </Text>
                  <Text variant="caption" color="muted">
                    Page {page} of {totalPages}
                  </Text>
                </Stack>
                <Badge variant="info">Query cache</Badge>
              </Stack>

              {productsQuery.isLoading ? (
                <Text color="muted">Loading products...</Text>
              ) : productsQuery.error ? (
                <Text color="error">{getApiErrorMessage(productsQuery.error)}</Text>
              ) : productsQuery.data?.items.length ? (
                <Stack gap="md">
                  {productsQuery.data.items.map((product: ManagedProduct) => (
                    <ProductListCard
                      key={product.id}
                      {...product}
                      onEdit={productId => setSelectedProductId(productId)}
                      onDelete={deleteProduct}
                    />
                  ))}
                </Stack>
              ) : (
                <Text color="muted">
                  No products matched the current filters. Try clearing the search.
                </Text>
              )}

              <Stack direction="horizontal" gap="sm" align="center">
                <Button
                  fullWidth={false}
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onPress={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  fullWidth={false}
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onPress={() => setPage(page + 1)}>
                  Next
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

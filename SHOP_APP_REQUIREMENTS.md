# Tong Hop Yeu Cau App Shop tu Chuong 4 va Chuong 5

## Nguon tai lieu

- `C:/Users/dthinh/Documents/Docs/MobileApp/ThucHanh_Slide/BT_CHUONG_4.pdf`
- `C:/Users/dthinh/Documents/Docs/MobileApp/ThucHanh_Slide/BT_CHUONG_5.pdf`

## Muc dich file

File nay tong hop toan bo cac yeu cau lien quan den viec xay dung mot ung dung Shop bang React Native duoc neu trong Chuong 4 va Chuong 5. Noi dung duoc sap xep lai theo kieu dac ta du an de de tra cuu va dung lam checklist thuc hien.

## Tong quan muc tieu cua bo bai tap

Hai chuong dat ra mot lo trinh phat trien app Shop theo 3 tang:

1. Nen tang ky thuat va cau truc du an.
2. Bo man hinh, component va trai nghiem giao dien cua app ban hang.
3. Nang cao chat luong san pham theo huong production-ready.

## I. Yeu cau tu Chuong 4

Chuong 4 tap trung vao viec setup, kien truc va ky thuat nen cho app Shop.

### 1. Setup React Native project tu dau

- Tao project React Native bang TypeScript template.
- Xac minh project chay duoc tren Android.
- Neu co dieu kien, test ca iOS va Android.
- Muc tieu la co mot project khoi dau dung chuan, co the build va debug.

### 2. Cau hinh TypeScript

- Bat `strict mode`.
- Cau hinh `baseUrl`.
- Setup path aliases cho cac nhom module:
  - `@components/*`
  - `@screens/*`
  - `@utils/*`
  - `@types/*`
  - `@hooks/*`
  - `@services/*`
  - `@store/*`
- Dong bo path aliases giua `tsconfig` va `babel.config.js`.

### 3. Cau truc thu muc du an Shop

Tai lieu yeu cau project Shop co cau truc ro rang, theo nhom trach nhiem:

- `src/components/`
  - `common/`
  - `product/`
  - `user/`
- `src/screens/`
  - `auth/`
  - `home/`
  - `product/`
  - `profile/`
- `src/navigation/`
  - `AppNavigator.tsx`
  - `AuthNavigator.tsx`
  - `types.ts`
- `src/services/`
  - `api.ts`
  - `storage.ts`
- `src/store/`
  - `authStore.ts`
  - `cartStore.ts`
  - `productStore.ts`
- `src/hooks/`
  - `useAuth.ts`
  - `useProducts.ts`
- `src/utils/`
  - `helpers.ts`
  - `constants.ts`
- `src/types/`
  - `product.ts`
  - `user.ts`
  - `api.ts`

### 4. Development tools bat buoc

- ESLint cho React Native.
- Prettier.
- Husky cho git hooks.
- Metro bundler config de ho tro aliases va phat trien de dang.

### 5. Base components can co

Chuong 4 yeu cau tao cac component nen cho du an Shop:

- `Button`
- `Input`
- `Card`
- `Loading`
- `Error`

Moi component can co tinh tai su dung cao va dat nen tang cho cac man hinh sau nay.

### 6. Splash Screen

- Hien thi logo Shop.
- Kiem tra trang thai dang nhap.
- Dieu huong dua tren auth state.
- Co thoi gian hien thi toi thieu 2 giay.

### 7. Navigation

- Cai dat React Navigation v7.
- Tao cau truc navigation ro rang.
- Co typings TypeScript cho navigation.

### 8. Testing setup

- Cau hinh Jest.
- Cai React Native Testing Library.
- Tao test dau tien cho `SplashScreen`.

### 9. Hieu architecture React Native

Phan ly thuyet va bai tap nang cao cua Chuong 4 yeu cau nguoi lam hieu:

- JavaScript Thread.
- UI Thread.
- Bridge communication.
- Cach React Native render va giao tiep voi native.
- Cach nhin nhan performance va debugging.

### 10. Best practices va quality requirements

Tai lieu dat cac yeu cau chat luong sau:

- Code phai clean va co to chuc.
- Error handling phai day du.
- Su dung TypeScript strict mode.
- Toi uu performance co ban.
- Co kha nang debug va troubleshooting.

### 11. Muc nang cao trong Chuong 4

Phan du an nang cao cua Chuong 4 mo rong app Shop theo huong production:

#### 11.1. Clean Architecture

- Domain layer: entities, use cases.
- Data layer: repositories, data sources.
- Presentation layer: screens, components.
- Infrastructure layer: API, storage.

#### 11.2. State management nang cao

- Zustand stores co persistence.
- TanStack Query cho server state.
- State synchronization.
- State migration.

#### 11.3. Performance optimization

- Code splitting.
- Lazy loading.
- Memoization.
- Image optimization.
- Bundle optimization.

#### 11.4. Advanced features

- Deep linking.
- Push notifications.
- Offline support.
- Biometric authentication.

### 12. Checklist hoan thanh theo Chuong 4

#### Co ban

- React Native project duoc setup.
- TypeScript configuration hoan chinh.
- Project structure dung.
- Base components duoc tao.
- Navigation setup.

#### Nang cao

- Clean Architecture duoc implement.
- State management hoan chinh.
- Performance duoc optimize.
- Error handling day du.

#### Sieu kho

- Advanced features hoat dong.
- Offline support.
- Deep linking.
- Push notifications.
- Biometric auth.

## II. Yeu cau tu Chuong 5

Chuong 5 tap trung vao giao dien, component va tuong tac cua app ban hang.

### 1. Profile Screen

Yeu cau xay dung mot `Profile Screen` hoan chinh voi:

#### 1.1. Profile Header

- Avatar.
- Ten nguoi dung.
- Email.
- Bio tuy chon.
- Bo cuc bang Flexbox.
- Giao dien dep va chuyen nghiep.

#### 1.2. Profile Information Section

- Form chinh sua profile voi cac `TextInput`:
  - Ten
  - Email
  - So dien thoai
  - Dia chi
- Validation:
  - Dinh dang email
  - Dinh dang so dien thoai
  - Required fields
- `Switch` cho:
  - Nhan thong bao
  - Hien thi email cong khai
- Nut:
  - Luu thay doi
  - Huy
  - Dang xuat

#### 1.3. Settings Section

Danh sach settings can co:

- `TouchableOpacity` cho moi item.
- Icon.
- Title va description.
- Arrow indicator.

Noi dung setting gom:

- Cai dat tai khoan.
- Cai dat thong bao.
- Cai dat bao mat.
- Ngon ngu.
- Chu de Light/Dark.
- Giup do va ho tro.
- Ve ung dung.

#### 1.4. Cac yeu cau ky thuat bo sung cho Profile

- `ActivityIndicator` khi load/saving.
- `ScrollView`.
- `KeyboardAvoidingView`.
- `SafeAreaView`.
- `Modal` xac nhan dang xuat va hien thi thong tin.
- `Alert` cho thanh cong, that bai, xoa tai khoan.
- Platform-specific styling cho iOS va Android.
- Cau hinh `StatusBar`.
- Style bang `StyleSheet.create`.
- Co color system, typography system, spacing system, responsive design.

### 2. Product Detail Screen

Day la man hinh san pham nang cao, yeu cau nhieu hon:

#### 2.1. Image Gallery

- `ScrollView` ngang cho anh san pham.
- `Image` co loading state.
- `Image` co error handling.
- Placeholder.
- Indicators.
- Zoom tuy chon.
- Swipe gestures.

#### 2.2. Product Information

- Ten san pham.
- Gia co format.
- Rating bang stars custom component.
- Mo ta dai.
- Danh sach specifications.
- Tags/Categories.

#### 2.3. Variant Selection

- Size selector.
- Color selector.
- Quantity selector.
- Co selected state.
- Co disabled state khi het hang.
- Co validation min/max.

#### 2.4. Add to Cart

- Button co loading state.
- Disabled state khi het hang.
- Success animation.
- Dung `Pressable`.
- Ho tro `onPress`, `onPressIn`, `onPressOut`.
- Haptic feedback tuy chon.

#### 2.5. Reviews Section

- User avatar.
- User name.
- Rating.
- Review text.
- Date.
- `ScrollView` hoac `FlatList`.
- Nut `Load more`.
- Empty state.

#### 2.6. Related Products

- Horizontal `ScrollView`.
- Product cards.
- `TouchableOpacity` de navigate.
- Loading skeleton.

#### 2.7. Share va Favorite

- Share button dung `Share API`.
- Favorite button toggle state.
- Animation khi toggle.
- Persist state.

#### 2.8. Bottom Sheet / Modal

- Quick add to cart.
- Chon size/color.
- Chon so luong.
- Slide up animation.
- Backdrop.
- Dismiss khi nhan backdrop.

#### 2.9. Keyboard handling

- `KeyboardAvoidingView`.
- Dismiss keyboard on scroll.
- Input focus management.

#### 2.10. Loading va error states

- Skeleton cho image, text, button.
- `ActivityIndicator` cho API calls.
- Progressive loading.
- Retry button.
- Error messages.
- Network error handling.

#### 2.11. Accessibility

- `accessibilityLabel`.
- `accessibilityHint`.
- `accessibilityRole`.
- Test voi screen reader.

#### 2.12. Animations va platform optimization

- Fade in.
- Scale animation.
- Slide animation cho bottom sheet.
- Success animation.
- iOS:
  - Safe area handling
  - Haptic feedback
  - Native navigation
- Android:
  - Material Design components
  - Back button handling
  - Ripple effects

### 3. Complete E-commerce App UI

Chuong 5 dat yeu cau xay mot app e-commerce hoan chinh, bao gom:

#### 3.1. Navigation structure

- Tab Navigation gom 5 tab:
  - Home
  - Search
  - Cart
  - Favorites
  - Profile
- Stack Navigation cho:
  - Product Detail
  - Checkout
  - Order History
  - Settings
- Drawer Navigation la tuy chon.

#### 3.2. Home Screen

- Hero banner / image carousel.
- Categories grid.
- Featured products.
- Flash sale section.
- New arrivals.
- Best sellers.
- Pull-to-refresh.
- Infinite scroll.

#### 3.3. Search Screen

- Search bar voi:
  - `TextInput`
  - Search icon
  - Clear button
  - Voice search mo phong
- Search history.
- Trending searches.
- Search results voi:
  - Filter options
  - Sort options
  - Grid/List toggle
- Empty state.
- Loading state.

#### 3.4. Product Listing

- Filter panel:
  - Price range slider
  - Category checkboxes
  - Brand selection
  - Rating filter
  - Availability toggle
- Sort options:
  - Price low to high
  - Price high to low
  - Newest
  - Rating
  - Popularity
- Product grid voi:
  - Product card
  - Quick view
  - Add to cart
  - Favorite
- Pagination hoac infinite scroll.

#### 3.5. Cart Screen

- Danh sach cart items:
  - Product image
  - Product name
  - Variant info
  - Price
  - Quantity selector
  - Remove button
  - Total price
- Empty cart state.
- Promo code input.
- Shipping options.
- Order summary.
- Checkout button.
- Continue shopping button.

#### 3.6. Checkout Screen

- Multi-step form:
  - Shipping address
  - Payment method
  - Review order
- Form validation.
- Address selection/input.
- Payment methods:
  - Credit card
  - Debit card
  - PayPal mo phong
  - Cash on delivery
- Order summary.
- Place order button.

#### 3.7. Order History

- List orders voi:
  - Order number
  - Date
  - Status
  - Total amount
  - Items count
- Filter by status.
- Order detail screen.
- Track order mo phong.

#### 3.8. Favorites Screen

- Grid/List view.
- Empty state.
- Remove from favorites.
- Share favorite.
- Move to cart.

#### 3.9. Profile Screen

- User info.
- Order history link.
- Addresses management.
- Payment methods.
- Settings.
- Logout.

### 4. Advanced reusable components theo Chuong 5

#### 4.1. Custom components tong quat

- Custom `Button`:
  - Variants
  - Sizes
  - Loading state
  - Disabled state
  - Icons
- Custom `Input`:
  - Label
  - Error message
  - Helper text
  - Icons
  - Validation
- Custom `Modal`:
  - Animations
  - Backdrop
  - Close button
  - Custom content
- Custom `Card`
- Custom `Badge`
- Custom `Avatar`

#### 4.2. UI components du an thuc te

Tai lieu con neu ro bo component can lam cho Shop:

- `ProductCard`
- `ProductList`
- `SearchBar`
- `FilterModal`
- `CartItem`
- `CheckoutForm`

Trong do:

- `ProductCard` phai co image, name, price, rating, seller info, add to cart.
- `ProductList` phai dung `FlatList`, pull to refresh, infinite scroll, loading, empty, error state.
- `SearchBar` phai co placeholder, search icon, clear button, loading indicator, debounce.
- `FilterModal` phai la bottom modal, co price/category/rating/sort, apply/reset, animation.
- `CartItem` phai co quantity selector, remove button, total price, swipe to delete.
- `CheckoutForm` phai la multi-step, co validation, keyboard avoiding, progress indicator.

### 5. State management, performance, animations

#### 5.1. State management

- Global state cho:
  - Cart
  - Favorites
  - User
  - Products
- Local state cho:
  - Form inputs
  - UI state
  - Filters

#### 5.2. Performance

- Lazy loading images.
- Caching.
- Placeholders.
- `FlatList` voi key dung.
- `getItemLayout`.
- `removeClippedSubviews`.
- `maxToRenderPerBatch`.
- `useMemo`.
- `useCallback`.
- `React.memo`.

#### 5.3. Animations

- Screen transitions.
- Component animations.
- Loading animations.
- Success/Error animations.
- Micro-interactions.

### 6. Error handling, accessibility, platform specifics

#### 6.1. Error handling

- Error boundaries.
- Network error handling.
- Validation errors.
- User-friendly error messages.
- Retry mechanisms.

#### 6.2. Accessibility

- Labels.
- Hints.
- Roles.
- States.
- Dynamic Type support.
- Screen reader testing.
- Keyboard navigation.

#### 6.3. Platform-specific

- iOS:
  - Safe area
  - Haptic feedback
  - Native navigation
- Android:
  - Material Design
  - Back button
  - Ripple effects

### 7. Documentation va testing theo Chuong 5

- Component tests.
- Integration tests.
- Snapshot tests.
- E2E tests cho critical flows.
- Component documentation.
- Usage examples.
- Props documentation.
- Storybook la tuy chon.

### 8. Design System va Theme Support

Phan du an nang cao cua Chuong 5 yeu cau:

- Color palette.
- Typography system.
- Spacing system.
- Component library.
- Light/Dark mode.
- Custom themes.
- Theme switching animation.
- Bottom sheet.
- Toast notifications.
- Loading skeletons.
- Empty states.
- Error states.
- Screen reader support.
- Keyboard navigation.
- Dynamic type support.
- High contrast mode.

## III. Muc do hoan thanh va tieu chi tong the

### 1. Muc co ban

Theo tinh than chung cua tai lieu, muc co ban dat khi:

- Setup dung project React Native + TypeScript.
- Co cau truc project ro rang.
- Co base components.
- Co navigation.
- Co cac component e-commerce co ban.
- Co man hinh profile co ban.

### 2. Muc nang cao

- Hoan thanh profile screen va product detail screen nang cao.
- Co state management ro rang.
- Co handling loading, error, accessibility.
- Co design system va theme support.
- Biet cach to chuc app tot hon va toi uu performance.

### 3. Muc sieu kho / gan production

- Hoan thanh full app e-commerce UI.
- Co checkout, order history, favorites, profile, search, listing, product detail.
- Co testing tot.
- Co performance optimization.
- Co advanced features va architecture nang cao.
- Co deployment/demo tai lieu day du.

## IV. Dau ra bai nop duoc yeu cau trong tai lieu

- Tao repository tren GitHub.
- Push code len repository.
- Tao file `SUBMISSION.md`.
- Co screenshots cua man hinh.
- Co video demo cho bai tap lon.
- Co documentation links.
- Co the deploy app o muc bai tap cao.

## V. Checklist tong hop de thuc hien du an Shop

### A. Nen tang ky thuat

- React Native + TypeScript setup.
- Strict TypeScript.
- Path aliases.
- Babel config.
- ESLint.
- Prettier.
- Husky.
- Jest + RNTL.

### B. Cau truc du an

- `components`
- `screens`
- `navigation`
- `services`
- `store`
- `hooks`
- `utils`
- `types`

### C. Core app flow

- Splash
- Auth flow
- Home
- Search
- Product listing
- Product detail
- Cart
- Checkout
- Favorites
- Profile
- Order history
- Settings

### D. Core reusable components

- Button
- Input
- Card
- Loading
- Error
- Modal
- Badge
- Avatar
- ProductCard
- ProductList
- SearchBar
- FilterModal
- CartItem
- CheckoutForm

### E. Cross-cutting quality requirements

- Loading states
- Error states
- Empty states
- Accessibility
- Responsive UI
- Platform-specific behavior
- Performance optimization
- Clean code organization

## VI. Ghi chu ap dung cho du an hien tai

Tai lieu goc mo ta mot ung dung e-commerce tong quat. Vi vay:

- Loai san pham khong bi rang buoc cu the.
- Cac vi du nhu size/color trong Product Detail co the duoc anh xa thanh bien the san pham phu hop voi du an thuc te.
- Voi Embedded Shop, co the map cac yeu cau nay thanh cac bien the nhu model, voltage, interface, memory, package, stock, compatibility.

## Ket luan

Neu tong hop theo tinh than cua Chuong 4 va Chuong 5, mot App Shop dat yeu cau can co:

- Nen tang ky thuat dung chuan.
- Cau truc project ro rang.
- Bo component tai su dung tot.
- Day du cac man hinh cua mot e-commerce app.
- Co loading, error, accessibility, animation, theming va performance.
- O muc cao hon, co testing, architecture tot, state management hien dai va kha nang mo rong production.

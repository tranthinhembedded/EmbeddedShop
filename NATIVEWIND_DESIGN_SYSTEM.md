# NativeWind Design System Audit

## Muc tieu doi chieu

Tai lieu nay doi chieu du an hien tai voi cac yeu cau trong BT chuong 6, sau do ghi ro nhung phan da co san va nhung phan da duoc bo sung them.

## Ket qua doi chieu nhanh

| Nhom yeu cau | Tinh trang cu | Bo sung moi |
| --- | --- | --- |
| Design tokens | Da co `src/theme.ts` cho 2 theme nhung moi tap trung vao color tokens cho app shop | Them `src/design-system/tokens.ts` va mo rong `tailwind.config.js` cho colors, typography, spacing, radius, shadows |
| Base components | Da co `src/components/common/Button.tsx`, `Input.tsx`, `Card.tsx` nhung chua du variants, states, icon slots va chua dung NativeWind | Them bo `src/components/ui/` gom `Button`, `Input`, `Card`, `Text`, `Badge` dung NativeWind |
| Layout components | Chua co bo layout components dung chung | Them `src/components/layout/Container.tsx`, `Stack.tsx`, `Grid.tsx` |
| Example screen | Chua co login example theo checklist | Them `src/screens/examples/LoginExampleScreen.tsx` |
| Theme configuration | Chua co theme provider rieng cho NativeWind | Them `src/design-system/theme.tsx` voi light/dark/system mode |
| Documentation | Chua co tai lieu rieng cho design system NativeWind | Them file nay |

## Design tokens

### Colors

- Primary / brand: `primary`, `primary-soft`, `primary-foreground`
- Secondary: `secondary`, `secondary-soft`, `secondary-foreground`
- Neutral scale: `neutral.0` -> `neutral.950`
- Semantic: `success`, `error`, `warning`, `info` va cac soft/foreground tokens
- Surface tokens: `background`, `surface`, `card`, `input`, `border`, `foreground`, `muted`, `ring`

### Typography

- Font families: `sans`, `serif`, `mono`
- Font sizes: `caption`, `label`, `body`, `title`, `hero`
- Font weights: `regular`, `medium`, `semibold`, `bold`
- Line heights: gan voi tung token size trong `tailwind.config.js` va `src/design-system/tokens.ts`

### Spacing

- Scale: `1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 18`
- Gia tri: 4px -> 72px

### Radius

- `sm = 12`
- `md = 16`
- `lg = 24`

### Shadows

- `elevation-sm`
- `elevation-md`
- `elevation-lg`

## Base components

### Button

Props chinh:

- `variant`: `primary | secondary | outline | ghost`
- `size`: `sm | md | lg`
- `loading`
- `disabled`
- `leftIcon`, `rightIcon`
- `fullWidth`
- `className`, `textClassName`

### Input

Props chinh:

- `label`
- `placeholder`
- `error`
- `helperText`
- `leftIcon`, `rightIcon`
- `className`, `inputClassName`
- Ho tro `TextInputProps`

### Card

Props chinh:

- `variant`: `default | elevated | outlined`
- `className`

### Text

Props chinh:

- `variant`: `heading | body | caption`
- `color`: `default | muted | primary | success | error | warning | info`
- `weight`: `regular | medium | semibold | bold`
- `className`

### Badge

Props chinh:

- `variant`: `default | success | error | warning | info`
- `size`: `sm | md | lg`
- `className`

## Layout components

### Container

- Max width theo `size`: `sm | md | lg`
- Padding ngang responsive
- Ho tro center alignment

### Stack

- `direction`: `vertical | horizontal`
- `gap`: `none | sm | md | lg | xl`
- `align`, `justify`, `wrap`

### Grid

- `columns`
- `smColumns`
- `mdColumns`
- `gap`

## Theme configuration

`DesignSystemThemeProvider` cung cap:

- `mode`: light hoac dark da resolve
- `preference`: `light | dark | system`
- `setPreference`
- `toggleTheme`
- `theme`

Provider nay dua mau vao CSS variables thong qua `vars()` cua NativeWind de cac component co the dung cac utility nhu `bg-background`, `text-foreground`, `border-border`, `bg-primary`.

## Example screen

`src/screens/examples/LoginExampleScreen.tsx` demo:

- Container
- Stack
- Grid
- Text
- Badge
- Card
- Input
- Button
- Theme switching
- Responsive layout

## Usage example

```tsx
import {
  Badge,
  Button,
  Card,
  Container,
  DesignSystemThemeProvider,
  Input,
  Stack,
  Text,
} from './src/design-system';

export function Example() {
  return (
    <DesignSystemThemeProvider>
      <Container size="sm" className="py-10">
        <Stack gap="lg">
          <Badge variant="info">Example</Badge>
          <Text variant="heading">Hello Design System</Text>
          <Card variant="elevated">
            <Input label="Email" placeholder="name@example.com" />
            <Button className="mt-4">Continue</Button>
          </Card>
        </Stack>
      </Container>
    </DesignSystemThemeProvider>
  );
}
```

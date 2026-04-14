import React from 'react';
import {SvgProps} from 'react-native-svg';

import AddCartSvg from '../../icons/cart-add.svg';
import FavoriteSvg from '../../icons/favorite.svg';
import HomeSvg from '../../icons/home.svg';
import ProfileSvg from '../../icons/profile.svg';
import SearchSvg from '../../icons/search.svg';
import CartSvg from '../../icons/cart.svg';
import ShareSvg from '../../icons/share.svg';

import MoonSvg from '../../icons/moon.svg';
import BellSvg from '../../icons/bell.svg';
import EyeSvg from '../../icons/eye.svg';
import PackageSvg from '../../icons/package.svg';
import MapPinSvg from '../../icons/map-pin.svg';
import CreditCardSvg from '../../icons/credit-card.svg';
import UserSvg from '../../icons/user.svg';
import LockSvg from '../../icons/lock.svg';
import GlobeSvg from '../../icons/globe.svg';
import FilterSvg from '../../icons/filter.svg';
import HelpCircleSvg from '../../icons/help-circle.svg';
import InfoSvg from '../../icons/info.svg';
import LogOutSvg from '../../icons/log-out.svg';
import EditSvg from '../../icons/edit-2.svg';
import SettingsSvg from '../../icons/settings.svg';
import ShoppingBagSvg from '../../icons/shopping-bag.svg';
import ChevronRightSvg from '../../icons/chevron-right.svg';
import CameraSvg from '../../icons/camera.svg';
import ImageSvg from '../../icons/image.svg';
import RefreshCwSvg from '../../icons/refresh-cw.svg';
import CloseSvg from '../../icons/x.svg';
import ZapSvg from '../../icons/zap.svg';
import ArrowBackSvg from '../../icons/arrow_back.svg';

export type IconName = 
  | 'addCart' | 'cart' | 'catalog' | 'home' | 'profile' | 'saved' | 'share'
  | 'moon' | 'bell' | 'eye' | 'package' | 'map-pin' | 'credit-card' | 'user'
  | 'lock' | 'globe' | 'help-circle' | 'info' | 'log-out' | 'edit-2' | 'settings' | 'shopping-bag' | 'chevron-right'
  | 'filter' | 'camera' | 'image' | 'refresh-cw' | 'x' | 'zap' | 'arrow-back';

const ICONS: Record<IconName, React.FC<SvgProps>> = {
  addCart: AddCartSvg,
  cart: CartSvg,
  catalog: SearchSvg,
  home: HomeSvg,
  profile: ProfileSvg,
  saved: FavoriteSvg,
  share: ShareSvg,
  moon: MoonSvg,
  bell: BellSvg,
  eye: EyeSvg,
  package: PackageSvg,
  'map-pin': MapPinSvg,
  'credit-card': CreditCardSvg,
  user: UserSvg,
  lock: LockSvg,
  globe: GlobeSvg,
  filter: FilterSvg,
  'help-circle': HelpCircleSvg,
  info: InfoSvg,
  'log-out': LogOutSvg,
  'edit-2': EditSvg,
  settings: SettingsSvg,
  'shopping-bag': ShoppingBagSvg,
  'chevron-right': ChevronRightSvg,
  camera: CameraSvg,
  image: ImageSvg,
  'refresh-cw': RefreshCwSvg,
  x: CloseSvg,
  zap: ZapSvg,
  'arrow-back': ArrowBackSvg,
};

export function AppIcon({
  name,
  size = 20,
  color = '#E3E3E3',
}: {
  name: IconName;
  size?: number;
  color?: string;
}): React.JSX.Element {
  const IconComponent = ICONS[name];

  return <IconComponent width={size} height={size} color={color} fill={color} />;
}

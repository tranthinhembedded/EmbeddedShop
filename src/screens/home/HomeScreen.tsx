import React from 'react';

import EmbeddedShopApp from '../../EmbeddedShopApp';
import {ShopAppProvider} from '../../store/shopAppContext';

export default function HomeScreen(): React.JSX.Element {
  return (
    <ShopAppProvider>
      <EmbeddedShopApp />
    </ShopAppProvider>
  );
}

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import LoginExampleScreen from '../src/screens/examples/LoginExampleScreen';

test('renders the design system login example', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<LoginExampleScreen />);
  });
});

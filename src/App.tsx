import 'react-native-url-polyfill/auto';
import React from 'react';
import {View} from 'react-native';
import {QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import AppErrorBoundary from './components/common/AppErrorBoundary';
import {AppRuntimeBridge} from './components/common/AppRuntimeBridge';
import {AppToastProvider} from './components/common/AppToastProvider';
import {DesignSystemThemeProvider} from './design-system';
import AppNavigator from './navigation/AppNavigator';
import {queryClient} from './services/queryClient';

export default function App(): React.JSX.Element {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <DesignSystemThemeProvider>
            <AppToastProvider>
              <View className="flex-1">
                <AppRuntimeBridge />
                <AppNavigator />
              </View>
            </AppToastProvider>
          </DesignSystemThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

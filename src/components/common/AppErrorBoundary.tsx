import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';

import {getUserFriendlyErrorMessage} from '../../services/api';
import ErrorState from './ErrorState';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
  resetKey: number;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
    resetKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught an error', error, errorInfo);
  }

  private resetBoundary = () => {
    this.setState(previous => ({
      error: null,
      resetKey: previous.resetKey + 1,
    }));
  };

  render(): React.JSX.Element {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <ErrorState
              title="Something went wrong"
              description={getUserFriendlyErrorMessage(this.state.error)}
              actionLabel="Reload app"
              onRetry={this.resetBoundary}
            />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#061018',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});

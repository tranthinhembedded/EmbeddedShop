const state = {
  type: 'wifi',
  isConnected: true,
  isInternetReachable: true,
};

const addEventListener = jest.fn(listener => {
  if (typeof listener === 'function') {
    listener(state);
  }

  return jest.fn();
});

const fetch = jest.fn(async () => state);
const useNetInfo = jest.fn(() => state);

module.exports = {
  __esModule: true,
  default: {
    addEventListener,
    fetch,
    useNetInfo,
  },
  addEventListener,
  fetch,
  useNetInfo,
};

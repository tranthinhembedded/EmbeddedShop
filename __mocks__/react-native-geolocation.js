const getCurrentPosition = jest.fn(success => {
  if (typeof success === 'function') {
    success({
      coords: {
        latitude: 10.7769,
        longitude: 106.7009,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  }
});

const watchPosition = jest.fn(() => 1);
const clearWatch = jest.fn();
const stopObserving = jest.fn();
const requestAuthorization = jest.fn(async () => 'granted');

module.exports = {
  __esModule: true,
  default: {
    getCurrentPosition,
    watchPosition,
    clearWatch,
    stopObserving,
    requestAuthorization,
  },
  getCurrentPosition,
  watchPosition,
  clearWatch,
  stopObserving,
  requestAuthorization,
};

const React = require('react');
const {View} = require('react-native');

class Camera extends React.Component {
  static getCameraPermissionStatus() {
    return 'granted';
  }

  static requestCameraPermission() {
    return Promise.resolve('granted');
  }

  render() {
    return React.createElement(View, this.props, this.props.children);
  }
}

const useCameraDevice = position => ({
  position,
  hasFlash: position !== 'front',
});

module.exports = {
  Camera,
  useCameraDevice,
};

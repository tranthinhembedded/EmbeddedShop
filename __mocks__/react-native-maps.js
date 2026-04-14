const React = require('react');
const {View} = require('react-native');

const MapView = props => React.createElement(View, props, props.children);
const Marker = props => React.createElement(View, props, props.children);

module.exports = {
  __esModule: true,
  default: MapView,
  Marker,
  PROVIDER_GOOGLE: 'google',
};

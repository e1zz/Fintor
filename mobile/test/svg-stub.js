const React = require('react');

// Stands in for react-native-svg-transformer components in tests.
module.exports = function SvgStub(props) {
  return React.createElement('Svg', props);
};

const React = require('react');

function mockHost(name) {
  const Comp = React.forwardRef(({ children, ...props }, ref) =>
    React.createElement(name, { ...props, ref }, children),
  );
  Comp.displayName = name;
  return Comp;
}

module.exports = {
  View: mockHost('View'),
  Text: mockHost('Text'),
  TextInput: mockHost('TextInput'),
  Pressable: mockHost('Pressable'),
  ScrollView: mockHost('ScrollView'),
  Image: mockHost('Image'),
  ActivityIndicator: mockHost('ActivityIndicator'),
  KeyboardAvoidingView: mockHost('KeyboardAvoidingView'),
  Platform: {
    OS: 'ios',
    select: (spec) => spec.ios ?? spec.default,
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
};

// SVGR config for react-native-svg-transformer. Replaces its default svgoConfig,
// so the preset overrides below mirror the transformer's defaults.
module.exports = {
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            inlineStyles: { onlyMatchedOnce: false },
            removeViewBox: false,
            removeUnknownsAndDefaults: false,
            convertColors: false,
          },
        },
      },
      // Figma exports add style="display: block" to the root <svg>; it's a web-only
      // hint and not a valid React Native display value.
      { name: 'removeAttrs', params: { attrs: 'svg:style' } },
    ],
  },
};

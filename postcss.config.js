export default {
  plugins: {
    autoprefixer: {
      grid: true,
      flexbox: true,
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not ie <= 11'
      ]
    },
    'postcss-preset-env': {
      stage: 3,
      autoprefixer: false,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'media-query-ranges': true,
        'color-functional-notation': true,
        'custom-media-queries': true,
        'container-queries': true
      }
    }
  }
};

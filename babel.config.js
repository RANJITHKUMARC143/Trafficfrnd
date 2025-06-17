module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      '@babel/plugin-transform-export-namespace-from',
      [
        'module-resolver',
        {
          root: ['./app'],
          alias: {
            '@': './app',
            '@src': './src'
          }
        }
      ]
    ],
  };
}; 
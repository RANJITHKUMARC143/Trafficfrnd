module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
      [
        'module-resolver',
        {
          root: ['./app'],
          alias: {
            '@': './app',
            '@src': './src',
            '@cmp': './components',
            '@lib': './lib'
          }
        }
      ],
      // Reanimated plugin MUST be listed last
      'react-native-reanimated/plugin'
    ],
  };
}; 
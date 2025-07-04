const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add path alias configuration
config.resolver.alias = {
  '@': __dirname,
};

module.exports = config; 
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Add custom resolver configuration
config.resolver.unstable_enablePackageExports = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot, 'src'),
};
config.resolver.alias = {
  '@': path.resolve(projectRoot, 'src'),
};

module.exports = config; 
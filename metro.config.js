// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// Set the app root directory
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app');

const config = getDefaultConfig(projectRoot);

// Add custom transformer for SVG
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Add custom resolver configuration
config.resolver.unstable_enablePackageExports = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot),
};
config.resolver.alias = {
  '@': path.resolve(projectRoot, 'app'),
};

// Add watch folders
config.watchFolders = [workspaceRoot];

module.exports = config; 
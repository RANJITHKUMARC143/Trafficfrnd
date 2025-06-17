// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// Set the app root directory
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app');

const config = getDefaultConfig(projectRoot);

// Enable require.context
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// Configure resolver
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  disableHierarchicalLookup: true,
  extraNodeModules: {
    '@': path.resolve(projectRoot),
  },
  alias: {
    '@': path.resolve(projectRoot, 'app'),
  },
};

// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

module.exports = config; 
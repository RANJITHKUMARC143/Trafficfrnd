const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// Ensure Expo Router knows where the app root is
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app');

const config = getDefaultConfig(projectRoot);

// Resolve modules from both the app and the workspace root (monorepo)
config.resolver.unstable_enablePackageExports = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Helpful aliases: map '@' to the Delivery_app root so '@/context/*' works
config.resolver.alias = {
  '@': path.resolve(projectRoot),
};

// Watch the workspace root as well
config.watchFolders = [workspaceRoot];

module.exports = config;
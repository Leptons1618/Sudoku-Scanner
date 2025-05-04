const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true, // Enable inline requires for better memory usage
        },
      }),
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'png'),
      sourceExts: [...sourceExts, 'png'],
      extraNodeModules: {
        'assets': `${__dirname}/assets`,
      },
    },
    maxWorkers: 2, // Reduce number of workers to decrease memory usage
    cacheVersion: '1.0', // Cache version for Metro bundler
  };
})();

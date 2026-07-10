const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Windows: avoid EMFILE (too many open files) during large bundles.
config.maxWorkers = 2;

module.exports = config;

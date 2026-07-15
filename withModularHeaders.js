const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(file, 'utf8');
      
      if (!contents.includes('use_modular_headers!')) {
        contents = contents.replace(/(platform :ios.*)/, '$1\nuse_modular_headers!');
        fs.writeFileSync(file, contents);
      }
      return config;
    },
  ]);
};

module.exports = withModularHeaders;

const withPoilabsAndroid = require("./withPoilabsVdNavigationAndroid");
const withPoilabsIOS = require("./withPoilabsVdNavigationIOS");

function withPoilabsSDK(config, props) {
  config = withPoilabsAndroid(config, props);
  config = withPoilabsIOS(config);
  return config;
}

module.exports = withPoilabsSDK;

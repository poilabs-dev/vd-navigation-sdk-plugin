const withPoilabsVdNavigationAndroid = require("./withPoilabsVdNavigationAndroid");
const withPoilabsVdNavigationIOS = require("./withPoilabsVdNavigationIOS");

function withPoilabsVdNavigation(config, props) {
  config = withPoilabsVdNavigationAndroid(config, props);
  config = withPoilabsVdNavigationIOS(config, props);
  return config;
}

module.exports = withPoilabsVdNavigation;
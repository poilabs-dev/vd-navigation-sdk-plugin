const { createRunOncePlugin } = require("@expo/config-plugins");
const withPoilabsVdNavigation = require("./plugin");

const pkg = {
  name: "@poilabs-dev/vd-navigation-sdk-plugin",
  version: "1.0.0",
};

module.exports = createRunOncePlugin(
  withPoilabsVdNavigation,
  pkg.name,
  pkg.version
);

const { createRunOncePlugin } = require("@expo/config-plugins");
const withPoilabsSDK = require("./plugin");

const pkg = {
  name: "@poilabs-dev/vd-navigation-sdk-plugin",
  version: "1.0.27",
};

module.exports = createRunOncePlugin(
  withPoilabsSDK,
  pkg.name,
  pkg.version
);
const {
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const ANDROID_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.BLUETOOTH",
  "android.permission.BLUETOOTH_ADMIN",
  "android.permission.BLUETOOTH_CONNECT",
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.ACCESS_NETWORK_STATE",
];

function withPoilabsManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const { manifest } = mod.modResults;
    const permissions = manifest["uses-permission"] || [];

    ANDROID_PERMISSIONS.forEach((permission) => {
      if (!permissions.some((p) => p["$"]["android:name"] === permission)) {
        permissions.push({ $: { "android:name": permission } });
      }
    });

    manifest["uses-permission"] = permissions;

    return mod;
  });
}

function withPoilabsGradle(config, { jitpackToken }) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;

      const buildScript = path.join(root, "android/build.gradle");

      if (!fs.existsSync(buildScript)) {
        return modConfig;
      }

      let text = fs.readFileSync(buildScript, "utf8");

      text = text.replace(
        /maven\s*{\s*url\s*['"]https:\/\/(?:www\.)?jitpack\.io['"].*?}/g,
        ""
      );

      text = text.replace(
        /(allprojects\s*\{\s*repositories\s*\{)([\s\S]*?)(}\s*})/,
        (match, start, middle, end) => {
          if (middle.includes(`url "https://jitpack.io"`)) {
            return match;
          }

          return `${start}${middle}
    maven {
      url "https://jitpack.io"
      credentials { username = '${jitpackToken}' }
    }${end}`;
        }
      );

      fs.writeFileSync(buildScript, text);

      const appGradle = path.join(root, "android/app/build.gradle");

      if (!fs.existsSync(appGradle)) {
        return modConfig;
      }

      let appText = fs.readFileSync(appGradle, "utf8");

      appText = appText.replace(
        /implementation\s+['"]com\.github\.poiteam:Android-VD-Navigation-SDK:[^'"]+['"]/g,
        ""
      );

      appText = appText.replace(
        /(dependencies\s*\{)/,
        `$1\n    implementation 'com.github.poiteam:Android-VD-Navigation-SDK:7.0.5'`
      );

      fs.writeFileSync(appGradle, appText);

      const gradlePropertiesPath = path.join(root, "android/gradle.properties");

      if (fs.existsSync(gradlePropertiesPath)) {
        let gradleProps = fs.readFileSync(gradlePropertiesPath, "utf8");

        if (!gradleProps.includes("android.enableJetifier=")) {
          gradleProps +=
            "\n# Enable Jetifier for support library compatibility\nandroid.enableJetifier=true\n";
          fs.writeFileSync(gradlePropertiesPath, gradleProps);
        } else if (!gradleProps.includes("android.enableJetifier=true")) {
          gradleProps = gradleProps.replace(
            /android\.enableJetifier=false/g,
            "android.enableJetifier=true"
          );
          fs.writeFileSync(gradlePropertiesPath, gradleProps);
        }
      }

      return modConfig;
    },
  ]);
}
function withPoilabsNativeModules(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const pkgName =
        config.android?.package || config.android?.packageName || config.slug;

      if (!pkgName) {
        return modConfig;
      }

      const pkgPath = pkgName.replace(/\./g, "/");
      const dest = path.join(root, "android/app/src/main/java", pkgPath);

      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const sourceDir = path.join(
        root,
        "node_modules/@poilabs-dev/vd-navigation-sdk-plugin/src/android"
      );

      const moduleFiles = [
        "PoilabsVdNavigationModule.kt",
        "PoilabsPackage.java",
      ];

      moduleFiles.forEach((file) => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(dest, file);

        if (fs.existsSync(sourcePath)) {
          let content = fs.readFileSync(sourcePath, "utf8");
          content = content.replace(/__PACKAGE_NAME__/g, pkgName);
          fs.writeFileSync(destPath, content, "utf8");
        }
      });

      return modConfig;
    },
  ]);
}

function withPoilabsAndroid(config, props) {
  config = withPoilabsManifest(config);
  config = withPoilabsGradle(config, props);
  config = withPoilabsNativeModules(config);
  return config;
}

module.exports = withPoilabsAndroid;

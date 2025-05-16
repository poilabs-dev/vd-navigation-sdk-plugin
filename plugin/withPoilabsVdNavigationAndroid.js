const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  withProjectBuildGradle,
  withAppBuildGradle,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Android izinleri
const ANDROID_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.BLUETOOTH",
  "android.permission.BLUETOOTH_ADMIN",
  "android.permission.BLUETOOTH_CONNECT",
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_BACKGROUND_LOCATION",
];

// Android Manifest izinlerini ekleyen fonksiyon
function withPoilabsManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const { manifest } = mod.modResults;

    // İzinlerin eklenmesi
    const permissions = manifest["uses-permission"] || [];
    ANDROID_PERMISSIONS.forEach((permission) => {
      if (!permissions.some((p) => p.$["android:name"] === permission)) {
        permissions.push({ $: { "android:name": permission } });
      }
    });
    manifest["uses-permission"] = permissions;

    return mod;
  });
}

// JitPack ve dependencies ekleme
function withPoilabsGradle(config, { jitpackToken }) {
  // Proje seviyesi build.gradle
  config = withProjectBuildGradle(config, (mod) => {
    const buildGradle = mod.modResults.contents;

    if (!buildGradle.includes("jitpack.io")) {
      const jitpackRepo = `
          maven {
              url "https://jitpack.io"
              credentials { username = '${jitpackToken}' }
          }`;

      // Repositories bloğunu bul ve jitpack'i ekle
      mod.modResults.contents = buildGradle.replace(
        /allprojects\s*{\s*repositories\s*{/,
        `allprojects {\n    repositories {\n        ${jitpackRepo}`
      );
    }

    return mod;
  });

  // App seviyesi build.gradle
  config = withAppBuildGradle(config, (mod) => {
    const appBuildGradle = mod.modResults.contents;

    if (
      !appBuildGradle.includes("com.github.poiteam:Android-VD-Navigation-SDK")
    ) {
      const dependencyLine = `    implementation 'com.github.poiteam:Android-VD-Navigation-SDK:7.0.5'`;

      // Dependencies bloğunu bul ve implementasyonu ekle
      mod.modResults.contents = appBuildGradle.replace(
        /dependencies\s*{/,
        `dependencies {\n${dependencyLine}`
      );
    }

    return mod;
  });

  return config;
}

// Native modülleri ekleyen fonksiyon
function withPoilabsNativeModules(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const pkgName =
        config.android?.package || config.android?.packageName || config.slug;

      if (!pkgName) {
        throw new Error("No Android package name found in app.json");
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

      const moduleFiles = ["PoilabsVdNavigationModule.kt", "PoilabsPackage.kt"];

      moduleFiles.forEach((file) => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(dest, file);

        if (fs.existsSync(sourcePath)) {
          let content = fs.readFileSync(sourcePath, "utf8");
          content = content.replace(/__PACKAGE_NAME__/g, pkgName);
          fs.writeFileSync(destPath, content, "utf8");
        } else {
          console.warn(`Source file not found: ${sourcePath}`);
        }
      });

      return modConfig;
    },
  ]);
}

// MainApplication'a Poilabs Package'ı ekleme
function withPoilabsPackage(config) {
  return withMainApplication(config, (mod) => {
    const mainApplication = mod.modResults.contents;
    const pkgName =
      config.android?.package || config.android?.packageName || config.slug;

    // Import ifadesi ekle
    if (!mainApplication.includes(`import ${pkgName}.PoilabsPackage`)) {
      mod.modResults.contents = mainApplication.replace(
        /import com.facebook.react.ReactApplication;/,
        `import com.facebook.react.ReactApplication;\nimport ${pkgName}.PoilabsPackage;`
      );
    }

    // getPackages methoduna package'ı ekle
    if (!mainApplication.includes("new PoilabsPackage()")) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /return packages;/,
        `packages.add(new PoilabsPackage());\n      return packages;`
      );
    }

    return mod;
  });
}

// Proguard kurallarını ekleme
function withPoilabsProguard(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const proguardPath = path.join(root, "android/app/proguard-rules.pro");

      if (fs.existsSync(proguardPath)) {
        let proguardContent = fs.readFileSync(proguardPath, "utf8");

        const poilabsProguardRules = `
  # Poilabs VD Navigation SDK Proguard Rules
  -keep public interface com.poilabs.vd.nav.non.ui.jsonclient.ApiInterface
  -keep public interface com.poilabs.vd.nav.non.ui.jsonclient.VDResponseListener
  -keep class com.poilabs.vd.nav.non.ui.models.** { *; }
  -keep class com.poilabs.vd.nav.non.ui.manager.VDCallbacks
  -dontwarn com.poilabs.vd.nav.non.ui.Utils.**
  `;

        if (
          !proguardContent.includes("Poilabs VD Navigation SDK Proguard Rules")
        ) {
          proguardContent += poilabsProguardRules;
          fs.writeFileSync(proguardPath, proguardContent);
        }
      }

      return modConfig;
    },
  ]);
}

// Ana Android düzenlemesi fonksiyonu
function withPoilabsVdNavigationAndroid(config, props) {
  config = withPoilabsManifest(config);
  config = withPoilabsGradle(config, props);
  config = withPoilabsNativeModules(config);
  config = withPoilabsPackage(config);
  config = withPoilabsProguard(config);
  return config;
}

module.exports = withPoilabsVdNavigationAndroid;

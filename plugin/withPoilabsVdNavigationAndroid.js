const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

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
];

// Android Manifest izinlerini ekleyen fonksiyon
function withPoilabsManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const { manifest } = mod.modResults;
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

function withPoilabsGradle(config, { jitpackToken }) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const projectGradle = path.join(root, "android/build.gradle");
      let content = fs.readFileSync(projectGradle, "utf8");

      // JitPack durumlarını kontrol et
      const hasJitpackWithCredentials = /url\s+['"]https?:\/\/jitpack\.io['"][\s\S]*credentials\s*\{\s*username\s*=/.test(content);
      const hasPlainJitpack = /url\s+['"]https?:\/\/(www\.)?jitpack\.io['"]/.test(content);

      if (hasJitpackWithCredentials) {
        // Zaten credentials ile tanımlı, hiçbir şey yapma
      } else if (hasPlainJitpack) {
        // Plain JitPack bloğunu credential'lı blokla güncelle
        content = content.replace(
          /maven\s*\{\s*url\s+['"][^']*jitpack\.io['"][\s\S]*?\}/g,
          `maven {
            url "https://jitpack.io"
            credentials { username = '${jitpackToken}' }
          }`
        );
      } else {
        // JitPack yoksa google() ve mavenCentral() ardından ekle
        content = content.replace(
          /(allprojects\s*\{[\s\S]*?repositories\s*\{)([\s\S]*?)(\})/, // capture the opening block
          (_, start, repos, end) => {
            const repoBlock = `
        maven {
          url "https://jitpack.io"
          credentials { username = '${jitpackToken}' }
        }`;
            return `${start}${repos}${repoBlock}${end}`;
          }
        );
      }

      fs.writeFileSync(projectGradle, content, "utf8");

      // Gradle properties: AndroidX & Jetifier
      const propsPath = path.join(root, "android/gradle.properties");
      if (fs.existsSync(propsPath)) {
        let props = fs.readFileSync(propsPath, "utf8");
        const toAdd = [];
        if (!/android\.useAndroidX=true/.test(props)) toAdd.push("android.useAndroidX=true");
        if (!/android\.enableJetifier=true/.test(props)) toAdd.push("android.enableJetifier=true");
        if (toAdd.length) {
          props += `\n# Poilabs SDK için AndroidX & Jetifier` + toAdd.map(v => `\n${v}`).join("");
          fs.writeFileSync(propsPath, props, "utf8");
        }
      }

      // App-level build.gradle: bağımlılıklar ve multidex
      const appGradle = path.join(root, "android/app/build.gradle");
      if (fs.existsSync(appGradle)) {
        let text = fs.readFileSync(appGradle, "utf8");

        // resolutionStrategy
        if (!/resolutionStrategy/.test(text)) {
          text = text.replace(
            /android\s*\{/, 
            `android {\n    configurations.all {\n      resolutionStrategy {\n        force 'androidx.core:core:1.13.1'\n        force 'androidx.media:media:1.0.0'\n      }\n    }`
          );
        }

        // dependencies bloğu: Poilabs SDK ve multidex
        text = text.replace(
          /dependencies\s*\{/, 
          `dependencies {\n    implementation ('com.github.poiteam:Android-VD-Navigation-SDK:7.0.5') { exclude group: 'com.android.support' }\n    implementation 'androidx.appcompat:appcompat:1.6.1'\n    implementation 'androidx.core:core:1.13.1'\n    implementation 'androidx.media:media:1.0.0'\n    implementation 'androidx.multidex:multidex:2.0.1'`
        );

        // defaultConfig: multidexEnabled
        if (!/multiDexEnabled/.test(text)) {
          text = text.replace(
            /defaultConfig\s*\{/, `defaultConfig {\n        multiDexEnabled true`
          );
        }

        fs.writeFileSync(appGradle, text, "utf8");
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
      const pkgName = config.android?.package || config.android?.packageName || config.slug;
      if (!pkgName) throw new Error("No Android package name found in app.json");
      const destDir = path.join(root, "android/app/src/main/java", pkgName.replace(/\./g, "/"));
      fs.mkdirSync(destDir, { recursive: true });
      const sourceDir = path.join(root, "node_modules/@poilabs-dev/vd-navigation-sdk-plugin/src/android");
      ["PoilabsVdNavigationModule.kt", "PoilabsPackage.kt"].forEach((file) => {
        const src = path.join(sourceDir, file);
        const dst = path.join(destDir, file);
        if (fs.existsSync(src)) {
          let content = fs.readFileSync(src, "utf8");
          content = content.replace(/__PACKAGE_NAME__/g, pkgName);
          fs.writeFileSync(dst, content, "utf8");
        }
      });
      return modConfig;
    },
  ]);
}

// MainApplication'a Poilabs Package'ı ekle
function withPoilabsPackage(config) {
  return withMainApplication(config, (mod) => {
    const contents = mod.modResults.contents;
    const pkgImport = `import ${config.android?.package || config.slug}.PoilabsPackage;`;
    if (!contents.includes(pkgImport)) {
      mod.modResults.contents = contents.replace(
        /import com.facebook.react.ReactApplication;/,
        `import com.facebook.react.ReactApplication;\n${pkgImport}`
      );
    }
    if (!mod.modResults.contents.includes("new PoilabsPackage()")) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /return packages;/,
        `  packages.add(new PoilabsPackage());\n    return packages;`
      );
    }
    return mod;
  });
}

// Proguard kuralları ekle
function withPoilabsProguard(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const proguardPath = path.join(root, "android/app/proguard-rules.pro");
      if (fs.existsSync(proguardPath)) {
        let rules = fs.readFileSync(proguardPath, "utf8");
        const sdkRules = `\n# Poilabs VD Navigation SDK Proguard Rules\n-keep public interface com.poilabs.vd.nav.non.ui.jsonclient.ApiInterface\n-keep public interface com.poilabs.vd.nav.non.ui.jsonclient.VDResponseListener\n-keep class com.poilabs.vd.nav.non.ui.models.** { *; }\n-keep class com.poilabs.vd.nav.non.ui.manager.VDCallbacks\n-dontwarn com.poilabs.vd.nav.non.ui.Utils.**\n`;
        if (!rules.includes("Poilabs VD Navigation SDK Proguard Rules")) {
          fs.writeFileSync(proguardPath, rules + sdkRules, "utf8");
        }
      }
      return modConfig;
    },
  ]);
}

// Ana Android düzenlemesi oluştur
function withPoilabsVdNavigationAndroid(config, props) {
  config = withPoilabsManifest(config);
  config = withPoilabsGradle(config, props);
  config = withPoilabsNativeModules(config);
  config = withPoilabsPackage(config);
  config = withPoilabsProguard(config);
  return config;
}

module.exports = withPoilabsVdNavigationAndroid;

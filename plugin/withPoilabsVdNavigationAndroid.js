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
    console.log('📝 Android: Adding required permissions to AndroidManifest.xml');
    
    const { manifest } = mod.modResults;
    const permissions = manifest["uses-permission"] || [];
    
    ANDROID_PERMISSIONS.forEach((permission) => {
      if (!permissions.some((p) => p["$"]["android:name"] === permission)) {
        permissions.push({ $: { "android:name": permission } });
      }
    });
    
    manifest["uses-permission"] = permissions;
    console.log('✅ Android: All required permissions added to AndroidManifest.xml');
    
    return mod;
  });
}

function withPoilabsGradle(config, { jitpackToken }) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;

      // Modify project level build.gradle
      console.log('📝 Android: Adding jitpack repository to project build.gradle');
      const buildScript = path.join(root, "android/build.gradle");
      
      if (!fs.existsSync(buildScript)) {
        console.log('❌ Android: build.gradle not found at', buildScript);
        return modConfig;
      }
      
      let text = fs.readFileSync(buildScript, "utf8");

      const hasJitpackWithCredentials =
        text.includes('url "https://jitpack.io"') &&
        text.includes("credentials { username =");
      const hasPlainJitpack = text.includes("url 'https://www.jitpack.io'");

      if (!hasJitpackWithCredentials) {
        const repo = `
        jcenter()
        maven {
          url "https://jitpack.io"
          credentials { username = '${jitpackToken}' }
        }`;

        text = text.replace(
          /allprojects\s*{[\s\S]*?repositories\s*{([\s\S]*?)}/,
          (m, block) =>
            block.includes("jitpack.io")
              ? m.replace(
                  block,
                  block.replace(
                    /maven\s*{\s*url\s*['"]https:\/\/www\.jitpack\.io['"].*?}/g,
                    ""
                  )
                )
              : m.replace(block, `${block}\n${repo}`)
        );
        
        console.log('✅ Android: Added jitpack repository to build.gradle');
      } else {
        console.log('ℹ️ Android: Jitpack repository already exists in build.gradle');
        if (hasPlainJitpack) {
          text = text.replace(
            /maven\s*{\s*url\s*['"]https:\/\/www\.jitpack\.io['"].*?}/g,
            ""
          );
        }
      }

      fs.writeFileSync(buildScript, text);

      // Modify app level build.gradle
      console.log('📝 Android: Adding SDK dependency to app build.gradle');
      const appGradle = path.join(root, "android/app/build.gradle");
      
      if (!fs.existsSync(appGradle)) {
        console.log('❌ Android: app/build.gradle not found at', appGradle);
        return modConfig;
      }
      
      let appText = fs.readFileSync(appGradle, "utf8");

      if (!appText.includes("com.github.poiteam:Android-VD-Navigation-SDK")) {
        appText = appText.replace(
          /dependencies\s*{[^}]*\n/,
          (m) =>
            `${m}    implementation 'com.github.poiteam:Android-VD-Navigation-SDK:7.0.5'\n`
        );
        
        console.log('✅ Android: Added SDK dependency to app build.gradle');
      } else {
        console.log('ℹ️ Android: SDK dependency already exists in app build.gradle');
      }

      fs.writeFileSync(appGradle, appText);
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
        console.log('❌ Android: No package name found in app.json');
        return modConfig;
      }

      console.log('📝 Android: Creating native module files');
      const pkgPath = pkgName.replace(/\./g, "/");
      const dest = path.join(root, "android/app/src/main/java", pkgPath);

      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
        console.log('✅ Android: Created destination directory at', dest);
      }

      // Copy module files from node_modules
      const sourceDir = path.join(
        root,
        "node_modules/@poilabs-dev/vd-navigation-sdk-plugin/src/android"
      );

      const moduleFiles = ["PoilabsVdNavigationModule.kt", "PoilabsPackage.java"];

      moduleFiles.forEach((file) => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(dest, file);

        if (fs.existsSync(sourcePath)) {
          let content = fs.readFileSync(sourcePath, "utf8");
          content = content.replace(/__PACKAGE_NAME__/g, pkgName);
          fs.writeFileSync(destPath, content, "utf8");
          console.log(`✅ Android: Created ${file} at ${destPath}`);
        } else {
          console.log(`❌ Android: Source file not found: ${sourcePath}`);
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
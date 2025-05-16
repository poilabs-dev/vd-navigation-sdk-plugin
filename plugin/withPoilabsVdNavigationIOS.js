const {
  withInfoPlist,
  withXcodeProject,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Info.plist gerekli izinleri ekleme
function withPoilabsInfoPlist(config) {
  return withInfoPlist(config, (mod) => {
    const plist = mod.modResults;

    // Lokasyon izinleri
    plist.NSLocationWhenInUseUsageDescription =
      plist.NSLocationWhenInUseUsageDescription ||
      "We need your location to provide navigation services.";

    plist.NSLocationAlwaysUsageDescription =
      plist.NSLocationAlwaysUsageDescription ||
      "We need your location to provide navigation services even when the app is in background.";

    plist.NSLocationAlwaysAndWhenInUseUsageDescription =
      plist.NSLocationAlwaysAndWhenInUseUsageDescription ||
      "We need your location to provide navigation services.";

    // Bluetooth izinleri
    plist.NSBluetoothPeripheralUsageDescription =
      plist.NSBluetoothPeripheralUsageDescription ||
      "We need to use Bluetooth to detect beacons for indoor navigation.";

    plist.NSBluetoothAlwaysUsageDescription =
      plist.NSBluetoothAlwaysUsageDescription ||
      "We need to use Bluetooth to detect beacons for indoor navigation.";

    return mod;
  });
}

// Podfile düzenleme
function withPoilabsPodfile(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const podfilePath = path.join(root, "ios/Podfile");

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, "utf8");

        // use_frameworks! ekleme
        if (!podfileContent.includes("use_frameworks!")) {
          podfileContent = podfileContent.replace(
            /platform :ios/,
            "platform :ios\nuse_frameworks!"
          );
        }

        // PoilabsVdNavigation ekle
        if (!podfileContent.includes("'PoilabsVdNavigation'")) {
          podfileContent = podfileContent.replace(
            /target .+ do/,
            (match) => `${match}\n  pod 'PoilabsVdNavigation', '7.1.0'`
          );
        }

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return modConfig;
    },
  ]);
}

// Native modülleri ekleme
function withPoilabsNativeModules(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const projectName = modConfig.modRequest.projectName;

      // Create PoilabsModule directory
      const moduleDir = path.join(root, "ios", projectName, "PoilabsModule");
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      // Source directory for module files
      const sourceDir = path.join(
        root,
        "node_modules/@poilabs-dev/vd-navigation-sdk-plugin/src/ios"
      );

      // Copy module files
      const moduleFiles = [
        "PoilabsVdNavigationModule.h",
        "PoilabsVdNavigationModule.m",
      ];

      moduleFiles.forEach((file) => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(moduleDir, file);

        if (fs.existsSync(sourcePath)) {
          const content = fs.readFileSync(sourcePath, "utf8");
          fs.writeFileSync(destPath, content);
        } else {
          console.warn(`Source file not found: ${sourcePath}`);
        }
      });

      // Create PoilabsVdNavigationManager.swift
      const swiftManagerPath = path.join(
        moduleDir,
        "PoilabsVdNavigationManager.swift"
      );
      const swiftManagerContent = `
  import UIKit
  import PoilabsVdNavigationUI
  
  @objc class PoilabsVdNavigationManager: NSObject {
      @objc func showPoilabsVdNavigation(applicationId: String, applicationSecret: String, uniqueIdentifier: String, language: String, completion: @escaping (Bool) -> Void) {
          let _ = PoilabsVdNavigationUI(withApplicationID: applicationId, 
                                        withApplicationSecret: applicationSecret, 
                                        withUniqueIdentifier: uniqueIdentifier, 
                                        lang: language) { controller in
              DispatchQueue.main.async {
                  let keyWindow = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first
                  let topController = keyWindow?.rootViewController
                  topController?.present(controller, animated: true, completion: nil)
                  completion(true)
              }
          }
      }
      
      @objc func showPoilabsVdNavigationWithCustomConfig(configUrl: String, applicationId: String, applicationSecret: String, uniqueIdentifier: String, language: String, completion: @escaping (Bool) -> Void) {
          let _ = PoilabsVdNavigationUI(configUrl: configUrl, 
                                        withApplicationID: applicationId, 
                                        withApplicationSecret: applicationSecret, 
                                        withUniqueIdentifier: uniqueIdentifier, 
                                        lang: language) { controller in
              DispatchQueue.main.async {
                  let keyWindow = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first
                  let topController = keyWindow?.rootViewController
                  topController?.present(controller, animated: true, completion: nil)
                  completion(true)
              }
          }
      }
  }
  `;

      fs.writeFileSync(swiftManagerPath, swiftManagerContent);

      // Create Bridge Header
      const bridgingHeaderPath = path.join(
        root,
        "ios",
        projectName,
        `${projectName}-Bridging-Header.h`
      );
      let bridgingHeaderContent = "";

      if (fs.existsSync(bridgingHeaderPath)) {
        bridgingHeaderContent = fs.readFileSync(bridgingHeaderPath, "utf8");
      }

      if (
        !bridgingHeaderContent.includes(
          "PoilabsVdNavigationUI/PoilabsVdNavigationUI.h"
        )
      ) {
        bridgingHeaderContent +=
          "\n#import <PoilabsVdNavigationUI/PoilabsVdNavigationUI.h>\n";
        fs.writeFileSync(bridgingHeaderPath, bridgingHeaderContent);
      }

      // Add files to AppDelegate for background updates
      const appDelegatePath = path.join(
        root,
        "ios",
        projectName,
        "AppDelegate.mm"
      );
      const appDelegateMPath = path.join(
        root,
        "ios",
        projectName,
        "AppDelegate.m"
      );
      const appDelegateSwiftPath = path.join(
        root,
        "ios",
        projectName,
        "AppDelegate.swift"
      );

      let appDelegateFilePath = "";
      if (fs.existsSync(appDelegatePath)) {
        appDelegateFilePath = appDelegatePath;
      } else if (fs.existsSync(appDelegateMPath)) {
        appDelegateFilePath = appDelegateMPath;
      } else if (fs.existsSync(appDelegateSwiftPath)) {
        appDelegateFilePath = appDelegateSwiftPath;
      }

      if (appDelegateFilePath && fs.existsSync(appDelegateFilePath)) {
        let appDelegateContent = fs.readFileSync(appDelegateFilePath, "utf8");

        // Swift AppDelegate için
        if (appDelegateFilePath.endsWith(".swift")) {
          if (!appDelegateContent.includes("import PoilabsVdNavigationUI")) {
            appDelegateContent = appDelegateContent.replace(
              /import UIKit/,
              "import UIKit\nimport PoilabsVdNavigationUI"
            );
          }

          if (!appDelegateContent.includes("didFinishLaunchingWithOptions")) {
            const applicationDidFinishCode = `
      func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
          // Expo initialization code...
          return true
      }`;

            appDelegateContent += applicationDidFinishCode;
          }
        }
        // Objective-C AppDelegate için
        else {
          if (
            !appDelegateContent.includes(
              "<PoilabsVdNavigationUI/PoilabsVdNavigationUI.h>"
            )
          ) {
            appDelegateContent = appDelegateContent.replace(
              /#import "AppDelegate.h"/,
              '#import "AppDelegate.h"\n#import <PoilabsVdNavigationUI/PoilabsVdNavigationUI.h>'
            );
          }
        }

        fs.writeFileSync(appDelegateFilePath, appDelegateContent);
      }

      return modConfig;
    },
  ]);
}

// Xcode project şeması düzenleme
function withPoilabsXcodeProject(config) {
  return withXcodeProject(config, async (mod) => {
    const xcodeProject = mod.modResults;

    // Enable Swift support
    xcodeProject.addBuildProperty("SWIFT_VERSION", "5.0");

    // Add Swift files to compile sources
    const pbxBuildFileSection = xcodeProject.pbxBuildFileSection();
    const pbxFileReferenceSection = xcodeProject.pbxFileReferenceSection();

    // Add frameworks
    xcodeProject.addFramework("PoilabsVdNavigationCore.xcframework", {
      link: true,
      embed: true,
    });

    xcodeProject.addFramework("PoilabsVdNavigationUI.xcframework", {
      link: true,
      embed: true,
    });

    return mod;
  });
}

// Ana iOS düzenleme fonksiyonu
function withPoilabsVdNavigationIOS(config, props) {
  config = withPoilabsInfoPlist(config);
  config = withPoilabsPodfile(config);
  config = withPoilabsNativeModules(config);
  config = withPoilabsXcodeProject(config);
  return config;
}

module.exports = withPoilabsVdNavigationIOS;

const { withInfoPlist, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withPoilabsInfoPlist(config) {
  return withInfoPlist(config, (mod) => {
    const plist = mod.modResults;

    // Location permissions
    plist.NSLocationUsageDescription =
      plist.NSLocationUsageDescription ||
      "Location permission is required to provide navigation services for visually disabled users";

    plist.NSLocationWhenInUseUsageDescription =
      plist.NSLocationWhenInUseUsageDescription ||
      "Location permission is required to provide navigation services for visually disabled users";

    plist.NSLocationAlwaysUsageDescription =
      plist.NSLocationAlwaysUsageDescription ||
      "Location permission is required to provide navigation services for visually disabled users";

    plist.NSLocationAlwaysAndWhenInUseUsageDescription =
      plist.NSLocationAlwaysAndWhenInUseUsageDescription ||
      "Location permission is required to provide navigation services for visually disabled users";

    // Bluetooth permissions
    plist.NSBluetoothAlwaysUsageDescription =
      plist.NSBluetoothAlwaysUsageDescription ||
      "Bluetooth is required to detect beacons for indoor navigation";

    plist.NSBluetoothPeripheralUsageDescription =
      plist.NSBluetoothPeripheralUsageDescription ||
      "Bluetooth is required to detect beacons for indoor navigation";

    return mod;
  });
}

function withPoilabsPodfile(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const podfile = path.join(modConfig.modRequest.projectRoot, "ios", "Podfile");

      if (!fs.existsSync(podfile)) {
        return modConfig;
      }

      let podText = fs.readFileSync(podfile, "utf8");

      if (!podText.match(/use_frameworks! *(:linkage *=> *:static)?/)) {
        const match = podText.match(/(^|\n)(\s*)use_react_native!/)
        if (match) {
          podText = podText.replace(
            /(^|\n)(\s*)use_react_native!/,
            `\nuse_frameworks! :linkage => :static\n$2use_react_native!`
          );
        } else {
          const platformMatch = podText.match(/(^|\n)(\s*)platform :ios.*\n/);
          if (platformMatch) {
            podText = podText.replace(
              platformMatch[0],
              `${platformMatch[0]}use_frameworks! :linkage => :static\n`
            );
          } else {
            podText = `use_frameworks! :linkage => :static\n${podText}`;
          }
        }
      }

      if (!podText.includes(`pod 'PoilabsVdNavigation'`)) {
        const targetMatch = podText.match(/target ['"][^'"]+['"] do/);
        if (targetMatch) {
          podText = podText.replace(
            targetMatch[0],
            `${targetMatch[0]}\n  pod 'PoilabsVdNavigation'`
          );
        }
      }

      fs.writeFileSync(podfile, podText, "utf8");
      return modConfig;
    },
  ]);
}


function withPoilabsNativeModules(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const projectName = modConfig.modRequest.projectName || "PoilabsApp";

      const moduleDir = path.join(root, "ios", projectName, "PoilabsModule");
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      const managerSwiftFile = path.join(
        moduleDir,
        "PoilabsVdNavigationManager.swift"
      );
      if (!fs.existsSync(managerSwiftFile)) {
        const swiftContent = `import UIKit
import PoilabsVdNavigationUI

@objc class PoilabsVdNavigationManager: NSObject {
    @objc func showPoilabsVdNavigation() {
        let appId = UserDefaults.standard.string(forKey: "poilabs_app_id") ?? "APPLICATION_ID"
        let secret = UserDefaults.standard.string(forKey: "poilabs_app_secret") ?? "APPLICATION_SECRET"
        let uniqueIdentifier = UserDefaults.standard.string(forKey: "poilabs_unique_id") ?? "UNIQUE_ID"
        
        let _ = PoilabsVdNavigationUI(withApplicationID: appId, 
                                    withApplicationSecret: secret, 
                                    withUniqueIdentifier: uniqueIdentifier) { controller in
            DispatchQueue.main.async {
                let keyWindow = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first
                let topController = keyWindow?.rootViewController
                topController?.show(controller, sender: self)
            }
        }
    }
}`;
        fs.writeFileSync(managerSwiftFile, swiftContent);
      }

      const moduleHeaderFile = path.join(
        moduleDir,
        "PoilabsVdNavigationModule.h"
      );
      const headerContent = `#import <React/RCTBridgeModule.h>

@interface PoilabsVdNavigationModule : NSObject <RCTBridgeModule>
@end`;
      fs.writeFileSync(moduleHeaderFile, headerContent);

      const moduleImplFile = path.join(
        moduleDir,
        "PoilabsVdNavigationModule.m"
      );
      const implContent = `#import "PoilabsVdNavigationModule.h"
#import "${projectName}-Swift.h"

@implementation PoilabsVdNavigationModule

RCT_EXPORT_MODULE(PoilabsVdNavigationModule);

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_METHOD(initialize:(NSString *)applicationId
                  secretKey:(NSString *)applicationSecretKey
                  uniqueId:(NSString *)uniqueId
                  language:(NSString *)language
                  title:(NSString *)title
                  configUrl:(NSString *)configUrl
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [[NSUserDefaults standardUserDefaults] setObject:applicationId forKey:@"poilabs_app_id"];
    [[NSUserDefaults standardUserDefaults] setObject:applicationSecretKey forKey:@"poilabs_app_secret"];
    [[NSUserDefaults standardUserDefaults] setObject:uniqueId forKey:@"poilabs_unique_id"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    resolve(@(YES));
}

RCT_EXPORT_METHOD(showPoilabsVdNavigation:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        PoilabsVdNavigationManager* vdManager = [[PoilabsVdNavigationManager alloc] init];
        [vdManager showPoilabsVdNavigation];
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(getUserLocation:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSDictionary *location = @{
        @"latitude": @(0.0),
        @"longitude": @(0.0),
        @"floorLevel": [NSNull null]
    };
    resolve(location);
}

RCT_EXPORT_METHOD(updateUniqueId:(NSString *)uniqueId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [[NSUserDefaults standardUserDefaults] setObject:uniqueId forKey:@"poilabs_unique_id"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    resolve(@(YES));
}

@end`;
      fs.writeFileSync(moduleImplFile, implContent);

      return modConfig;
    },
  ]);
}

function withPoilabsBridgingHeader(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const root = modConfig.modRequest.projectRoot;
      const projectName = modConfig.modRequest.projectName || "PoilabsApp";

      const bridgingHeaderPath = path.join(
        root,
        "ios",
        projectName,
        `${projectName}-Bridging-Header.h`
      );
      let bridgingHeaderAlternativePath = path.join(
        root,
        "ios",
        `${projectName}-Bridging-Header.h`
      );

      let headerPath = null;

      if (fs.existsSync(bridgingHeaderPath)) {
        headerPath = bridgingHeaderPath;
      } else if (fs.existsSync(bridgingHeaderAlternativePath)) {
        headerPath = bridgingHeaderAlternativePath;
      } else {
        const iosDir = path.join(root, "ios");
        const files = fs.readdirSync(iosDir);

        for (const file of files) {
          if (file.includes("-Bridging-Header.h")) {
            headerPath = path.join(iosDir, file);
            break;
          }
        }

        if (!headerPath) {
          const subDirs = files.filter((file) =>
            fs.statSync(path.join(iosDir, file)).isDirectory()
          );

          for (const dir of subDirs) {
            const subDirPath = path.join(iosDir, dir);
            const subFiles = fs.readdirSync(subDirPath);

            for (const file of subFiles) {
              if (file.includes("-Bridging-Header.h")) {
                headerPath = path.join(subDirPath, file);
                break;
              }
            }

            if (headerPath) break;
          }
        }
      }

      if (headerPath) {
        let headerContent = fs.readFileSync(headerPath, "utf8");

        if (
          !headerContent.includes(
            "PoilabsVdNavigationUI/PoilabsVdNavigationUI.h"
          )
        ) {
          headerContent +=
            "\n#import <PoilabsVdNavigationUI/PoilabsVdNavigationUI.h>\n";

          fs.writeFileSync(headerPath, headerContent);
        } else {
        }
      }

      return modConfig;
    },
  ]);
}

function withPoilabsIOS(config) {
  config = withPoilabsInfoPlist(config);
  config = withPoilabsPodfile(config);
  config = withPoilabsNativeModules(config);
  config = withPoilabsBridgingHeader(config);
  return config;
}

module.exports = withPoilabsIOS;

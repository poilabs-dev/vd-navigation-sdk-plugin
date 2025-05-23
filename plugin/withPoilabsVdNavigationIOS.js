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
      console.log("📝 iOS: Modifying Podfile");
      const podfile = path.join(
        modConfig.modRequest.projectRoot,
        "ios/Podfile"
      );

      if (!fs.existsSync(podfile)) {
        console.log("❌ iOS: Podfile not found at", podfile);
        return modConfig;
      }

      let podText = fs.readFileSync(podfile, "utf8");

      // Add use_frameworks! before use_react_native!
      if (!podText.includes("use_frameworks!")) {
        console.log("📝 iOS: Adding use_frameworks! to Podfile");

        if (podText.includes("use_react_native!")) {
          podText = podText.replace(
            /use_react_native!/,
            "use_frameworks!\nuse_react_native!"
          );
        } else if (podText.includes("platform :ios")) {
          podText = podText.replace(
            /platform :ios/,
            "use_frameworks!\nplatform :ios"
          );
        } else {
          podText = "use_frameworks!\n" + podText;
        }
      }

      // Add PoilabsVdNavigation pod
      if (!podText.includes("pod 'PoilabsVdNavigation'")) {
        console.log("📝 iOS: Adding PoilabsVdNavigation pod");

        if (podText.includes("target ")) {
          podText = podText.replace(
            /target ['"][^'"]+['"] do/,
            (m) => `${m}\n  pod 'PoilabsVdNavigation', '7.1.0'`
          );
        } else {
          const lastEndIndex = podText.lastIndexOf("end");
          if (lastEndIndex !== -1) {
            podText =
              podText.substring(0, lastEndIndex) +
              "  pod 'PoilabsVdNavigation', '7.1.0'\n" +
              podText.substring(lastEndIndex);
          } else {
            podText += "\npod 'PoilabsVdNavigation', '7.1.0'\n";
          }
        }
      }

      fs.writeFileSync(podfile, podText);
      console.log("✅ iOS: Podfile modified successfully");

      return modConfig;
    },
  ]);
}

function withPoilabsNativeModules(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      console.log("📝 iOS: Creating native bridge files");
      const root = modConfig.modRequest.projectRoot;
      const projectName = modConfig.modRequest.projectName || "PoilabsApp";

      // Create Swift manager file
      const managerSwiftFile = path.join(
        root,
        "ios",
        "PoilabsVdNavigationManager.swift"
      );
      if (!fs.existsSync(managerSwiftFile)) {
        const swiftContent = `
import UIKit
import PoilabsVdNavigationUI
import CoreLocation

@objc class PoilabsVdNavigationManager: NSObject, PoilabsVdNavigationDelegate {
    
    // Controller referansını tutmak için bir property
    private var navigationController: UIViewController?
    
    @objc public func showPoilabsVdNavigation() {
        print("🟢 showPoilabsVdNavigation called in Swift")
        
        let appId = UserDefaults.standard.string(forKey: "poilabs_app_id") ?? "APPLICATION_ID"
        let secret = UserDefaults.standard.string(forKey: "poilabs_app_secret") ?? "APPLICATION_SECRET"
        let uniqueId = UserDefaults.standard.string(forKey: "poilabs_unique_id") ?? "UNIQUE_ID"
        
        print("🟢 Using credentials: \(appId), \(secret), \(uniqueId)")
        
        // SDK'yı basitçe başlat
        let navigationUI = PoilabsVdNavigationUI(withApplicationID: appId,
                             withApplicationSecret: secret,
                             withUniqueIdentifier: uniqueId) { [weak self] controller in
            
            print("🟢 Controller received, saving and presenting")
            self?.navigationController = controller
            
            // SDK'nın içyapısını anlamak için controller'ı inceleyelim
            print("🔍 Controller class: \(type(of: controller))")
            
            // Delegate ayarlamayı deneyelim - farklı olası yolları
            if let navController = controller as? UINavigationController {
                print("🔍 Controller is a UINavigationController")
                if let topVC = navController.topViewController {
                    print("🔍 Top view controller class: \(type(of: topVC))")
                    
                    // Reflection kullanarak delegate property'sini bulmayı deneyelim
                    let mirror = Mirror(reflecting: topVC)
                    for child in mirror.children {
                        if child.label == "delegate" {
                            print("🟢 Found delegate property")
                        }
                    }
                    
                    // Doğrudan property atamayı deneyelim
                    if let sdkVC = topVC as? NSObject {
                        // KVC yöntemi ile property atama
                        let selectorName = "setDelegate:"
                        let selector = NSSelectorFromString(selectorName)
                        if sdkVC.responds(to: selector) {
                            print("🟢 Setting delegate using selector: \(selectorName)")
                            sdkVC.perform(selector, with: self)
                        } else {
                            print("⚠️ Controller does not respond to \(selectorName)")
                            
                            // Alternatif olarak, diğer olası delegate setter metotlarını deneyin
                            let possibleSelectors = ["setNavigationDelegate:", "setVdDelegate:", "setLocationDelegate:"]
                            for sel in possibleSelectors {
                                let altSelector = NSSelectorFromString(sel)
                                if sdkVC.responds(to: altSelector) {
                                    print("🟢 Found alternative delegate setter: \(sel)")
                                    sdkVC.perform(altSelector, with: self)
                                    break
                                }
                            }
                        }
                    }
                }
            }
            
            DispatchQueue.main.async {
                let keyWindow = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first
                let topController = keyWindow?.rootViewController
                topController?.present(controller, animated: true, completion: nil)
            }
        }
    }
    
    // PoilabsVdNavigationDelegate protokolünün metodu
    func poilabsVdNavigation(didUpdate userLocation: CLLocationCoordinate2D) {
        print("📍 REAL LOCATION from SDK: \(userLocation.latitude), \(userLocation.longitude)")
        
        // UserDefaults'a konum bilgisini kaydet
        UserDefaults.standard.set(userLocation.latitude, forKey: "poilabs_location_latitude")
        UserDefaults.standard.set(userLocation.longitude, forKey: "poilabs_location_longitude") 
        UserDefaults.standard.set(true, forKey: "poilabs_has_location")
        UserDefaults.standard.synchronize()
        
        // Notification gönder
        NotificationCenter.default.post(
            name: NSNotification.Name("PoilabsLocationUpdated"),
            object: nil
        )
    }
}      
`;
        fs.writeFileSync(managerSwiftFile, swiftContent);
        console.log(
          `✅ iOS: Created PoilabsVdNavigationManager.swift at ${managerSwiftFile}`
        );
      }

      // Create bridge header file
      const bridgeHeaderFile = path.join(
        root,
        "ios",
        "PoilabsNavigationBridge.h"
      );
      if (!fs.existsSync(bridgeHeaderFile)) {
        const headerContent = `
#ifndef PoilabsNavigationBridge_h
#define PoilabsNavigationBridge_h
#import <React/RCTBridgeModule.h>
        
@interface PoilabsNavigationBridge : NSObject <RCTBridgeModule>
-(void) showPoilabsVdNavigation;
@end
        
#endif
`;
        fs.writeFileSync(bridgeHeaderFile, headerContent);
        console.log(
          `✅ iOS: Created PoilabsNavigationBridge.h at ${bridgeHeaderFile}`
        );
      }

      // Create bridge implementation file
      const bridgeImplFile = path.join(
        root,
        "ios",
        "PoilabsNavigationBridge.m"
      );
      if (!fs.existsSync(bridgeImplFile)) {
        const implContent = `
#import <Foundation/Foundation.h>
#import "PoilabsNavigationBridge.h"
#import "${projectName}-Swift.h"

@implementation PoilabsNavigationBridge

RCT_EXPORT_MODULE(PoilabsNavigationBridge);

RCT_EXPORT_METHOD(showPoilabsVdNavigation) {
  
  dispatch_async(dispatch_get_main_queue(), ^{
    
    PoilabsVdNavigationManager* vdManager = [[PoilabsVdNavigationManager alloc] init];
    if (vdManager) {
      [vdManager showPoilabsVdNavigation];
    }
  });
}

@end
`;
        fs.writeFileSync(bridgeImplFile, implContent);
        console.log(
          `✅ iOS: Created PoilabsNavigationBridge.m at ${bridgeImplFile}`
        );
      }

      // Create module files
      const moduleDir = path.join(root, "ios", projectName, "PoilabsModule");
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
        console.log(`✅ iOS: Created PoilabsModule directory at ${moduleDir}`);
      }

      // Copy native module files from the plugin
      const sourceDir = path.join(
        root,
        "node_modules/@poilabs-dev/vd-navigation-sdk-plugin/src/ios"
      );

      const moduleFiles = [
        "PoilabsVdNavigationModule.h",
        "PoilabsVdNavigationModule.m",
      ];

      moduleFiles.forEach((file) => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(moduleDir, file);

        if (fs.existsSync(sourcePath)) {
          const content = fs.readFileSync(sourcePath, "utf8");
          fs.writeFileSync(destPath, content, "utf8");
          console.log(`✅ iOS: Created ${file} at ${destPath}`);
        } else {
          console.log(`⚠️ iOS: Source file not found at ${sourcePath}`);
          // Create default implementation if source doesn't exist
          if (file.endsWith(".h")) {
            const headerContent = `
#ifndef ${file.replace(".h", "")}_h
#define ${file.replace(".h", "")}_h

#import <React/RCTBridgeModule.h>

@interface PoilabsVdNavigationModule : NSObject <RCTBridgeModule>
@end

#endif
`;
            fs.writeFileSync(destPath, headerContent, "utf8");
            console.log(`✅ iOS: Created default ${file} at ${destPath}`);
          } else if (file.endsWith(".m")) {
            const implContent = `
#import "PoilabsVdNavigationModule.h"
#import <PoilabsVdNavigationUI/PoilabsVdNavigationUI.h>

@implementation PoilabsVdNavigationModule

RCT_EXPORT_MODULE(PoilabsVdNavigationModule);

RCT_EXPORT_METHOD(initialize:(NSString *)applicationId
                  secretKey:(NSString *)applicationSecretKey
                  uniqueId:(NSString *)uniqueId
                  language:(NSString *)language
                  title:(NSString *)title
                  configUrl:(NSString *)configUrl
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // Store credentials for later use
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

@end
`;
            fs.writeFileSync(destPath, implContent, "utf8");
            console.log(`✅ iOS: Created default ${file} at ${destPath}`);
          }
        }
      });

      console.log("✅ iOS: Native bridge files created successfully");
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

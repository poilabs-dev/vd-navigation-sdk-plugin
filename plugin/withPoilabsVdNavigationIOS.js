const { withInfoPlist, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withPoilabsInfoPlist(config) {
  return withInfoPlist(config, (mod) => {
    console.log('📝 iOS: Adding required permissions to Info.plist');
    
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
      console.log('📝 iOS: Modifying Podfile');
      const podfile = path.join(
        modConfig.modRequest.projectRoot,
        "ios/Podfile"
      );
      
      if (!fs.existsSync(podfile)) {
        console.log('❌ iOS: Podfile not found at', podfile);
        return modConfig;
      }
      
      let podText = fs.readFileSync(podfile, "utf8");

      // Add use_frameworks! before use_react_native!
      if (!podText.includes("use_frameworks!")) {
        console.log('📝 iOS: Adding use_frameworks! to Podfile');
        
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
        console.log('📝 iOS: Adding PoilabsVdNavigation pod');
        
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
      console.log('✅ iOS: Podfile modified successfully');
      
      return modConfig;
    },
  ]);
}

function withPoilabsNativeModules(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      console.log('📝 iOS: Creating native bridge files');
      const root = modConfig.modRequest.projectRoot;
      const projectName = modConfig.modRequest.projectName || 'PoilabsApp';
      
      // Create Swift manager file
      const managerSwiftFile = path.join(root, "ios", "PoilabsVdNavigationManager.swift");
      if (!fs.existsSync(managerSwiftFile)) {
        const swiftContent = `
import UIKit
import PoilabsVdNavigationUI
@objc class PoilabsVdNavigationManager: NSObject {
  @objc func showPoilabsVdNavigation() {
    let appId = "YOUR_APPLICATION_ID"
    let secret = "YOUR_APPLICATION_SECRET"
    let uniqueIdentifier = "UNIQUE_ID"
        
    let _ = PoilabsVdNavigationUI(withApplicationID: appId, withApplicationSecret: secret, withUniqueIdentifier: uniqueIdentifier) { controller in
      DispatchQueue.main.async {
          let keyWindow = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first
          let topController = keyWindow?.rootViewController
          topController?.show(controller, sender: self)
      }
    }
  }
}        
`;
        fs.writeFileSync(managerSwiftFile, swiftContent);
        console.log(`✅ iOS: Created PoilabsVdNavigationManager.swift at ${managerSwiftFile}`);
      }
      
      // Create bridge header file
      const bridgeHeaderFile = path.join(root, "ios", "PoilabsNavigationBridge.h");
      if (!fs.existsSync(bridgeHeaderFile)) {
        const headerContent = `
#ifndef PoilabsNavigationBridge_h
#define PoilabsNavigationBridge_h

#import <React/RCTBridgeModule.h>

@interface PoilabsNavigationBridge : NSObject <RCTBridgeModule>
-(void) showPoilabsVdNavigation;
@end

#endif /* PoilabsNavigationBridge_h */
`;
        fs.writeFileSync(bridgeHeaderFile, headerContent);
        console.log(`✅ iOS: Created PoilabsNavigationBridge.h at ${bridgeHeaderFile}`);
      }
      
      // Create bridge implementation file
      const bridgeImplFile = path.join(root, "ios", "PoilabsNavigationBridge.m");
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
    [vdManager showPoilabsVdNavigation];
  });
}

@end
`;
        fs.writeFileSync(bridgeImplFile, implContent);
        console.log(`✅ iOS: Created PoilabsNavigationBridge.m at ${bridgeImplFile}`);
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
        "PoilabsVdNavigationModule.m"
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
          if (file.endsWith('.h')) {
            const headerContent = `
#ifndef ${file.replace('.h', '')}_h
#define ${file.replace('.h', '')}_h

#import <React/RCTBridgeModule.h>

@interface PoilabsVdNavigationModule : NSObject <RCTBridgeModule>
@end

#endif
`;
            fs.writeFileSync(destPath, headerContent, "utf8");
            console.log(`✅ iOS: Created default ${file} at ${destPath}`);
          } else if (file.endsWith('.m')) {
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
      
      console.log('✅ iOS: Native bridge files created successfully');
      return modConfig;
    },
  ]);
}

function withPoilabsIOS(config) {
  config = withPoilabsInfoPlist(config);
  config = withPoilabsPodfile(config);
  config = withPoilabsNativeModules(config);
  return config;
}

module.exports = withPoilabsIOS;
#import "PoilabsVdNavigationModule.h"
#import "PoilabsNavigationBridge.h"

@implementation PoilabsVdNavigationModule

RCT_EXPORT_MODULE(PoilabsVdNavigationModule);

// Define instance variables to store credentials
NSString *applicationIdValue;
NSString *applicationSecretValue;
NSString *uniqueIdValue;
NSString *languageValue;
NSString *titleValue;
NSString *configUrlValue;

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
    // Store the credentials for later use
    applicationIdValue = applicationId;
    applicationSecretValue = applicationSecretKey;
    uniqueIdValue = uniqueId;
    languageValue = language ?: @"en";
    titleValue = title;
    configUrlValue = configUrl;
    
    // Update the PoilabsVdNavigationManager.swift file with these values
    // For now, just resolve true
    resolve(@(YES));
}

RCT_EXPORT_METHOD(showPoilabsVdNavigation:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (!applicationIdValue || !applicationSecretValue || !uniqueIdValue) {
        reject(@"not_initialized", @"The SDK has not been initialized", nil);
        return;
    }
    
    dispatch_async(dispatch_get_main_queue(), ^{
        // Use the PoilabsNavigationBridge which is already set up
        PoilabsNavigationBridge *bridge = [[PoilabsNavigationBridge alloc] init];
        [bridge showPoilabsVdNavigation];
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(getUserLocation:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Return placeholder location
    NSDictionary *location = @{
        @"latitude": @(0.0),
        @"longitude": @(0.0),
        @"floorLevel": [NSNull null]
    };
    resolve(location);
}

@end
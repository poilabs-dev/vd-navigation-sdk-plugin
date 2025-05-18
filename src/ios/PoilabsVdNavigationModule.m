
#import "PoilabsVdNavigationModule.h"
#import <PoilabsVdNavigationUI/PoilabsVdNavigationUI.h>

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
    return NO; // or YES if you need to access UIKit classes
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
    languageValue = language;
    titleValue = title;
    configUrlValue = configUrl;
    
    // For now, just resolve true as initialization is delayed until we show the UI
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
        // Normally we'd use the PoilabsNavigationBridge here
        // But we also provide direct access to the SDK for completeness
        void (^completionBlock)(UIViewController *) = ^(UIViewController *controller) {
            UIViewController *rootViewController = [UIApplication sharedApplication].keyWindow.rootViewController;
            if (rootViewController) {
                [rootViewController presentViewController:controller animated:YES completion:nil];
                resolve(@(YES));
            } else {
                reject(@"no_root_view", @"Could not find root view controller", nil);
            }
        };
        
        if (configUrlValue && ![configUrlValue isEqualToString:@""]) {
            [PoilabsVdNavigationUI.new initWithConfigUrl:configUrlValue
                                        withApplicationID:applicationIdValue
                                     withApplicationSecret:applicationSecretValue
                                     withUniqueIdentifier:uniqueIdValue
                                                     lang:languageValue
                                          completionBlock:completionBlock];
        } else {
            [PoilabsVdNavigationUI.new initWithApplicationID:applicationIdValue
                                        withApplicationSecret:applicationSecretValue
                                        withUniqueIdentifier:uniqueIdValue
                                                        lang:languageValue
                                             completionBlock:completionBlock];
        }
    });
}

RCT_EXPORT_METHOD(getUserLocation:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // This would normally get the user's location from the SDK
    // For now we'll return a placeholder
    NSDictionary *location = @{
        @"latitude": @(0.0),
        @"longitude": @(0.0),
        @"floorLevel": [NSNull null]
    };
    resolve(location);
}

@end
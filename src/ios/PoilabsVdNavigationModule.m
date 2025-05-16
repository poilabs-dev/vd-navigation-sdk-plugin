#import "PoilabsVdNavigationModule.h"
#import <React/RCTUtils.h>

@implementation PoilabsVdNavigationModule

RCT_EXPORT_MODULE(PoilabsVdNavigationModule);

(NSArray<NSString *> *)supportedEvents {
  return @[@"PoilabsLocationChangeEvent", @"PoilabsStatusChangeEvent", @"PoilabsErrorEvent"];
}

(dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

(BOOL)requiresMainQueueSetup {
  return YES;
}

RCT_EXPORT_METHOD(startPoilabsVdNavigation:(NSString *)applicationId 
                  applicationSecret:(NSString *)secret 
                  uniqueId:(NSString *)uniqueId 
                  language:(NSString *)language
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
  Class managerClass = NSClassFromString(@"PoilabsVdNavigationManager");
  if (!managerClass) {
    reject(@"E_MISSING_MODULE", @"PoilabsVdNavigationManager Swift class not found", nil);
    return;
  }
  
  id manager = [[managerClass alloc] init];
  if (![manager respondsToSelector:@selector(showPoilabsVdNavigation:applicationSecret:uniqueIdentifier:language:completion:)]) {
    reject(@"E_MISSING_METHOD", @"showPoilabsVdNavigation method not found", nil);
    return;
  }
  
  [manager showPoilabsVdNavigation:applicationId 
                 applicationSecret:secret 
                  uniqueIdentifier:uniqueId 
                          language:language 
                        completion:^(BOOL success) {
    if (success) {
      resolve(@(YES));
    } else {
      reject(@"E_NAVIGATION_ERROR", @"Navigation initialization failed", nil);
    }
  }];
}

RCT_EXPORT_METHOD(startPoilabsVdNavigationWithCustomConfig:(NSString *)configUrl
                  applicationId:(NSString *)applicationId 
                  applicationSecret:(NSString *)secret 
                  uniqueId:(NSString *)uniqueId 
                  language:(NSString *)language
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
  // Swift bridge sınıfımızı çağırıyoruz
  Class managerClass = NSClassFromString(@"PoilabsVdNavigationManager");
  if (!managerClass) {
    reject(@"E_MISSING_MODULE", @"PoilabsVdNavigationManager Swift class not found", nil);
    return;
  }
  
  id manager = [[managerClass alloc] init];
  if (![manager respondsToSelector:@selector(showPoilabsVdNavigationWithCustomConfig:applicationId:applicationSecret:uniqueIdentifier:language:completion:)]) {
    reject(@"E_MISSING_METHOD", @"showPoilabsVdNavigationWithCustomConfig method not found", nil);
    return;
  }
  
  [manager showPoilabsVdNavigationWithCustomConfig:configUrl
                                     applicationId:applicationId
                                 applicationSecret:secret 
                                  uniqueIdentifier:uniqueId 
                                          language:language 
                                        completion:^(BOOL success) {
    if (success) {
      resolve(@(YES));
    } else {
      reject(@"E_NAVIGATION_ERROR", @"Navigation initialization failed", nil);
    }
  }];
}

RCT_EXPORT_METHOD(stopPoilabsVdNavigation:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@(YES));
}

RCT_EXPORT_METHOD(updateUniqueId:(NSString *)uniqueId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@(YES));
}

RCT_EXPORT_METHOD(addLocationChangeListener) {}

RCT_EXPORT_METHOD(removeLocationChangeListener) {}

@end
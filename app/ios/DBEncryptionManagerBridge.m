#import <React/RCTBridgeModule.h>
// Don't explicitly import Swift header, React Native handles this

@interface RCT_EXTERN_MODULE(DBEncryptionManager, NSObject)

RCT_EXTERN_METHOD(openDatabase:(NSString *)databasePath
                  encryptionKey:(NSString *)encryptionKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(closeDatabase:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(executeSQL:(NSString *)sql
                  arguments:(NSArray *)arguments
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(selectSQL:(NSString *)sql
                  arguments:(NSArray *)arguments
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end 
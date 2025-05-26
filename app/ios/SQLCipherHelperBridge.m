#import <React/RCTBridgeModule.h>

// Import the auto-generated Swift header. The name is usually <TargetName>-Swift.h
#import "app-Swift.h" 

@interface RCT_EXTERN_MODULE(SQLCipherHelper, NSObject)

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
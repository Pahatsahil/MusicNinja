#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FFmpegModule, NSObject)

RCT_EXTERN_METHOD(execute:(NSString *)command
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(transcode:(NSString *)inputPath
                  codec:(NSString *)codec
                  bitrate:(NSString *)bitrate
                  outputExt:(NSString *)outputExt
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancel:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getMediaInfo:(NSString *)filePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

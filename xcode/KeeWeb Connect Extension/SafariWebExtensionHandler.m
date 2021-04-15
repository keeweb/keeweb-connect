#import "SafariWebExtensionHandler.h"

#import <SafariServices/SafariServices.h>
#import <sys/socket.h>
#import <sys/un.h>
#import <unistd.h>

#if __MAC_OS_X_VERSION_MIN_REQUIRED < 110000
NSString *const SFExtensionMessageKey = @"message";
#endif

@implementation SafariWebExtensionHandler {
  @private
    int _socketFD;
}

- (id)init {
    if (self = [super init]) {
        _socketFD = -1;
    }
    return self;
}

- (void)closeSocket {
    if (_socketFD != -1) {
        close(_socketFD);
        _socketFD = -1;
    }
}

- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context {
    _socketFD = socket(PF_LOCAL, SOCK_STREAM, 0);
    if (_socketFD == -1) {
        NSExtensionItem *response = [[NSExtensionItem alloc] init];
        response.userInfo = @{SFExtensionMessageKey : @{@"error" : @"Socket error"}};
        [context completeRequestReturningItems:@[ response ] completionHandler:nil];

        return;
    }

    NSString *sockPath = [NSFileManager.defaultManager
                             containerURLForSecurityApplicationGroupIdentifier:@"3LE7JZ657W.keeweb"]
                             .path;
    sockPath = [sockPath stringByAppendingPathComponent:@"browser.sock"];

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(struct sockaddr_un));
    addr.sun_family = AF_LOCAL;
    strncpy(addr.sun_path, sockPath.UTF8String, sizeof(addr.sun_path) - 1);
    addr.sun_len = SUN_LEN(&addr);

    int conn = connect(_socketFD, (struct sockaddr *)&addr, addr.sun_len);
    if (conn == -1) {
        [self closeSocket];

        NSExtensionItem *response = [[NSExtensionItem alloc] init];
        response.userInfo = @{
            SFExtensionMessageKey : @{
                @"error" : @"Connect error",
                @"keeWebConnectErrorMsg" : @"errorConnectionErrorApp"
            }
        };
        [context completeRequestReturningItems:@[ response ] completionHandler:nil];

        return;
    }

    id message = [context.inputItems.firstObject userInfo][SFExtensionMessageKey];

    NSError *jsonSerializeError;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:message
                                                       options:0
                                                         error:&jsonSerializeError];

    uint32_t dataLength = (uint32_t)jsonData.length;
    NSMutableData *requestData = [NSMutableData dataWithBytes:&dataLength length:4];
    [requestData appendData:jsonData];

    if (write(_socketFD, requestData.bytes, requestData.length) != requestData.length) {
        [self closeSocket];

        NSExtensionItem *response = [[NSExtensionItem alloc] init];
        response.userInfo = @{SFExtensionMessageKey : @{@"error" : @"Socket write error"}};
        [context completeRequestReturningItems:@[ response ] completionHandler:nil];

        return;
    }

    const int MAX_READ_SIZE = 1024 * 10;
    char buffer[MAX_READ_SIZE];
    ssize_t bytesRead = read(_socketFD, buffer, MAX_READ_SIZE);

    if (bytesRead < 4) {
        [self closeSocket];

        NSExtensionItem *response = [[NSExtensionItem alloc] init];
        response.userInfo = @{SFExtensionMessageKey : @{@"error" : @"Socket read error"}};
        [context completeRequestReturningItems:@[ response ] completionHandler:nil];

        return;
    }

    uint32_t messageSize = *(uint32_t *)buffer;
    if (messageSize > MAX_READ_SIZE - 4) {
        [self closeSocket];

        NSExtensionItem *response = [[NSExtensionItem alloc] init];
        response.userInfo = @{SFExtensionMessageKey : @{@"error" : @"Socket data read error"}};
        [context completeRequestReturningItems:@[ response ] completionHandler:nil];

        return;
    }

    void *dataPtr = (char *)buffer + 4;
    NSData *messageData = [NSData dataWithBytes:dataPtr length:messageSize];
    NSError *jsonReadError;
    id responseFromKeeWeb = [NSJSONSerialization JSONObjectWithData:messageData
                                                            options:0
                                                              error:&jsonReadError];

    if (jsonReadError) {
        [self closeSocket];

        NSExtensionItem *response = [[NSExtensionItem alloc] init];
        response.userInfo = @{SFExtensionMessageKey : @{@"error" : @"JSON parse error"}};
        [context completeRequestReturningItems:@[ response ] completionHandler:nil];

        return;
    }

    NSExtensionItem *response = [[NSExtensionItem alloc] init];
    response.userInfo = @{SFExtensionMessageKey : responseFromKeeWeb};

    [context completeRequestReturningItems:@[ response ] completionHandler:nil];
}

@end

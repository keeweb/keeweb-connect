#import "SafariWebExtensionHandler.h"

#import <OSLog/OSLog.h>
#import <SafariServices/SafariServices.h>
#import <sys/socket.h>
#import <sys/un.h>
#import <unistd.h>

@implementation SafariWebExtensionHandler {
}

NSString *const KWResponsePropertyError = @"error";
NSString *const KWResponsePropertyKeeWebConnectError = @"keeWebConnectError";

NSString *const KWGroupContainer = @"3LE7JZ657W.keeweb";
NSString *const KWSocketFileName = @"conn.sock";

NSString *const KWErrorDisconnected = @"errorKeeWebDisconnected";
NSString *const KWErrorCannotConnect = @"errorConnectionErrorApp";

int socketFD = -1;
char readBuffer[1024 * 100];

- (NSMutableDictionary *)makeErrorWithMessage:(NSString *)message {
    os_log(OS_LOG_DEFAULT, "Returning error to the extension: %@", message);
    NSMutableDictionary *err = [[NSMutableDictionary alloc] init];
    err[KWResponsePropertyError] = message;
    return err;
}

- (NSMutableDictionary *)makeErrorWithMessage:(NSString *)message
                          andKeeWebMessageStr:(NSString *)kwMessage {
    NSMutableDictionary *err = [self makeErrorWithMessage:message];
    err[KWResponsePropertyKeeWebConnectError] = kwMessage;
    return err;
}

- (NSMutableDictionary *)makeSystemErrorWithMessage:(NSString *)message {
    NSString *errnoStr = [NSString stringWithUTF8String:strerror(errno)];
    os_log(OS_LOG_DEFAULT, "System error (%@): %d", message, errno);

    message = [message stringByAppendingString:@": "];
    message = [message stringByAppendingString:errnoStr];

    if (errno == EPIPE) {
        return [self makeErrorWithMessage:message andKeeWebMessageStr:KWErrorDisconnected];
    } else {
        return [self makeErrorWithMessage:message];
    }
}

- (NSMutableDictionary *)makeSystemErrorWithMessage:(NSString *)message
                                andKeeWebMessageStr:(NSString *)kwMessage {
    NSMutableDictionary *err = [self makeSystemErrorWithMessage:message];
    err[KWResponsePropertyKeeWebConnectError] = kwMessage;
    return err;
}

- (void)closeSocket {
    if (socketFD != -1) {
        os_log(OS_LOG_DEFAULT, "Closing socket");
        close(socketFD);
        socketFD = -1;
    }
}

- (NSDictionary *)connectSocket {
    if (socketFD != -1) {
        os_log(OS_LOG_DEFAULT, "Socket already exists, reusing");
        return nil;
    }

    signal(SIGPIPE, SIG_IGN);

    socketFD = socket(PF_LOCAL, SOCK_STREAM, 0);
    os_log(OS_LOG_DEFAULT, "Create socket: %d", socketFD);
    if (socketFD == -1) {
        return [self makeSystemErrorWithMessage:@"Socket error"];
    }

    NSString *socketPath = [NSFileManager.defaultManager
                               containerURLForSecurityApplicationGroupIdentifier:KWGroupContainer]
                               .path;
    socketPath = [socketPath stringByAppendingPathComponent:KWSocketFileName];

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(struct sockaddr_un));
    addr.sun_family = AF_LOCAL;

    if (socketPath.length > sizeof(addr.sun_path) - 1) {
        os_log(OS_LOG_DEFAULT, "Socket path is too long: %@", socketPath);
        return [self makeErrorWithMessage:@"Socket path is too long"];
    }

    strncpy(addr.sun_path, socketPath.UTF8String, sizeof(addr.sun_path) - 1);
    addr.sun_len = SUN_LEN(&addr);

    int connectRes = connect(socketFD, (struct sockaddr *)&addr, addr.sun_len);
    os_log(OS_LOG_DEFAULT, "Socket connect: %d", connectRes);
    if (connectRes == -1) {
        NSMutableDictionary *err = [self makeSystemErrorWithMessage:@"Connect error"
                                                andKeeWebMessageStr:KWErrorCannotConnect];
        [self closeSocket];
        return err;
    }

    return nil;
}

- (void)returnResult:(NSDictionary *)result toContext:(NSExtensionContext *)context {
    NSExtensionItem *response = [[NSExtensionItem alloc] init];
    response.userInfo = @{SFExtensionMessageKey : result};
    [context completeRequestReturningItems:@[ response ] completionHandler:nil];
}

- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context {
    os_log(OS_LOG_DEFAULT, "New message");

    NSDictionary *error = nil;

    id messageToKeeWeb = [context.inputItems.firstObject userInfo][SFExtensionMessageKey];

    NSError *jsonError;
    NSData *requestJsonData = [NSJSONSerialization dataWithJSONObject:messageToKeeWeb
                                                              options:0
                                                                error:&jsonError];

    if (jsonError) {
        os_log(OS_LOG_DEFAULT, "JSON serialize error: %@", jsonError.localizedDescription);
        error = [self makeErrorWithMessage:@"JSON serialize error"];
        [self returnResult:error toContext:context];
        return;
    }

    uint32_t requestDataLength = (uint32_t)requestJsonData.length;
    NSMutableData *requestData = [NSMutableData dataWithBytes:&requestDataLength length:4];
    [requestData appendData:requestJsonData];

    error = [self connectSocket];
    if (error) {
        [self returnResult:error toContext:context];
        return;
    }

    ssize_t bytesWritten = write(socketFD, requestData.bytes, requestData.length);
    if (bytesWritten == -1) {
        os_log(OS_LOG_DEFAULT, "Socket write error: %d", errno);
        error = [self makeSystemErrorWithMessage:@"Socket write error"];
        [self closeSocket];
        [self returnResult:error toContext:context];
        return;
    }

    if (bytesWritten != requestData.length) {
        os_log(OS_LOG_DEFAULT, "Wrote %zd bytes to socket instead of %zd", bytesWritten,
               requestData.length);
        error = [self makeErrorWithMessage:@"Socket write error"];
        [self closeSocket];
        [self returnResult:error toContext:context];
        return;
    }

    os_log(OS_LOG_DEFAULT, "Wrote %zd bytes to socket", bytesWritten);

    ssize_t bytesRead = read(socketFD, readBuffer, sizeof(readBuffer));
    if (bytesRead == -1) {
        os_log(OS_LOG_DEFAULT, "Socket read error: %d", errno);
        error = [self makeSystemErrorWithMessage:@"Socket read error"];
        [self closeSocket];
        [self returnResult:error toContext:context];
        return;
    }

    os_log(OS_LOG_DEFAULT, "Read %zd bytes from socket", bytesWritten);

    if (bytesRead < 4) {
        error = [self makeErrorWithMessage:@"Socket read error"];
        [self closeSocket];
        [self returnResult:error toContext:context];
        return;
    }

    uint32_t responseDataLength = *(uint32_t *)readBuffer;
    if (responseDataLength != bytesRead - 4) {
        os_log(OS_LOG_DEFAULT, "Message size is %d bytes instead of %zd", responseDataLength,
               bytesRead - 4);
        error = [self makeErrorWithMessage:@"Data decoding error"];
        [self closeSocket];
        [self returnResult:error toContext:context];
        return;
    }

    os_log(OS_LOG_DEFAULT, "Message size is %d bytes", responseDataLength);

    void *resposneDataPtr = (char *)readBuffer + 4;
    NSData *responseData = [NSData dataWithBytes:resposneDataPtr length:responseDataLength];
    id responseFromKeeWeb = [NSJSONSerialization JSONObjectWithData:responseData
                                                            options:0
                                                              error:&jsonError];

    if (jsonError) {
        os_log(OS_LOG_DEFAULT, "JSON parse error: %@", jsonError.localizedDescription);
        error = [self makeErrorWithMessage:@"JSON parse error"];
        [self closeSocket];
        [self returnResult:error toContext:context];
        return;
    }

    os_log(OS_LOG_DEFAULT, "Message processed OK");

    [self returnResult:responseFromKeeWeb toContext:context];
}

@end

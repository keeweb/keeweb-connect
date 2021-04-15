#import <Cocoa/Cocoa.h>

@interface ViewController : NSViewController

@property(weak, nonatomic) IBOutlet NSTextField *appNameLabel;

- (IBAction)openSafariExtensionPreferences:(id)sender;

@end

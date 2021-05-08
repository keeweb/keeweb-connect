# KeeWeb Connect: browser extension

<img src="xcode/KeeWeb%20Connect/Assets.xcassets/AppIcon.appiconset/icon_128x128%402x.png" width="128" alt="KeeWeb Connect logo" />

This is a browser extension for [KeeWeb](https://keeweb.info).
Although KeeWeb supports auto-typing, browser extensions provide seamless integration
consistent across all operating systems.

<img src="img/chrome/button.png" width="233" alt="KeeWeb Connect button" />

<img src="img/chrome/menu.png" width="646" alt="KeeWeb Connect menu" />

## Installation

The extension can be installed from the official stores, depending on your browser:

- [Chrome](https://chrome.google.com/webstore/detail/keeweb-connect/pikpfmjfkekaeinceagbebpfkmkdlcjk)
- [Firefox](https://addons.mozilla.org/firefox/addon/keeweb-connect/)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/keeweb-connect/nmggpehkjmeaeocmaijenpejbepckinm)
- [Safari](https://apps.apple.com/app/keeweb-connect/id1565748094)
- Other browsers: [how to set up](https://github.com/keeweb/keeweb/wiki/Browser-AutoFill#other-browsers)

## Translations

If you would like to translate the extension, it's already waiting for you on OneSky: https://keeweb.oneskyapp.com/collaboration/project?id=382232

## Building

The project is built with `npm`:

Production build:
```sh
npm start
```

Build a development version and watch:
```sh
npm run watch
```

## Protocol

KeeWeb implements [keepassxc-protocol](https://github.com/keepassxreboot/keepassxc-browser/blob/develop/keepassxc-protocol.md)
with several modifications for KeeWeb listed [here](docs/keeweb-connect-protocol.md).

## License

[MIT](https://github.com/keeweb/keeweb-connect/blob/master/LICENSE)


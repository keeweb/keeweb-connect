# KeeWeb Connect: browser extension

This is a browser extension for [KeeWeb](https://keeweb.info).

![KeeWeb Connect button](img/chrome/button.png | width=233)

![KeeWeb Connect menu](img/chrome/menu.png | width=646)

## Status

WIP, not ready to use. It's not possible to install this extension now.

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

[MIT](https://github.com/keeweb/keeweb-browser/blob/master/LICENSE)


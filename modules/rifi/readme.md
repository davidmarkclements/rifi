# rifi 

The distributed module system

## Installation

```sh
npm install rifi --save
```


## Tests

```sh
npm install
npm test
```

## Dependencies

- [rifi-bundle](): The bundling part of rifi, the distributed module system
- [rifi-exports](): The exporting part of rifi, the distributed module system
- [rifi-load](): The loading part of rifi, the distributed module system
- [rifi-render](): The server-side rendering part of rifi, the distributed module system
- [rifi-sync](): The synchronizing part of rifi, the distributed module system
- [upring](https://github.com/upringjs/upring): application-level sharding on node.js streams

## Dev Dependencies

- [pino](https://github.com/pinojs/pino): super fast, all natural json logger
- [proxyquire](https://github.com/thlorenz/proxyquire): Proxies nodejs require in order to allow overriding dependencies during testing.
- [tap](https://github.com/tapjs/node-tap): A Test-Anything-Protocol library
- [through2](https://github.com/rvagg/through2): A tiny wrapper around Node streams2 Transform to avoid explicit subclassing noise


## License

MIT

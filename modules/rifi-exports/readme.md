# rifi-exports 

The exporting part of rifi, the distributed module system

## Installation

```sh
npm install rifi-exports --save
```


## Tests

```sh
npm install
npm test
```

## Dependencies

- [browser-resolve](https://github.com/shtylman/node-browser-resolve): resolve which handles browser field support in package.json
- [module-deps](https://github.com/substack/module-deps): walk the dependency graph to generate json output that can be fed into browser-pack
- [pump](https://github.com/mafintosh/pump): pipe streams together and close all of them if one of them closes
- [rifi-load](): The loading part of rifi, the distributed module system
- [through2](https://github.com/rvagg/through2): A tiny wrapper around Node streams2 Transform to avoid explicit subclassing noise
- [upring-pubsub](https://github.com/upringjs/upring-pubsub): PubSub system built on top of upring

## Dev Dependencies

- [tap](https://github.com/tapjs/node-tap): A Test-Anything-Protocol library
- [upring](https://github.com/upringjs/upring): application-level sharding on node.js streams


## License

MIT

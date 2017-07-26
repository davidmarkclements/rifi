# rifi-render 

The server-side rendering part of rifi, the distributed module system

## Installation

```sh
npm install rifi-render --save
```


## Tests

```sh
npm install
npm test
```

## Dependencies

- [callback-stream](https://github.com/mcollina/callback-stream): A pipeable stream that calls your callback
- [nodepack](https://github.com/substack/browser-pack): pack browserify bundles for node
- [pump](https://github.com/mafintosh/pump): pipe streams together and close all of them if one of them closes
- [rifi-load](): The loading part of rifi, the distributed module system
- [through2](https://github.com/rvagg/through2): A tiny wrapper around Node streams2 Transform to avoid explicit subclassing noise

## Dev Dependencies

- [tap](https://github.com/tapjs/node-tap): A Test-Anything-Protocol library


## License

MIT

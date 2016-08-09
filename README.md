# flume-spool

[![Build Status](https://travis-ci.org/nekronhuang/flume-spool.svg?branch=master)](https://travis-ci.org/nekronhuang/flume-spool) [![Coverage Status](https://coveralls.io/repos/github/nekronhuang/flume-spool/badge.svg?branch=master)](https://coveralls.io/github/nekronhuang/flume-spool?branch=master)

The repository is to support flume spooling directory source for node.

**Note:** only support Node > 4.0.0 and Apache Flume > 1.3.0

## Installation
```shell
$ npm install flume-spool
```

## Usage
Opening a log stream:

```javascript
const FlumeSpool = require('flume-spool')
const log = new FlumeSpool('/path/to/spool/directory', [options])

log.write('some logs \n')
```
See the `examples/` folder for more examples.

### Options
Available options:

Name                 | Type    | Default         | Description
:------------------- | :------ | :-------------- | :-----
`interval`            | number  | 60000(60s)      | The time interval for transfering files from temporary directory to spool directory.
`tempDir`             | string  | ./flume_temp    | The directory for temporary logs.
`autoDelete`          | boolean | false           | Remove completed files using node.
`autoDeleteInterval`  | number  | 600000(10min)   | ---
`autoDeleteSuffixReg` | regexp  | /\.COMPLETED$/  | ---
`streamEncoding`      | string  | utf8            | The config for the log stream.
`streamMode`          | number  | 0644            | ---
`streamFlags`         | string  | a               | ---

### Methods
* `write(chunk<String|Buffer>)`: write data to log stream
* `close()`: close log stream

## Flume Config
Example for the agent using spooling directory source:

```apacheconf
agent.sources.s1.type = spooldir
agent.sources.s1.channels = ch1
agent.sources.s1.spoolDir = /path/to/spool/directory
agent.sources.s1.fileHeader = true
# auto delete completed files
agent.sources.s1.deletePolicy = immediate
```
See [FlumeUserGuide](https://flume.apache.org/FlumeUserGuide.html#spooling-directory-source) for all available options.


## Events
The instance will emit some events in running:

Event     | Description
:-------- | :-----------
open      | emit when being initialized
transfer  | emit when the temporary file is transfered
close     | emit when being closed
error     | emit when an error occurs

## Tests
```shell
$ npm test
```

## License

Apache-2.0
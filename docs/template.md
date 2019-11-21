# Templating

Templating is used inside configuration to give it more flexibility. Template compile inline javascript and render complicated logic in various forms.

## Basic templating format

Templating format can be describe as simple as the following regex:

`/<%[-=](.*)%([ifbIFB]?)>/`

### Interpolation

You can use `<%= ... %>` to interpolate values.
If you want to interpolate an HTML-escaped data, `<%- ... ->` is there for you to use.

### Arbitrary

You can use the template to run an arbitrary javascript code and printout instead with `<% n = 'Tonny'; print('Hello' + n) %>`

### Post-parsing

In a yaml file, you can set result of the templating into `integer`, `boolean` or `float` instead of the default string. To acchieve that, the template must be a top layer result, for example:

```yaml
vars:
 integer: <%= 1 %i>
 boolean: <%= 1 %b>
 float: <%= 1.0 %f>
 other: Hello <%= name %>
```

In the example above, `integer`, `boolean`, `float` can be parsed into another format instead of a string, while `other` can not.

## Template data

`Brask` provides data and tools you can use in the templating.

### Project

`project.gitSHA` is the result of `git rev-parse --short HEAD` in the root folder of the project.

`project.rootDir` is the absolute path to the root directory of the project.

`project.svcDir` is the absolute path to the root directory of the current service, only available in service scope.

`project.svcDirFromRoot` is the relative path of the current service from the project root folder, and unavailable outside of service scope.

### Argv

`argv`: Argument object of the invoked `task` command

`argv._` is the array of all parameters
Other flags are included in `argv` itself.

Example:

`task foo bar baz -x 3 -y 4 -n5 -abc --beep=boop`

Results

```yaml
argv:
 _: [task, foo, bar, baz]
 x: 3
 y: 4
 n: 5
 a: true
 b: true
 c: true
 beep: boop
```

`env` is the object let you access to the environment variables

Example:

```bash
cluster=prod task sampleTask
```

Will set `env.cluster` to `prod`

### OS

`os.arch(), os.type(), os.platform()` is the architecture, type and platform of the host

`os.EOL`, like its name said, EOL of the host.

`os.hostname()`, the name of the host, or the computer name

`os.userInfo().username`, name of the user executed the command

`os.homedir()`, the home directory of the user executed the command.

### VARS

`vars` is the object from the manifest file, and is different depending on the scope

`no-scope` has no `vars`

In `project scope`, `vars` is the object copied from `/vars` from `root.yaml`

In `service scope`, `vars` is the result of merging `/vars` from `manifest.yaml` with the one in `root.yaml`. The value of the same key in `manifest.yaml` will overwrite `root.yaml`.

### Manifest

`rootman` is the object parsed directly from `root.yaml`
`svcman` is the object parsed directly from `manifest.yaml`

## Tools

The template provides `tools` you can use to make things easier

### Value caching

`tools.get(key)`, and `tools.set(key, value)`

The behavior of `get` and `set` is [documented here](https://github.com/mariocasciaro/object-path#usage)

Other functions of a `step`, like `inquiries` or `pipe` also storing data into the cache.

### Object Path

`getPath`, and `setPath` are two alias to [mariocasciaro/object-path](https://github.com/mariocasciaro/object-path)

### Command

`tools.which('/path/to/binary')`: equivalent to `which binary` in your terminal. Useful tool to check if a binary exists or not.

`tools.cancel('Cancel current execution')`: Tell `brask` to cancel execution of current task.

`tools.hasError(cmd: string, warn: string="", warn_on_error:boolean=true): boolean`: Run cmd, if the exit code is not zero output `warn` if `warn_on_error` is true, and return true. Else return false.

`tools.exists('/path/to/file'): boolean`: Check if file `/path/to/file` exists.

### I/O

`tools.writeFileSync`,`tools.appendFileSync` are two alias to `fs.writeFileSync` and `fs.appendFileSync`.
`tools.templateFile(tplFile: string, inp: JSONObject, outputFile: string)`: Read template function from `tplFile` and call it with `inp`, then save output of the template function into `outputFile`.

Here is a sample of template file:

```javascript
module.exports = function (input) {
 return `
FROM alpine:3.10

RUN apk --no-cache add ca-certificates tzdata && update-ca-certificates

WORKDIR /brask

COPY .build/${input} /brask/${input}

RUN chown -R brask:brask /brask

USER brask
`;
};
```

### String manipulation

`tools.camelCase`, `tools.pascalCase` are tools to change the case of the input string as their names show.

`tools.replace(str: string, rpl: string = "", pattern: string, flags: string): string`: Create a [node's regular expression](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/RegExp) from `pattern` and `flag`. Then apply it to `str`

### RSA

`tools.rsaEncrypt(base64RsaPub: string, encryptingStr: string): string`: Encrypt `encryptingStr` with public key `base64RsaPub`, return in `base64` format.

`tools.rsaDecrypt(base64RsaPk: string, base64EncryptedStr: string): string`: Decrypt encrypted message in base64 format `base64EncryptedStr` with private key `base64RsaPk`, and return the original string

### Others

`timestamp`: The second Unix timestamp of the moment the `task` command got executed.

`pipe`: Result of the previous step that set `pipe: PIPE`

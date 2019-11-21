# Brask

Once you install with `npm i -g brask`, you will have a command called `task`

## Scope

Brask has 3 `Scope`, depending on where you run the `task` command.

If your `working dir` or any of its parent dir has a valid `manifest.yaml` file, then you're inside `service scope`.
Else if your `working dir` or any of its parent dir has a valid `root.yaml` file, then you're inside `project scope`.
Or else you're in `no-scope`.

## Logging

There are 5 log levels: `VERBOSE`, `INFO`, `WARNING`, `ERROR`, and `FATAL`

You can set the log level by `BRASK_LOG` environment variable.

The default log level is `INFO`. You can tell `brask` to output more log by setting level to `VERBOSE` or less by setting to `ERROR`.

## Check the current version of Task

```bash
$task - version
1.1.11
```

## `root.yaml` file

This file should be placed at the root of your project. This file can have everything, but some paths are reserved.

`/project` is the name of the project

`/requiredVersion` is the required version of `task`, it must be a [semver](https://semver.org/) likes ">=1.1.10", "~1.1.10", ...

`/vars` is an object, that will be merged with `manifest.yaml/vars` of the service scope.

`/tasks` is an object, you can nest as many tasks inside this object. This also gets merged with `manifest.yaml/tasks` when running inside a service scope.

## `manifest.yaml` file

This file should be placed at the root of your service. These are the reserved paths:

`/service` is the name of the project

`/vars` is an object, that will be merged with `root.yaml/vars` of the `project scope`.

`/tasks` is an object, you can nest as many tasks inside this object. This also gets merged with `manifest.yaml/tasks` when running inside a `service scope`.

## A `task`

A task is the wrapper of a predefined series of commands that will be invoked through [child processes](https://nodejs.org/api/child_process.html).

A task can be defined in both `root.yaml` or `manifest.yaml`. However, they will be merged if you run a command under `service scope`.

A task also can invoke other tasks as well.

A task is an object with two attributes: `env` and `steps`. `env` is a `{string: string}` object, that declares the environment of the task. These will be merged with the environment when invoked `task`, yield the final environment variables that will be assigned to child processes when the task run.

`steps` is the list of `Step`, each of that defines a command will be invoked by a single `child process`. `Brask` will invoke each `Step` step-by-step, until one of that returns a `non-zero` exit code.

## A `step`

A `step` is a unit of a `task`, they have many attributes:

`name: string` defines the text that will be log during the execution of a task. Can use [templating](template.md) inside.

`cmd: string | string[]`, is the command that will be executed in the child process. In the case of `string[]`, they will be joined by a space, and get treated like a `string`. `cmd` also can use `templating`. One notice that this is not a bash command line, so you can not pipe commands like `pwd | echo`, use `PIPE` if you need pipelining.

`when: string`, the condition that `cmd` will be run, need to be cast in boolean in the form of `<%= %b>`, please refer to [templating](template.md) on how to do that, must be `templated`. If the evaluation of `when` return false, the `step` will be ignored.

`stop: boolean`, tells `brask` stops executing next `step` and exit. Default to `false`

`cwd: string`, specifies the `Working Dir` when running this step. In `project scope`, default to `rootDir`(directory has `root.yaml`). In `service scope`, default to `svcDir`(service dir that has `manifest.yaml`). `cwd` can also be templated.

`inquiries: []Inquiry`, when you need to ask for information from the keyboard, you can use these as the tool. `Inquiry` is the object from [SBoudrias/Inquirer here](https://github.com/SBoudrias/Inquirer.js#objects). Please note that `when` and `validate` attributes of `Inquiry` is wrapped with a function already. So instead of writing `when: func(answer) {return true;}`, you can write: `when: return true;`. To be precise, this is how it got wrapped:

```javascript
(answers) => ${inquiry.when}
(input) => ${element.validate}
```

The `answers` will object will be stored in the key wit prefix `inquiry`. So you can get with: `<%=tools.get("inquiry.question_name")>`

`pipe: enum[PIPE, RAW, JSON, YAML]`, signals `brask` to watch and store the stdout of the command of this `step` for future use. `PIPE` means just store the output in `pipe` variable so you can use `<%=pipe%>` in the template. The other values require `storeKey` attribute, and `brask` will store the output in a cache with key as `storekey`. `RAW` will store the output as it is, as a string into a key. `JSON` or `YAML` tells `brask` to parse the output as an object in json or yaml format and store into the `storeKey`

`storeKey` is the key to store output of the step if `pipe` is one of `RAW`, `JSON` or `YAML`. Data can get within the template with `<%=tools.get('storeKey')%>`

Example of `pipe`:

```yaml
tasks:
 example_of_pipe:
 steps:
 - name: piping
 cmd: echo '{"a": [{},{"foo": "bar"}]}'
 pipe: JSON
 storeKey: pipe.example
 - name: get pipe
 cmd: echo <%=tools.get('pipe.example.a.1.foo')%>
```

This will output "bar"

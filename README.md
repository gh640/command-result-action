# Command Result Action

This is a reusable action for GitHub Actions. This action just runs a command and capture the outputs. Easy to use and useful to capture multi-line outputs.

## Motivation

The way to capture a command's multi-line standard output / error is not intuitive on GitHub Actions.

- [set-output Truncates Multiline Strings - #9 by andreasplesch - GitHub Actions - GitHub Community](https://github.community/t/set-output-truncates-multiline-strings/16852/9)
- [set-env truncates multiline strings · Issue #403 · actions/toolkit · GitHub](https://github.com/actions/toolkit/issues/403)

## Usage

Use this action `gh640/command-result-action` in your workflow with `command` input.

```yaml
uses: gh640/command-result-action@v1
with:
  command: npm outdated
id: myaction
```

You can optionally change the working directory by passing `cwd` as input:

```yaml
uses: gh640/command-result-action@v1
with:
  command: npm outdated
  cwd: ./src
id: myaction
```

You can use the output in subsequent steps. In the above case, the following variables are available:

- `${{ steps.myaction.outputs.exitCode }}`
- `${{ steps.myaction.outputs.stdout }}`
- `${{ steps.myaction.outputs.stderr }}`

### Available inputs

| name | required | description |
| --- | --- | --- |
| `command` | ✓ | Command to run |
| `cwd` |  | Working directory |

### Available outputs

| name | description |
| --- | --- |
| `exitCode` | Exit code of the command |
| `stdout` | Stdout of the command |
| `stderr` | Stderr of the command |

## Different approaches to capture standard output / error

### `actions/github-script` action

This action uses `@actions/exec` and `@actions/core`. The behavior of this action is almost same as one of the following action with `actions/github-script`:

```yaml
uses: actions/github-script@v6
with:
  script: |
    const result = await exec.getExecOutput('npm outdated', [], {
      ignoreReturnCode: true,
    })
    core.setOutput('exitCode', result.exitCode)
    core.setOutput('stdout', result.stdout)
    core.setOutput('stderr', result.stderr)
id: myaction
```

## Working Example

- [GitHub - gh640/test-command-result-action: https://github.com/gh640/command-result-action](https://github.com/gh640/test-command-result-action)

## Questions

### Can I execute multiple commands with this action?

No. This action supports only one command.

---

README from the original template:

<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Create a JavaScript Action using TypeScript

Use this template to bootstrap the creation of a TypeScript action.:rocket:

This template includes compilation support, tests, a validation workflow, publishing, and versioning guidance.  

If you are new, there's also a simpler introduction.  See the [Hello World JavaScript Action](https://github.com/actions/hello-world-javascript-action)

## Create an action from this template

Click the `Use this Template` and provide the new repo details for your action

## Code in Main

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:  
```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

## Change action.yml

The action.yml defines the inputs and output for your action.

Update the action.yml with your name, description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

## Change the Code

Most toolkit and CI/CD operations involve async operations so the action is run in an async function.

```javascript
import * as core from '@actions/core';
...

async function run() {
  try { 
      ...
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/actions/typescript-action/actions) for runs of this action! :rocket:

## Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action

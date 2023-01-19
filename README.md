# Command Result Action

This is a reusable action for GitHub Actions. This action just runs a single command and captures the outputs. Easy to use and useful to capture multi-line outputs.

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

- [GitHub - gh640/test-command-result-action](https://github.com/gh640/test-command-result-action)

## Questions

### Can I execute multiple commands with this action?

No. This action supports only one command.

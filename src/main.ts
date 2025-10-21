import * as core from '@actions/core'
import * as exec from '@actions/exec'

process.on('unhandledRejection', handleError)
// eslint-disable-next-line github/no-then
main().catch(handleError)

async function main(): Promise<void> {
  const command: string = core.getInput('command', { required: true })
  const cwd: string = core.getInput('cwd')

  const options: exec.ExecOptions = { ignoreReturnCode: true }
  if (cwd != null) {
    options.cwd = cwd
  }

  core.info(`Starting command.`)
  core.startGroup(`command`)
  const result: exec.ExecOutput = await exec.getExecOutput(command, [], options)
  core.endGroup()
  core.info(`Finished command.`)

  core.setOutput('exitCode', result.exitCode)
  core.setOutput('stdout', result.stdout)
  core.setOutput('stderr', result.stderr)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleError(err: any): void {
  // eslint-disable-next-line no-console
  console.error(err)
  core.setFailed(`Unhandled error: ${err}`)
}

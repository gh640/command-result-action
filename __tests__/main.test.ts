import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {promisify} from 'util'
import {expect, test} from '@jest/globals'

type CommandResult = {
  stdout: string
  stderr: string
}
type execMainType = {
  (env: NodeJS.ProcessEnv): Promise<CommandResult>
}
const execMain: execMainType = async env => {
  const execFile = promisify(cp.execFile)
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileOptions = {env}

  const result: CommandResult = await execFile(np, [ip], options)

  return result
}

type prepareEnvType = {
  (vars: {[key: string]: string}): NodeJS.ProcessEnv
}
const prepareEnv: prepareEnvType = vars => {
  return {
    ...process.env,
    ...vars
  }
}

test('throws error on unknown command', async () => {
  expect.assertions(2)

  try {
    await execMain(prepareEnv({INPUT_COMMAND: 'unknown'}))
  } catch (err: any) {
    expect(err.code).toEqual(1)
    expect(err.stderr.toString()).toContain(
      `Unable to locate executable file: unknown.`
    )
  }
})

test('properly handles single-line stdout', async () => {
  const {stdout} = await execMain(
    prepareEnv({INPUT_COMMAND: 'echo "Hello world"'})
  )

  const expectedLines = [
    'Starting command.',
    '::group::command',
    '[command]/bin/echo Hello world',
    'Hello world',
    '::endgroup::',
    'Finished command.',
    '',
    '::set-output name=exitCode::0',
    '',
    '::set-output name=stdout::Hello world%0A',
    '',
    '::set-output name=stderr::'
  ].join('\n')
  expect(stdout.trim()).toEqual(expectedLines)
})

test('properly handles multi-line stdout (line breaks are escaped)', async () => {
  const {stdout} = await execMain(
    prepareEnv({INPUT_COMMAND: 'echo "Hello\nworld"'})
  )

  const expectedLines = [
    'Starting command.',
    '::group::command',
    '[command]/bin/echo Hello',
    'world',
    'Hello',
    'world',
    '::endgroup::',
    'Finished command.',
    '',
    '::set-output name=exitCode::0',
    '',
    '::set-output name=stdout::Hello%0Aworld%0A',
    '',
    '::set-output name=stderr::'
  ].join('\n')
  expect(stdout.trim()).toEqual(expectedLines)
})

test('cwd', async () => {
  const {stdout} = await execMain(
    prepareEnv({
      INPUT_COMMAND: 'ls',
      INPUT_CWD: './lib'
    })
  )

  const expectedLines = [
    'Starting command.',
    '::group::command',
    '[command]/bin/ls',
    'main.js',
    '::endgroup::',
    'Finished command.',
    '',
    '::set-output name=exitCode::0',
    '',
    '::set-output name=stdout::main.js%0A',
    '',
    '::set-output name=stderr::'
  ].join('\n')
  expect(stdout.trim()).toEqual(expectedLines)
})

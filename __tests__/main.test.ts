import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'

type CommandResult = {
  exitCode: number
  stdout: string
  stderr: string
}
type execMainType = {
  (env: NodeJS.ProcessEnv): Promise<CommandResult>
}
const execMain: execMainType = async env => {
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')

  let stdout = ''
  let stderr = ''

  const child: cp.ChildProcess = cp.spawn(np, [ip], {env})

  child.stdout?.on('data', data => {
    stdout += data.toString()
  })

  child.stderr?.on('data', data => {
    stderr += data.toString()
  })

  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('close', resolve)
    child.on('error', reject)
  })

  return {exitCode, stdout, stderr}
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
  const result = await execMain(prepareEnv({INPUT_COMMAND: 'unknown'}))
  expect(result.exitCode).toEqual(1)
  expect(result.stdout).toContain(`Unable to locate executable file: unknown.`)
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

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
  const {exitCode, stdout, stderr} = await execMain(
    prepareEnv({INPUT_COMMAND: 'unknown'})
  )
  expect(exitCode).toEqual(1)
  expect(stdout).toContain('Unable to locate executable file: unknown.')
  expect(stderr).toContain('Error: Unable to locate executable file: unknown.')
})

test('properly handles single-line stdout', async () => {
  const {stdout} = await execMain(
    prepareEnv({INPUT_COMMAND: 'echo "Hello world"'})
  )

  expect(stdout).toContain('Starting command.')
  expect(stdout).toContain(['echo Hello world', 'Hello world'].join('\n'))
  expect(stdout).toContain('Finished command.')
  expect(stdout).toContain('::set-output name=exitCode::0')
  expect(stdout).toContain('::set-output name=stdout::Hello world%0A')
  expect(stdout).toContain('::set-output name=stderr::')
})

test('properly handles multi-line stdout (line breaks are escaped)', async () => {
  const {stdout} = await execMain(
    prepareEnv({INPUT_COMMAND: 'echo "Hello\nworld"'})
  )

  expect(stdout).toContain('Starting command.')
  expect(stdout).toContain(['echo Hello\nworld', 'Hello\nworld'].join('\n'))
  expect(stdout).toContain('Finished command.')
  expect(stdout).toContain('::set-output name=exitCode::0')
  expect(stdout).toContain('::set-output name=stdout::Hello%0Aworld%0A')
  expect(stdout).toContain('::set-output name=stderr::')
})

test('cwd', async () => {
  const {stdout} = await execMain(
    prepareEnv({
      INPUT_COMMAND: 'ls',
      INPUT_CWD: './lib'
    })
  )

  expect(stdout).toContain('Starting command.')
  expect(stdout).toContain(['ls', 'main.js'].join('\n'))
  expect(stdout).toContain('Finished command.')
  expect(stdout).toContain('::set-output name=exitCode::0')
  expect(stdout).toContain('::set-output name=stdout::main.js%0A')
  expect(stdout).toContain('::set-output name=stderr::')
})

import * as cp from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'

import {afterAll, beforeAll, describe, expect, test} from '@jest/globals'

const outDirParent = path.join(__dirname, 'test')
const outDirPrefix = path.join(outDirParent, 'out-')

type CommandResult = {
  exitCode: number
  stdout: string
  stderr: string
}
type execMainType = {
  (env: NodeJS.ProcessEnv, entrypoint: string): Promise<CommandResult>
}
const execMain: execMainType = async (env, entrypoint) => {
  const np = process.execPath
  const ip = path.join(__dirname, '..', entrypoint)

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

describe.each(['lib/main.js', 'dist/index.js'])('%s', entrypoint => {
  const runMain = (env: NodeJS.ProcessEnv): Promise<CommandResult> =>
    execMain(env, entrypoint)
  beforeAll(() => {
    if (!fs.existsSync(outDirParent)) {
      fs.mkdirSync(outDirParent)
    }
  })

  afterAll(() => {
    fs.rmSync(outDirParent, {recursive: true})
  })

  test('properly handles single-line stdout', async () => {
    const [outFile, readOutFile] = tempFile()
    const {stdout} = await runMain(
      prepareEnv({
        INPUT_COMMAND: 'echo "Hello world"',
        GITHUB_OUTPUT: outFile
      })
    )
    const outFileContent = readOutFile()

    expect(stdout).toContain('Starting command.')
    expect(stdout).toContain('echo Hello world\nHello world')
    expect(stdout).toContain('Finished command.')

    // `[\w-]` matches the delimtier.
    expect(outFileContent).toMatch(/exitCode<<[\w-]+\n0\n/)
    expect(outFileContent).toMatch(/stdout<<[\w-]+\nHello world\n/)
    expect(outFileContent).toMatch(/stderr<<[\w-]+\n\n/)
  })

  test('properly handles multi-line stdout', async () => {
    const [outFile, readOutFile] = tempFile()
    const {stdout} = await runMain(
      prepareEnv({
        INPUT_COMMAND: 'echo "Hello\nworld"',
        GITHUB_OUTPUT: outFile
      })
    )
    const outFileContent = readOutFile()

    // `[\w-]` matches the delimtier.
    expect(outFileContent).toMatch(/exitCode<<[\w-]+\n0\n/)
    expect(outFileContent).toMatch(/stdout<<[\w-]+\nHello\nworld\n/)
    expect(outFileContent).toMatch(/stderr<<[\w-]+\n\n/)
  })

  test('works with option `cwd`', async () => {
    const [outFile, readOutFile] = tempFile()
    const {stdout} = await runMain(
      prepareEnv({
        INPUT_COMMAND: 'ls',
        INPUT_CWD: './lib',
        GITHUB_OUTPUT: outFile
      })
    )
    const outFileContent = readOutFile()

    // `[\w-]` matches the delimtier.
    expect(outFileContent).toMatch(/exitCode<<[\w-]+\n0\n/)
    expect(outFileContent).toMatch(/stdout<<[\w-]+\nmain\.js\n/)
    expect(outFileContent).toMatch(/stderr<<[\w-]+\n\n/)
  })

  test('properly captures stderr', async () => {
    const [outFile, readOutFile] = tempFile()
    const {exitCode, stdout, stderr} = await runMain(
      prepareEnv({
        INPUT_COMMAND: 'ls /unkown/path/',
        GITHUB_OUTPUT: outFile
      })
    )
    const outFileContent = readOutFile()

    expect(exitCode).toEqual(0)
    expect(stdout).toContain('ls /unkown/path/')

    // `[\w-]` matches the delimtier.
    // The `exitCode` can be 1 or 2 depending on the environment.
    expect(outFileContent).toMatch(/exitCode<<[\w-]+\n[12]\n/)
    expect(outFileContent).toMatch(/stdout<<[\w-]+\n\n/)
    expect(outFileContent).toMatch(
      /stderr<<[\w-]+\n.*No such file or directory\n/
    )
  })

  test('fails with unknown command', async () => {
    const [outFile, readOutFile] = tempFile()
    const {exitCode, stdout, stderr} = await runMain(
      prepareEnv({
        INPUT_COMMAND: 'unknown',
        GITHUB_OUTPUT: outFile
      })
    )
    const outFileContent = readOutFile()

    expect(exitCode).toEqual(1)
    expect(stdout).toContain('Unable to locate executable file: unknown.')
    expect(stderr).toContain(
      'Error: Unable to locate executable file: unknown.'
    )
    expect(outFileContent).toEqual('')
  })

  test('captures both streams and preserves a nonzero command exit code', async () => {
    const [outFile, readOutFile] = tempFile()
    const {exitCode} = await runMain(
      prepareEnv({
        INPUT_COMMAND: `"${process.execPath}" -e "process.stdout.write('out'); process.stderr.write('err'); process.exit(7)"`,
        GITHUB_OUTPUT: outFile
      })
    )

    // A failed command is reported as an output; it does not fail the Action.
    expect(exitCode).toEqual(0)
    expect(readOutFile()).toMatch(/exitCode<<[\w-]+\n7\n/)
    expect(readOutFile()).toMatch(/stdout<<[\w-]+\nout\n/)
    expect(readOutFile()).toMatch(/stderr<<[\w-]+\nerr\n/)
  })

  test('fails when the required command is empty', async () => {
    const [outFile, readOutFile] = tempFile()
    const {exitCode} = await runMain(
      prepareEnv({INPUT_COMMAND: '', GITHUB_OUTPUT: outFile})
    )

    expect(exitCode).toEqual(1)
    expect(readOutFile()).toEqual('')
  })
})

/**
 * Helper: prepare a temporary file.
 */
function tempFile(): [string, () => string] {
  const directory = fs.mkdtempSync(outDirPrefix)
  const file = path.join(directory, 'out')
  fs.appendFileSync(file, '', {encoding: 'utf8'})

  function read(): string {
    return fs.readFileSync(file, {encoding: 'utf8'})
  }

  return [file, read]
}

import 'source-map-support/register.js'
import { Test } from 'brittle'
import {
  ChildProcess,
  spawn as spawnProcess,
  SpawnOptions,
} from 'node:child_process'
import { PrismaClient } from '../../lib.js'
import type { Prisma } from 'repco-prisma'

const COMPOSE_FILE = '../../test/docker-compose.test.yml'
const RUNNING_DBS = new Set()

type SetupOpts = {
  port?: number
}
export async function setup(test: Test, opts: SetupOpts = {}) {
  const pgPort = opts.port || 20432
  const databaseUrl = await setupDb(test, pgPort)
  process.env.DATABASE_URL = databaseUrl
  let log: Prisma.LogDefinition[] = []
  if (process.env.QUERY_LOG) log = [{ emit: 'event', level: 'query' }]
  const prisma = new PrismaClient({
    log,
    datasources: {
      db: { url: databaseUrl },
    },
  })
  // @ts-ignore
  prisma.$on("query", async (e: any) => {
    if (process.env.QUERY_LOG) {
      console.log(`${e.query} ${e.params}`)
    }
  })
  return prisma
}

export async function setup2(test: Test) {
  return Promise.all([
    setup(test, { port: 15000 }),
    setup(test, { port: 15001 }),
  ])
}

export async function setupDb(test: Test, port: number) {
  if (process.env.DOCKER_SETUP === '0') return
  const env = {
    POSTGRES_PORT: '' + port,
    DATABASE_URL: `postgresql://test:test@localhost:${port}/tests`,
  }
  if (!RUNNING_DBS.has(port)) {
    RUNNING_DBS.add(port)
    await spawn(
      'docker',
      [
        'compose',
        '-p',
        'repco-postgres-test-' + port,
        '-f',
        COMPOSE_FILE,
        'up',
        '-d',
        '--remove-orphans',
      ],
      {
        log: test.comment,
        env,
      },
    )
  }
  await spawn('yarn', ['prisma', 'migrate', 'reset', '-f', '--skip-generate'], {
    cwd: '../repco-prisma',
    log: test.comment,
    // stdio: 'inherit',
    env,
  })
  return env.DATABASE_URL
}

process.on('beforeExit', () => {
  if (process.env.DOCKER_SETUP === '0') return
  for (const port of RUNNING_DBS) {
    RUNNING_DBS.delete(port)
    spawn('docker', [
      'compose',
      '-p',
      'repco-postgres-test-' + port,
      '-f',
      COMPOSE_FILE,
      'down'
    ]).catch((err) => console.error('>> Failed to teardown docker container:', err))
  }
})

function spawn(
  command: string,
  args: string[],
  opts: SpawnOptions & { log?: Test['comment'] } = {},
): Promise<void> & { child: ChildProcess } {
  if (!opts.stdio) opts.stdio = 'pipe'
  if (!opts.log) opts.log = (msg: string) => console.error(`# ${msg}`)
  opts.log(`spawn: ${command} ${args.map((x) => `${x}`).join(' ')}`)
  const child = spawnProcess(command, args, opts)
  let stderr = ''
  let stdout = ''
  child.stderr?.on('data', (data) => (stderr += data))
  child.stdout?.on('data', (data) => (stdout += data))
  const promise = new Promise((resolve, reject) => {
    child.on('error', (err) => reject(err))
    child.on('exit', (code) => {
      if (code) {
        const log = stdout + '\n' + stderr
        reject(
          new Error(
            `Command \`${command}\` exited with code ${code}. Command output:\n${log}`,
          ),
        )
      } else {
        resolve()
      }
    })
  }) as ReturnType<typeof spawn>
  promise.child = child
  return promise
}

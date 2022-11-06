import { PrismaClient } from 'repco-prisma'
import { DataSourcePluginRegistry, DataSourceRegistry } from './datasource.js'
import { EntityRevision } from './entity.js'

// export type WorkerConstructor
export enum WorkerStatus {
  Running = 'running',
  Stopped = 'stopped',
}

export abstract class Worker<Conf = void> {
  constructor(public plugins: DataSourcePluginRegistry, public repo: Repo) { }
  abstract start(): Promise<void>
  // abstract status(): WorkerStatus
  async stop(): Promise<void> { }
}

export abstract class Indexer<Conf = void> extends Worker<Conf> {
  abstract onRevisions(revisions: EntityWithRevision[]): Promise<void>
}

export class Ingester extends Worker<void> {
  interval = 1000 * 60
  constructor(plugins: DataSourcePluginRegistry, public repo: Repo) {
    super(plugins, repo)
  }

  get datasources(): DataSourceRegistry {
    return this.repo.dsr
  }

  async init() {
    const savedDataSources = await this.repo.prisma.dataSource.findMany()
    for (const model of savedDataSources) {
      if (!model.pluginUid || !this.plugins.has(model.pluginUid)) {
        console.error(
          `Skip init of data source ${model.uid}: Unknown plugin ${model.pluginUid}`,
        )
      }
      const ds = this.plugins.createInstance(model.pluginUid!, model.config)
      this.datasources.register(ds)
    }
  }

    for (const ds of this.datasources.all()) {
      // ingestUpdatesFromDataSource(this.state.prisma, this.datasources, ds)
    }
  }

  async work(): Promise<void> {
    const results = await Promise.all(
      this.datasources.all().map((ds) =>
        ingestUpdatesFromDataSource(this.repo, ds)
          .then((result) => ({ uid: ds.definition.uid, ok: false, ...result }))
          .catch((error) => ({ uid: ds.definition.uid, ok: false, error })),
      ),
    )
    console.log('results', results)
  }
}

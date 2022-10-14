import { EntityBatch, EntityForm } from './entity.js'
import { PrismaClient } from './prisma.js'
import { UID } from './shared.js'
import { storeEntityWithDataSourceFallback } from './store.js'

export type DataSourcePluginDefinition = {
  // The unique ID for this data source instance.
  uid: UID
  // The human-readable name of the data source instance (e.g. "CBA")
  name: string
}

export interface DataSourcePlugin<C = any> {
  createInstance(config: C): DataSource
  get definition(): DataSourcePluginDefinition
}

export class DataSourcePluginRegistry {
  private plugins: Record<string, DataSourcePlugin> = {}
  register(plugin: DataSourcePlugin) {
    this.plugins[plugin.definition.uid] = plugin
  }
  createInstance(uid: string, config: any): DataSource {
    if (!this.plugins[uid]) {
      throw new Error(`Unknown data source plugin: ${uid}`)
    }
    return this.plugins[uid].createInstance(config)
  }
  has(uid: string): boolean {
    return !!this.plugins[uid]
  }
}

export type DataSourceDefinition = {
  // The unique ID for this data source instance.
  uid: UID
  // The human-readable name of the data source instance (e.g. "CBA")
  name: string
  // A primary endpoint URL for this data source.
  // url: string
  pluginUid: UID
}

/**
 * A DataSource is an external provider for repco data.
 *
 * The interface is implemented for individual providers (like CBA, XRCB, media.cccc.de).
 * The DataSource includes methods to fetch data from the external source
 * and converts this data into the repco data model.
 */
export interface DataSource {
  get definition(): DataSourceDefinition
  fetchUpdates(cursor: string | null): Promise<EntityBatch>
  fetchByUID(uid: string): Promise<EntityForm[] | null>
  canFetchUID(uid: string): boolean
}

export abstract class BaseDataSource {
  canFetchUID(_uid: string): boolean {
    return false
  }
}

export class DataSourceRegistry {
  map: Map<string, DataSource> = new Map()

  get(uid: string): DataSource | null {
    return this.map.get(uid) || null
  }

  all(): DataSource[] {
    return [...this.map.values()]
  }

  register(datasource: DataSource) {
    const uid = datasource.definition.uid
    this.map.set(uid, datasource)
  }

  getByUID(uid: string): DataSource | null {
    return this.map.get(uid) || null
  }

  getForUID(uid: string): DataSource[] {
    const matching = []
    for (const ds of this.map.values()) {
      if (ds.canFetchUID(uid)) {
        matching.push(ds)
      }
    }
    return matching
  }
}

export type IngestResult = Record<
  string,
  {
    count: number
    cursor: string | null
  }
>

export async function ingestUpdatesFromDataSources(
  prisma: PrismaClient,
  datasources: DataSourceRegistry,
  maxIterations = 1,
): Promise<IngestResult> {
  const res: IngestResult = {}
  for (const ds of datasources.all()) {
    const ret = await ingestUpdatesFromDataSource(
      prisma,
      datasources,
      ds,
      maxIterations,
    )
    res[ds.definition.uid] = ret
  }
  return res
}

/**
 * Fetch updates from a data source, using the cursor persisted
 * after the last invocation.
 * All updates will be persisted to the local database. After each
 * page of updates, the current cursor will be saved locally as well.
 * Set maxIterations to Infinity to fetch all updates until no more
 * updates are returned, then stop.
 */
export async function ingestUpdatesFromDataSource(
  prisma: PrismaClient,
  datasources: DataSourceRegistry,
  datasource: DataSource,
  maxIterations = 1,
) {
  let count = 0
  let cursor = await fetchCursor(prisma, datasource)
  while (--maxIterations >= 0) {
    // console.log('fetch updates for cursor', cursor)
    const batch: EntityBatch = await datasource.fetchUpdates(cursor)
    if (!batch.entities.length) break
    count += batch.entities.length
    // console.log('fetched entities from datasource', batch.entities)
    cursor = batch.cursor
    await storeEntityBatchFromDataSource(prisma, datasources, datasource, batch)
    await saveCursor(prisma, datasource, cursor)
  }
  return {
    count,
    cursor,
  }
}

export async function storeEntityBatchFromDataSource(
  prisma: PrismaClient,
  datasources: DataSourceRegistry,
  datasource: DataSource,
  batch: EntityBatch,
) {
  for (const entity of batch.entities) {
    if (!entity.revision) entity.revision = {}
    entity.revision.datasource = datasource.definition.uid
    // console.log('IN', entity)
    const stored = await storeEntityWithDataSourceFallback(
      prisma,
      datasources,
      entity,
    )
    // console.log('rid', stored.revision.id)
    // console.log('OUT', stored)
  }
}

/**
 * Returns a string which serves as a marker for the last fetch.
 * Usually this is a timestamp or something similar
 */
async function fetchCursor(
  prisma: PrismaClient,
  datasource: DataSource,
): Promise<string | null> {
  const state = await prisma.dataSource.findUnique({
    where: { uid: datasource.definition.uid },
  })
  let cursor = null
  if (state) {
    cursor = state.cursor
  }
  return cursor
}

/**
 * The cursor contains the information about the last fetch
 * from a datasource. You can take any marker but it makes
 * sense to take the last modified date or something similar.
 */
export async function saveCursor(
  prisma: PrismaClient,
  datasource: DataSource,
  cursor: string,
) {
  await prisma.dataSource.upsert({
    where: { uid: datasource.definition.uid },
    update: { cursor },
    create: {
      uid: datasource.definition.uid,
      pluginUid: datasource.definition.pluginUid,
      cursor,
    },
  })
}

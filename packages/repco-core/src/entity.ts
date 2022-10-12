/**
 * We work with entities. An entity has a type, content and a revision.
 * An EntityBatch is retrieved from the datasource and persisted locally,
 * it can contain multiple entities and their associated revisions.
 * Furthermore the EntityBatch has a cursor which is usually a timestamp of the last retrieval of the entity.
 */

import { repco } from 'repco-prisma'
import {
  ContentGrouping,
  ContentGroupingVariant,
  ContentItem,
  MediaAsset,
  Revision,
} from './prisma.js'

export type { ContentItem, MediaAsset, ContentGrouping, Revision }
export { ContentGroupingVariant }
// export type AnyEntityContent = repco.EntityOutput['content']
export type AnyEntityContent = { uid: string }
export type AnyEntityType = repco.EntityOutput['type']

export type EntityBatch = {
  cursor: string
  entities: EntityForm[]
}

export type Entity = {
  type: string
  content: AnyEntityContent
  revision: Revision
}

export type EntityMaybeContent<T extends boolean = true> = T extends true
  ? Entity
  : T extends false
  ? Omit<Entity, 'content'>
  : never

export type TypedEntity<T extends AnyEntityType> = {
  type: T
  content: Extract<repco.EntityOutput, { type: T }>['content']
  revision: Revision
}

export type MaybeTypedEntity<T = any> = {
  type: T extends AnyEntityType ? T : string
  content: T extends AnyEntityType
    ? Extract<repco.EntityOutput, { type: T }>['content']
    : AnyEntityContent
  revision: Revision
}

export function assumeType<T extends AnyEntityType>(
  entity: Entity,
): TypedEntity<T> {
  return entity as TypedEntity<T>
}

export type EntityFormContent = Omit<AnyEntityContent, 'revisionId'>

// TODO: This should be the output types.
export type TypedEntity<T extends EntityType> = Extract<
  repco.EntityInput,
  { type: T }
>
export type TypedEntityWithRevision<T extends EntityType> = TypedEntity<T> & {
  revision: Revision
  uid: string
}
export function filterType<T extends EntityType>(
  entities: EntityWithRevision[],
  type: T,
): TypedEntityWithRevision<T>[] {
  return entities.filter((x) => x.type === type) as TypedEntityWithRevision<T>[]
}

export function checkType<T extends EntityType>(
  entity: EntityWithRevision,
  type: T,
): asserts entity is TypedEntityWithRevision<T> {
  if (entity.type !== type)
    throw new Error(
      `Type mismatch: expected ${type} but received ${entity.type}`,
    )
}

export function safeCheckType<T extends EntityType>(
  entity: EntityWithRevision,
  type: T,
): TypedEntityWithRevision<T> | null {
  if (entity.type !== type) return null
  return entity as TypedEntityWithRevision<T>
}

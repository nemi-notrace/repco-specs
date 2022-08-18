import { resolvers } from 'repco-prisma/generated/typegraphql'
import { buildSchemaSync } from 'type-graphql'

export const schema = buildSchemaSync({
  resolvers,
  validate: false,
})

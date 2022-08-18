// @ts-ignore
import 'express-async-errors'
import * as error from './error.js'
import cors from 'cors'
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { PrismaClient } from 'repco-core'
import Routes from './routes.js'
import { context } from './context'
import { schema } from './schema.js'

export function runServer(prisma: PrismaClient, port: number) {
  const app = express()
  app.use(
    '/graphql',
    graphqlHTTP({
      schema,
      context: context,
      graphiql: true,
    }),
  )
  app.use(express.json({ limit: '100mb' }))
  app.use(cors())
  app.use((req, res, next) => {
    res.locals.prisma = prisma
    next()
  })
  app.use((req, res, next) => {
    if (!req.header('content-type')) {
      req.headers['content-type'] = 'application/json'
    }
    next()
  })

  app.use('/', Routes)

  app.use(error.notFoundHandler)
  app.use(error.handler)

  return app.listen(port, () => {
    console.log(`Repco server listening on http://localhost:${port}`)
  })
}

import formatError from './formatError'
import * as express from 'express'
import * as bodyParser from 'body-parser'

import { createServer } from 'http'
import { execute, subscribe } from 'graphql'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import { authenticate } from './authentication'

import buildDataLoaders from './dataloaders'

import schema from './schema'
import connectMongo from './mongo-connector'

const PORT = 4000

const start = async () => {
  const mongo = await connectMongo()
  const app = express()

  const buildOptions = async (req, res) => {
    const user = await authenticate(req, mongo.Users)

    return {
      context: {
        mongo,
        user,
        dataloaders: buildDataLoaders(mongo)
      },
      formatError,
      schema
    }
  }
  app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions))
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    passHeader: `'Authorization': 'bearer token-foo@bar.com'`,
    subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
  }));

  const server = createServer(app)
  server.listen(PORT, () => {
    SubscriptionServer.create(
      { execute, subscribe, schema },
      { server, path: '/subscriptions' }
    )
    console.log(`Hackernews GraphQL server running on port ${PORT}.`)
  })
}

start()

import formatError from './formatError';
import * as express from 'express';
import * as bodyParser from 'body-parser';

import { graphqlExpress } from 'apollo-server-express'
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

  app.listen(PORT, () =>
    console.log(`Hackernews GraphQL server running on port ${PORT}.`)
  )
}

start()

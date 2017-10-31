const { ObjectID } = require('mongodb')
import { URL } from 'url'
import pubsub from '../pubsub'

class ValidationError extends Error {
  constructor(message, public field) {
    super(message)
  }
}

function validateLink({ url }) {
  try {
    console.log(url)
    new URL(url)
  } catch (error) {
    throw new ValidationError('Link validation error: invalid url.', 'url')
  }
}

const getId = root => root._id || root.id

export default {
  Query: {
    allLinks: async (_, data, { mongo: { Links } }) => {
      return await Links.find({}).toArray()
    }
  },
  Mutation: {
    async createLink(_, data, { mongo: { Links }, user }) {
      validateLink(data)

      const link = {
        ...data,
        postedById: user && user._id
      }
      const { insertedIds: [id] } = await Links.insert(link)

      const created = Object.assign({ id }, link)

      pubsub.publish('Link', { Link: { mutation: 'CREATED', node: created } })

      return created
    },
    async createUser(root, { name, authProvider }, { mongo: { Users } }) {
      const user = {
        name,
        email: authProvider.email.email,
        password: authProvider.email.password
      }

      const { insertedIds: [id] } = await Users.insert(user)
      const created = Object.assign({ id }, user)

      return created
    },
    async createVote(_, data, { mongo: { Votes }, user }) {
      const vote = {
        userId: user && user._id,
        linkId: new ObjectID(data.linkId)
      }
      const { insertedIds: [id] } = await Votes.insert(vote)

      return {
        id,
        ...vote
      }
    },
    async signinUser(root, { email }, { mongo: { Users } }) {
      const user = await Users.findOne({ email: email.email })
      if (email.password === user.password) {
        return { token: `token-${user.email}`, user }
      }
    }
  },
  Subscription: {
    Link: {
      subscribe: () => pubsub.asyncIterator('Link')
    }
  },
  Link: {
    id: getId,
    async postedBy({ postedById }, data, { dataloaders: { userLoader } }) {
      return await userLoader.load(postedById)
    },
    async votes({ _id: linkId }, data, { mongo: { Votes } }) {
      return await Votes.find({ linkId }).toArray()
    }
  },
  User: {
    id: getId,
    async votes({ _id: userId }, data, { mongo: { Votes } }) {
      return await Votes.find({ userId }).toArray()
    }
  },
  Vote: {
    id: getId,
    user: async ({ userId }, data, { dataloaders: { userLoader } }) => {
      return await userLoader.load(userId)
    },
    async link({ linkId: _id }, data, { mongo: { Links } }) {
      return await Links.findOne({ _id })
    }
  }
}

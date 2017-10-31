import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './resolvers'

const typeDefs = `
    type Link {
        id: ID!
        url: String!
        description: String!
        postedBy: User      
        votes: [Vote!]!        
    }

    type User {
        id: ID!
        name: String!
        email: String
        votes: [Vote!]!                
    }

    type Query {
        allLinks: [Link!]!
    }

    type SigninPayload {
        token: String
        user: User
    }

    type Vote {
        id: ID!
        user: User!
        link: Link!
    }

    type Subscription {
        Link(filter: LinkSubscriptionFilter): LinkSubscriptionPayload
    }

    input LinkSubscriptionFilter {
        mutation_in: [_ModelMutationType!]
    }

    type LinkSubscriptionPayload {
        mutation: _ModelMutationType!
        node: Link
    }

    enum _ModelMutationType {
        CREATED
        UPDATED
        DELETED
    }

    input AuthProviderSignupData {
        email: AUTH_PROVIDER_EMAIL
    }

    input AUTH_PROVIDER_EMAIL {
        email: String!
        password: String!
    }

    type Mutation {
        createLink(url: String!, description: String!): Link
        createUser(name: String!, authProvider: AuthProviderSignupData!): User
        createVote(linkId: ID!): Vote
        signinUser(email: AUTH_PROVIDER_EMAIL!): SigninPayload!
    }
`

export default makeExecutableSchema({typeDefs, resolvers})
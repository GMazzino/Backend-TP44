import { buildSchema as schema } from 'graphql';
import { graphqlHTTP as expressGraphql } from 'express-graphql';
import { getProductById, getProducts } from '../handlers/graphql.js';
import { apiMethods as api } from '../api/api_array.js';

const graphqlSchema = schema(`
    input ProductInput {
        name: String,
        price: Float,
        img: String
    }
    type Product {
        id: ID!
        name: String,
        price: Float,
        img: String
    }
    type Query {
        getProductByID(id:ID!): Product,
        getProducts: [Product],
    }
`);

export const graphqlMidWare = expressGraphql({
  schema: graphqlSchema,
  rootValue: {
    getProductById,
    getProducts,
  },
  graphiql: true,
});

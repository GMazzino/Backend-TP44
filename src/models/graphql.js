import { buildSchema as schema } from 'graphql';
import { graphqlHTTP as expressGraphql } from 'express-graphql';
import { ApiGraphql } from '../api/api_graphql.js';

const graphqlSchema = schema(`
    type Product {
        id: Int,
        name: String,
        price: Float,
        img: String
    }
    type Query {
        getProductById(id:Int!): Product,
        getProducts: [Product],
    }
`);

export class GraphqlMidWare {
  constructor() {
    const api = new ApiGraphql();
    return expressGraphql({
      schema: graphqlSchema,
      rootValue: {
        getProductById: api.getProductById,
        getProducts: api.getProducts,
      },
      graphiql: true,
    });
  }
}

export const graphqlMidWare = new GraphqlMidWare();

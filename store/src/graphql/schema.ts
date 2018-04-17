const { makeExecutableSchema } = require('graphql-tools');
import * as Kafka from "node-rdkafka";

const producer = new Kafka.Producer({
  'metadata.broker.list': 'kafka:9092',
}, {});
producer.connect({});

interface ctx {
};

// Some fake data
const orders = [
  {
    uuid: "abc-123",
    status: "pending",
  },
  {
    uuid: "def-456",
    status: "pending",
  },
];

const typeDefs = `
  type Order {
    uuid: String
    status: String
  }
  type Query {
    orders: [Order!]!
  }
  type Mutation {
    createOrder(status: String): Status
  }
  type Status {
    success: String
  }
  schema {
    query: Query
    mutation: Mutation
  }
`;

const resolvers = {
  Query: {
    orders: () => orders,
  },
  Mutation: {
    createOrder(obj: any, { status }: { status: string }, context: ctx) {
      try {
        producer.produce(
          'storeEvent',
          null,
          Buffer.from(status, 'utf-8'),
          null,
          Date.now(),
        );
        console.log('Producer has produced!');
        return {
          success: true,
        };
      } catch (err) {
        console.error('A problem occurred when sending our message');
        console.error(err);
        return {
          success: false,
        };
      }
    },
  },
};

export const myGraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

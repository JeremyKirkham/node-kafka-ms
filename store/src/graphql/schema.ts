const { makeExecutableSchema } = require('graphql-tools');
import { createConnection } from "typeorm";
import "reflect-metadata";
import * as uuid from "uuid/v4";
import {
  Order,
  PENDING_STATUS,
} from "../entity/Order";
import { PubSub, withFilter } from 'graphql-subscriptions';
import { producer } from '../producers';
import { STORE_EVENT } from '../consumers';
import { ORDER_PUBSUB_TOPIC, pubsub } from '../app';
import { ORDER_TYPE } from '../messages';

interface ctx {
};

const typeDefs = `
  type Order {
    uuid: String!
    status: String!
  }
  type Query {
    orders: [Order!]!
  }
  type Mutation {
    createOrder: Status!
  }
  type Subscription {
    orderAdded: Order!
    orderUpdated: Order!
  }
  type Status {
    success: String!
  }
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

const resolvers = {
  Query: {
    orders: () => {
      return createConnection().then(async connection => {
        let orderRepository = connection.getRepository(Order);
        const orders = await orderRepository.find();
        await connection.close();
        return orders;
      });
    },
  },
  Mutation: {
    createOrder(obj: any, args: any, context: ctx) {
      let order = new Order();
      order.uuid = uuid();
      order.status = PENDING_STATUS;
      const buff = ORDER_TYPE.toBuffer(order);
      try {
        producer.produce(
          STORE_EVENT,
          null,
          buff,
          null,
          Date.now(),
        );
        return {
          success: true,
        };
      } catch (e) {
        console.log('Error occurred producing a message');
        console.log(e);
      }
      return {
        success: false,
      };
    },
  },
  Subscription: {
    orderAdded: {
      subscribe: withFilter(() => pubsub.asyncIterator(ORDER_PUBSUB_TOPIC), (payload, args) => {
        return payload.hasOwnProperty('orderAdded')
      }),
    },
    orderUpdated: {
      subscribe: withFilter(() => pubsub.asyncIterator(ORDER_PUBSUB_TOPIC), (payload, args) => {
        return payload.hasOwnProperty('orderUpdated');
      }),
    },
  },
};

export const myGraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

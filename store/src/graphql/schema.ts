const { makeExecutableSchema } = require('graphql-tools');
import { createConnection } from "typeorm";
import "reflect-metadata";
import * as uuid from "uuid/v4";
import * as avro from "avsc";
import {
  Order,
  PENDING_STATUS,
  AWAITING_PAYMENT_STATUS,
} from "../entity/Order";
import { PubSub, withFilter } from 'graphql-subscriptions';
import { producer } from '../producers';
import { STORE_EVENT } from '../consumers';
import { ORDER_PUBSUB_TOPIC, pubsub } from '../app';

export const avroType = avro.Type.forSchema({
  type: 'record',
  fields: [
    {name: 'uuid', type: 'string'},
    {name: 'status', type: 'string'}
  ],
});

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
    createOrder(status: String!): Status!
  }
  type Subscription {
    # Subscription fires on every comment added
    orderAdded(status: String): Order!
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
    createOrder(obj: any, { status }: { status: string }, context: ctx) {
      let order = new Order();
      order.uuid = uuid();
      order.status = AWAITING_PAYMENT_STATUS;
      const buff = avroType.toBuffer(order);
      try {
        producer.produce(
          STORE_EVENT,
          null,
          buff,
          null,
          Date.now(),
        );
        console.log('Store Producer has produced!');
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
        return payload.orderAdded.topic === args.topic;
      }),
    },
  },
};

export const myGraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

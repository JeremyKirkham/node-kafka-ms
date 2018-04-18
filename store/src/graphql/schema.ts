const { makeExecutableSchema } = require('graphql-tools');
import * as Kafka from "node-rdkafka";
import { createConnection } from "typeorm";
import "reflect-metadata";
import { Order } from "../entity/Order";
import * as uuid from "uuid/v4";
import * as avro from "avsc";
import { KafkaPubSub } from 'graphql-kafka-subscriptions';
import { PubSub, withFilter } from 'graphql-subscriptions';

const ORDER_ADDED_TOPIC = 'orderAdded';
const pubsub = new KafkaPubSub({
  topic: ORDER_ADDED_TOPIC,
  host: 'kafka',
  port: '9092',
})

const avroType = avro.Type.forSchema({
  type: 'record',
  fields: [
    {name: 'id', type: 'int'},
    {name: 'uuid', type: 'string'},
    {name: 'status', type: 'string'}
  ],
});

const avroType2 = avro.Type.forSchema({
  type: 'record',
  fields: [
    {name: 'uuid', type: 'string'},
    {name: 'status', type: 'string'}
  ],
});

const producer = new Kafka.Producer({
  'metadata.broker.list': 'kafka:9092',
}, {});
producer.connect({});

const consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': 'kafka:9092',
}, {});
consumer.connect({});
consumer
  .on('ready', function() {
    console.log('Store Consumer is ready!');
    consumer.subscribe(['paymentEvent']);
    consumer.consume();
  })
  .on('data', function(data) {
    const decoded = avroType2.fromBuffer(data.value);
    console.log('Store Consumer has received data!');
    createConnection().then(async connection => {
      let orderRepository = connection.getRepository(Order);
      let order = await orderRepository.findOne({uuid: decoded.uuid });
      order.status = decoded.status;
      await orderRepository.save(order);
      await connection.close();
    });
  });

interface ctx {
};

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
  type Subscription {
    # Subscription fires on every comment added
    orderAdded(status: String): Order
  }
  type Status {
    success: String
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
      createConnection().then(async connection => {
        let order = new Order();
        order.uuid = uuid();
        order.status = status;
        let orderRepository = connection.getRepository(Order);
        await orderRepository.save(order);
        await connection.close();
        const buff = avroType.toBuffer(order);
        try {
          producer.produce(
            'storeEvent',
            null,
            buff,
            null,
            Date.now(),
          );
          pubsub.publish({
            ORDER_ADDED_TOPIC,
            orderAdded: {
              uuid: order.uuid,
              status: order.status,
            },
          });
          console.log('Store Producer has produced!');
        } catch (e) {
          console.log('Error occurred producing a message');
          console.log(e);
        }
      });
      return {
        success: true,
      };
    },
  },
  Subscription: {
    orderAdded: {
      subscribe: withFilter(() => pubsub.asyncIterator(ORDER_ADDED_TOPIC), (payload, args) => {
        return payload.orderAdded.topic === args.topic;
      }),
    },
  },
};

export const myGraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

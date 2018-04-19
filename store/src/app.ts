import * as express from 'express';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { myGraphQLSchema as schema } from './graphql/schema';
import * as cors from 'cors';
import { KafkaPubSub } from 'graphql-kafka-subscriptions';
import { producer } from './producers';
import { consumer } from './consumers';

const port = 3000;

export const ORDER_PUBSUB_TOPIC = 'orderPubSub';
export const pubsub = new KafkaPubSub({
  topic: ORDER_PUBSUB_TOPIC,
  host: 'kafka',
  port: '9092',
});

producer.connect({});
consumer.connect({});

// Create Express server
const app = express();

app.use('/graphql', cors(), bodyParser.json(), graphqlExpress({
  schema
}));

app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
  subscriptionsEndpoint: `ws://localhost:${port}/subscriptions`
}));

// Express configuration
app.set("port", port);

export default app;

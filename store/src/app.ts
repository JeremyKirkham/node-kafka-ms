import * as express from 'express';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { myGraphQLSchema as schema } from './graphql/schema';
import * as cors from 'cors';

const port = 3000;

// Create Express server
const app = express();

app.use('/graphql', cors(), bodyParser.json(), graphqlExpress({
  schema
}));

app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));

// Express configuration
app.set("port", port);

export default app;

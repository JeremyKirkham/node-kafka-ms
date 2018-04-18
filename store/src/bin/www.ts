import app from "../app";
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { createServer } from 'http';
import { myGraphQLSchema as schema } from '../graphql/schema';

const port = 3000;

/**
 * Start Express server.
 */
 // Wrap the Express server
 const ws = createServer(app);
 ws.listen(port, () => {
   console.log(`Apollo Server is now running on http://localhost:${port}`);
   // Set up the WebSocket for handling GraphQL subscriptions
   new SubscriptionServer({
     execute,
     subscribe,
     schema
   }, {
     server: ws,
     path: '/subscriptions',
   });
 });

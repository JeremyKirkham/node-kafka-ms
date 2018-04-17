import * as express from 'express';

const port = 3001;

// Create Express server
const app = express();

// Express configuration
app.set("port", port);

export default app;

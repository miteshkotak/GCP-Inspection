import express, { Response } from 'express';
import createError from 'http-errors';
import path from 'path';
import config from './config/env';

import { handleError } from './helpers/error';
import httpLogger from './utils/httpLogger';

import { initializeDatabase } from './config/database';
import templatesRouter from './routes/templates';
import objectsRouter from './routes/objects';
import inspectionsRouter from './routes/inspection';

const app = express();

//TODO: add cors as middle for cross site verification,  between backend and frontend
// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(httpLogger);

//routes
app.use('/api/templates', templatesRouter);
app.use('/api/objects', objectsRouter);
app.use('/api/inspections', inspectionsRouter);

// Serve frontend
app.get('/', (res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  next(createError(404));
});

// error handler
const errorHandler: express.ErrorRequestHandler = (err, _req, res) => {
  handleError(err, res);
};
app.use(errorHandler);

const PORT = config.port;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

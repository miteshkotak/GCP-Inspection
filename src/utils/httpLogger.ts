import morgan, { StreamOptions } from 'morgan';
import logger from '../utils/logger';

const stream: StreamOptions = {
  write: (message) => logger.info(message),
};

const morganMiddleware = morgan('combined', { stream: stream });

export default morganMiddleware;

import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    const app = createApp();
    
    const server = app.listen(config.port, () => {
      logger.info(`API Gateway listening on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server shut down complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

startServer();
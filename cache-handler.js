import { CacheHandler } from '@neshca/cache-handler';
import createLruHandler from '@neshca/cache-handler/local-lru';
import createRedisHandler from '@neshca/cache-handler/redis-strings';
import { createClient } from 'redis';

CacheHandler.onCreation(async () => {
  let client;

  // Use Redis if available, otherwise fallback to LRU
  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await client.connect();
  } catch {
    // Fallback to LRU cache
  }

  const clientHandlers = [];

  if (client) {
    clientHandlers.push(
      createRedisHandler({
        client,
        keyPrefix: 'next-cache:',
        timeoutMs: 1000,
      })
    );
  }

  // Always include LRU as fallback
  clientHandlers.push(
    createLruHandler({
      maxItemsNumber: 10000,
      maxItemsSize: 1024 * 1024 * 1024, // 1GB
    })
  );

  return {
    handlers: clientHandlers,
  };
});

export default CacheHandler;
import { MongoMemoryReplSet } from 'mongodb-memory-server'

/**
 * Starts a throwaway single-node replica set for tests that need a real MongoDB.
 *
 * The `mongod` binary is resolved by mongodb-memory-server's own cache (by default
 * `node_modules/.cache/mongodb-memory-server`, or `MONGOMS_DOWNLOAD_DIR` when set), so it is
 * downloaded once per machine instead of once per test file. CI caches that directory.
 */
export async function createTestMongoServer(): Promise<{
  stop: () => Promise<void>
  uri: string
}> {
  const server = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
    },
  })

  return {
    stop: async () => {
      await server.stop()
    },
    uri: server.getUri(),
  }
}

import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { MongoMemoryReplSet } from 'mongodb-memory-server'

export async function createTestMongoServer(): Promise<{
  stop: () => Promise<void>
  uri: string
}> {
  const downloadDir = mkdtempSync(join(tmpdir(), 'payload-mongodb-binary-'))
  const server = await MongoMemoryReplSet.create({
    binary: {
      downloadDir,
    },
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
    },
  })

  return {
    stop: async () => {
      await server.stop()
      rmSync(downloadDir, {
        force: true,
        recursive: true,
      })
    },
    uri: server.getUri(),
  }
}

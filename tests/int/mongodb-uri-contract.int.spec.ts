import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const activeContractPaths = [
  '.env.example',
  'README.md',
  'docker-compose.yml',
  'scripts/export-db.mjs',
  'src/config/runtime.ts',
  'docs/operations/developer-workflows.md',
  'docs/operations/mongodb-deployment.md',
  'docs/operations/runtime-and-providers.md',
  'docs/operations/starter-clone-checklist.md',
] as const
const dockerCompose = readFileSync('docker-compose.yml', 'utf8')
const mongoDeploymentDocs = readFileSync('docs/operations/mongodb-deployment.md', 'utf8')
const projectArchitecture = readFileSync(
  '.agents/skills/project-context/references/architecture.md',
  'utf8',
)

describe('MongoDB environment contract', () => {
  it('uses MONGODB_URI throughout every active contract surface', () => {
    for (const filePath of activeContractPaths) {
      const source = readFileSync(filePath, 'utf8')

      expect(source, filePath).toContain('MONGODB_URI')
      expect(source, filePath).not.toContain('DATABASE_URL')
    }
  })

  it('documents the local MongoDB URI in the environment example', () => {
    const envExample = readFileSync('.env.example', 'utf8')

    expect(envExample).toContain(
      'MONGODB_URI=mongodb://127.0.0.1:27017/payload-cms-starter-kit',
    )
  })

  it('pins local MongoDB to the Atlas-compatible runtime and volume', () => {
    expect(dockerCompose).toContain('image: mongo:8.0.29')
    expect(dockerCompose).toContain('- mongo_data_8_0:/data/db')
    expect(dockerCompose).toContain('mongo_data_8_0:')
    expect(dockerCompose).not.toContain('image: mongo:latest')

    expect(mongoDeploymentDocs).toContain('MongoDB 8.0.29')
    expect(projectArchitecture).toContain('MongoDB 8.0.29')
  })
})

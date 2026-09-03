/**
 * One-time migration script: moves office locations from the `site-settings`
 * global array into the new `office-locations` collection.
 *
 * Usage:
 *   pnpm migrate:offices
 *
 * Safe to run multiple times — it will not duplicate entries if the collection
 * already has data (it prints a warning and exits early).
 */

import path from 'node:path'

import { config as dotenvConfig } from 'dotenv'
import { getPayload } from 'payload'

dotenvConfig({ path: path.resolve(process.cwd(), '.env') })
dotenvConfig({ path: path.resolve(process.cwd(), '.env.local'), override: false })

async function run() {
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  // Guard: skip if collection already has documents
  const existing = await payload.find({
    collection: 'office-locations',
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    console.log(
      `⚠  office-locations collection already has ${existing.totalDocs} document(s). ` +
        'Skipping migration to avoid duplicates.',
    )
    await payload.db.destroy?.()
    return
  }

  // Find an admin user to satisfy the editorial workflow publish check
  const usersResult = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
  })
  const adminUser = usersResult.docs[0]
  if (!adminUser) {
    throw new Error(
      'No user found. Create an admin account via /admin then re-run this script.',
    )
  }

  // Read the legacy global array
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyOffices: any[] = (settings as any).officeLocations ?? []

  if (!legacyOffices.length) {
    console.log('No office locations found in site-settings. Nothing to migrate.')
    await payload.db.destroy?.()
    return
  }

  console.log(`Migrating ${legacyOffices.length} office location(s)…`)

  for (const office of legacyOffices) {
    const doc = await payload.create({
      collection: 'office-locations',
      overrideAccess: true,
      user: adminUser,
      data: {
        _status: 'published' as const,
        city: office.city ?? 'Unknown City',
        region: office.region ?? undefined,
        showAddressDetails: office.showAddressDetails ?? true,
        address: office.address ?? undefined,
        phone: office.phone ?? undefined,
        email: office.email ?? undefined,
        mapEmbedUrl: office.mapEmbedUrl,
        mapUrl: office.mapUrl,
        mapTitle: office.mapTitle ?? undefined,
      },
    })
    console.log(`  ✓  ${doc.city}${office.region ? ` (${office.region})` : ''} → ${doc.id}`)
  }

  console.log('\n✅  Migration complete.')
  console.log(
    'You can now remove the officeLocations array from your site-settings backup/export.',
  )

  await payload.db.destroy?.()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

import type { CollectionConfig } from 'payload'

// Internal security state is deliberately inaccessible even to Admin REST/GraphQL clients.
// Only the authenticated, password-confirmed Users endpoints may change it.
export const TwoFactorCredentials: CollectionConfig = {
  slug: 'two-factor-credentials',
  admin: { hidden: true },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  graphQL: false,
  trash: false,
  fields: [
    { name: 'userID', type: 'text', required: true, unique: true, index: true },
    { name: 'revision', type: 'number', required: true, defaultValue: 0 },
    { name: 'state', type: 'json', required: true },
  ],
}

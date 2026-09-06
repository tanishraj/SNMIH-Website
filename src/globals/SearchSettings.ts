import type { ArrayField, GlobalConfig } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { revalidateGlobalsCacheForGlobal } from '@/hooks/revalidateCmsContent'
import { MAX_SEARCH_SUGGESTIONS, validateSuggestedSearchTerms } from '@/lib/searchSuggestions'

export const SearchSettings: GlobalConfig = {
  slug: 'search-settings',
  label: 'Search Settings',
  admin: {
    group: 'Configuration',
    description: 'Suggested search terms displayed on the search page.',
    hidden: hideUnlessFeature('searchSettings'),
  },
  access: {
    read: allowPublicReadOrFeature('searchSettings'),
    readVersions: requireFeature('searchSettings'),
    update: requireFeature('searchSettings'),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [revalidateGlobalsCacheForGlobal],
  },
  fields: [
    {
      name: 'suggestedSearches',
      label: 'Suggested Searches',
      type: 'array',
      maxRows: MAX_SEARCH_SUGGESTIONS,
      validate: validateSuggestedSearchTerms,
      admin: {
        description:
          'Up to 6 ordered terms shown as clickable chips on the full Search page. Use each term only once.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'term',
          label: 'Search Term',
          type: 'text',
          required: true,
        },
      ],
    } satisfies ArrayField,
  ],
}

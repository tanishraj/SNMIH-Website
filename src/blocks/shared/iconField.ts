import type { TextField } from 'payload'

export function createIconField(options?: {
  label?: string
  required?: boolean
  description?: string
}): TextField {
  return {
    name: 'icon',
    label: options?.label ?? 'Icon',
    type: 'text',
    ...(options?.required ? { required: true } : {}),
    admin: {
      description:
        options?.description ??
        'Lucide icon name — e.g. "Star", "Rocket", "GraduationCap". Browse all icons at lucide.dev/icons',
    },
  }
}

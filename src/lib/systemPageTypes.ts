export const systemPageTypeOptions = [
  {
    label: '404',
    value: '404',
  },
  {
    label: 'Maintenance',
    value: 'maintenance',
  },
  {
    label: 'Coming Soon',
    value: 'comingSoon',
  },
] as const

export type SystemPageType = (typeof systemPageTypeOptions)[number]['value']

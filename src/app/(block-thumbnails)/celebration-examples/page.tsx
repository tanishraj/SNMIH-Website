import { notFound } from 'next/navigation'

import { CelebrationExamples } from '@/components/celebration/CelebrationExamples'

export default function CelebrationExamplesPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <CelebrationExamples />
}

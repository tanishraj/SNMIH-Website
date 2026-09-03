'use client'

import {
  DefaultEditView,
  useDocumentDrawerContext,
  useDocumentInfo,
} from '@payloadcms/ui'
import type { DocumentViewClientProps } from 'payload'

import { PageRecipeSetup } from '@/components/admin/PageRecipeSetup'

export function PageCreateView(props: DocumentViewClientProps) {
  const { drawerSlug } = useDocumentDrawerContext()
  const { id } = useDocumentInfo()

  if (id || drawerSlug) return <DefaultEditView {...props} />

  return <PageRecipeSetup />
}

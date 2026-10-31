import { formFileKindDefinitions } from '@/lib/forms'

/** Upload collection that stores files sent through public forms. */
export const FORM_ATTACHMENTS_COLLECTION = 'form-attachments' as const
/** Object-storage prefix (and local static directory) for those files. */
export const FORM_ATTACHMENTS_STORAGE_PREFIX = 'form-attachments'

/** Every MIME type any form file field can accept; a field narrows this further. */
export const FORM_ATTACHMENT_MIME_TYPES = [
  ...new Set(Object.values(formFileKindDefinitions).flatMap((kind) => kind.mimeTypes)),
]

import type { ArrayField } from 'payload'
import { createContentActionsField } from './contentActionsFields'
import { resolveFeeDocumentActions } from './feeDocumentAction'

export function createFeeDocumentActionField(): ArrayField {
  return {
    ...createContentActionsField({
      name: 'feeDocumentAction',
      label: 'Fee Document Action',
      maxRows: 1,
      allowedLinkTypes: ['file'],
      defaultVariant: 'outline',
    }),
    hooks: {
      afterRead: [
        ({ value, siblingData }) =>
          resolveFeeDocumentActions({ ...siblingData, feeDocumentAction: value }),
      ],
      beforeValidate: [
        ({ value, siblingData }) =>
          resolveFeeDocumentActions({ ...siblingData, feeDocumentAction: value }),
      ],
    },
  }
}
export const hasFeeDocumentAction = (
  _data: unknown,
  siblingData: { feeDocumentAction?: unknown[] | null; feeDocument?: unknown },
) =>
  siblingData?.feeDocumentAction !== undefined
    ? Boolean(siblingData.feeDocumentAction?.length)
    : Boolean(siblingData?.feeDocument)

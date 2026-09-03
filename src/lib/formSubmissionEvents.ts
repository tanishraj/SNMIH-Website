export type FormSubmissionEventInput = {
  campaign?: string
  formId: string | number
  formSlug: string
  landingPage?: string
  owner?: string | number
  source?: string
  submissionId: string | number
  submissionIntent: 'general' | 'lead' | 'review'
  status: 'new' | 'in_review' | 'qualified' | 'won' | 'rejected' | 'archived'
  submitterEmail?: string
  submitterName?: string
  values: Record<string, boolean | string>
}

// Starter seam for project-specific lead routing or downstream automation.
export const emitFormSubmissionEvent = async (
  _input: FormSubmissionEventInput,
): Promise<void> => {
  return
}

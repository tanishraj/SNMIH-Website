import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import type { CmsActionValue } from '@/lib/cmsLinks'

export type BankDetailsTabStyle = 'boxed' | 'pills' | 'underline'
export type BankDetailsTabWidth = 'centered' | 'content' | 'equal'
export type BankDetailsDisplayMode = 'scanner' | 'text'
export type BankDetailsPanelPosition = 'left' | 'right'

export type BankDetailsLedgerTextValue = {
  accountHolderLabel?: string | null
  accountNumberLabel?: string | null
  bankNameLabel?: string | null
  branchLabel?: string | null
  copyAllLabel?: string | null
  ifscCodeLabel?: string | null
  ledgerTitle?: string | null
  upiIdLabel?: string | null
  verifiedLabel?: string | null
}

export type ResolvedBankDetailsLedgerText = {
  [Key in keyof BankDetailsLedgerTextValue]-?: string
}

export type BankAccountValue = {
  accountHolder?: string | null
  accountNumber?: string | null
  bankName?: string | null
  branch?: string | null
  id?: string | null
  ifscCode?: string | null
  instructions?: string | null
  purpose?: string | null
  upiId?: string | null
}

export type ResolvedBankAccount = {
  accountHolder: string
  accountNumber: string
  bankName?: string
  branch?: string
  id: string
  ifscCode: string
  instructions?: string
  purpose: string
  upiId?: string
}

export type BankDetailsBlockLike = {
  accentTitle?: string | null
  accounts?: BankAccountValue[] | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | null
  description?: string | null
  displayMode?: BankDetailsDisplayMode | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  ledgerText?: BankDetailsLedgerTextValue | null
  officialAccountLabel?: string | null
  panelDescription?: string | null
  panelPosition?: BankDetailsPanelPosition | null
  panelTitle?: string | null
  size?: RegularBlockSize | null
  tabStyle?: BankDetailsTabStyle | null
  tabWidth?: BankDetailsTabWidth | null
  title?: string | null
}

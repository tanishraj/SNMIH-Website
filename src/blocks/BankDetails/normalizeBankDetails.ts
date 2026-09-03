import type {
  BankAccountValue,
  BankDetailsLedgerTextValue,
  ResolvedBankAccount,
  ResolvedBankDetailsLedgerText,
} from './types'

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const bankDetailsLedgerTextDefaults: ResolvedBankDetailsLedgerText = {
  accountHolderLabel: 'Account Holder',
  accountNumberLabel: 'Account Number',
  bankNameLabel: 'Bank Name',
  branchLabel: 'Branch & Type',
  copyAllLabel: 'Copy all details',
  ifscCodeLabel: 'IFSC Code',
  ledgerTitle: 'Bank Account Information',
  upiIdLabel: 'UPI ID',
  verifiedLabel: 'Verified',
}

export function normalizeBankDetailsLedgerText(value?: unknown): ResolvedBankDetailsLedgerText {
  const source: BankDetailsLedgerTextValue =
    value && typeof value === 'object' ? (value as BankDetailsLedgerTextValue) : {}

  return {
    accountHolderLabel:
      normalizeText(source.accountHolderLabel) || bankDetailsLedgerTextDefaults.accountHolderLabel,
    accountNumberLabel:
      normalizeText(source.accountNumberLabel) || bankDetailsLedgerTextDefaults.accountNumberLabel,
    bankNameLabel:
      normalizeText(source.bankNameLabel) || bankDetailsLedgerTextDefaults.bankNameLabel,
    branchLabel: normalizeText(source.branchLabel) || bankDetailsLedgerTextDefaults.branchLabel,
    copyAllLabel: normalizeText(source.copyAllLabel) || bankDetailsLedgerTextDefaults.copyAllLabel,
    ifscCodeLabel:
      normalizeText(source.ifscCodeLabel) || bankDetailsLedgerTextDefaults.ifscCodeLabel,
    ledgerTitle: normalizeText(source.ledgerTitle) || bankDetailsLedgerTextDefaults.ledgerTitle,
    upiIdLabel: normalizeText(source.upiIdLabel) || bankDetailsLedgerTextDefaults.upiIdLabel,
    verifiedLabel:
      normalizeText(source.verifiedLabel) || bankDetailsLedgerTextDefaults.verifiedLabel,
  }
}

export function normalizeBankAccounts(accounts?: BankAccountValue[] | null): ResolvedBankAccount[] {
  if (!Array.isArray(accounts)) return []

  const purposes = new Set<string>()
  const resolved: ResolvedBankAccount[] = []

  accounts.forEach((account, sourceIndex) => {
    if (!account || typeof account !== 'object') return

    const purpose = normalizeText(account.purpose)
    const purposeKey = purpose.toLocaleLowerCase()
    const accountHolder = normalizeText(account.accountHolder)
    const accountNumber = normalizeText(account.accountNumber)
    const ifscCode = normalizeText(account.ifscCode)
    const bankName = normalizeText(account.bankName)
    const branch = normalizeText(account.branch)

    if (!purpose || !accountHolder || !accountNumber || !ifscCode || purposes.has(purposeKey)) {
      return
    }

    purposes.add(purposeKey)

    const instructions = normalizeText(account.instructions)
    const upiId = normalizeText(account.upiId)
    resolved.push({
      accountHolder,
      accountNumber,
      id: normalizeText(account.id) || `bank-account-${sourceIndex + 1}`,
      ifscCode,
      ...(bankName ? { bankName } : {}),
      ...(branch ? { branch } : {}),
      ...(instructions ? { instructions } : {}),
      purpose,
      ...(upiId ? { upiId } : {}),
    })
  })

  return resolved
}

export function formatBankAccountCopyText(account: ResolvedBankAccount): string {
  return [
    `Account holder: ${account.accountHolder}`,
    `Account number: ${account.accountNumber}`,
    `IFSC code: ${account.ifscCode}`,
    ...(account.bankName ? [`Bank: ${account.bankName}`] : []),
    ...(account.branch ? [`Branch & type: ${account.branch}`] : []),
    ...(account.upiId ? [`UPI ID: ${account.upiId}`] : []),
  ].join('\n')
}

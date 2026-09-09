import { expect, test } from '@playwright/test'
import { createAuthenticator } from '../../src/lib/twoFactorCrypto'

const email = 'security@example.test'
const password = 'Test-browser-password-123!'

test('enrolls from account settings, protects login, and disables only with password and a factor', async ({
  page,
}) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.goto('/admin/account')
  const security = page.getByRole('region', { name: 'Two-factor authentication' })
  await expect(security.getByText('Not enabled', { exact: true })).toBeVisible()
  await security.getByLabel('Current password').fill(password)
  await security.getByLabel('Current password').press('Enter')
  await expect(
    security.getByRole('heading', { name: 'Connect your authenticator app' }),
  ).toBeFocused()
  await security.getByText('Can’t scan the code?').click()
  const secret = await security.locator('.two-factor__secret').innerText()
  await page.screenshot({ path: 'test-results/two-factor-setup-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-results/two-factor-setup-mobile.png', fullPage: true })
  await security
    .getByLabel('Authenticator code', { exact: true })
    .fill(createAuthenticator(secret).generate())
  await security.getByRole('button', { name: 'Verify and enable' }).click()
  await expect(security.getByRole('heading', { name: 'Save your recovery codes' })).toBeFocused()
  const codes = await security.locator('.two-factor__recovery code').allTextContents()
  expect(codes).toHaveLength(10)
  const downloading = page.waitForEvent('download')
  await security.getByRole('button', { name: 'Download recovery codes' }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('snmih-cms-recovery-codes.txt')
  const me = await page.request.get('/api/users/me')
  expect((await me.json()).user).toBeNull()
  await security.getByRole('link', { name: 'I’ve saved my codes — sign in' }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page.locator('.two-factor__error')).toContainText('authenticator code')
  await page.getByLabel('Two-factor code (if enabled)').fill(codes[0])
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.goto('/admin/account')
  await expect(security.getByText('Enabled', { exact: true })).toBeVisible()
  await security.getByLabel('Current password').fill(password)
  await security.getByLabel('Authenticator or recovery code').fill(codes[1])
  await security.getByRole('button', { name: 'Turn off two-factor authentication' }).click()
  await expect(
    security.getByText('Two-factor authentication is off. Sign in again to continue.'),
  ).toBeVisible()
  await expect(security.getByRole('link', { name: 'Sign in again', exact: true })).toBeFocused()
})

test('renders the password-reset factor field and validates confirmation', async ({ page }) => {
  await page.goto('/admin/reset/test-token')
  await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible()
  await page.getByLabel('New password', { exact: true }).fill('new-password-123')
  await page.getByLabel('Confirm new password', { exact: true }).fill('different-password')
  await expect(page.getByLabel('Two-factor code (if enabled)')).toBeVisible()
  await page.getByRole('button', { name: 'Reset password and log in' }).click()
  await expect(page.locator('.two-factor__error')).toContainText('passwords do not match')
})

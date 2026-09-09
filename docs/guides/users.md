# Users Guide

## Two-factor authentication

Two-factor authentication is optional for each Admin and Site Manager. Open your own account at
`/admin/account` to manage it; the Users destination remains Admin-only.

1. In **Two-factor authentication**, enter your current password and select **Set up two-factor authentication**.
2. Scan the QR code with an authenticator app, or enter the setup key manually. Setup expires after ten minutes.
3. Enter the app's current six-digit code and select **Verify and enable**.
4. Download or copy the ten recovery codes to a safe place, then sign in again. Codes are shown only once.

After enrollment, login and password reset require a current authenticator code or an unused recovery
code. Leave the two-factor field blank for an account that has not enabled it. Each authenticator
time step and recovery code is accepted once; wait for the next app code after using one.

To replace recovery codes or turn 2FA off, return to your account and enter your current password
and a fresh authenticator or recovery code. Replacing recovery codes invalidates the old set.
Enabling, disabling, and replacing codes sign you out on every device. Security actions save
immediately and do not need the account form's Save button. After ten security attempts within five
minutes, wait for the window to expire before trying again.

If you lose both your authenticator and all recovery codes, contact the deployment operator.
Password reset does not remove 2FA. Admins cannot disable another user's 2FA through the Users editor.
If enrollment succeeds but the response is lost, sign in with the authenticator you just connected
and replace recovery codes to obtain a new set.

## What This Section Is

`Users` is the Admin-only destination for creating CMS accounts and deciding which parts of the Admin
panel each person can operate. The two roles are Admin and Site Manager.

- Admins have complete access and may create multiple Admin or Site Manager accounts.
- Site Managers begin with no access and receive explicit feature checkboxes.
- Site Managers cannot open Users or view/change their own role and grants.

## Create a Site Manager

1. Open **Administration → Users**.
2. Create the login and choose **Site Manager**.
3. In **Feature Access**, enable only the destinations required for that person's responsibilities.
4. Save and ask the user to sign in again.
5. Verify both the sidebar and a direct URL for one granted and one ungranted feature.

Feature changes clear the affected user's sessions, so an already signed-in user must authenticate
again. New Site Managers have all 29 features disabled unless the creating Admin selects them.

## Create Another Admin

Choose **Admin** as the role. Admin access is implicit, so no feature checklist is shown. The CMS
allows multiple Admins but prevents demoting, trashing, or permanently deleting the last active Admin.

## Choosing Features

Each feature is one visible Admin destination and includes its documented action bundle. Do not grant
Action Queue or Audit Log alone: their rows are also filtered by the source feature. For example, a
review moderator commonly needs Reviews and optionally Action Queue; a form operator needs Form
Submissions and optionally Action Queue.

See the complete 29-feature action table in
[Users, Features, and Publication Governance](../operations/editorial-governance.md).

## Best Practices

- keep Admin membership small and maintain at least two active Admins;
- grant the minimum destinations needed for current responsibilities;
- review grants whenever staff responsibilities change;
- test direct URLs and API access, not just sidebar visibility; and
- take a database backup before bulk user or migration work.

## Related Guides

- [Audit Log](./operational-audit-events.md)
- [Action Queue](./work-queue.md)
- [Form Submissions](./form-submissions.md)

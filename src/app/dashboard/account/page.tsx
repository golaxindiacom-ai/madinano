import { AccountSettingsPage } from "@/components/auth/account-settings-page";

export default function StudentAccountPage() {
  return (
    <AccountSettingsPage
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      nextPath="/dashboard/account"
    />
  );
}

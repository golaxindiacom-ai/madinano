import { AccountSettingsPage } from "@/components/auth/account-settings-page";

export default function InstructorAccountPage() {
  return (
    <AccountSettingsPage
      backHref="/instructor-dashboard"
      backLabel="Back to Instructor Dashboard"
      nextPath="/instructor-dashboard/account"
    />
  );
}

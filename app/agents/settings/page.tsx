import AppPre from "@/components/AppPre";
import ChangePassword from "@/components/ChangePassword";
import Header from "@/components/Header";
import Notification from "@/components/Notification";
import ProfileInfo from "@/components/ProfileInfo";

function Page() {
  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header title="Settings" Subtitle="Manage your account and preferences" />

      <div className="p-6 space-y-6">
        <ProfileInfo />
        <ChangePassword />
        <Notification />
        <AppPre />
      </div>
    </div>
  );
}

export default Page;

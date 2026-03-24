import { formatCurrency, formatDateTime } from "@/libs/helper";
import type { AgentProfileResponse } from "@/libs/type";

type Props = {
  profile: AgentProfileResponse["data"];
};

function ProfileInfo({ profile }: Props) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const initials =
    `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase() ||
    "AG";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
            {initials}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Profile Information
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Live account details from the agent profile endpoint
            </p>

            <div className="mt-4 space-y-1 text-sm text-gray-800 dark:text-slate-300">
              <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {fullName}
              </p>
              <p>{profile.role}</p>
              <p>{profile.email}</p>
              <p>{profile.phone}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[34rem]">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Hospital
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100">
              {profile.hospital_name}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Code: {profile.hospital_code}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Account Status
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100">
              {profile.is_active ? "Active" : "Inactive"}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Agent ID: {profile.id}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Wallet Balance
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100">
              {formatCurrency(profile.balance)}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Last topup: {formatCurrency(profile.last_wallet_topup)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Last Wallet Update
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100">
              {formatDateTime(profile.balance_updated_at)}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Joined: {formatDateTime(profile.created_at)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileInfo;

import { formatCurrency, formatDateTime } from "@/libs/helper";
import type { AgentProfileResponse, FoProfileResponse } from "@/libs/type";

type ProfileData =
  | AgentProfileResponse["data"]
  | FoProfileResponse["data"]
  | {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      role: string;
      is_active: boolean;
      created_at: string;
      hospital_name: string;
      hospital_code: string;
    };

type Props = {
  profile: ProfileData;
};

function ProfileInfo({ profile }: Props) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const initials =
    `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase() ||
    "AG";
  const isAgentProfile = "balance" in profile;
  const roleLabel =
    profile.role === "FO"
      ? "financial office"
      : profile.role === "PHARMACY"
        ? "pharmacy"
        : "agent";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-xl font-bold text-orange-700 dark:bg-brand-500/15 dark:text-brand-200">
            {initials}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Profile Information
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Live account details from the {roleLabel} profile endpoint
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

        <div
          className={`grid grid-cols-1 gap-3 ${
            isAgentProfile ? "sm:grid-cols-2 lg:w-136" : "sm:grid-cols-2 lg:w-112"
          }`}
        >
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-line-subtle dark:bg-panel-muted">
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

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-line-subtle dark:bg-panel-muted">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Account Status
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100">
              {profile.is_active ? "Active" : "Inactive"}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              {profile.role} ID: {profile.id}
            </p>
          </div>

          {isAgentProfile ? (
            <>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-line-subtle dark:bg-panel-muted">
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

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-line-subtle dark:bg-panel-muted">
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
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-line-subtle dark:bg-panel-muted sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Last Activity
              </p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100">
                {"last_activity" in profile && profile.last_activity
                  ? formatDateTime(profile.last_activity as string)
                  : "N/A"}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                Joined: {formatDateTime(profile.created_at)}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProfileInfo;

function ChangePassword() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Change Password
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Password update API is not available in the current agent docs yet
          </p>
        </div>
        <button
          className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          disabled
          type="button"
        >
          Coming Soon
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-700 dark:text-slate-300">
        Once the backend endpoint is documented, we can wire secure password
        updates here using the same query and mutation pattern.
      </p>
    </section>
  );
}

export default ChangePassword;

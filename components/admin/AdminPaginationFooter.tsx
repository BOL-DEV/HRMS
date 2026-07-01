type Props = {
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function AdminPaginationFooter({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-line-subtle px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
      <p className="text-gray-600 dark:text-slate-400">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="rounded-xl border border-line-subtle bg-panel px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-panel-muted disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="rounded-xl border border-line-subtle bg-panel px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-panel-muted disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminPaginationFooter;

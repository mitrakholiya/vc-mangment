type PlanCardFooterProps = {
  createdAt: Date;
  updatedAt: Date;
  isAdmin?: boolean;
  showAddContribution?: boolean;
  onAddContribution: () => void;
};

export default function PlanCardFooter({
  createdAt,
  updatedAt,
  isAdmin,
  showAddContribution,
  onAddContribution,
}: PlanCardFooterProps) {
  return (
    <div className="text-xs text-muted space-y-3 sm:space-y-1 flex flex-col sm:flex-row sm:justify-between py-2">
      <div className="space-y-0.5">
        <p>
          <strong>Created:</strong> {new Date(createdAt).toLocaleDateString()}
        </p>
        <p>
          <strong>Updated:</strong> {new Date(updatedAt).toLocaleDateString()}
        </p>
      </div>

      {showAddContribution && (
        <div className="text-sm mt-2 sm:mt-0">
          <button
            onClick={onAddContribution}
            className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 active:scale-[0.98] px-4 py-3 sm:py-2 rounded-lg font-medium transition-all"
          >
            Add Contribution
          </button>
        </div>
      )}
    </div>
  );
}

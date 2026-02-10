import { Chip, CircularProgress, Typography } from "@mui/material";

type PlanCardContributionsProps = {
  isLoading: boolean;
  contributions: any[];
};

export default function PlanCardContributions({
  isLoading,
  contributions,
}: PlanCardContributionsProps) {
  return (
    <div className="space-y-2">
      <Typography variant="subtitle2" fontWeight={600}>
        My Contribution Status
      </Typography>
      {isLoading ? (
        <div className="flex justify-center py-2">
          <CircularProgress size={20} />
        </div>
      ) : contributions && contributions.length > 0 ? (
        <div className="space-y-1 text-sm">
          {contributions.map((contribution: any) => (
            <div
              key={contribution._id}
              className="flex flex-wrap items-center justify-between gap-2 bg-background p-2 sm:p-3 rounded"
            >
              <span className="text-xs sm:text-sm">
                {contribution.month}/{contribution.year}
              </span>
              <span className="text-xs sm:text-sm">₹{contribution.amount}</span>
              <Chip
                label={contribution.status}
                color={contribution.status === "PAID" ? "success" : "warning"}
                size="small"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No contributions yet</p>
      )}
    </div>
  );
}

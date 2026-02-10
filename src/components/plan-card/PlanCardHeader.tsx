import { Chip, Typography } from "@mui/material";

type PlanCardHeaderProps = {
  name: string;
  requestsCount: number;
  status: string;
  isAdmin: boolean;
  maxLoanAmount: number;
  onRequestsClick: () => void;
  onStatusToggle: () => void;
};

export default function PlanCardHeader({
  name,
  requestsCount,
  status,
  isAdmin,
  maxLoanAmount,
  onRequestsClick,
  onStatusToggle,
}: PlanCardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-1">
      <Typography
        variant="h6"
        fontWeight={600}
        className="text-base sm:text-lg"
      >
        {name.toUpperCase()}{" "}
        <div
          onClick={onRequestsClick}
          className="inline-block cursor-pointer ml-2"
        >
          {isAdmin && (
            <Chip
              label={`Requests: ${requestsCount}`}
              color={requestsCount > 0 ? "warning" : "default"}
              size="small"
            />
          )}
        </div>
      </Typography>
      <div className="flex flex-col gap-1">
        <div onClick={onStatusToggle}>
          <Chip
            label={status}
            color={status === "active" ? "success" : "error"}
            size="small"
          />
        </div>
        <Chip
          label={`Max Loan: ₹${maxLoanAmount}`}
          color="primary"
          size="small"
        />
      </div>
    </div>
  );
}

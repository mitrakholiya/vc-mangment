type PlanCardDetailsProps = {
  monthlyEmi: number;
  interestRate: number;
  fundWallet: number;
  ventureId: string;
};

export default function PlanCardDetails({
  monthlyEmi,
  interestRate,
  fundWallet,
  ventureId,
}: PlanCardDetailsProps) {
  return (
    <div className="space-y-1 text-sm ">
      <p>
        <span className="font-medium">Monthly EMI:</span> ₹{monthlyEmi}
      </p>

      <p>
        <span className="font-medium">Loan Interest:</span> {interestRate}%
      </p>

      <p>
        <span className="font-medium">Wallet Balance:</span> {fundWallet}
      </p>
      <p className="break-all">
        <span className="font-medium">VC ID:</span>{" "}
        <span className="text-xs sm:text-sm">{ventureId}</span>
      </p>
    </div>
  );
}

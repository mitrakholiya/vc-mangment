# Monthly Cron Jobs - Complete Guide

This document provides a comprehensive overview of all automated monthly cron jobs in the VC Management system.

## Overview

The system has **3 automated cron jobs** that run monthly to manage venture capital operations:

| Cron Job                  | Schedule                    | Purpose                                       |
| ------------------------- | --------------------------- | --------------------------------------------- |
| **Monthly Contributions** | 1st of month, 12:00 AM      | Generate contribution entries for all members |
| **Monthly User VC Logs**  | Last day of month, 11:50 PM | Generate individual user monthly summaries    |
| **Monthly VC Summary**    | Last day of month, 11:59 PM | Generate venture-wide monthly summaries       |

## Execution Order & Timing

```
Start of Month (1st)
├─ 00:00 → Monthly Contributions
│           Creates PENDING contribution entries for all members
│
│  ... (Members pay throughout the month) ...
│
End of Month (28-31st)
├─ 23:50 → Monthly User VC Logs
│           Generates per-user monthly summaries with loan details
│
└─ 23:59 → Monthly VC Summary
            Aggregates all data into venture-wide summary
```

---

## 1. Monthly Contributions Cron

**Path**: `/api/cron/monthly-contributions`  
**Schedule**: `0 0 1 * *` (1st of every month at midnight)

### Purpose

Creates PENDING contribution entries for all members of all active ventures at the start of each month.

### What It Does

- Finds all active ventures
- For each member in each venture:
  - Creates a new `MonthlyContribution` record
  - Sets status to `PENDING`
  - Sets amount from `venture.monthly_emi`

### Generated Data

```typescript
{
  vc_id: ObjectId,
  user_id: ObjectId,
  amount: number,
  month: number,
  year: number,
  status: "PENDING",
  paid_at: null
}
```

### Testing

```bash
# Generate entries
curl -X POST "http://localhost:3000/api/cron/monthly-contributions?secret=YOUR_SECRET"

# View stats
curl -X GET "http://localhost:3000/api/cron/monthly-contributions?secret=YOUR_SECRET"
```

---

## 2. Monthly User VC Logs Cron

**Path**: `/api/cron/monthly-user-vc-logs`  
**Schedule**: `50 23 28-31 * *` (Last day of month at 11:50 PM)

### Purpose

Generates detailed monthly logs for each user in each venture, including contribution amounts, loan details, and total payables.

### What It Does

- Finds all active ventures
- For each member in each venture:
  - Fetches their active loan (if any)
  - Calculates:
    - Monthly contribution amount
    - Loan interest (Principal × Interest Rate%)
    - Monthly EMI (Interest + Repayment Amount)
    - Remaining loan balance
    - Total payable amount

### Generated Data

```typescript
{
  vc_id: string,
  user_id: string,
  month: number,
  year: number,
  monthly_contribution: number,      // From venture.monthly_emi
  loan_amount: number,                // Original loan principal
  loan_interest: number,              // Calculated interest
  loan_monthly_emi: number,           // Interest + Repayment
  loan_paid_amount: number,           // Total paid so far
  remaining_loan: number,             // Remaining balance
  total_payable: number               // Contribution + EMI
}
```

### Calculation Details

**Interest**: `Principal × (Interest Rate / 100)`  
**Repayment**: `Principal × (Repayment Percent / 100)`  
**Monthly EMI**: `Interest + Repayment`  
**Total Payable**: `Monthly Contribution + Monthly EMI`

### Testing

```bash
# Generate logs
curl -X POST "http://localhost:3000/api/cron/monthly-user-vc-logs?secret=YOUR_SECRET"

# View stats
curl -X GET "http://localhost:3000/api/cron/monthly-user-vc-logs?secret=YOUR_SECRET"
```

---

## 3. Monthly VC Summary Cron

**Path**: `/api/cron/monthly-vc-summary`  
**Schedule**: `59 23 28-31 * *` (Last day of month at 11:59 PM)

### Purpose

Creates venture-wide monthly summaries aggregating all financial activities including contributions, repayments, and loans.

### What It Does

- Finds all active ventures
- For each venture:
  - Gets previous month's remaining balance
  - Sums all PAID contributions for the month
  - Calculates total loan repayments received
  - Lists all loans disbursed during the month
  - Auto-calculates totals and remaining amount

### Generated Data

```typescript
{
  vc_id: string,
  last_month_remaining_amount: number,  // Carried forward
  total_monthly_contribution: number,   // Sum of PAID contributions
  total_loan_repayment: number,         // Sum of EMI payments
  total_part_payment: number,           // Additional payments
  total: number,                        // Auto-calculated
  loans: [{                             // Disbursed this month
    user_id: string,
    loan_amount: number
  }],
  remaining_amount: number,             // Auto-calculated
  month: number,
  year: number
}
```

### Auto-Calculations (Pre-Save Hook)

**Total**: `last_month_remaining + contributions + repayments + part_payments`  
**Remaining**: `Total - Sum(all loans disbursed)`

### Testing

```bash
# Generate summaries
curl -X POST "http://localhost:3000/api/cron/monthly-vc-summary?secret=YOUR_SECRET"

# View stats
curl -X GET "http://localhost:3000/api/cron/monthly-vc-summary?secret=YOUR_SECRET"
```

---

## Configuration

### Environment Variables

Add to your `.env.local` file:

```env
CRON_SECRET=your-secure-random-secret-here
```

### Vercel Cron Configuration

The `vercel.json` file is already configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-contributions",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/monthly-user-vc-logs",
      "schedule": "50 23 28-31 * *"
    },
    {
      "path": "/api/cron/monthly-vc-summary",
      "schedule": "59 23 28-31 * *"
    }
  ]
}
```

### Cron Schedule Syntax

- `0 0 1 * *` = Minute 0, Hour 0, Day 1, Every Month, Every Day of Week
- `50 23 28-31 * *` = Minute 50, Hour 23, Days 28-31, Every Month, Every Day of Week
- `59 23 28-31 * *` = Minute 59, Hour 23, Days 28-31, Every Month, Every Day of Week

---

## Testing All Crons

### Quick Test Script

Use the provided test script to test all crons at once:

```bash
node scripts/test-all-crons.js
```

This will:

1. Test each cron job's POST endpoint
2. Retrieve and display statistics
3. Show a summary of all results

### Manual Testing

Test each cron individually:

```bash
# 1. Generate contributions
curl -X POST "http://localhost:3000/api/cron/monthly-contributions?secret=test-secret-123"

# 2. Generate user logs
curl -X POST "http://localhost:3000/api/cron/monthly-user-vc-logs?secret=test-secret-123"

# 3. Generate VC summaries
curl -X POST "http://localhost:3000/api/cron/monthly-vc-summary?secret=test-secret-123"
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     START OF MONTH                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Monthly Contributions Cron   │
        │  (1st @ 00:00)                │
        └───────────────┬───────────────┘
                        │
                        ▼
          Create PENDING contribution entries
          for all members in all active VCs
                        │
                        │
        ╔═══════════════╧═══════════════╗
        ║   DURING THE MONTH            ║
        ║   - Members pay contributions ║
        ║   - Loans are disbursed       ║
        ║   - Loan repayments made      ║
        ╚═══════════════╤═══════════════╝
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    END OF MONTH                           │
└───────────────────┬───────────────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │ Monthly User VC Logs Cron     │
    │ (28-31st @ 23:50)             │
    └───────────────┬───────────────┘
                    │
                    ▼
      Generate per-user monthly summary
      - Contributions
      - Loan details
      - Total payable
                    │
                    ▼ (9 minutes later)
    ┌───────────────────────────────┐
    │  Monthly VC Summary Cron      │
    │  (28-31st @ 23:59)            │
    └───────────────┬───────────────┘
                    │
                    ▼
      Generate venture-wide summary
      - Aggregate contributions
      - Total repayments
      - Loans disbursed
      - Remaining balance
                    │
                    ▼
            ┌───────────────┐
            │  Month Ends   │
            └───────────────┘
```

---

## Idempotency & Safety

All cron jobs are **idempotent**, meaning:

- Running multiple times won't create duplicates
- Each has unique indexes preventing duplicate records
- Safe to manually trigger for testing

**Unique Indexes**:

- **Contributions**: `user_id + vc_id + month + year`
- **User Logs**: `user_id + vc_id + month + year`
- **VC Summary**: `vc_id + month + year`

---

## Monitoring & Troubleshooting

### Check Vercel Cron Logs

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Deployments**
4. Click on a deployment
5. View **Functions** tab
6. Find cron execution logs

### Common Issues

#### Issue: Cron doesn't run automatically

**Solution**:

- Verify `vercel.json` is committed
- Check Vercel dashboard → Cron Jobs
- Ensure project is deployed (crons only work in production)

#### Issue: Unauthorized error

**Solution**:

- Verify `CRON_SECRET` environment variable
- Check it matches in both Vercel and requests

#### Issue: No data generated

**Solution**:

- Ensure there are active ventures
- Check database connection
- Review error logs in response

---

## Related Models

- **MonthlyContribution** (`/src/models/monthly-contribution.model.ts`)
- **VcUserMonthly** (`/src/models/vc-user-monthly.ts`)
- **VcMonthly** (`/src/models/vc_monthly.model.ts`)
- **Venture** (`/src/models/venture.model.ts`)
- **Loan** (`/src/models/loan.model.ts`)

---

## Support

For detailed documentation on individual crons:

- See `docs/CRON_MONTHLY_VC_SUMMARY.md` for VC Summary cron details

For issues or questions, review the source code:

- `/src/app/api/cron/monthly-contributions/route.ts`
- `/src/app/api/cron/monthly-user-vc-logs/route.ts`
- `/src/app/api/cron/monthly-vc-summary/route.ts`

# Monthly VC Summary Cron Job

This document explains the monthly VC summary cron job that automatically generates summary data for all active ventures.

## Overview

The **Monthly VC Summary Cron** is an automated job that runs at the end of each month to generate comprehensive financial summaries for all active ventures in the system.

### What It Does

For each active venture, the cron job:

1. **Aggregates Monthly Contributions**: Sums up all PAID contributions for the month
2. **Calculates Loan Repayments**: Tracks all loan repayments made during the month
3. **Records Part Payments**: Tracks any additional part payments (if implemented)
4. **Lists Loans Disbursed**: Records all loans given out during the month
5. **Calculates Final Balance**: Automatically computes the remaining fund balance

### Generated Data Structure

Each monthly summary record (`VcMonthly`) contains:

```typescript
{
  vc_id: string;                          // Venture ID
  last_month_remaining_amount: number;     // Previous month's balance
  total_monthly_contribution: number;      // Sum of all paid contributions
  total_loan_repayment: number;            // Sum of all loan repayments
  total_part_payment: number;              // Sum of part payments
  total: number;                           // Auto-calculated total
  loans: [{                                // Loans disbursed this month
    user_id: string;
    loan_amount: number;
  }];
  remaining_amount: number;                // Auto-calculated remaining balance
  month: number;                           // 1-12
  year: number;                            // Full year (e.g., 2026)
}
```

## Schedule

The cron job runs according to the following schedule:

```
Schedule: 59 23 28-31 * *
```

**Explanation**: Runs at 11:59 PM on days 28-31 of every month (effectively running on the last day of each month).

## API Endpoints

### POST: `/api/cron/monthly-vc-summary`

Generates monthly summaries for all active ventures.

**Authentication**: Requires CRON_SECRET

**Request Examples**:

```bash
# Via query parameter
POST /api/cron/monthly-vc-summary?secret=YOUR_CRON_SECRET

# Via authorization header
POST /api/cron/monthly-vc-summary
Authorization: Bearer YOUR_CRON_SECRET
```

**Response**:

```json
{
  "success": true,
  "message": "Monthly VC summaries generated for 2/2026",
  "created": 5,
  "skipped": 0,
  "errors": []
}
```

### GET: `/api/cron/monthly-vc-summary`

Retrieves current month's summary statistics.

**Authentication**: Requires CRON_SECRET

**Request Example**:

```bash
GET /api/cron/monthly-vc-summary?secret=YOUR_CRON_SECRET
```

**Response**:

```json
{
  "success": true,
  "month": 2,
  "year": 2026,
  "stats": {
    "total_vcs": 5,
    "total_contributions": 50000,
    "total_loans_given": 30000,
    "total_remaining": 20000
  },
  "summaries": [...]
}
```

## Configuration

### Environment Variables

Add the following to your `.env` or `.env.local` file:

```env
CRON_SECRET=your-secure-random-secret-here
```

**Important**: Use a strong, random secret for production!

### Vercel Configuration

The cron job is automatically configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-vc-summary",
      "schedule": "59 23 28-31 * *"
    }
  ]
}
```

## Manual Testing

You can manually trigger the cron job for testing:

### Using curl:

```bash
# Generate summaries
curl -X POST "http://localhost:3000/api/cron/monthly-vc-summary?secret=YOUR_CRON_SECRET"

# View current month stats
curl -X GET "http://localhost:3000/api/cron/monthly-vc-summary?secret=YOUR_CRON_SECRET"
```

### Using Postman:

1. **POST Request**:
   - URL: `http://localhost:3000/api/cron/monthly-vc-summary`
   - Query Params: `secret=YOUR_CRON_SECRET`
   - Method: POST

2. **GET Request**:
   - URL: `http://localhost:3000/api/cron/monthly-vc-summary`
   - Query Params: `secret=YOUR_CRON_SECRET`
   - Method: GET

## Data Flow

### Month-End Summary Process

```
┌─────────────────────────────────────────┐
│  End of Month (Day 28-31, 11:59 PM)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  1. Get All Active Ventures             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. For Each Venture:                   │
│     - Get previous month's balance      │
│     - Sum all PAID contributions        │
│     - Calculate loan repayments         │
│     - Track part payments               │
│     - List loans disbursed              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Create VcMonthly Record             │
│     (Auto-calculates total & remaining) │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Return Summary Stats                │
└─────────────────────────────────────────┘
```

## Important Notes

### Calculation Details

1. **Total**: Calculated automatically via pre-save hook

   ```
   total = last_month_remaining_amount +
           total_monthly_contribution +
           total_loan_repayment +
           total_part_payment
   ```

2. **Remaining Amount**: Calculated automatically via pre-save hook

   ```
   remaining_amount = total - sum(all loans disbursed this month)
   ```

3. **Loan Repayment**: Currently calculates based on `loan_repayment_percent`
   - Adjust line 123-125 if using different repayment tracking logic

### Data Integrity

- **Unique Index**: Each VC can only have one summary per month/year
- **Idempotent**: Running multiple times in a month won't create duplicates
- **Error Handling**: Failed ventures are logged but don't stop the entire process

### Customization Points

If your system has different requirements, update these sections:

1. **Line 99-102**: Contribution aggregation logic
2. **Line 121-129**: Loan repayment calculation
3. **Line 132-133**: Part payment tracking (currently set to 0)
4. **Line 135-147**: Loan disbursement tracking

## Troubleshooting

### Issue: Cron doesn't run automatically

**Solution**:

- Verify `vercel.json` is properly configured
- Check Vercel dashboard → Project → Settings → Cron Jobs
- Ensure project is deployed (crons only work on deployed projects)

### Issue: Unauthorized error

**Solution**:

- Verify `CRON_SECRET` environment variable is set
- Ensure the secret matches in both request and environment

### Issue: Incorrect calculations

**Solution**:

- Review loan repayment logic (lines 121-129)
- Verify contribution status (only PAID contributions are counted)
- Check if `last_paid_at` is properly updated when loans are repaid

## Related Models

- **VcMonthly** (`/src/models/vc_monthly.model.ts`): Main summary model
- **MonthlyContribution** (`/src/models/monthly-contribution.model.ts`): Individual contributions
- **Loan** (`/src/models/loan.model.ts`): Loan records with payment tracking
- **Venture** (`/src/models/venture.model.ts`): Venture configuration

## Related Cron Jobs

- **monthly-contributions**: Generates monthly contribution entries (runs on 1st of month)
- **monthly-user-vc-logs**: Generates per-user monthly logs

## Support

For issues or questions, contact the development team or review the source code at:
`/src/app/api/cron/monthly-vc-summary/route.ts`

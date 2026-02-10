# Take Loan Feature - Implementation Summary

## Date: February 6, 2026

## Overview

Added functionality to allow users to take loans directly from the VC view page. Loans are tracked in `vc-user-monthly` records and deducted from the venture's `fund_wallet`.

## Files Created

### API Routes

1. **`src/app/api/venture/take-loan/route.ts`**
   - POST endpoint to handle loan disbursement
   - Validates user membership and loan limits
   - Checks available venture funds
   - Updates or creates user monthly record with loan details
   - Deducts loan amount from venture fund_wallet
   - Prevents users from taking multiple active loans

### Hooks

2. **`src/hooks/useTakeLoan.ts`**
   - React Query hook for taking loans
   - Handles API communication
   - Returns mutation state and function

### Components

3. **`src/components/TakeLoanModal.tsx`**
   - Modal dialog for loan request
   - Amount input with slider
   - Real-time EMI calculation display
   - Shows:
     - Principal amount
     - Interest (calculated from venture interest_rate)
     - Repayment (calculated from venture loan_repayment_percent)
     - Total monthly EMI
   - Validates against max loan amount and fund wallet

## Files Modified

### Components

1. **`src/components/PlanCard.tsx`**
   - Added TakeLoanModal import
   - Added loan modal state
   - Added useTakeLoan hook
   - Added handleTakeLoan function
   - Added "Take Loan" button (green) in view mode
   - Added TakeLoanModal component at bottom

## Functionality

### Take Loan Flow

1. User clicks "Take Loan" button on VC view page
2. Modal opens showing:
   - Max loan amount (from venture)
   - Current fund wallet balance
   - Input field and slider for loan amount
   - Real-time EMI calculation
3. User enters desired loan amount
4. System validates:
   - User is a member of the venture
   - Loan amount ≤ max_loan_amount
   - Loan amount ≤ fund_wallet
   - User doesn't have an existing active loan
5. On success:
   - Creates/updates vc-user-monthly record with:
     - `loan_amount`: New loan principal
     - `loan_interest`: Calculated interest
     - `loan_monthly_emi`: Total EMI (interest + repayment)
     - `remaining_loan`: Full loan amount (initially)
     - `total_payable`: Monthly contribution + EMI
   - Deducts loan amount from venture's `fund_wallet`

### Loan Calculations

```
Interest = (Loan Amount × Interest Rate) / 100
Repayment = (Loan Amount × Loan Repayment %) / 100
Monthly EMI = Interest + Repayment
Total Payable = Monthly Contribution + Monthly EMI
```

## Data Flow

### vc-user-monthly Update

When a user takes a loan:

```javascript
{
  vc_id: "venture_id",
  user_id: "user_id",
  month: current_month,
  year: current_year,
  monthly_contribution: venture.monthly_emi,
  loan_amount: requested_amount,  // ← INCREASED
  loan_interest: calculated_interest,
  loan_monthly_emi: calculated_emi,
  loan_paid_amount: 0,
  remaining_loan: requested_amount,
  total_payable: contribution + emi
}
```

### Venture Update

```javascript
{
  fund_wallet: current_fund_wallet - loan_amount; // ← DECREASED
}
```

## UI/UX

- **Button Color**: Green (bg-green-600) to distinguish from contribution (indigo)
- **Button Location**: Below contributions section, above footer
- **Only Visible**: On VC view page (when `view` prop is defined)
- **Modal Features**:
  - Clean, modern design with MUI components
  - Input validation
  - Real-time calculation preview
  - Clear summary of repayment terms
  - Loading state during processing

## Security & Validation

- ✅ JWT authentication required
- ✅ User must be a member of the venture
- ✅ Loan amount must not exceed max_loan_amount
- ✅ Venture must have sufficient funds
- ✅ User cannot have multiple active loans
- ✅ All inputs validated server-side

## Testing Recommendations

1. Test loan creation with valid amounts
2. Test validation:
   - Exceeding max loan amount
   - Insufficient fund wallet
   - Taking loan when already having active loan
   - Non-member trying to take loan
3. Verify fund_wallet deduction
4. Verify vc-user-monthly record creation/update
5. Test UI responsiveness and calculations

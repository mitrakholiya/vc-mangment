# 💰 VcMonthly Logic - Complete Guide

## 📊 Understanding VcMonthly Fields

### The Formula (Pre-save Hook - Lines 104-117)

```typescript
total =
  last_month_remaining_amount +
  total_monthly_contribution +
  total_loan_repayment +
  total_part_payment;

remaining_amount = total - total_loans;
```

---

## 🔄 Field Meanings & When They Update

### 1. **last_month_remaining_amount** 💼

**What it is:** Money carried over from previous month  
**When updated:** At month creation (from previous month's `remaining_amount`)  
**Updated by:** Cron job or `ensureVcMonthlyRecord()`

```javascript
// Example: February 2026
last_month_remaining_amount: 50000; // From January's remaining_amount
```

---

### 2. **total_monthly_contribution** 💵

**What it is:** Sum of ALL approved member contributions this month  
**When updated:** When admin approves a contribution  
**Updated by:** `approve-contribution/route.ts`

```javascript
// Example: 5 members × ₹1000 each
total_monthly_contribution: 5000

// Updates when:
Admin approves User A's ₹1000 → total_monthly_contribution += 1000
Admin approves User B's ₹1000 → total_monthly_contribution += 1000
```

**Current Implementation:**

```typescript
// In approve-contribution/route.ts (Line 95-97)
vcMonthly.total_monthly_contribution += contribution.monthly_contribution;
```

---

### 3. **total_loan_repayment** 💸

**What it is:** Sum of loan EMI payments made this month  
**When updated:** When admin approves a contribution (that includes EMI)  
**Updated by:** `approve-contribution/route.ts`

**IMPORTANT DISTINCTION:**

- ❌ NOT the loans GIVEN out
- ✅ The loan EMI PAID BACK by members

```javascript
// Example:
User A has ₹10,000 loan, pays ₹1,100 EMI
User B has ₹5,000 loan, pays ₹550 EMI

total_loan_repayment: 1650  // Sum of EMI paid back
```

**Current Implementation:**

```typescript
// In approve-contribution/route.ts (Line 101-103)
vcMonthly.total_loan_repayment += contribution.loan_monthly_emi;
```

---

### 4. **total_part_payment** 💰

**What it is:** Extra payments made by members (beyond regular EMI)  
**When updated:** When member makes additional payment  
**Updated by:** Part payment API (if implemented)

```javascript
// Example:
User A pays extra ₹2,000 to reduce loan faster
total_part_payment: 2000
```

**Current Status:** Not implemented yet (always 0)

---

### 5. **loans** 📋

**What it is:** Array of all loans DISBURSED this month  
**When updated:** When admin distributes loans  
**Updated by:** `admin/loan/route.ts`

```javascript
loans: [
  { user_id: "A", loan_amount: 10000 },
  { user_id: "B", loan_amount: 5000 },
];

// Total loans disbursed = 15,000
```

**Current Implementation:**

```typescript
// In admin/loan/route.ts (Lines 163-189)
// Accumulates loan amounts for each user
```

---

### 6. **total** (Calculated) 🧮

**What it is:** Total money available this month  
**When calculated:** Automatically on save (pre-save hook)  
**Formula:**

```
total = last_month_remaining
      + contributions
      + loan repayments
      + part payments
```

```javascript
// Example:
last_month_remaining_amount: 50,000
total_monthly_contribution:   5,000  (5 members paid)
total_loan_repayment:         1,650  (EMI paid back)
total_part_payment:               0

total = 50,000 + 5,000 + 1,650 + 0 = 56,650
```

---

### 7. **remaining_amount** (Calculated) 💎

**What it is:** Money left after distributing loans  
**When calculated:** Automatically on save (pre-save hook)  
**Formula:**

```
remaining_amount = total - total_loans_disbursed
```

```javascript
// Example:
total: 56,650
loans: [
  { user_id: "A", loan_amount: 10000 },
  { user_id: "B", loan_amount: 5000 }
]
total_loans = 15,000

remaining_amount = 56,650 - 15,000 = 41,650
```

---

## 🎯 Complete Monthly Flow Example

### **Scenario: "Quick Venture" - February 2026**

#### **Starting State (Feb 1)**

```javascript
VcMonthly (Feb 2026):
{
  last_month_remaining_amount: 50,000,  // From January
  total_monthly_contribution: 0,
  total_loan_repayment: 0,
  total_part_payment: 0,
  loans: [],
  total: 50,000,                         // Auto-calculated
  remaining_amount: 50,000               // Auto-calculated
}
```

---

#### **Step 1: Members Pay Contributions (Feb 5-10)**

**User A pays ₹1,000 contribution + ₹100 EMI**

```javascript
// Admin approves User A
VcUserMonthly (User A):
  monthly_contribution: 1000
  loan_monthly_emi: 100
  status: "approved"

// VcMonthly updates:
total_monthly_contribution: 0 + 1000 = 1,000
total_loan_repayment: 0 + 100 = 100
total: 50,000 + 1,000 + 100 = 51,100  // Auto-calculated
remaining_amount: 51,100 - 0 = 51,100  // Auto-calculated
```

**User B pays ₹1,000 contribution + ₹50 EMI**

```javascript
// After approval:
total_monthly_contribution: 1,000 + 1,000 = 2,000
total_loan_repayment: 100 + 50 = 150
total: 50,000 + 2,000 + 150 = 52,150
remaining_amount: 52,150 - 0 = 52,150
```

**User C, D, E also pay ₹1,000 each (no loans)**

```javascript
// After all 5 members paid:
total_monthly_contribution: 5,000
total_loan_repayment: 150
total: 50,000 + 5,000 + 150 = 55,150
remaining_amount: 55,150 - 0 = 55,150
```

---

#### **Step 2: Admin Distributes Loans (Feb 15)**

**User F gets ₹10,000 loan**
**User G gets ₹5,000 loan**

```javascript
// VcMonthly updates:
loans: [
  { user_id: "F", loan_amount: 10000 },
  { user_id: "G", loan_amount: 5000 }
]

// Auto-calculated:
total_loans = 15,000
total: 55,150  // Unchanged (no new money in)
remaining_amount: 55,150 - 15,000 = 40,150  // Money left!
```

---

#### **Step 3: More Contributions Come In (Feb 20)**

**User F pays ₹1,000 contribution + ₹1,100 EMI**

```javascript
// After approval:
total_monthly_contribution: 5,000 + 1,000 = 6,000
total_loan_repayment: 150 + 1,100 = 1,250
total: 50,000 + 6,000 + 1,250 = 57,250
remaining_amount: 57,250 - 15,000 = 42,250
```

---

#### **Final State (Feb 28)**

```javascript
VcMonthly (Feb 2026):
{
  last_month_remaining_amount: 50,000,
  total_monthly_contribution: 6,000,    // 6 members paid
  total_loan_repayment: 1,250,          // EMI collected
  total_part_payment: 0,
  loans: [
    { user_id: "F", loan_amount: 10000 },
    { user_id: "G", loan_amount: 5000 }
  ],
  total: 57,250,                        // Auto-calculated
  remaining_amount: 42,250              // Carries to March
}
```

---

## 🔄 Month Transition (Feb → March)

```javascript
// March 1: Cron job creates new VcMonthly
VcMonthly (March 2026):
{
  last_month_remaining_amount: 42,250,  // From Feb's remaining_amount
  total_monthly_contribution: 0,        // Reset
  total_loan_repayment: 0,              // Reset
  total_part_payment: 0,                // Reset
  loans: [],                            // Reset
  total: 42,250,                        // Only last month's money
  remaining_amount: 42,250
}
```

---

## ❓ Why We Update Values When We Do

### **Q: Why update `total_monthly_contribution` when approving, not when distributing loans?**

**A:** Because contributions are INCOME (money coming IN). They should be counted when members actually PAY, not when we distribute loans.

### **Q: Why is `total_loan_repayment` updated on approval, not loan distribution?**

**A:** Because it tracks EMI PAID BACK (money coming IN), not loans given OUT. It's INCOME, not expense.

### **Q: Why don't we update `total_monthly_contribution` when distributing loans?**

**A:** Loan distribution is EXPENSE (money going OUT). It reduces `remaining_amount` but doesn't affect contributions.

### **Q: What if we want to track total loans given this month?**

**A:** That's what the `loans` array is for! Sum of `loans[].loan_amount` = total loans disbursed.

---

## 📐 The Accounting Equation

```
MONEY IN:
+ last_month_remaining_amount (starting balance)
+ total_monthly_contribution  (members pay monthly fee)
+ total_loan_repayment        (members pay EMI)
+ total_part_payment          (extra payments)
= TOTAL AVAILABLE

MONEY OUT:
- loans (sum of loans[].loan_amount)
= REMAINING AMOUNT (for next month)
```

---

## ✅ Current Implementation Status

| Field                         | Updated By                       | Status                   |
| ----------------------------- | -------------------------------- | ------------------------ |
| `last_month_remaining_amount` | Cron job / ensureVcMonthlyRecord | ✅ Working               |
| `total_monthly_contribution`  | approve-contribution             | ✅ Working               |
| `total_loan_repayment`        | approve-contribution             | ✅ Working               |
| `total_part_payment`          | Part payment API                 | ❌ Not implemented       |
| `loans`                       | admin/loan                       | ✅ Working (accumulates) |
| `total`                       | Pre-save hook                    | ✅ Auto-calculated       |
| `remaining_amount`            | Pre-save hook                    | ✅ Auto-calculated       |

---

## 🚨 Common Mistakes to Avoid

### ❌ WRONG: Update contributions when distributing loans

```typescript
// In admin/loan/route.ts - DON'T DO THIS:
vcMonthly.total_monthly_contribution += loanAmount; // WRONG!
```

### ❌ WRONG: Update loan repayment when distributing loans

```typescript
// In admin/loan/route.ts - DON'T DO THIS:
vcMonthly.total_loan_repayment += loanAmount; // WRONG!
```

### ✅ CORRECT: Only update loans array when distributing

```typescript
// In admin/loan/route.ts - CORRECT:
vcMonthly.loans.push({ user_id, loan_amount });
// remaining_amount auto-calculated on save
```

---

## 🎯 Summary

**Money Coming IN (increases total):**

- ✅ `total_monthly_contribution` (when approved)
- ✅ `total_loan_repayment` (when approved)
- ✅ `total_part_payment` (when paid)
- ✅ `last_month_remaining_amount` (at month start)

**Money Going OUT (decreases remaining_amount):**

- ✅ `loans` array (when distributed)

**Auto-Calculated (don't manually update):**

- ✅ `total` = sum of all income
- ✅ `remaining_amount` = total - loans

---

Generated: 2026-02-09

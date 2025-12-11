# Claims Approval Status Sync - Quick Test Guide

## How to Test the Fix

### Prerequisites

- Start the dev server: `npm run dev`
- Open two browser windows side by side (or tabs)
- Tab 1: Hospital Portal at `http://localhost:3000/hospital/claims`
- Tab 2: Insurer Portal at `http://localhost:3000/insurer/claims`

### Test Case 1: Verify Hardcoded Claims Are Synced on Load

**Step 1:** Open Hospital Portal

- You should see claims like "clm-0001", "clm-0008", "clm-0012" with "Pending" status

**Step 2:** Check Insurer Portal

- These same claims should appear in the insurer's claim list
- You should see a merged list containing both:
  - Default insurer claims (CLM-2025-0001, etc.)
  - Synced hospital claims (clm-0001, clm-0008, etc.)

**Expected Result:** ✅ Hardcoded hospital claims are now registered with insurer

---

### Test Case 2: Insurer Approves Hardcoded Claim

**Step 1:** In Insurer Portal

- Find claim "clm-0001" (or any hardcoded claim starting with "clm-")
- Note current status: likely "Pending"

**Step 2:** Update the Claim

- Click on the claim row to open details modal
- Look for action buttons (Approve/Reject)
- Click the "Approve" button
- The modal should update to show "Approved" status
- Amount should show as paid/approved

**Step 3:** Check Hospital Portal (Tab 1)

- **Without refresh:** The status might not update immediately
- **With refresh (F5):** The claim should now show "Approved" status
- **Approved Amount:** Should equal the claimed amount

**Expected Result:** ✅ Hospital page reflects insurer's approval decision

---

### Test Case 3: Real-time Sync (Optional)

**Step 1:** Keep both tabs open

- Hospital Portal shows claim "clm-0008" as "Pending"
- Insurer Portal shows the same claim

**Step 2:** In Insurer Portal

- Approve the claim
- The Insurer Portal updates immediately (you'll see it)

**Step 3:** Switch to Hospital Portal

- The status should update automatically IF:
  - The event listeners are working correctly
  - The browser is in focus
  - No errors in browser console

**If it doesn't update automatically:**

- Refresh the Hospital Portal (F5)
- It should now show the updated status

**Expected Result:** ✅ Status syncs in real-time or after refresh

---

### Test Case 4: New Claims Still Work

**Step 1:** In Hospital Portal

- Click "Submit New Claim" button
- Fill out the form and submit

**Step 2:** In Insurer Portal

- The new claim should appear in the list
- Should have a unique ID starting with a timestamp

**Step 3:** Approve the Claim

- Click on the new claim in Insurer Portal
- Approve it
- Switch to Hospital Portal
- The new claim should show as "Approved"

**Expected Result:** ✅ New claims submission and approval flow still works

---

## What to Look For in Browser Console

Open DevTools (F12) → Console tab to see logs:

### Successful Sync

```
// When hardcoded claims are synced on mount
// (No specific log, but claims are added to localStorage)

// When insurer updates a claim
// Event fires and hospital page updates
```

### Potential Issues

```
// Check for errors related to:
- localStorage access
- JSON parsing
- Undefined claim fields
- Type mismatches
```

---

## Claim Status Verification

### Hardcoded Claims (Before Fix)

| Claim    | Status             | Synced?            |
| -------- | ------------------ | ------------------ |
| clm-0001 | Pending → Approved | ❌ No (before fix) |
| clm-0008 | Pending → Approved | ❌ No (before fix) |
| clm-0012 | Pending → Approved | ❌ No (before fix) |

### Hardcoded Claims (After Fix)

| Claim    | Status             | Synced? |
| -------- | ------------------ | ------- |
| clm-0001 | Pending → Approved | ✅ Yes  |
| clm-0008 | Pending → Approved | ✅ Yes  |
| clm-0012 | Pending → Approved | ✅ Yes  |

---

## Troubleshooting

### Issue: Claims don't show in Insurer Portal

- **Cause:** Sync didn't complete on hospital page load
- **Fix:**
  - Refresh Hospital Portal first
  - Then check Insurer Portal
  - Check browser console for errors

### Issue: Status doesn't update after insurer approval

- **Cause:** Event listener not firing
- **Fix:**
  - Refresh Hospital Portal (F5)
  - Check browser console for errors
  - Verify localStorage has the updated claim

### Issue: Claim data looks incomplete

- **Cause:** Field mapping issue in convertClaimToClaimData()
- **Fix:**
  - Check console for specific field errors
  - Verify claim JSON structure in claims.json
  - Check /src/utils/claimsSyncUtils.ts for field mapping

---

## Success Criteria

✅ All test cases pass  
✅ No console errors  
✅ Hardcoded claims show updated status on hospital page  
✅ New claims still work correctly  
✅ Approval status syncs between portals

---

## Database/Storage Location

The claims are stored in browser localStorage at:

**Hospital Portal:**

- Key: `hospital_claims_hosp-001` (only NEW claims)

**Insurer Portal:**

- Key: `insurerClaimsData` (ALL claims: default + hardcoded + new)

To inspect:

1. Open DevTools (F12)
2. Application → Local Storage
3. Select http://localhost:3000
4. Look for these keys
5. The values are JSON strings containing claim arrays

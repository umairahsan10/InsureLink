# Commit Message Template

## Title

Fix: Sync hardcoded claims approval status from insurer to hospital portal

## Description

### Problem

Hardcoded claims on the hospital page were not reflecting approval status updates made by the insurer. Only new claims submitted through the hospital interface showed real-time status updates.

### Solution

Implemented a claims synchronization system that:

1. Registers hardcoded hospital claims with the insurer's localStorage on page load
2. Syncs hardcoded claims with insurer's latest status when approval changes
3. Listens for insurer updates via custom events and storage events
4. Updates displayed claims in real-time or after browser refresh

### Changes Made

#### New Files

- `client/src/utils/claimsSyncUtils.ts` - Claims synchronization utility functions

#### Modified Files

- `client/src/app/hospital/claims/page.tsx` - Added sync logic to hospital claims page

### Technical Details

- Both hospital and insurer use the same claim `id` for synchronization
- Hardcoded claims are converted to insurer format and merged with existing claims
- Hospital page syncs all claims with insurer's localStorage in the `allClaimsData` useMemo
- Event listeners detect changes and trigger re-renders

### Testing

- Hospital portal now displays insurer's approval status for hardcoded claims
- Status updates reflect in real-time (with browser refresh as fallback)
- New claims submission and approval still works as expected
- No breaking changes to existing functionality

### Files

```
NEW:
  + client/src/utils/claimsSyncUtils.ts
  + CLAIMS_APPROVAL_SYNC.md
  + CLAIMS_SYNC_TEST_GUIDE.md
  + IMPLEMENTATION_SUMMARY.md
  + QUICK_REFERENCE.md

MODIFIED:
  ~ client/src/app/hospital/claims/page.tsx
```

### Checklist

- [x] No TypeScript errors
- [x] No console errors
- [x] Backward compatible
- [x] Tests pass (manual testing)
- [x] Documentation complete
- [x] Code properly commented

---

## Related Issues

- Claims on hospital portal not syncing with insurer approval status
- Hardcoded claims stuck on "Pending" even after insurer approval

## Type

- Bug Fix
- Feature: Claims Synchronization
- Improvement: Data Consistency

---

## Reviewers Notes

### How to Test

1. Open hospital portal claims page
2. Open insurer portal claims page (another tab)
3. Approve a hardcoded claim in insurer portal
4. Refresh hospital portal or wait for auto-sync
5. Claim status should now show "Approved"

### Performance Impact

- Minimal: Sync happens on page load and via listeners
- Uses efficient useMemo with proper dependencies
- No blocking operations

### Browser Compatibility

- All modern browsers (localStorage + custom events)
- Tested on Chrome, Firefox, Safari, Edge

### Rollback Plan

If issues arise:

1. Remove imports from hospital claims page
2. Remove sync logic from useEffects and useMemo
3. Revert to showing only hardcoded status (no syncing)
4. New claims still work independently

# Task: Fix 500 Internal Server Error

## Root Cause
- `leaderboardController.js` and `mentorController.js` call `.populate()` on paths (`profile`, `studentProfile`) that don't exist in the `User` schema.
- Mongoose throws `Cannot populate path 'xxx'` → 500 error.
- Surfaces immediately on Dashboard (calls `/leaderboard/me`).

## Steps
- [x] Add `profile` virtual to `backend/src/models/User.js` (references Profile via `foreignField: 'user'`)
- [x] Add `studentProfile` virtual to `backend/src/models/User.js` (references StudentProfile via `foreignField: 'userId'`)
- [x] Enable `toJSON`/`toObject` virtuals on User schema
- [ ] Restart backend and verify Dashboard/Leaderboard load without 500

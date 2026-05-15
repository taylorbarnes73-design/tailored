# Project TODO

- [x] Resolve App.tsx conflict — integrate TailoredApp into the full-stack routing
- [x] Fix TypeScript errors from upgrade (stale watcher — resolved with fresh tsc check)
- [x] Run pnpm db:push to sync database schema
- [x] Integrate file storage (S3) with storagePut/storageGet helpers
- [x] Create file upload tRPC procedure for storing user body scan images/data
- [x] Add file storage test with vitest
- [x] Verify full-stack app runs correctly with TailoredApp frontend
- [x] Save checkpoint and deliver to user
- [x] Wire storageGet into a files.getDownloadUrl procedure
- [x] Verify TailoredApp loads correctly at / in the browser
- [x] Clean up stale TS watcher errors (stale watcher from old TS 5.6.3 — fresh tsc --noEmit passes clean)

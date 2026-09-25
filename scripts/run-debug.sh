export $(grep -v '^#' .env.local | xargs)
npx tsx scripts/debug-email.ts

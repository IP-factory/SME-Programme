import { getBusyRanges, isCalendarConfigured } from "../server/calendar";

async function main() {
  if (!isCalendarConfigured()) {
    console.log(JSON.stringify({ configured: false }));
    return;
  }

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const busyRanges = await getBusyRanges(now, nextWeek);
  console.log(JSON.stringify({ configured: true, busyRanges: busyRanges.length }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

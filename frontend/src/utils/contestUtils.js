import { parseISO, format } from 'date-fns';

// Format date to match DMOJ format: "Oct 6, 2025, 23:00"
export function formatContestDate(dateString) {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy, HH:mm');
  } catch {
    return dateString;
  }
}

// Format window duration: "03:00 window"
export function formatWindowDuration(hours) {
  if (!hours) return '';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} window`;
}

// Get contest status
export function getContestStatus(contest) {
  if (!contest) return 'unknown';
  const now = new Date();
  const start = contest.start_time ? new Date(contest.start_time) : null;
  const end = contest.end_time ? new Date(contest.end_time) : null;

  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'ended';
  if (start && end && now >= start && now <= end) return 'running';
  return 'unknown';
}


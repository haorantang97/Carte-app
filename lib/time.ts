/** Format a timestamp as "just now", "5m ago", "3h ago", "2d ago", or short date. */
export function formatTimeAgo(input: string | Date): string {
  const then = typeof input === 'string' ? new Date(input) : input;
  const diffSec = (Date.now() - then.getTime()) / 1000;

  if (diffSec < 30) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return then.toLocaleDateString();
}

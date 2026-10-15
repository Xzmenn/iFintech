export type GoalContributionPoint = {
  amount: number;
  date: Date | string;
};

function addMonths(date: Date, count: number) {
  const firstOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + count, 1);
  const lastDay = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth(),
    Math.min(date.getDate(), lastDay),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

export function estimateGoalCompletion(
  saved: number,
  target: number,
  contributions: GoalContributionPoint[],
  deadline?: Date | string | null,
  now = new Date(),
) {
  const percent = target > 0 ? Math.min(100, Math.max(0, Math.round((saved / target) * 100))) : 0;
  const remaining = Math.max(0, target - saved);
  const firstRecentMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const recentTotal = contributions.reduce((sum, contribution) => {
    const date = new Date(contribution.date);
    return date >= firstRecentMonth && date <= now ? sum + contribution.amount : sum;
  }, 0);
  const monthlyAverage = recentTotal / 3;
  const deadlineDate = deadline ? new Date(deadline) : null;
  const monthsRemaining = deadlineDate
    ? Math.max(1, (deadlineDate.getTime() - now.getTime()) / (30.4375 * 24 * 60 * 60 * 1000))
    : null;
  const requiredPerMonth =
    remaining === 0 || !monthsRemaining || deadlineDate! <= now
      ? remaining === 0 && deadlineDate
        ? 0
        : null
      : remaining / monthsRemaining;
  const estimatedDate =
    remaining === 0
      ? now
      : monthlyAverage > 0
        ? addMonths(now, Math.ceil(remaining / monthlyAverage))
        : null;
  const onTrack =
    remaining === 0 ||
    (requiredPerMonth !== null && monthlyAverage >= requiredPerMonth) ||
    (!deadlineDate && monthlyAverage > 0);

  return {
    percent,
    remaining,
    monthlyAverage,
    estimatedDate,
    requiredPerMonth,
    onTrack,
  };
}

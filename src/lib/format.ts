export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatNet(amount: number): string {
  if (amount >= 0) return `+${formatCurrency(amount)}`;
  return `-${formatCurrency(Math.abs(amount))}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

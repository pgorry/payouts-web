export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatNet(amount: number): string {
  if (amount >= 0) return `+${formatCurrency(amount)}`;
  return `-${formatCurrency(Math.abs(amount))}`;
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];
export function formatPlace(place: number): string {
  return ORDINALS[place - 1] ?? `${place}th`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

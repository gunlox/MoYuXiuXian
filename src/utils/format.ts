/** 格式化数字 */
export function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 10000) return (n / 1000).toFixed(1) + '千';
  if (n < 100000000) return (n / 10000).toFixed(1) + '万';
  return (n / 100000000).toFixed(2) + '亿';
}

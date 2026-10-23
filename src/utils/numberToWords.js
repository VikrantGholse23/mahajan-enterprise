// Indian numbering system converter (Lakhs, Crores, Thousands)
export function numberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  const n = Math.round(Number(num));
  if (n === 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(v) {
    if (v === 0) return '';
    if (v < 10) return single[v];
    if (v >= 10 && v < 20) return double[v - 10];
    const t = Math.floor(v / 10);
    const u = v % 10;
    return (tens[t] + (u > 0 ? ' ' + single[u] : '')).trim();
  }

  function convertThreeDigits(v) {
    const h = Math.floor(v / 100);
    const rest = v % 100;
    let res = '';
    if (h > 0) res += single[h] + ' Hundred';
    if (rest > 0) {
      if (res !== '') res += ' ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let words = '';
  let crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundred = remainder % 1000;

  if (crore > 0) words += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundred > 0) words += convertThreeDigits(hundred) + ' ';

  return words.trim() + ' Rupees Only';
}

export function formatIndianCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

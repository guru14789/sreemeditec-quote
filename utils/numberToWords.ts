const units = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
  'seventeen', 'eighteen', 'nineteen'
];

const tens = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];

const numToWords = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) {
        return units[num];
    }
    if (num < 100) {
        return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    }
    if (num < 1000) {
        return units[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' ' + numToWords(num % 100) : '');
    }
    if (num < 100000) {
        return numToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 !== 0 ? ' ' + numToWords(num % 1000) : '');
    }
    if (num < 10000000) {
        return numToWords(Math.floor(num / 100000)) + ' lakh' + (num % 100000 !== 0 ? ' ' + numToWords(num % 100000) : '');
    }
    return numToWords(Math.floor(num / 10000000)) + ' crore' + (num % 10000000 !== 0 ? ' ' + numToWords(num % 10000000) : '');
};

export function numberToWords(num: number): string {
    if (num === null || num === undefined) return '';
    if (num === 0) return 'Zero only';

    const numStr = num.toString();
    const [integerPartStr, decimalPartStr] = numStr.split('.');
    
    let words = '';
    const integerPart = parseInt(integerPartStr, 10);
    if (integerPart > 0) {
        words = numToWords(integerPart);
    }

    if (decimalPartStr) {
        const decimalPart = parseInt(decimalPartStr.padEnd(2, '0').substring(0, 2), 10);
        if (decimalPart > 0) {
            if (words) {
                words += ' and ';
            }
            words += numToWords(decimalPart) + ' paise';
        }
    }
    
    if (!words) return "Zero only";

    const result = words.replace(/\s\s+/g, ' ').trim();
    return result.charAt(0).toUpperCase() + result.slice(1) + ' only';
}

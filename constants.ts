
import { BankDetails, Terms } from './types';

export const DEFAULT_TERMS: Terms = {
  payment: '50% advance with purchase order payable in the name of Sreemeditec and balance 50% on delivery of Machine.',
  delivery: 'Within 10 days from the date of the receipt of your purchase order.',
  warranty: 'Warranty against manufacturing defects for a period of one year from the date of delivery.',
};

export const DEFAULT_BANK_DETAILS: BankDetails = {
  name: 'ICICI Bank',
  branch: 'Selaiyur',
  accName: 'Sreemeditec,',
  accType: 'CA',
  accNo: '603705016939',
  ifsc: 'ICIC0006037',
};


export interface ProductItem {
  id: string;
  name: string;
  model: string;
  features: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export interface Client {
  name: string;
  address: string;
  gst: string;
}

export interface StoredProduct {
  name: string;
  model: string;
  features: string;
  rate: number;
  gstRate: number;
}

export interface Terms {
  payment: string;
  delivery: string;
  warranty: string;
}

export interface BankDetails {
  name: string;
  branch: string;
  accName: string;
  accType: string;
  accNo: string;
  ifsc: string;
}

export interface QuotationData {
  refNo: string;
  date: string;
  client: Client;
  products: ProductItem[];
  terms: Terms;
  bankDetails: BankDetails;
  logo: string | null;
  signature: string | null;
  stamp: string | null;
  freight: number;
  freightGstRate: number;
}
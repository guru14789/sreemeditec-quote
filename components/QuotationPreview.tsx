
import React from 'react';
import { QuotationData } from '../types';
import { numberToWords } from '../utils/numberToWords';

interface QuotationPreviewProps {
  data: QuotationData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};


const QuotationPreview: React.FC<QuotationPreviewProps> = ({ data }) => {
  const subTotal = data.products.reduce((sum, product) => {
    const baseAmount = product.quantity * product.rate;
    const totalAmount = baseAmount + (baseAmount * (product.gstRate / 100));
    return sum + totalAmount;
  }, 0);
  const freightGstAmount = data.freight > 0 ? data.freight * (data.freightGstRate / 100) : 0;
  const grandTotal = subTotal + data.freight + freightGstAmount;
  const roundedGrandTotal = Math.round(grandTotal);
  const roundingOff = roundedGrandTotal - grandTotal;

  return (
    <div className="w-full bg-white p-4 sm:p-6 shadow-lg rounded-lg border border-gray-200 text-black">
      <div className="text-center mb-6">
        {data.logo ? (
          <img src={data.logo} alt="Company Logo" className="mx-auto h-20 mb-4 object-contain" />
        ) : (
          <h1 className="text-2xl sm:text-3xl font-bold text-black">SREE MEDITEC</h1>
        )}
        <p className="text-sm">New No: 18, Old No: 2, Bajanai Koil Street, Rajajipakkam, Chennai 600 073.</p>
        <p className="text-sm">Mob: 9884818398.</p>
        <p className="text-sm">GST NO: 33APGPS4675G2ZL</p>
        <h2 className="text-xl sm:text-2xl font-bold mt-4 border-b-2 border-black inline-block px-2 pb-2">Quotation</h2>
      </div>

      <div className="flex justify-between mb-6 text-sm">
        <div>
          <p><span className="font-bold">Ref:</span> {data.refNo}</p>
        </div>
        <div>
          <p><span className="font-bold">Date:</span> {data.date}</p>
        </div>
      </div>

      <div className="mb-6 text-sm">
        <p>To,</p>
        <p className="font-bold">{data.client.name}</p>
        <p className="whitespace-pre-wrap">{data.client.address}</p>
        {data.client.gst && <p>GST: {data.client.gst}</p>}
      </div>

      <div className="mb-5 text-sm">
        <p><span className="font-bold">Sub:</span> Reg. Price Quotation for {data.products.map(p => p.name).join(' and ')}.</p>
      </div>

      <p className="mb-4 text-sm">Sir, this is with ref to the discussion we had with you we are happy in submitting our quotation for the same.</p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
        <table className="w-full border-collapse border-black text-sm">
          <thead>
            <tr className="bg-gray-200 text-black font-bold">
              <th className="border border-black p-2 text-left">Product</th>
              <th className="border border-black p-2 text-left">Model</th>
              <th className="border border-black p-2 text-left">Features</th>
              <th className="border border-black p-2 text-center">Qty</th>
              <th className="border border-black p-2 text-right">Rate</th>
              <th className="border border-black p-2 text-right">GST %</th>
              <th className="border border-black p-2 text-right">GST Amount</th>
              <th className="border border-black p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((product) => {
              const baseAmount = product.quantity * product.rate;
              const gstAmount = baseAmount * (product.gstRate / 100);
              const totalAmount = baseAmount + gstAmount;
              return (
                <tr key={product.id}>
                  <td className="border border-black p-2 align-top text-black">{product.name}</td>
                  <td className="border border-black p-2 align-top text-black">{product.model}</td>
                  <td className="border border-black p-2 align-top text-black min-w-[200px]">
                    <ul className="list-disc list-inside">
                      {product.features.split('\n').map((feature, i) => feature.trim() && <li key={i}>{feature}</li>)}
                    </ul>
                  </td>
                  <td className="border border-black p-2 align-top text-center text-black">{product.quantity} no</td>
                  <td className="border border-black p-2 align-top text-right text-black">Rs.{formatCurrency(product.rate)}</td>
                  <td className="border border-black p-2 align-top text-right text-black">{product.gstRate}%</td>
                  <td className="border border-black p-2 align-top text-right text-black">Rs.{formatCurrency(gstAmount)}</td>
                  <td className="border border-black p-2 align-top text-right text-black min-w-[150px]">
                    <p>Rs.{formatCurrency(totalAmount)}</p>
                    <p className="text-xs text-black">({numberToWords(totalAmount)})</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-end text-sm mb-6">
        <div className="w-full sm:w-2/3 md:w-1/2">
          <div className="flex justify-between py-1">
            <span>Sub Total</span>
            <span className="font-bold text-right">Rs.{formatCurrency(subTotal)}</span>
          </div>
            {data.freight > 0 && (
              <>
                <div className="flex justify-between py-1">
                  <span>Freight</span>
                  <span className="font-bold text-right">Rs.{formatCurrency(data.freight)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>GST @ {data.freightGstRate}% on Freight</span>
                  <span className="font-bold text-right">Rs.{formatCurrency(freightGstAmount)}</span>
                </div>
              </>
            )}
           {roundingOff !== 0 && (
            <div className="flex justify-between py-1">
                <span>Rounding Off</span>
                <span className="font-bold text-right">Rs.{formatCurrency(roundingOff)}</span>
            </div>
           )}
          <div className="border-t border-black my-2 pt-2"></div>
          <div className="flex justify-between">
            <span className="font-bold">Grand Total</span>
            <span className="font-bold text-right">Rs.{formatCurrency(roundedGrandTotal)}</span>
          </div>
        </div>
      </div>


      <div className="text-xs">
        <h3 className="font-bold text-sm mb-2">Terms and condition:</h3>
        <div className="grid grid-cols-[max-content_auto_1fr] gap-x-2 gap-y-1 items-start">
            <span className="font-bold">Validity</span>
            <span>:</span>
            <span>The above price is valid up to 30 days from the date of submission of the Quotation.</span>
            
            <span className="font-bold">Taxes</span>
            <span>:</span>
            <span>GST is applicable to the price mentioned as per item-wise rates.</span>
            
            <span className="font-bold">Payment</span>
            <span>:</span>
            <span className="whitespace-pre-wrap">{data.terms.payment}</span>
            
            <span className="font-bold">Banking details</span>
            <span>:</span>
            <span className="whitespace-pre-wrap">Bank name: {data.bankDetails.name}<br/>Branch name: {data.bankDetails.branch}<br/>A/C name: {data.bankDetails.accName}<br/>A/C type: {data.bankDetails.accType}<br/>A/C No: {data.bankDetails.accNo}<br/>IFSC Code: {data.bankDetails.ifsc}</span>
            
            <span className="font-bold">Delivery</span>
            <span>:</span>
            <span className="whitespace-pre-wrap">{data.terms.delivery}</span>
            
            <span className="font-bold">Warranty</span>
            <span>:</span>
            <span className="whitespace-pre-wrap">{data.terms.warranty}</span>
        </div>
      </div>
      
      <div className="mt-10 text-sm">
        <p>Thanking you and looking forward for your order.</p>
        <p className="mt-6">With Regards,</p>
        <p>For SREE MEDITEC,</p>
        
        <div className="relative h-20 w-40 mt-2">
            {data.stamp && (
                <img 
                    src={data.stamp} 
                    alt="Stamp" 
                    className="absolute inset-0 h-full w-auto object-contain"
                />
            )}
            {data.signature && (
                <img 
                    src={data.signature} 
                    alt="Signature" 
                    className="absolute inset-0 h-full w-auto object-contain" 
                />
            )}
            {(!data.signature && !data.stamp) && <div className="h-20"></div>}
        </div>

        <p className="font-bold">S. Suresh Kumar.</p>
        <p>9884818398</p>
      </div>

    </div>
  );
};

export default QuotationPreview;

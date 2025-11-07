import React, { useState, useCallback, useEffect, useRef } from 'react';
import { QuotationData, Client, StoredProduct, ProductItem } from './types';
import { DEFAULT_TERMS, DEFAULT_BANK_DETAILS } from './constants';
import QuotationPreview from './components/QuotationPreview';
import { generatePdf } from './services/pdfGenerator';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDebounce } from './hooks/useDebounce';

const formatRefNo = (num: number) => `SMQ ${String(num).padStart(3, '0')}`;

const App: React.FC = () => {
    const [clients, setClients] = useLocalStorage<Client[]>('clients', []);
    const [products, setProducts] = useLocalStorage<StoredProduct[]>('products', []);
    const [lastRefNo, setLastRefNo] = useLocalStorage<number>('lastRefNo', 71);
    const [activeView, setActiveView] = useState<'form' | 'preview'>('form');

    const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
    const [productSuggestions, setProductSuggestions] = useState<StoredProduct[]>([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<string | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    // FIX: Explicitly initialize useRef with `undefined` to resolve the "Expected 1 arguments, but got 0" error.
    // This can be caused by older React type definitions that don't support an argument-less `useRef` call.
    const prevQuotationDataRef = useRef<QuotationData | undefined>(undefined);


    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Only load from files if localStorage is empty to not overwrite user's work
                const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
                if (localClients.length === 0) {
                    const res = await fetch('/clients.json');
                    if (res.ok) {
                        const data = await res.json();
                        setClients(data);
                    }
                }

                const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
                if (localProducts.length === 0) {
                    const res = await fetch('/products.json');
                     if (res.ok) {
                        const data = await res.json();
                        setProducts(data);
                    }
                }
            } catch (error) {
                console.error("Error loading initial data from JSON files:", error);
            } finally {
                setIsDataLoaded(true);
            }
        };
        loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const getInitialState = useCallback((currentLastRef: number): Omit<QuotationData, 'logo' | 'signature' | 'stamp'> => ({
        refNo: formatRefNo(currentLastRef + 1),
        date: new Date().toISOString().split('T')[0],
        client: { name: '', address: '', gst: '' },
        products: [{ id: crypto.randomUUID(), name: '', model: '', features: '', quantity: 1, rate: 0, gstRate: 12 }],
        terms: DEFAULT_TERMS,
        bankDetails: DEFAULT_BANK_DETAILS,
        freight: 0,
    }), []);

    const [quotationData, setQuotationData] = useState<QuotationData>(() => ({
        ...getInitialState(lastRefNo),
        logo: null,
        signature: null,
        stamp: null,
    }));
    
    const debouncedQuotationData = useDebounce(quotationData, 500);

    // Effect for AUTOSAVING to localStorage
    useEffect(() => {
        if (!isDataLoaded || !debouncedQuotationData || JSON.stringify(debouncedQuotationData) === JSON.stringify(prevQuotationDataRef.current)) {
            return;
        }

        // Save/Update client from form
        const currentClient = debouncedQuotationData.client;
        if (currentClient.name) {
            setClients(prevClients => {
                const clientIndex = prevClients.findIndex(c => c.name.toLowerCase() === currentClient.name.toLowerCase());
                const newClients = [...prevClients];
                if (clientIndex > -1) {
                    if(JSON.stringify(newClients[clientIndex]) !== JSON.stringify(currentClient)){
                        newClients[clientIndex] = currentClient; // Update
                        return newClients;
                    }
                } else {
                    newClients.push(currentClient); // Add
                    return newClients;
                }
                return prevClients;
            });
        }

        // Save/Update products from form
        setProducts(prevProducts => {
            const newProducts = [...prevProducts];
            let hasChanged = false;
            debouncedQuotationData.products.forEach((p: ProductItem) => {
                if (!p.name) return;
                const { id, quantity, ...productToStore } = p;
                const productIndex = newProducts.findIndex(sp => sp.name.toLowerCase() === p.name.toLowerCase());

                if (productIndex > -1) {
                    if (JSON.stringify(newProducts[productIndex]) !== JSON.stringify(productToStore)) {
                        newProducts[productIndex] = productToStore;
                        hasChanged = true;
                    }
                } else {
                    newProducts.push(productToStore);
                    hasChanged = true;
                }
            });
            return hasChanged ? newProducts : prevProducts;
        });
        
        prevQuotationDataRef.current = debouncedQuotationData;

    }, [debouncedQuotationData, isDataLoaded, setClients, setProducts]);

    const handleBlur = () => {
        setTimeout(() => setActiveSuggestionBox(null), 150);
    };

    const selectClientSuggestion = (client: Client) => {
        setQuotationData(prev => ({ ...prev, client }));
        setActiveSuggestionBox(null);
    };

    const selectProductSuggestion = (productId: string, suggestedProduct: StoredProduct) => {
        setQuotationData(prev => ({
            ...prev,
            products: prev.products.map(p =>
                p.id === productId
                    ? { ...p, name: suggestedProduct.name, model: suggestedProduct.model, features: suggestedProduct.features, rate: suggestedProduct.rate, gstRate: suggestedProduct.gstRate }
                    : p
            ),
        }));
        setActiveSuggestionBox(null);
    };
    
    const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setQuotationData(prev => ({ ...prev, client: { ...prev.client, [name]: value } }));

        if (name === 'name') {
            if (value) {
                const suggestions = clients.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
                setClientSuggestions(suggestions);
                setActiveSuggestionBox('client');
            } else {
                setActiveSuggestionBox(null);
            }
        }
    };

    const handleProductChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const parsedValue = (name === 'quantity' || name === 'rate' || name === 'gstRate') ? parseFloat(value) || 0 : value;
        setQuotationData(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === id ? { ...p, [name]: parsedValue } : p),
        }));
        
        if (name === 'name') {
            if (value) {
                const suggestions = products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));
                setProductSuggestions(suggestions);
                setActiveSuggestionBox(id);
            } else {
                setActiveSuggestionBox(null);
            }
        }
    };

    const addProduct = () => {
        setQuotationData(prev => ({
            ...prev,
            products: [...prev.products, { id: crypto.randomUUID(), name: '', model: '', features: '', quantity: 1, rate: 0, gstRate: 12 }]
        }));
    };

    const removeProduct = (id: string) => {
        setQuotationData(prev => ({
            ...prev,
            products: prev.products.filter(p => p.id !== id)
        }));
    };

    const handleTermsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setQuotationData(prev => ({ ...prev, terms: { ...prev.terms, [name]: value } }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature' | 'stamp') => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setQuotationData(prev => ({ ...prev, [type]: event.target?.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGeneratePdf = () => {
        generatePdf(quotationData);
        
        const currentRefNumberNumeric = parseInt(quotationData.refNo.replace(/\D/g, ''), 10);
        const newLastRefNo = !isNaN(currentRefNumberNumeric) ? Math.max(lastRefNo, currentRefNumberNumeric) : lastRefNo;
        setLastRefNo(newLastRefNo);

        setQuotationData(prev => ({
            ...getInitialState(newLastRefNo),
            logo: prev.logo,
            signature: prev.signature,
            stamp: prev.stamp,
        }));
    };

    const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
        e.currentTarget.blur();
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">SREE MEDITEC</h1>
                <p className="text-lg sm:text-xl text-gray-600">Quotation Generator</p>
            </header>

            {/* Mobile View Toggle */}
            <div className="lg:hidden flex justify-center mb-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveView('form')}
                    className={`flex-1 text-center py-2 text-sm font-medium transition-colors ${
                        activeView === 'form' 
                        ? 'border-b-2 border-indigo-600 text-indigo-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    aria-current={activeView === 'form'}
                >
                    Edit Form
                </button>
                <button
                    onClick={() => setActiveView('preview')}
                    className={`flex-1 text-center py-2 text-sm font-medium transition-colors ${
                        activeView === 'preview' 
                        ? 'border-b-2 border-indigo-600 text-indigo-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    aria-current={activeView === 'preview'}
                >
                    View Preview
                </button>
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* Form Section */}
                <div className={`bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-200 ${activeView === 'form' ? 'block' : 'hidden'} lg:block`}>
                    <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Quotation Details</h2>
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="refNo" className="block text-sm font-medium text-gray-700">Reference No.</label>
                            <input
                                id="refNo" 
                                type="text" 
                                value={quotationData.refNo} 
                                onChange={e => setQuotationData(p => ({...p, refNo: e.target.value}))} 
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                             />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                            <input 
                                id="date"
                                type="date" 
                                value={quotationData.date} 
                                onChange={e => setQuotationData(p => ({...p, date: e.target.value}))}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                    </div>
                    
                    {/* Client Details */}
                    <div className="space-y-4 mb-6">
                         <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Client Information</h3>
                        <div className="relative">
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
                            <input
                                id="clientName"
                                type="text"
                                name="name"
                                value={quotationData.client.name}
                                onChange={handleClientChange}
                                onBlur={handleBlur}
                                autoComplete="off"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                placeholder="Start typing for suggestions..."
                            />
                            {activeSuggestionBox === 'client' && clientSuggestions.length > 0 && (
                                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                                    {clientSuggestions.map(c => (
                                        <li
                                            key={c.name}
                                            onClick={() => selectClientSuggestion(c)}
                                            className="p-2 cursor-pointer hover:bg-indigo-100 text-gray-900"
                                        >
                                            {c.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea 
                                id="clientAddress"
                                name="address" 
                                value={quotationData.client.address} 
                                onChange={handleClientChange} 
                                rows={3}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label htmlFor="clientGst" className="block text-sm font-medium text-gray-700">GST Number</label>
                            <input 
                                id="clientGst"
                                type="text" 
                                name="gst" 
                                value={quotationData.client.gst} 
                                onChange={handleClientChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                             />
                        </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-6 mb-6">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Products</h3>
                        {quotationData.products.map((p) => (
                            <div key={p.id} className="p-4 border border-gray-200 rounded-md space-y-4 relative">
                                {quotationData.products.length > 1 && (
                                    <button onClick={() => removeProduct(p.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={p.name}
                                            onChange={e => handleProductChange(p.id, e)}
                                            onBlur={handleBlur}
                                            autoComplete="off"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"
                                            placeholder="Start typing for suggestions..."
                                        />
                                        {activeSuggestionBox === p.id && productSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                                                {productSuggestions.map(pr => (
                                                    <li
                                                        key={pr.name}
                                                        onClick={() => selectProductSuggestion(p.id, pr)}
                                                        className="p-2 cursor-pointer hover:bg-indigo-100 text-gray-900"
                                                    >
                                                        {pr.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Model</label>
                                        <input type="text" name="model" value={p.model} onChange={e => handleProductChange(p.id, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Features (one per line)</label>
                                    <textarea name="features" value={p.features} onChange={e => handleProductChange(p.id, e)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"/>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                        <input type="number" name="quantity" value={p.quantity} onWheel={preventScroll} onChange={e => handleProductChange(p.id, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Rate (per unit)</label>
                                        <input type="number" name="rate" value={p.rate} onWheel={preventScroll} onChange={e => handleProductChange(p.id, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">GST (%)</label>
                                        <input type="number" name="gstRate" value={p.gstRate} onWheel={preventScroll} onChange={e => handleProductChange(p.id, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addProduct} className="w-full text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold py-2 px-4 rounded-md transition-colors">Add Product</button>
                    </div>

                    {/* Freight */}
                     <div className="mb-6">
                        <label htmlFor="freight" className="block text-sm font-medium text-gray-700">Freight Charges</label>
                        <input
                            id="freight"
                            type="number"
                            value={quotationData.freight}
                            onChange={(e) => setQuotationData(p => ({ ...p, freight: parseFloat(e.target.value) || 0 }))}
                            onWheel={preventScroll}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                        />
                    </div>

                    {/* Terms & Details */}
                    <div className="space-y-4 mb-6">
                         <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Terms &amp; Conditions</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                            <textarea name="payment" value={quotationData.terms.payment} onChange={handleTermsChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Delivery Terms</label>
                            <textarea name="delivery" value={quotationData.terms.delivery} onChange={handleTermsChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Warranty</label>
                            <textarea name="warranty" value={quotationData.terms.warranty} onChange={handleTermsChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2"/>
                        </div>
                    </div>
                    
                     {/* Uploads */}
                    <div className="space-y-4 mb-6">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Branding &amp; Signing</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                            <input type="file" onChange={e => handleFileChange(e, 'logo')} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Signature Image</label>
                            <input type="file" onChange={e => handleFileChange(e, 'signature')} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Company Stamp Image</label>
                            <input type="file" onChange={e => handleFileChange(e, 'stamp')} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"/>
                        </div>
                    </div>
                    
                    <button onClick={handleGeneratePdf} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        Generate Quotation PDF
                    </button>
                </div>

                {/* Preview Section */}
                <div className={`${activeView === 'preview' ? 'block' : 'hidden'} lg:block`}>
                    <div className="sticky top-8">
                        <QuotationPreview data={quotationData} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
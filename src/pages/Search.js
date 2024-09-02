import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import config from '../config';

const StockTable = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('Dealertoken');
        if (!token) {
          setError('Token not found.');
          return;
        }

        const response = await axios.get(`${config.BASE_URL}/api/dealer/stock`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data) {
          setStockData(response.data);
        } else {
          setError('No data available.');
        }
      } catch (error) {
        setError('Error fetching stock data.');
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

  const filteredStockData = stockData.filter((item) => {
    const brandName = item.brandName?.toLowerCase() || '';
    const modelName = item.modelName?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return brandName.includes(query) || modelName.includes(query);
  });

  return (
    <>
      <TopNav />
      <div className="p-6 bg-white shadow-md rounded-lg mt-16 mb-16">
        {/* Search box */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by brand or model"
            className="p-2 border border-gray-300 rounded-md w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center h-screen">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent border-solid rounded-full animate-spin"></div>
          </div>
        )}
        {error && !loading && (
          <p className="text-red-500">{error}</p>
        )}
        {!loading && !error && stockData.length === 0 && (
          <p className="text-yellow-500">No data available.</p>
        )}
        {!loading && !error && stockData.length > 0 && (
          <>
            {filteredStockData.length === 0 ? (
              <p className="text-gray-500">No results found.</p>
            ) : (
              filteredStockData.map((item, index) => (
                <div key={index} className="mb-8">
                  {/* Heading with brand name, model name, price, and total quantity */}
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold mb-2">{item.brandName || 'N/A'} - {item.modelName || 'N/A'}</h1>
                    <p className="text-lg mb-2">Price: ₹{item.price?.toFixed(2) || '0.00'}</p>
                    <p className="text-lg mb-2">Total Quantity: &nbsp;
                      <span className={item.totalQuantity >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {item.totalQuantity || 0}
                      </span>
                    </p>
                    <p className="text-lg mb-2">Total Amount: &nbsp;
                      <span className={item.totalAmount >= 0 ? 'text-green-500' : 'text-red-500'}>
                        ₹{item.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </p>
                  </div>

                  {/* Responsive table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-gray-100 rounded-lg">
                      <thead>
                        <tr className="bg-teal-600 text-white">
                          <th className="p-3 border-b">S.No</th>
                          <th className="p-3 border-b">Date</th>
                          <th className="p-3 border-b">Quantity</th>
                          <th className="p-3 border-b">Stock</th>
                          <th className="p-3 border-b">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        {item.stockHistory && item.stockHistory.length > 0 ? (
                          item.stockHistory
                            .slice()
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((history, historyIndex) => {
                              const quantityColor = history.quantity >= 0 ? 'text-green-500' : 'text-red-500';
                              const quantitySign = history.quantity >= 0 ? '+' : '-';
                              const amount = history.quantity * item.price;
                              const amountClass = amount >= 0 ? 'text-green-500' : 'text-red-500';

                              return (
                                <tr key={history._id} className="hover:bg-gray-200">
                                  <td className="p-3 border-b">{historyIndex + 1}</td>
                                  <td className="p-3 border-b">{new Date(history.date).toLocaleDateString()}</td>
                                  <td className={`p-3 border-b ${quantityColor}`}>
                                    {quantitySign}{Math.abs(history.quantity)}
                                  </td>
                                  <td className="p-3 border-b">{history.currentTotalQuantity}</td>
                                  <td className={`p-3 border-b ${amountClass}`}>
                                    ₹{Math.abs(amount).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-3 text-center text-gray-500">No stock history available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
};

export default StockTable;

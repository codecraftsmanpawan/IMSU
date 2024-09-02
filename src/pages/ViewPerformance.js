import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {jwtDecode} from 'jwt-decode'; 
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import config from '../config';

const PerformanceData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('quarter'); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Retrieve the token from local storage
        const token = localStorage.getItem('Dealertoken');
        if (!token) {
          throw new Error('No token found');
        }

        // Decode the token to get the ID
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;

       
        const response = await axios.get(`${config.BASE_URL}/api/dealer/brand-performance?dealerId=${userId}&period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Sort data by totalAmount in descending order
        const sortedData = response.data.sort((a, b) => b.totalAmount - a.totalAmount);

        setData(sortedData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]); // Dependency array includes period

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };

  const exportPDF = () => {
    if (!data.length) return;

    const doc = new jsPDF();
    doc.text('Top Performing Brands', 20, 10);

    const tableData = data.map((item, index) => [
      index + 1,
      item.brandName,
      item.totalQuantity,
      item.totalAmount,
    ]);

    autoTable(doc, {
      head: [['Rank', 'Brand', 'Stock Sold', 'Amount']],
      body: tableData,
      startY: 20,
    });

    doc.save('performance_data.pdf');
  };

  const exportExcel = () => {
    if (!data.length) return;

    const worksheetData = data.map((item, index) => ({
      Rank: index + 1,
      Brand: item.brandName,
      'Stock Sold': item.totalQuantity,
      Amount: item.totalAmount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance Data');
    XLSX.writeFile(workbook, 'performance_data.xlsx');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data: {error.message}</p>;

  const maxQuantity = Math.max(...data.map(item => item.totalQuantity));
  const minWidth = 5; // Minimum width in percentage

  return (
    <>
      <TopNav />
      <div className="p-6 bg-white shadow-md rounded-lg mb-16 mt-16">
        <h1 className="text-2xl font-bold mb-4">Top Performing Brands</h1>

        {/* Period Selection */}
        <div className="mb-6">
          <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
            Select Period:
          </label>
          <select
            id="period"
            value={period}
            onChange={handlePeriodChange}
            className="block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => {
            const width = `${Math.max((item.totalQuantity / maxQuantity) * 100, minWidth)}%`;

            return (
              <div key={item.brandId} className="flex items-center">
                <div className="flex-grow bg-gray-200 h-8 rounded-lg relative">
                  <div
                    className="bg-blue-500 h-full rounded-lg"
                    style={{ width }}
                  >
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm font-medium text-white">
                      {item.brandName}
                    </span>
                  </div>
                </div>
                <span className="ml-3">{item.totalQuantity} Pcs</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-4 my-4">
          <button
            onClick={exportPDF}
            className="bg-red-500 text-white py-2 px-4 rounded-md"
          >
            Export PDF
          </button>
          <button
            onClick={exportExcel}
            className="bg-green-500 text-white py-2 px-4 rounded-md"
          >
            Export Excel
          </button>
        </div>

        <div className="overflow-x-auto mt-8">
          <h2 className="text-xl font-bold mb-4">Detailed Performance Data</h2>
          <table className="min-w-full bg-white border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 px-4 border-b">Rank</th>
                <th className="py-2 px-4 border-b">Brand</th>
                <th className="py-2 px-4 border-b">Stock Sold</th>
                <th className="py-2 px-4 border-b">Amount</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {data.map((item, index) => (
                <tr key={item.brandId} className="text-gray-700">
                  <td className="py-2 px-4 border-b">{index + 1}</td>
                  <td className="py-2 px-4 border-b">{item.brandName}</td>
                  <td className="py-2 px-4 border-b">{item.totalQuantity}</td>
                  <td className="py-2 px-4 border-b">{item.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default PerformanceData;

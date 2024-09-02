import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {jwtDecode} from 'jwt-decode'; // Import jwt-decode
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import config from '../config';

const ModelPerformanceData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month'); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('Dealertoken');
        if (!token) {
          throw new Error('No token found');
        }

        const decodedToken = jwtDecode(token);
        const dealerId = decodedToken.id; 

        let startDate, endDate;

        // Set dates based on the selected period
        const now = new Date();
        switch (period) {
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
            endDate = new Date().toISOString();
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
            break;
          case 'quarter':
            const quarter = Math.floor((now.getMonth() + 3) / 3);
            startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1).toISOString();
            endDate = new Date(now.getFullYear(), quarter * 3, 0).toISOString();
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1).toISOString();
            endDate = new Date(now.getFullYear(), 11, 31).toISOString();
            break;
          case 'lifetime':
            startDate = undefined;
            endDate = undefined;
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        }

        const params = {
          dealerId: dealerId,
          period: period
        };

        if (startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        }

        const response = await axios.get(
          `${config.BASE_URL}/api/dealer/model-performance`, {
          params: params,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        setData(response.data.performanceData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]); // Re-fetch data when the period changes

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };

  const exportPDF = () => {
    if (!data.length) return;

    const doc = new jsPDF();
    doc.text('Model Performance Data', 20, 10);

    const tableData = data.map((item, index) => [
      index + 1,
      item.modelName,
      item.totalQuantity,
      item.totalAmount,
      item.modelPrice,
    ]);

    autoTable(doc, {
      head: [['Rank', 'Model', 'Stock Sold', 'Amount', 'Model Price']],
      body: tableData,
      startY: 20,
    });

    doc.save('model_performance_data.pdf');
  };

  const exportExcel = () => {
    if (!data.length) return;

    const worksheetData = data.map((item, index) => ({
      Rank: index + 1,
      Model: item.modelName,
      'Stock Sold': item.totalQuantity,
      Amount: item.totalAmount,
      'Model Price': item.modelPrice,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Model Performance Data');
    XLSX.writeFile(workbook, 'model_performance_data.xlsx');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data: {error.message}</p>;

  const maxQuantity = Math.max(...data.map(item => item.totalQuantity));
  const minWidth = 5; // Minimum width in percentage

  return (
    <>
      <TopNav />
      <div className="p-6 bg-white shadow-md rounded-lg mb-16 mt-16">
        <h1 className="text-2xl font-bold mb-4">Model Performance Data</h1>

    <div className="mb-6 flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
  <div className="flex flex-col md:flex-row w-full">
    <label className="block md:flex mb-2 md:mb-0 md:mr-4 w-full">
      <select
        value={period}
        onChange={handlePeriodChange}
        className="w-full p-2 border border-gray-300 rounded-md"
      >
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="quarter">Quarter</option>
        <option value="year">Year</option>
        <option value="lifetime">Lifetime</option>
      </select>
    </label>
  </div>
</div>


        <div className="space-y-4">
          {data.map((item, index) => {
            const width = `${Math.max((item.totalQuantity / maxQuantity) * 100, minWidth)}%`;

            return (
              <div key={item.modelId} className="flex items-center">
                <div className="flex-grow bg-gray-200 h-8 rounded-lg relative">
                  <div
                    className="bg-blue-500 h-full rounded-lg"
                    style={{ width }}
                  >
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm font-medium text-white">
                      {item.modelName}
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
          <h2 className="text-xl font-bold mb-4">Detailed Model Performance Data</h2>
          <table className="min-w-full bg-white border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 px-4 border-b">Rank</th>
                <th className="py-2 px-4 border-b">Model</th>
                <th className="py-2 px-4 border-b">Stock Sold</th>
                <th className="py-2 px-4 border-b">Amount</th>
                <th className="py-2 px-4 border-b">Model Price</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {data.map((item, index) => (
                <tr key={item.modelId} className="text-gray-700">
                  <td className="py-2 px-4 border-b">{index + 1}</td>
                  <td className="py-2 px-4 border-b">{item.modelName}</td>
                  <td className="py-2 px-4 border-b">{item.totalQuantity}</td>
                  <td className="py-2 px-4 border-b">{item.totalAmount}</td>
                  <td className="py-2 px-4 border-b">{item.modelPrice}</td>
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

export default ModelPerformanceData;

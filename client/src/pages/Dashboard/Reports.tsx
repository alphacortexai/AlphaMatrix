import { useState, useMemo } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useExpenses } from '@/contexts/ExpensesContext';
import { useProducts } from '@/contexts/ProductContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Reports() {
  const { sales, getTotalSales, getTotalProfit } = useSales();
  const { expenses, getTotalExpenses } = useExpenses();
  const { products, getLowStockProducts } = useProducts();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    
    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();

  // Sales trend data
  const salesTrendData = useMemo(() => {
    const data: any = {};
    sales.forEach((sale) => {
      if (sale.createdAt >= startDate && sale.createdAt <= endDate) {
        const date = sale.createdAt.toLocaleDateString();
        if (!data[date]) {
          data[date] = { date, sales: 0, profit: 0, count: 0 };
        }
        data[date].sales += sale.total;
        data[date].profit += sale.profit;
        data[date].count += 1;
      }
    });
    return Object.values(data).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [sales, startDate, endDate]);

  // Top products
  const topProducts = useMemo(() => {
    const productSales: any = {};
    sales.forEach((sale) => {
      if (sale.createdAt >= startDate && sale.createdAt <= endDate) {
        sale.items.forEach((item) => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.total;
        });
      }
    });
    return Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales, startDate, endDate]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const categories: any = {};
    expenses.forEach((expense) => {
      if (expense.createdAt >= startDate && expense.createdAt <= endDate) {
        if (!categories[expense.category]) {
          categories[expense.category] = 0;
        }
        categories[expense.category] += expense.amount;
      }
    });
    return Object.entries(categories).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [expenses, startDate, endDate]);

  const COLORS = ['#1e3a8a', '#059669', '#d97706', '#dc2626', '#7c3aed'];

  // Metrics
  const totalSales = getTotalSales(startDate, endDate);
  const totalProfit = getTotalProfit(startDate, endDate);
  const totalExpenses = getTotalExpenses(startDate, endDate);
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const lowStockCount = getLowStockProducts().length;

  return (
    <ProtectedRoute requiredRoles={['owner', 'branch_manager']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
              <p className="text-slate-600 mt-1">Business performance and insights</p>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Sales</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">${totalSales.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-2 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+12% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Profit</p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">${totalProfit.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-2 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">{profitMargin.toFixed(1)}% margin</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-amber-600 mt-2">${totalExpenses.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-2 text-amber-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">-5% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{lowStockCount}</p>
                <p className="text-sm text-slate-500 mt-2">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales & Profit Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sales & Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {salesTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#1e3a8a" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500">
                    No expense data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#1e3a8a" name="Revenue" />
                    <Bar dataKey="quantity" fill="#059669" name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  No sales data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

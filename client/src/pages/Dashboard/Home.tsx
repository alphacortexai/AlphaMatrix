import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                  {change}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-indigo-100 rounded-lg">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardHome() {
  const { currentBranch, business } = useBusiness();
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalExpenses: 0,
    lowStockItems: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentBranch) return;

      try {
        setLoading(true);

        // Fetch sales for current branch
        const salesQuery = query(
          collection(db, 'sales'),
          where('branchId', '==', currentBranch.id),
          where('createdAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        );
        const salesSnap = await getDocs(salesQuery);
        let totalSales = 0;
        let totalProfit = 0;
        const dailySales: { [key: string]: number } = {};

        salesSnap.docs.forEach((doc) => {
          const sale = doc.data();
          totalSales += sale.total || 0;
          totalProfit += (sale.profit || 0);
          
          const date = sale.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString();
          dailySales[date] = (dailySales[date] || 0) + (sale.total || 0);
        });

        // Fetch expenses
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('branchId', '==', currentBranch.id),
          where('createdAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        );
        const expensesSnap = await getDocs(expensesQuery);
        let totalExpenses = 0;

        expensesSnap.docs.forEach((doc) => {
          totalExpenses += doc.data().amount || 0;
        });

        // Fetch low stock items
        const productsQuery = query(
          collection(db, 'products'),
          where('branchId', '==', currentBranch.id)
        );
        const productsSnap = await getDocs(productsQuery);
        let lowStockItems = 0;

        productsSnap.docs.forEach((doc) => {
          const product = doc.data();
          if (product.quantity <= (product.lowStockAlert || 10)) {
            lowStockItems++;
          }
        });

        setMetrics({
          totalSales,
          totalProfit,
          totalExpenses,
          lowStockItems,
        });

        // Prepare chart data
        const chartArray = Object.entries(dailySales).map(([date, amount]) => ({
          date,
          sales: amount,
        }));
        setChartData(chartArray.slice(-7)); // Last 7 days
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentBranch]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{business?.name || 'Dashboard'}</h1>
            <p className="text-slate-600 mt-1">
              {currentBranch?.name} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Sales"
              value={`$${metrics.totalSales.toFixed(2)}`}
              icon={<ShoppingCart className="w-6 h-6 text-indigo-600" />}
              trend="up"
              change={12}
            />
            <MetricCard
              title="Total Profit"
              value={`$${metrics.totalProfit.toFixed(2)}`}
              icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
              trend="up"
              change={8}
            />
            <MetricCard
              title="Total Expenses"
              value={`$${metrics.totalExpenses.toFixed(2)}`}
              icon={<TrendingDown className="w-6 h-6 text-amber-600" />}
              trend="down"
              change={-5}
            />
            <MetricCard
              title="Low Stock Items"
              value={metrics.lowStockItems}
              icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-600">Profit Margin</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {metrics.totalSales > 0
                      ? ((metrics.totalProfit / metrics.totalSales) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-slate-600">Avg Transaction</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    ${metrics.totalSales > 0 ? (metrics.totalSales / 10).toFixed(2) : 0}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-slate-600">Expense Ratio</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {metrics.totalSales > 0
                      ? ((metrics.totalExpenses / metrics.totalSales) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

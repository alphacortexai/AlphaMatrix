import { useState } from 'react';
import { useExpenses } from '@/contexts/ExpensesContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'salary', label: 'Salary' },
  { value: 'transport', label: 'Transport' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'internet', label: 'Internet' },
  { value: 'stock', label: 'Stock Purchase' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'other', label: 'Other' },
];

export default function Expenses() {
  const { expenses, createExpense, updateExpense, deleteExpense, getTotalExpenses } = useExpenses();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'other' as const,
    description: '',
    amount: 0,
    paymentMethod: '',
    reference: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateExpense(editingId, formData);
        toast.success('Expense updated successfully');
      } else {
        await createExpense(formData);
        toast.success('Expense recorded successfully');
      }
      setOpen(false);
      setEditingId(null);
      setFormData({
        category: 'other',
        description: '',
        amount: 0,
        paymentMethod: '',
        reference: '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  const handleEdit = (expense: any) => {
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod || '',
      reference: expense.reference || '',
    });
    setEditingId(expense.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        toast.success('Expense deleted successfully');
      } catch (err) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const categoryTotals = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    const total = expenses
      .filter((e) => e.category === cat.value)
      .reduce((sum, e) => sum + e.amount, 0);
    return { ...acc, [cat.value]: total };
  }, {} as Record<string, number>);

  return (
    <ProtectedRoute requiredRoles={['owner', 'branch_manager']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
              <p className="text-slate-600 mt-1">Track and manage business expenses</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Expense' : 'Record New Expense'}</DialogTitle>
                  <DialogDescription>
                    {editingId ? 'Update expense details' : 'Add a new business expense'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Expense description"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method (Optional)</label>
                    <Input
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      placeholder="Cash, Check, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reference (Optional)</label>
                    <Input
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Invoice #, Receipt #, etc."
                    />
                  </div>

                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                    {editingId ? 'Update Expense' : 'Record Expense'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Expense Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ${getTotalExpenses().toFixed(2)}
                </p>
              </CardContent>
            </Card>
            {EXPENSE_CATEGORIES.slice(0, 3).map((cat) => (
              <Card key={cat.value}>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">{cat.label}</p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    ${categoryTotals[cat.value]?.toFixed(2) || '0.00'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No expenses recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses
                        .slice()
                        .reverse()
                        .map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="text-sm">
                              {expense.createdAt.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium capitalize">
                                {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label}
                              </span>
                            </TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell className="text-right font-semibold">
                              ${expense.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm">{expense.paymentMethod || '-'}</TableCell>
                            <TableCell className="text-sm">{expense.reference || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(expense)}
                                  className="p-1 hover:bg-slate-100 rounded"
                                >
                                  <Edit2 className="w-4 h-4 text-slate-600" />
                                </button>
                                <button
                                  onClick={() => handleDelete(expense.id)}
                                  className="p-1 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

import { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useProducts } from '@/contexts/ProductContext';
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
import { Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function Sales() {
  const { sales, createSale, getTotalSales, getTotalProfit } = useSales();
  const { products } = useProducts();
  const [open, setOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money' | 'credit'>('cash');

  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Please select a product and quantity');
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existingItem = cartItems.find((item) => item.productId === selectedProduct);
    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === selectedProduct
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.sellingPrice,
          discount: 0,
          total: product.sellingPrice * quantity,
        },
      ]);
    }

    setSelectedProduct('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const totalDiscount = cartItems.reduce((sum, item) => sum + item.discount, 0);
    const total = subtotal - totalDiscount;
    const profit = cartItems.reduce(
      (sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return sum;
        return sum + (item.unitPrice - product.costPrice) * item.quantity - item.discount;
      },
      0
    );
    return { subtotal, totalDiscount, total, profit };
  };

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const { subtotal, totalDiscount, total, profit } = calculateTotals();
      await createSale({
        items: cartItems,
        subtotal,
        totalDiscount,
        tax: 0,
        total,
        profit,
        paymentMethod,
        customerName: customerName || undefined,
      });

      toast.success('Sale recorded successfully');
      setCartItems([]);
      setCustomerName('');
      setPaymentMethod('cash');
      setOpen(false);
    } catch (err) {
      toast.error('Failed to record sale');
    }
  };

  const { subtotal, totalDiscount, total, profit } = calculateTotals();

  return (
    <ProtectedRoute requiredRoles={['owner', 'cashier']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
              <p className="text-slate-600 mt-1">Record and manage sales transactions</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record New Sale</DialogTitle>
                  <DialogDescription>Add items and complete the transaction</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Product Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Add Items</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Product</label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - ${product.sellingPrice}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleAddToCart}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Cart</h3>
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cartItems.map((item) => (
                          <div
                            key={item.productId}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-slate-600">
                                {item.quantity} × ${item.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right mr-4">
                              <p className="font-semibold">${item.total.toFixed(2)}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.productId)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Customer Name (Optional)</label>
                        <Input
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Customer name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Payment Method</label>
                        <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Profit:</span>
                      <span>${profit.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCompleteSale}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={cartItems.length === 0}
                    >
                      Complete Sale
                    </Button>
                    <Button
                      onClick={() => setOpen(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Sales Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Sales Today</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ${getTotalSales().toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Profit Today</p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">
                  ${getTotalProfit().toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Number of Transactions</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{sales.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No sales recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.slice().reverse().map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="text-sm">
                            {sale.createdAt.toLocaleString()}
                          </TableCell>
                          <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                          <TableCell>{sale.items.length}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ${sale.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 font-semibold">
                            ${sale.profit.toFixed(2)}
                          </TableCell>
                          <TableCell className="capitalize text-sm">
                            {sale.paymentMethod.replace('_', ' ')}
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

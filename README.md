# Alpha Matrix - Business Management System

A comprehensive web-based business management system built with React, TypeScript, Tailwind CSS, and Firebase. Alpha Matrix helps businesses manage products, services, sales, inventory, expenses, and generate detailed analytics.

## Features

### Core Functionality
- **Multi-Branch Support**: Manage multiple business branches with separate inventory, sales, and staff
- **Role-Based Access Control**: Owner, Branch Manager, Cashier, and Stock Manager roles
- **Product & Service Management**: Track products and services with pricing, inventory, and supplier information
- **Sales Management**: Record sales transactions with automatic profit calculation
- **Inventory Management**: Real-time stock tracking with low-stock alerts
- **Expense Tracking**: Categorize and monitor business expenses
- **Analytics Dashboard**: Comprehensive reports and business performance insights

### User Roles
- **Owner/Admin**: Full access to all features and reports
- **Branch Manager**: Manage assigned branch, view branch-specific reports
- **Cashier/Sales Staff**: Record sales, apply discounts, view available stock
- **Stock Manager**: Manage inventory, track stock movements

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Routing**: Wouter
- **Form Handling**: React Hook Form

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Firebase project (create at [firebase.google.com](https://firebase.google.com))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/alphacortexai/AlphaMatrix.git
cd AlphaMatrix
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure Firebase**

Create a `.env.local` file in the project root with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

You can find these values in your Firebase project settings:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon → Project Settings
4. Copy the Web API configuration

4. **Set up Firebase Database**

In Firebase Console:
1. Enable Firestore Database (Start in test mode for development)
2. Enable Authentication (Email/Password)
3. Create the following Firestore collections:
   - `users` - User profiles and roles
   - `businesses` - Business information
   - `branches` - Branch details
   - `products` - Products and services
   - `sales` - Sales transactions
   - `expenses` - Business expenses

### Running Locally

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check
```

The application will be available at `http://localhost:3000`

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.tsx      # Main layout with sidebar
│   │   ├── ProtectedRoute.tsx       # Role-based route protection
│   │   └── ui/                      # shadcn/ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Authentication & user management
│   │   ├── BusinessContext.tsx      # Business & branch management
│   │   ├── ProductContext.tsx       # Product management
│   │   ├── SalesContext.tsx         # Sales transactions
│   │   └── ExpensesContext.tsx      # Expense tracking
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── Setup.tsx
│   │   └── Dashboard/
│   │       ├── Home.tsx             # Dashboard overview
│   │       ├── Inventory.tsx        # Product management
│   │       ├── Sales.tsx            # Sales recording
│   │       ├── Expenses.tsx         # Expense tracking
│   │       ├── Reports.tsx          # Analytics & reports
│   │       ├── Staff.tsx            # Team management
│   │       └── Settings.tsx         # Business settings
│   ├── lib/
│   │   ├── firebase.ts              # Firebase configuration
│   │   └── utils.ts                 # Utility functions
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
└── public/
    └── favicon.ico
```

## Firestore Schema

### Users Collection
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'branch_manager' | 'cashier' | 'stock_manager';
  businessId: string;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Businesses Collection
```typescript
{
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  type: 'shop' | 'stationery' | 'service' | 'other';
  createdAt: Date;
  updatedAt: Date;
}
```

### Products Collection
```typescript
{
  id: string;
  branchId: string;
  name: string;
  type: 'product' | 'service';
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockAlert: number;
  supplier?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sales Collection
```typescript
{
  id: string;
  branchId: string;
  staffId: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  total: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'mobile_money' | 'credit';
  createdAt: Date;
  updatedAt: Date;
}
```

### Expenses Collection
```typescript
{
  id: string;
  branchId?: string;
  category: 'rent' | 'salary' | 'transport' | 'utilities' | 'internet' | 'stock' | 'repairs' | 'other';
  description: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Guide

### Creating an Account
1. Click "Sign up" on the login page
2. Enter your name, email, and password
3. Complete the business setup form
4. Your account is ready to use

### Recording a Sale
1. Navigate to Sales → New Sale
2. Select products and quantities
3. Enter customer information (optional)
4. Choose payment method
5. Complete the transaction

### Managing Inventory
1. Go to Inventory
2. Add new products with cost and selling prices
3. Set low-stock alert levels
4. Track quantity changes

### Viewing Reports
1. Navigate to Reports & Analytics
2. Select time range (Week, Month, Year)
3. View sales trends, profit analysis, and expense breakdown
4. Identify top-selling products and low-stock items

## Security Considerations

- All data is encrypted in transit (HTTPS)
- Firebase Authentication handles secure user authentication
- Firestore security rules should be configured in production
- Sensitive data (passwords) are never stored locally
- Role-based access control prevents unauthorized data access

### Recommended Firestore Security Rules (Production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Businesses - owner can manage
    match /businesses/{businessId} {
      allow read: if request.auth.uid in resource.data.staffIds;
      allow write: if request.auth.uid == resource.data.ownerId;
    }
    
    // Products - branch staff can access
    match /products/{productId} {
      allow read, write: if request.auth.uid != null;
    }
    
    // Sales - staff can create, view
    match /sales/{saleId} {
      allow create: if request.auth.uid != null;
      allow read: if request.auth.uid != null;
    }
    
    // Expenses - managers can manage
    match /expenses/{expenseId} {
      allow read, write: if request.auth.uid != null;
    }
  }
}
```

## Development

### Adding New Features

1. Create context if needed (e.g., `NewFeatureContext.tsx`)
2. Create page component (e.g., `pages/Dashboard/NewFeature.tsx`)
3. Add route to `App.tsx`
4. Add navigation item to `DashboardLayout.tsx`

### Styling

- Use Tailwind CSS utilities
- Follow the color scheme: Indigo (primary), Emerald (success), Amber (warning)
- Maintain consistent spacing and typography

### Testing

```bash
# Run type checking
pnpm check

# Build the project
pnpm build
```

## Deployment

The application can be deployed to various platforms:

- **Vercel**: `vercel deploy`
- **Netlify**: Connect GitHub repo to Netlify
- **Firebase Hosting**: `firebase deploy`
- **Any Node.js host**: `pnpm build && pnpm start`

## Troubleshooting

### Firebase Connection Issues
- Verify Firebase credentials in `.env.local`
- Check Firestore is enabled in Firebase Console
- Ensure security rules allow your operations

### Authentication Errors
- Clear browser cache and cookies
- Verify email/password are correct
- Check Firebase Authentication is enabled

### Data Not Appearing
- Verify Firestore collections exist
- Check security rules allow read access
- Ensure data is being saved to correct branch/business

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review Firebase documentation

## Roadmap

- [ ] Advanced inventory management (stock transfers, damage tracking)
- [ ] Customer management and loyalty programs
- [ ] Supplier management and purchase orders
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] SMS alerts for low stock
- [ ] Advanced reporting and exports
- [ ] Integration with payment gateways
- [ ] Barcode/QR code scanning

## Changelog

### Version 1.0.0
- Initial release
- Core business management features
- Multi-branch support
- Role-based access control
- Sales and inventory management
- Expense tracking
- Analytics dashboard

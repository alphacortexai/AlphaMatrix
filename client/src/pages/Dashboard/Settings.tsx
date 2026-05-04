import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function Settings() {
  const { userProfile, logout } = useAuth();
  const { business, updateBusiness, branches, createBranch } = useBusiness();
  const [, navigate] = useLocation();
  const [businessName, setBusinessName] = useState(business?.name || '');
  const [businessDescription, setBusinessDescription] = useState(business?.description || '');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setLoading(true);
    try {
      await updateBusiness(business.id, {
        name: businessName,
        description: businessDescription,
      });
      toast.success('Business updated successfully');
    } catch (err) {
      toast.error('Failed to update business');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBranch({
        name: newBranchName,
        location: newBranchLocation,
      });
      toast.success('Branch added successfully');
      setNewBranchName('');
      setNewBranchLocation('');
    } catch (err) {
      toast.error('Failed to add branch');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error('Failed to logout');
    }
  };

  return (
    <ProtectedRoute requiredRoles={['owner']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-1">Manage your business and account</p>
          </div>

          <Tabs defaultValue="business" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {/* Business Tab */}
            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>Update your business details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateBusiness} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Name</label>
                      <Input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Business name"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        placeholder="Business description"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Type</label>
                      <Input
                        value={business?.type || ''}
                        disabled
                        className="bg-slate-100"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branches Tab */}
            <TabsContent value="branches" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Branches</CardTitle>
                  <CardDescription>Manage your business branches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {branches.map((branch) => (
                      <div key={branch.id} className="p-4 border border-slate-200 rounded-lg">
                        <h3 className="font-semibold text-slate-900">{branch.name}</h3>
                        <p className="text-sm text-slate-600">{branch.location}</p>
                        {branch.phone && <p className="text-sm text-slate-600">{branch.phone}</p>}
                        {branch.email && <p className="text-sm text-slate-600">{branch.email}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add New Branch</CardTitle>
                  <CardDescription>Expand your business with a new branch</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddBranch} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Branch Name</label>
                      <Input
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="Branch name"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        value={newBranchLocation}
                        onChange={(e) => setNewBranchLocation(e.target.value)}
                        placeholder="Branch location"
                        required
                        disabled={loading}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Branch'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Name</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {userProfile?.displayName}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Email</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {userProfile?.email}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Role</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1 capitalize">
                      {userProfile?.role.replace('_', ' ')}
                    </p>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Account created on {userProfile?.createdAt.toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900">Logout</CardTitle>
                  <CardDescription className="text-red-800">
                    Sign out of your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

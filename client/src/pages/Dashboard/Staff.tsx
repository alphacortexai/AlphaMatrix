import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

export default function Staff() {
  return (
    <ProtectedRoute requiredRoles={['owner', 'branch_manager']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
              <p className="text-slate-600 mt-1">Manage your team and user roles</p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>

          {/* Coming Soon */}
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <Users className="w-16 h-16 mx-auto text-slate-300" />
                <h2 className="text-2xl font-bold text-slate-900">Staff Management Coming Soon</h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  This feature is currently under development. You'll soon be able to manage your team members, 
                  assign roles, and track their performance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

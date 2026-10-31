import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { QuotationsView } from './views/QuotationsView';
import { QuotationTemplatesView } from './views/QuotationTemplatesView';
import { InvoicesView } from './views/InvoicesView';
import { PaymentsView } from './views/PaymentsView';
import { BillingSchedulerView } from './views/BillingSchedulerView';
import { ProductsView } from './views/ProductsView';
import { PlansView } from './views/PlansView';
import { DiscountsView } from './views/DiscountsView';
import { TaxesView } from './views/TaxesView';
import { CustomersView } from './views/CustomersView';
import { StaffView } from './views/StaffView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { AuthView } from './views/AuthView';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import type { Invoice, User } from './types';

interface DashboardLayoutProps {
  user: User;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user }) => {
  const [currentTab, setCurrentTab] = useState<string>(
    user.role === 'customer' ? 'customer-portal' : 'dashboard'
  );
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-switch tab if role changes (e.g. via persona switcher)
  useEffect(() => {
    if (user.role === 'customer' && currentTab !== 'customer-portal' && currentTab !== 'invoices' && currentTab !== 'payments') {
      setCurrentTab('customer-portal');
    } else if (user.role !== 'customer' && currentTab === 'customer-portal') {
      setCurrentTab('dashboard');
    }
  }, [user.role]);

  // Fetch overdue count for badge
  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.kpis?.overdueInvoicesCount) {
          setOverdueCount(data.kpis.overdueInvoicesCount);
        }
      })
      .catch(console.error);
  }, [currentTab]);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenScheduler={() => setCurrentTab('scheduler')}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
          />
        );
      case 'subscriptions':
        return <SubscriptionsView />;
      case 'quotations':
        return <QuotationsView />;
      case 'quotation-templates':
        return <QuotationTemplatesView />;
      case 'invoices':
        return <InvoicesView />;
      case 'payments':
        return <PaymentsView />;
      case 'scheduler':
        return <BillingSchedulerView />;
      case 'products':
        return <ProductsView />;
      case 'plans':
        return <PlansView />;
      case 'discounts':
        return <DiscountsView />;
      case 'taxes':
        return <TaxesView />;
      case 'customers':
        return <CustomersView />;
      case 'staff':
        return <StaffView />;
      case 'customer-portal':
        return <CustomerPortalView />;
      default:
        return (
          <DashboardView
            onOpenScheduler={() => setCurrentTab('scheduler')}
            onSelectInvoice={setSelectedInvoice}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      {/* Top Sticky Header */}
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNavigateTab={setCurrentTab}
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex w-full flex-1 items-start gap-4 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          overdueCount={overdueCount}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="min-w-0 flex-1 pb-8">
          {renderContent()}
        </main>
      </div>

      {/* Modal for Invoice Printing when opened from Dashboard */}
      <InvoicePrintModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};

const MainApp: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthView />;
  }

  return <DashboardLayout user={user} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;

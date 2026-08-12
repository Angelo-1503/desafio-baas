import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ActivateGatewayPage } from './pages/ActivateGatewayPage';
import { CheckoutLinkDetailPage } from './pages/CheckoutLinkDetailPage';
import { CheckoutLinksPage } from './pages/CheckoutLinksPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PayPage } from './pages/PayPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { RegisterPage } from './pages/RegisterPage';
import { WebhooksPage } from './pages/WebhooksPage';
import { WithdrawalsPage } from './pages/WithdrawalsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pay/:linkId" element={<PayPage />} />
      <Route path="/receipt/:orderId" element={<ReceiptPage />} />

      <Route
        path="/gateway/activate"
        element={
          <ProtectedRoute>
            <ActivateGatewayPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/checkout-links" element={<CheckoutLinksPage />} />
        <Route path="/checkout-links/:id" element={<CheckoutLinkDetailPage />} />
        <Route path="/withdrawals" element={<WithdrawalsPage />} />
        <Route path="/webhooks" element={<WebhooksPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

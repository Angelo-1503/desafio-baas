import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <nav className="app-nav">
        <span className="brand">VBA Systems BaaS</span>
        <NavLink to="/dashboard">Carteira</NavLink>
        <NavLink to="/checkout-links">Links de pagamento</NavLink>
        <NavLink to="/withdrawals">Saques</NavLink>
        <NavLink to="/webhooks">Webhooks</NavLink>
        <span className="muted">{user?.email}</span>
        <button type="button" className="secondary" onClick={logout}>
          Sair
        </button>
      </nav>
      <div className="page">
        <Outlet />
      </div>
    </>
  );
}

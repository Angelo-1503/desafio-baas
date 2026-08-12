import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { RegisterPayload } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

const initialForm: RegisterPayload = {
  name: '',
  email: '',
  password: '',
  personType: 'PF',
  tradingName: '',
  phone: '',
  document: '',
  zipCode: '',
  address: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterPayload>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate('/gateway/activate');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <h1>Criar conta de lojista</h1>
      <p className="muted">
        Esses dados também são usados para cadastrar sua conta no gateway Lera Box. Use e-mail e
        telefone reais — o CPF/CNPJ pode ser fictício (ambiente sandbox). Você receberá a senha de
        acesso ao gateway por e-mail.
      </p>
      <form className="stack card" onSubmit={handleSubmit}>
        {error && <div className="error-box">{error}</div>}

        <div className="row">
          <label className="field">
            Tipo de pessoa
            <select
              value={form.personType}
              onChange={(e) => update('personType', e.target.value as 'PF' | 'PJ')}
            >
              <option value="PF">Pessoa física</option>
              <option value="PJ">Pessoa jurídica</option>
            </select>
          </label>
          <label className="field field-lg">
            Nome / Razão social
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>
        </div>

        {form.personType === 'PJ' && (
          <label className="field">
            Nome fantasia
            <input
              value={form.tradingName}
              onChange={(e) => update('tradingName', e.target.value)}
            />
          </label>
        )}

        <div className="row">
          <label className="field">
            E-mail (real)
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </label>
          <label className="field">
            Senha de acesso à BaaS
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </label>
        </div>

        <div className="row">
          <label className="field">
            Telefone (real, DDD + número)
            <input
              required
              placeholder="11999998888"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </label>
          <label className="field">
            CPF/CNPJ (pode ser fictício)
            <input
              required
              placeholder="somente números"
              value={form.document}
              onChange={(e) => update('document', e.target.value)}
            />
          </label>
        </div>

        <div className="row">
          <label className="field">
            CEP
            <input
              required
              value={form.zipCode}
              onChange={(e) => update('zipCode', e.target.value)}
            />
          </label>
          <label className="field field-lg">
            Endereço
            <input
              required
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </label>
          <label className="field">
            Número
            <input
              required
              value={form.number}
              onChange={(e) => update('number', e.target.value)}
            />
          </label>
        </div>

        <div className="row">
          <label className="field">
            Complemento
            <input value={form.complement} onChange={(e) => update('complement', e.target.value)} />
          </label>
          <label className="field">
            Bairro
            <input
              required
              value={form.neighborhood}
              onChange={(e) => update('neighborhood', e.target.value)}
            />
          </label>
        </div>

        <div className="row">
          <label className="field field-lg">
            Cidade
            <input required value={form.city} onChange={(e) => update('city', e.target.value)} />
          </label>
          <label className="field">
            UF
            <input
              required
              maxLength={2}
              value={form.state}
              onChange={(e) => update('state', e.target.value.toUpperCase())}
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <p className="muted">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}

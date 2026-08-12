import { api } from './client';
import type { AuthResponse, GatewayAccountView, PersonType } from './types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  personType: PersonType;
  tradingName?: string;
  phone: string;
  document: string;
  zipCode: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const authApi = {
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload, false),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }, false),
  activateGateway: (password: string) =>
    api.post<GatewayAccountView>('/auth/gateway/activate', { password }),
};

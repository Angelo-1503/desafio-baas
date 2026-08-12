/** Todos os valores monetários trafegam e são persistidos em centavos (inteiros). */
export function centavosToBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

export function isValidCentavos(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

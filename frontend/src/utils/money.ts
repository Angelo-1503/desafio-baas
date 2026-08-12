export function centavosToBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    centavos / 100,
  );
}

export function brlToCentavos(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return Math.round(Number.parseFloat(normalized) * 100);
}

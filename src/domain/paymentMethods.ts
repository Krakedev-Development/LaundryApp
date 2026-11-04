import type { AppState, PaymentMethod } from "./models";

export interface CardInput {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
}
export interface BankAccountInput {
  bank: string;
  holder: string;
  accountNumber: string;
  accountType: "Ahorros" | "Corriente";
}
export const digitsOnly = (value: string) => value.replace(/\D/g, "");
export function cardBrand(
  number: string,
): "Visa" | "Mastercard" | "Amex" | undefined {
  const digits = digitsOnly(number);
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(digits)) return "Visa";
  if (/^3[47]\d{13}$/.test(digits)) return "Amex";
  if (
    digits.length === 16 &&
    (/^5[1-5]/.test(digits) ||
      (Number(digits.slice(0, 4)) >= 2221 &&
        Number(digits.slice(0, 4)) <= 2720))
  )
    return "Mastercard";
  return undefined;
}
export function cardNumberError(value: string): string | undefined {
  if (/[^\d\s-]/.test(value)) return "Revisa el número de tarjeta.";
  const digits = digitsOnly(value);
  if (!cardBrand(digits))
    return "Ingresa una tarjeta Visa, Mastercard o Amex válida.";
  let sum = 0;
  for (
    let index = digits.length - 1, double = false;
    index >= 0;
    index--, double = !double
  ) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0 ? undefined : "Revisa el número de tarjeta.";
}
export function expiryError(
  value: string,
  now = new Date(),
): string | undefined {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return "Usa un vencimiento válido con formato MM/AA.";
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(date.find((part) => part.type === "year")!.value);
  const month = Number(date.find((part) => part.type === "month")!.value);
  return 2000 + Number(match[2]) < year ||
    (2000 + Number(match[2]) === year && Number(match[1]) < month)
    ? "La tarjeta está vencida."
    : undefined;
}
export function cardInputError(
  input: CardInput,
  now = new Date(),
): string | undefined {
  return (
    cardNumberError(input.number) ??
    (input.holder.trim().length < 3
      ? "Ingresa el nombre del titular."
      : undefined) ??
    expiryError(input.expiry, now) ??
    (!new RegExp(
      cardBrand(input.number) === "Amex" ? "^\\d{4}$" : "^\\d{3}$",
    ).test(input.cvv)
      ? "Revisa el código de seguridad."
      : undefined)
  );
}
export function bankAccountError(input: BankAccountInput): string | undefined {
  if (input.bank.trim().length < 2) return "Ingresa el nombre del banco.";
  if (input.holder.trim().length < 3) return "Ingresa el nombre del titular.";
  if (
    /[^\d\s-]/.test(input.accountNumber) ||
    !/^\d{6,24}$/.test(digitsOnly(input.accountNumber))
  )
    return "Ingresa un número de cuenta de 6 a 24 dígitos.";
  if (!["Ahorros", "Corriente"].includes(input.accountType))
    return "Selecciona el tipo de cuenta.";
  return undefined;
}
export function initialPaymentMethods(): PaymentMethod[] {
  return [
    {
      id: "pm-demo-visa",
      customerId: "cust-1",
      kind: "CARD",
      brand: "Visa",
      holder: "María Torres",
      last4: "4242",
      expiry: "12/27",
      isDefault: true,
    },
  ];
}
/** Additive migration: existing customer balances, orders and payment records stay intact. */
export function migratePaymentMethods(state: AppState): AppState {
  if (state.paymentMethods === undefined)
    state.paymentMethods = state.customers.some(
      (customer) => customer.id === "cust-1",
    )
      ? initialPaymentMethods()
      : [];
  if (!Array.isArray(state.paymentMethods))
    throw Error("Los métodos de pago locales no tienen un formato compatible.");
  const ids = new Set<string>();
  const defaults = new Set<string>();
  for (const method of state.paymentMethods) {
    if (
      !method ||
      !method.id ||
      ids.has(method.id) ||
      !state.customers.some((customer) => customer.id === method.customerId) ||
      typeof method.holder !== "string" ||
      method.holder.trim().length < 3 ||
      !/^\d{4}$/.test(method.last4) ||
      typeof method.isDefault !== "boolean"
    )
      throw Error("Los métodos de pago locales no son válidos.");
    if (method.isDefault && defaults.has(method.customerId))
      throw Error("Hay más de un método de pago principal.");
    if (method.kind === "CARD") {
      if (
        !["Visa", "Mastercard", "Amex"].includes(method.brand) ||
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(method.expiry)
      )
        throw Error("La tarjeta guardada no es válida.");
    } else if (method.kind === "TRANSFER") {
      if (
        bankAccountError(method) ||
        method.accountNumber.slice(-4) !== method.last4
      )
        throw Error("La cuenta bancaria guardada no es válida.");
    } else throw Error("El tipo de método de pago no es válido.");
    ids.add(method.id);
    if (method.isDefault) defaults.add(method.customerId);
  }
  return state;
}
export function addCard(
  state: AppState,
  customerId: string,
  input: CardInput,
  id: string,
  now: Date,
): string {
  const error = cardInputError(input, now);
  if (error) throw Error(error);
  const brand = cardBrand(input.number)!;
  const last4 = digitsOnly(input.number).slice(-4);
  const holder = input.holder.trim();
  if (
    state.paymentMethods.some(
      (method) =>
        method.customerId === customerId &&
        method.kind === "CARD" &&
        method.brand === brand &&
        method.last4 === last4 &&
        method.expiry === input.expiry &&
        method.holder.toLowerCase() === holder.toLowerCase(),
    )
  )
    throw Error("Esta tarjeta ya está registrada.");
  state.paymentMethods.push({
    id,
    customerId,
    kind: "CARD",
    brand,
    last4,
    holder,
    expiry: input.expiry,
    isDefault: !state.paymentMethods.some(
      (method) => method.customerId === customerId,
    ),
  });
  return id;
}
export function addBankAccount(
  state: AppState,
  customerId: string,
  input: BankAccountInput,
  id: string,
): string {
  const error = bankAccountError(input);
  if (error) throw Error(error);
  const accountNumber = digitsOnly(input.accountNumber);
  const bank = input.bank.trim();
  if (
    state.paymentMethods.some(
      (method) =>
        method.customerId === customerId &&
        method.kind === "TRANSFER" &&
        method.bank.toLowerCase() === bank.toLowerCase() &&
        method.accountNumber === accountNumber,
    )
  )
    throw Error("Esta cuenta bancaria ya está registrada.");
  state.paymentMethods.push({
    id,
    customerId,
    kind: "TRANSFER",
    bank,
    accountNumber,
    last4: accountNumber.slice(-4),
    accountType: input.accountType,
    holder: input.holder.trim(),
    isDefault: !state.paymentMethods.some(
      (method) => method.customerId === customerId,
    ),
  });
  return id;
}
export function setDefaultPaymentMethod(
  state: AppState,
  customerId: string,
  id: string,
): void {
  if (
    !state.paymentMethods.some(
      (method) => method.id === id && method.customerId === customerId,
    )
  )
    throw Error("No tienes acceso a este método de pago.");
  for (const method of state.paymentMethods)
    if (method.customerId === customerId) method.isDefault = method.id === id;
}
export function removePaymentMethod(
  state: AppState,
  customerId: string,
  id: string,
): void {
  const method = state.paymentMethods.find(
    (item) => item.id === id && item.customerId === customerId,
  );
  if (!method) throw Error("No tienes acceso a este método de pago.");
  state.paymentMethods = state.paymentMethods.filter((item) => item !== method);
  if (method.isDefault) {
    const remaining = state.paymentMethods.find(
      (item) => item.customerId === customerId,
    );
    if (remaining) remaining.isDefault = true;
  }
}

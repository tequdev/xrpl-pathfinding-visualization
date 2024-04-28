import { type Amount, type Currency, Balance } from "xrpl";

export const parseAccount = (account: string) => {
  return account.slice(0, 8) + '...'
}

// 通貨名の取得
export const parseCurrencyName = (currency: Balance, option?: { forDisp: boolean }) => {
  if (currency.currency === "XRP") return "XRP";
  if (option?.forDisp === true)
    // @ts-ignore
    return convertCurrencyCode(currency.currency) + '.' + parseAccount(currency.issuer!)
  else
    return currency.currency
};

export const convertCurrencyCode = (currency: string): string => {
  if (currency && currency.length > 3) {
    return Buffer.from(currency, 'hex').toString('utf-8').replace(/\0/g, '')
  } else {
    return currency
  }
}

export const parseCurrencyIssuer = (currency: Amount | Currency) => {
  if (typeof currency === "string" || currency.currency === "XRP") return undefined;
  // @ts-ignore
  return currency["issuer"] as string;
};

export const parseAmountValue = (amount: Balance): string => {
  if (amount.currency === "XRP") {
    return amount.value.replaceAll(/^-/g, "")
  }
  return amount.value.replaceAll(/^-/g, "")
}



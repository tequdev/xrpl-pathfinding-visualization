// @ts-ignore
import { extractBalanceChanges, extractExchanges } from "@xrplkit/txmeta";
import {
  dropsToXrp,
  type Amount,
  type Currency,
  type Payment,
  type TxResponse,
} from "xrpl";

export const parseAccount = (account: string) => {
  return account.slice(0, 8) + '...'
}

// 通貨名の取得
export const parseCurrencyName = (currency: Amount | Currency,option?:{forDisp:boolean}) => {
  if (typeof currency === "string" || currency.currency === "XRP") return "XRP";
  if(option?.forDisp === true)
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

export const parseAmountValue = (amount: Amount): string => {
  if (typeof amount === 'string') {
    return dropsToXrp(amount)
  }
  return amount.value
}

export const getAccountChanges = (tx: TxResponse<Payment>["result"]) => {
  return extractBalanceChanges(tx)
}
export const getAccountBalanceChangesAmount = (
  account: string,
  issuer: string | undefined,
  currency: string,
  tx: TxResponse<Payment>["result"]
) => {
  const balanceChanges = getAccountChanges(tx)
  const change = balanceChanges[account].filter(
    (change: any) =>
      (!issuer || change?.issuer === issuer) && change.currency === currency
  )[0];
  return {
    before: change.previous,
    after: change.final,
  };

};

export const getOfferChangesAmount = (tx: TxResponse<Payment>["result"]) => {
  return extractExchanges(tx, { collapse: true })
};

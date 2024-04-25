// @ts-ignore
import { extractBalanceChanges, extractExchanges } from "@xrplkit/txmeta";
import { ModifierFlags } from "typescript";
import {
  dropsToXrp,
  type Amount,
  type Currency,
  type Payment,
  type TxResponse,
  isModifiedNode,
  ModifiedNode,
} from "xrpl";
import { RippleState } from "xrpl/dist/npm/models/ledger";

export const parseAccount = (account: string) => {
  return account.slice(0, 8) + '...'
}

// 通貨名の取得
export const parseCurrencyName = (currency: Amount | Currency, option?: { forDisp: boolean }) => {
  if (typeof currency === "string" || currency.currency === "XRP") return "XRP";
  // @ts-ignore
  if (!currency.issuer) return "XRP"
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

export const parseAmountValue = (amount: Amount): string => {
  if (typeof amount === 'string') {
    return dropsToXrp(amount)
  }
  return amount.value
}

export const getAccountChanges = (tx: TxResponse<Payment>["result"]) => {
  const changes = extractBalanceChanges(tx) as Record<string, any[]>

  const amm_accounts = getAMMAccountFromTx(tx)
  Object.keys(changes).forEach((account) => {
    changes[account] = changes[account].map((change) => ({
      is_amm: amm_accounts.includes(account),
      ...change
    }))
  })
  return changes
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
    change: change.change,
  };

};

const getAMMAccountFromTx = (tx: TxResponse<Payment>["result"]) => {
  if (typeof tx.meta === 'string') throw new Error('meta is not object')

  const modifiedAMMNodes = tx.meta?.AffectedNodes.filter((node) => isModifiedNode(node) && node.ModifiedNode.LedgerEntryType === 'RippleState' && 16777216 & node.ModifiedNode.FinalFields?.Flags as number) as ModifiedNode[]
  const modifiedAmmAccount = modifiedAMMNodes.map(node => {
    const finalFields = node.ModifiedNode.FinalFields as unknown as RippleState
    return finalFields.Balance.value.includes("-") ? finalFields.HighLimit.issuer : finalFields.LowLimit.issuer
  })

  return modifiedAmmAccount.filter((elem, index, self) => self.indexOf(elem) === index) // unique
}

export const getOfferChangesAmount = (tx: TxResponse<Payment>["result"]) => {
  return extractExchanges(tx, { collapse: true })
};

"use client";
import useSWR from "swr/immutable";
import { useParams } from "next/navigation";
import { XrplClient } from "xrpl-client";
// @ts-ignore
import { rippleTimeToISOTime, type AccountTxResponse, type TxResponse, Payment, ResponseOnlyTxInfo, TransactionMetadata, AccountTxTransaction, OfferCreate } from "xrpl";
import { parseAccount, parseCurrencyName } from "@/utils/xrpl";
import Path from "@/components/Path";
import { useEffect, useState } from "react";
import pathParser from 'xrpl-tx-path-parser'

const fetcher = async (account: string) => {
  const client = new XrplClient();
  const result = await client.send({
    command: "account_tx",
    account,
    limit: 100000,
  });
  client.close()
  return result.transactions as AccountTxResponse["result"]['transactions'];
};

export default function Hash() {
  const { address } = useParams();
  const { data: transactions, isLoading, error } = useSWR<AccountTxResponse["result"]['transactions']>(
    address,
    fetcher
  );
  const [selectedTransaction, setSelectedTransaction] = useState<TxResponse<Payment | OfferCreate>['result']>()

  useEffect(() => {
    if (selectedTransaction) {
      // @ts-ignore
      window[selectedTransaction.hash] && window[selectedTransaction.hash].showModal()
    }
  })

  if (isLoading) return <>Loading...</>;

  if (!transactions) {
    return <>{error}</>;
  }

  const filterPathPayment = (tx: AccountTxTransaction) => ['Payment', 'OfferCreate'].includes(tx.tx!.TransactionType) && (tx.meta as TransactionMetadata).TransactionResult === 'tesSUCCESS'
  return (
    <div className="overflow-x-auto flex flex-row justify-center p-4">
      <table className="table max-w-6xl">
        {/* head */}
        <thead>
          <tr>
            <th>Date</th>
            <th>Transaction Type</th>
            <th>From</th>
            <th>To</th>
            <th>Modal</th>
          </tr>
        </thead>
        <tbody>
          {transactions.filter(filterPathPayment).map((tx: AccountTxTransaction) => {
            if (typeof tx.meta === 'string') return false

            const sourceTxn = { ...tx.tx, meta: tx.meta } as any

            const result = (() => {
              try {
                return pathParser(sourceTxn)
              } catch (e) {
                console.error(tx.tx!.hash, e)
                throw e
              }
            })()

            const data: TxResponse['result'] = {
              hash: tx.tx!.hash!,
              ledger_index: tx.ledger_index,
              meta: tx.meta,
              validated: tx.validated,
              ...tx.tx as (Payment | OfferCreate) & ResponseOnlyTxInfo
            }

            return (
              <tr key={tx.tx!.hash}>
                <td>{rippleTimeToISOTime(tx.tx?.date!).split(".")[0].replace("T", ' ')}</td>
                <td>{tx.tx?.TransactionType}</td>
                <td>
                  <div>{parseAccount(result.sourceAccount)}</div>
                  <div>{result.sourceAmount.value.replaceAll(/^-/g,'')} {parseCurrencyName(result.sourceAmount, { forDisp: true })}</div>
                </td>
                <td>
                  <div>{parseAccount(result.destinationAccount)}</div>
                  <div>{result.destinationAmount.value.replaceAll(/^-/g,'')} {parseCurrencyName(result.destinationAmount, { forDisp: true })}</div>
                </td>
                <td><button className="btn" onClick={() => {
                  setSelectedTransaction(data)
                }
                }>open modal</button></td>

              </tr>)
          })}
        </tbody>
      </table>
      {selectedTransaction &&
        <dialog id={selectedTransaction.hash} className="modal flex flex-row justify-center">
          <form method="dialog" className="modal-box w-[80%] max-w-none">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            <Path key={selectedTransaction.hash} data={selectedTransaction} isModal />
          </form>
        </dialog>
      }
    </div>
  )
}

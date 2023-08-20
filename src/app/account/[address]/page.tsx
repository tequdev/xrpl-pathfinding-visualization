"use client";
import useSWR from "swr/immutable";
import { useParams } from "next/navigation";
import { XrplClient } from "xrpl-client";
// @ts-ignore
import { rippleTimeToISOTime, type AccountTxResponse, type TxResponse, Payment, ResponseOnlyTxInfo, TransactionMetadata, AccountTxTransaction } from "xrpl";
import BigNumber from 'bignumber.js'
import {
  getAccountBalanceChangesAmount,
  parseCurrencyIssuer,
  parseCurrencyName,
} from "@/utils/xrpl";
import Path from "@/components/Path";
import { useEffect, useState } from "react";


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
  const [selectedTransaction, setSelectedTransaction] = useState<TxResponse<Payment>['result']>()
  
  useEffect(() => {
    if(selectedTransaction){
      // @ts-ignore
      window[selectedTransaction.hash] && window[selectedTransaction.hash].showModal()
    }
  })

  if (isLoading) return <>Loading...</>;

  if (!transactions) {
    return <>{error}</>;
  }

  const filterPathPayment = (tx: AccountTxTransaction) => tx.tx?.TransactionType === 'Payment' && tx.tx?.Paths && (tx.meta as TransactionMetadata).TransactionResult === 'tesSUCCESS'
  return (
    <div className="overflow-x-auto">
      <table className="table">
        {/* head */}
        <thead>
          <tr>
            <th>Date</th>
            <th>Transaction Type</th>
            <th>Changes</th>
            <th>Modal</th>
          </tr>
        </thead>
        <tbody>
          {transactions.filter(filterPathPayment).map((tx) => {
            const data: TxResponse<Payment>['result'] = {
              hash: tx.tx!.hash!,
              ledger_index: tx.ledger_index,
              meta: tx.meta,
              validated: tx.validated,
              ...tx.tx as Payment & ResponseOnlyTxInfo
            }
            const sender = data.Account;
            const senderCurrency = parseCurrencyName(data.SendMax!);
            const senderIssuer = parseCurrencyIssuer(data.SendMax!);
            const senderBalanceChanges = getAccountBalanceChangesAmount(
              sender,
              senderIssuer,
              senderCurrency,
              data
            );
            const receiver = data.Destination;
            const receiverCurrency = parseCurrencyName(data.Amount!);
            const receiverIssuer = parseCurrencyIssuer(data.Amount!);
            const receiverBalanceChanges = getAccountBalanceChangesAmount(
              receiver,
              receiverIssuer,
              receiverCurrency,
              data
            );

            const senderChange = BigNumber(senderBalanceChanges.change)
            const receiverChange = BigNumber(receiverBalanceChanges.change)
            const balanceChange = BigNumber(senderBalanceChanges.change).plus(receiverChange)
            return (
              <tr key={tx.tx!.hash} className={balanceChange.toNumber()>= 1 ?`bg-green-200`:''}>
                <td>{ rippleTimeToISOTime(data.date!).split(".")[0].replace("T",' ')}</td>
                <td>{data.TransactionType}</td>
                <td >
                  <div>
                    {senderChange.toFixed(3).replace("-",'') + ' -> ' + receiverChange.toFixed(3)}
                  </div>
                  {balanceChange.toFixed(3)}
                </td>
                <td><button className="btn" onClick={() => {
                  setSelectedTransaction(data)
                }
                }>open modal</button></td>

              </tr>)
          })}
        </tbody>
      </table>
      {selectedTransaction && <dialog id={selectedTransaction.hash} className="modal">
        <form method="dialog" className="modal-box w-[80%] max-w-none">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          <Path key={selectedTransaction.hash} data={selectedTransaction} isModal />
        </form>
      </dialog>
      }
    </div>
  )
}

"use client";
import useSWR from "swr/immutable";
import { useParams } from "next/navigation";
import { XrplClient } from "xrpl-client";
// @ts-ignore
import type { TxResponse } from "xrpl";
import { PathFlow } from "@/components/PathFlow";
import {
  getAccountBalanceChangesAmount,
  getAccountChanges,
  getOfferChangesAmount,
  parseCurrencyIssuer,
  parseCurrencyName,
} from "@/utils/xrpl";
import { data1,data2 } from "@/_data";


const fetcher = async (hash: string) => {
  const client = new XrplClient();
  const result = await client.send({
    command: "tx",
    transaction: hash,
  });
  client.close()
  return result as TxResponse["result"];
  // return Promise.resolve(data1)
};

export default function Hash() {
  const { hash } = useParams();
  const { data, isLoading, error } = useSWR<TxResponse["result"]>(
    hash,
    fetcher
  );

  if (isLoading) return <>Loading...</>;

  if (!data) {
    return <>{error}</>;
  }
  if (data.TransactionType !== "Payment") {
    return <>{data.TransactionType}</>;
  }

  const paths = data.Paths;
  if (!paths) {
    return <></>;
  }

  // 送信者
  // SendMax
  // ModifiedNode: AccountRoot/RippleState
  const sender = data.Account;
  const senderCurrency = parseCurrencyName(data.SendMax!);
  const senderIssuer = parseCurrencyIssuer(data.SendMax!);
  const senderBalanceChanges = getAccountBalanceChangesAmount(
    sender,
    senderIssuer,
    senderCurrency,
    data
  );
  // 受信者
  // deliver_amount
  // ModifiedNode: AccountRoot/RippleState
  const receiver = data.Destination;
  const receiverCurrency = parseCurrencyName(data.Amount!);
  const receiverIssuer = parseCurrencyIssuer(data.Amount!);
  const receiverBalanceChanges = getAccountBalanceChangesAmount(
    receiver,
    receiverIssuer,
    receiverCurrency,
    data
  );
  console.log({ senderBalanceChanges, receiverBalanceChanges });

  // 中間者
  // Offer
  // ModifiedNode/DeletedNode
  //
  console.log('offerChanges')
  const offerChanges = getOfferChangesAmount(data);
  console.log(offerChanges);
  console.log('accountChanges')
  const accountChanges = getAccountChanges(data);
  console.log(JSON.stringify(accountChanges), null, 2);

  const source_amount = data.SendMax!;
  const destination_amount = data.Amount;
  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-4">
      <div className="mt-12" style={{ width: "100vw", height: "90vh" }}>
        <PathFlow
          path={{ source_amount, destination_amount, paths_computed: paths }}
          accountChanges={accountChanges}
          offerChanges={offerChanges}
        />
      </div>
      <pre className="max-w-[100vw] overflow-scroll">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </main>
  );
}

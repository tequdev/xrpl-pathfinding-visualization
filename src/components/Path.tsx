import { getAccountBalanceChangesAmount, getAccountChanges, getOfferChangesAmount, parseCurrencyIssuer, parseCurrencyName } from "@/utils/xrpl";
import { TransactionMetadata, TxResponse } from "xrpl";
import { PathFlow } from "./PathFlow";

type Props = {
  data: TxResponse["result"]
  isModal?: boolean
}

export default function Path({ data, isModal = false }: Props) {
  if (data.TransactionType !== "Payment") {
    return (
      <>
        <div>{data.TransactionType}</div>
        <p>Only Payment transactions are supported. </p>
      </>
    );
  }

  const paths = data.Paths;
  if (!paths || (data.meta as TransactionMetadata).TransactionResult !== "tesSUCCESS") {
    return (
      <>
        <p>
          Paths Field is not used or the transaction failed.
        </p>
      </>
    );
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
  // console.log({ senderBalanceChanges, receiverBalanceChanges });

  // 中間者
  // Offer
  // ModifiedNode/DeletedNode
  //
  // console.log('offerChanges')
  const offerChanges = getOfferChangesAmount(data);
  // console.log(offerChanges);
  // console.log('accountChanges')
  const accountChanges = getAccountChanges(data);
  // console.log(JSON.stringify(accountChanges), null, 2);

  const source_amount = data.SendMax!;
  const destination_amount = data.Amount;
  return (
    <main className={`flex ${isModal ? '' : 'min-h-[100vh] justify-between items-center'} flex-col  py-4`}>
      <div className={`${isModal ? '' : 'mt-12'}`} style={{ width: "100vh", height: "90vh" }}>
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

import { TransactionMetadata, TxResponse } from "xrpl";
import { PathFlow } from "./PathFlow";
import pathParser from 'xrpl-tx-path-parser'

type Props = {
  data: TxResponse["result"]
  isModal?: boolean
}

export default function Path({ data, isModal = false }: Props) {
  if (data.TransactionType !== "Payment" && data.TransactionType !== "OfferCreate") {
    return (
      <>
        <div>{data.TransactionType}</div>
        <p>Only Payment or OfferCreate transactions are supported. </p>
      </>
    );
  }

  if ((data.meta as TransactionMetadata).TransactionResult !== "tesSUCCESS") {
    return (
      <>
        <p>
          Transaction Failed.
        </p>
      </>
    );
  }
  
  
  const result = (() => {
    try {
      return pathParser(data)
    } catch (e) {
      return undefined
    }
  })()
  
  
  if (!result) {
    return (
      <>
        <p>
          Invalid Transaction.
        </p>
      </>
    );
  }
  
  return (
    <main className={`flex ${isModal ? 'items-center' : 'min-h-[100vh] justify-between items-center'} flex-col py-4`}>
      <div className={`${isModal ? '' : 'mt-12'}`} style={{ width: "100vh", height: "90vh" }}>
        <PathFlow
          sourceAccount={result.sourceAccount}
          destinationAccount={result.destinationAccount}
          sourceAmount={result.sourceAmount}
          destinationAmount={result.destinationAmount}
          paths={result.paths}
        />
      </div>
      <pre className="max-w-[100vw] overflow-scroll">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </main>
  );
}

"use client";
import useSWR from "swr/immutable";
import { useParams } from "next/navigation";
import { XrplClient } from "xrpl-client";
// @ts-ignore
import type { TxResponse } from "xrpl";
import { data1,data2 } from "@/_data";
import Path from "@/components/Path";


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
  
  return <Path data={data} />
}

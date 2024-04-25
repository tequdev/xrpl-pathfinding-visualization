import { FC, useEffect } from "react";
import { useCallback } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
} from "reactflow";
import { Balance, Currency } from "xrpl/dist/npm/models/common";

import {
  parseAccount,
  parseAmountValue,
  parseCurrencyName,
} from "@/utils/xrpl";

import "reactflow/dist/style.css";
import { PathFindPathOption } from "xrpl";
import BigNumber from "bignumber.js";

type PathNode = Node<{ label: string }>;
type PathEdge = Edge;

type OfferChange = {
  takerPaid: Balance;
  takerGot: Balance;
};
type AMMChange = {
  ammGot: Balance;
  ammPaid: Balance;
};
type AccountChange = {
  [key: string]: {
    is_amm: boolean;
    currency: string;
    issuer: string | null;
    previous: string;
    final: string;
    change: string;
  }[];
};

type Props = {
  path: PathFindPathOption;
  offerChanges: OfferChange[];
  accountChanges: AccountChange;
};

export const PathFlow: FC<Props> = ({ path, offerChanges, accountChanges }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<{ label: string }>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    let edges: PathEdge[] = [];
    const source = path.source_amount;
    const destination = path.destination_amount;
    const pathsColCount = path.paths_computed.length;
    const pathsRowCount = Math.max(
      ...path.paths_computed.map((path) => path.length)
    );
    const inputNode: PathNode = {
      id: "start",
      type: "input",
      position: { x: 200 * (pathsColCount - 1) * 0.5, y: 0 },
      data: {
        label:
          parseCurrencyName(source, { forDisp: true }) +
          "\n" +
          parseAmountValue(source),
      },
    };
    const outputNode: PathNode = {
      id: "end",
      type: "output",
      position: {
        x: 200 * (pathsColCount - 1) * 0.5,
        y: 100 * (pathsRowCount + 1),
      },
      data: {
        label:
          parseCurrencyName(destination!, { forDisp: true }) +
          "\n" +
          parseAmountValue(destination!),
      },
    };
    const middleNodes = path.paths_computed
      .map((computed, computedIndex, originalPath) => {
        let cur_currency: Currency =
          typeof source === "string" ? { currency: "XRP" } : source;
        return computed.map((step, stepIndex, originalSteps): PathNode => {
          const getId = (stepIdx: number) => computedIndex + "-" + stepIdx;
          const id = getId(stepIndex);
          const nextId = getId(stepIndex + 1);
          const isFirst = stepIndex === 0;
          const isLast = stepIndex === originalSteps.length - 1;
          let firstEdge: any = {};
          let edge: any = {};
          if (isFirst) {
            firstEdge = {
              id: id + "-first",
              source: "start",
              target: id,
            };
            edges = [...edges, { ...firstEdge }];
          }
          if (isLast) {
            edge = {
              id,
              source: id,
              target: "end",
            };
          } else {
            edge = {
              id,
              source: id,
              target: nextId,
              // label: "abc"
            };
          }
          if (!isFirst && !isLast) {
          }

          const label = (
            step: PathFindPathOption["paths_computed"][number][number]
          ) => {
            if (step.issuer || step.currency) {
              // type: 16(currency) or type: 32(issuer) or type: 48(issuer+currency)
              const compare = (a: any, b: any) =>
                (!a.issuer && !b.issuer || a.issuer === b.issuer) && a.currency === b.currency;
              const offer = offerChanges.find((offerChange) => {
                return (
                  compare(offerChange.takerPaid, cur_currency) &&
                  compare(offerChange.takerGot, step)
                );
              });
              const amm = (() => {
                const keys = Object.keys(accountChanges);
                const amm_accounts = keys.filter((key) => {
                  return accountChanges[key].find((change) => change.is_amm)
                })
                const account = amm_accounts.find((account) => {
                  return accountChanges[account].every((change) => {
                    return compare(change, step) || compare(change, cur_currency)
                  })
                })
                if (!account) return undefined
                const _ammGot = accountChanges[account].find((change) => compare(change, cur_currency))!
                const _ammPaid = accountChanges[account].find((change) => compare(change, step))!
                return {
                  ammGot: {
                    currency: _ammGot.currency,
                    issuer: _ammGot.issuer || undefined,
                    value: _ammGot.change,
                  },
                  ammPaid: {
                    currency: _ammPaid.currency,
                    issuer: _ammPaid.issuer || undefined,
                    value: _ammPaid.change,
                  },
                }
              })();

              const getEdgeLabel = (offer: OfferChange | undefined, amm: AMMChange | undefined) => {
                if (!offer && !amm) return { got: "0", paid: "0" }
                let nodeGotCurrencyName = ""
                let nodeGotValue = ""
                let nodePaidCurrencyName = ""
                let nodePaidValue = ""
                if (offer) {
                  {
                    const { currency, issuer, value } = offer.takerPaid
                    const currencyName = parseCurrencyName(
                      { currency, issuer } as Currency,
                      { forDisp: true }
                    );
                    nodeGotCurrencyName = currencyName
                    nodeGotValue = value
                  }
                  {
                    const { currency, issuer, value } = offer.takerGot
                    const currencyName = parseCurrencyName(
                      { currency, issuer } as Currency,
                      { forDisp: true }
                    );
                    nodePaidCurrencyName = currencyName
                    nodePaidValue = value
                  }
                }
                if (amm) {
                  {
                    const { currency, issuer, value } = amm.ammGot
                    const currencyName = parseCurrencyName(
                      { currency, issuer } as Currency,
                      { forDisp: true }
                    );
                    if (nodeGotCurrencyName !== "") {
                      if (nodeGotCurrencyName !== currencyName) throw new Error("currencyName is different")
                    } else {
                      nodeGotCurrencyName = currencyName
                    }
                    if (nodeGotValue === "") {
                      nodeGotValue = value
                    } else {
                      nodeGotValue = BigNumber(nodeGotValue).plus(value).toString()
                    }
                  }
                  {
                    const { currency, issuer, value } = amm.ammPaid
                    const currencyName = parseCurrencyName(
                      { currency, issuer } as Currency,
                      { forDisp: true }
                    );
                    if (nodePaidCurrencyName !== "") {
                      if (nodePaidCurrencyName !== currencyName) throw new Error("currencyName is different")
                    } else {
                      nodePaidCurrencyName = currencyName
                    }
                    if (nodePaidValue === "") {
                      nodePaidValue = value
                    } else {
                      nodePaidValue = BigNumber(nodePaidValue).plus(value).toString()
                    }
                  }
                }
                return {
                  got: `${nodeGotValue.replace("-", "")} ${nodeGotCurrencyName}`,
                  paid: `${nodePaidValue.replace("-", "")} ${nodePaidCurrencyName}`
                }
              };
              edges = edges.map((edge) => {
                if (edge.target !== id) return edge;
                edge.label = getEdgeLabel(offer, amm).got;
                return edge;
              });
              edge.label = getEdgeLabel(offer, amm).paid;

              const source = parseCurrencyName(cur_currency, { forDisp: true });
              const dest = parseCurrencyName(step as Currency, {
                forDisp: true,
              });
              return `${source}/${dest}`;
            }
            if (step.account) {
              // type: 1(account)(rippling)
              const currency = cur_currency.currency;
              if (accountChanges[step.account]) {
                const getChange = (
                  changes: AccountChange[string],
                  type: "plus" | "minus"
                ) => {
                  return changes.find((change) => {
                    return (
                      change.currency === currency &&
                      ((type === "plus" && !change.change.includes("-")) ||
                        (type === "minus" && change.change.includes("-")))
                    );
                  })!;
                };
                const changeMinus = getChange(
                  accountChanges[step.account],
                  "minus"
                );
                const changePlus = getChange(
                  accountChanges[step.account],
                  "plus"
                );

                const getEdgeLabel = (
                  _change: AccountChange[string][number]
                ) => {
                  const { change, currency, issuer } = _change;
                  const currencyName = parseCurrencyName(
                    { currency, issuer } as Currency,
                    { forDisp: true }
                  );
                  return `${change.replace("-", "")} ${currencyName}`;
                };
                if (edges.find((e) => e.target === id)?.label !== "0") {
                  edges = edges.map((edge) => {
                    if (edge.target !== id) return edge;
                    edge.label = getEdgeLabel(changePlus);
                    return edge;
                  });
                  edge.label = getEdgeLabel(changeMinus);
                } else {
                  edge.label = "0";
                }
              } else {
                edge.label = edges.find((e) => e.target === id)?.label || "0";
              }
              return parseAccount(step.account);
            }
            return parseCurrencyName(step as Currency, { forDisp: true });
          };
          const node = {
            id: computedIndex + "-" + stepIndex,
            position: {
              x: 200 * (computedIndex + 1 - 1),
              y: 100 * (stepIndex + 1),
            },
            data: {
              label: label(step),
            },
          };
          if (step.currency) {
            cur_currency = step as Currency;
          }
          edges = [...edges, { ...edge }];
          return node;
        });
      })
      .flatMap((path) => path);
    setNodes([inputNode, ...middleNodes, outputNode]);
    setEdges(edges);
  }, [
    accountChanges,
    offerChanges,
    path.destination_amount,
    path.paths_computed,
    path.source_amount,
    setEdges,
    setNodes,
  ]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      attributionPosition="bottom-right"
      fitView
    />
  );
};

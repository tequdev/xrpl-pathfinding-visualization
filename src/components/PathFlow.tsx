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
import { Balance } from "xrpl/dist/npm/models/common";

import {
  parseAccount,
  parseAmountValue,
  parseCurrencyName,
} from "@/utils/xrpl";

import "reactflow/dist/style.css";

type PathNode = Node<{ label: string | JSX.Element }>;
type PathEdge = Edge;

type Props = {
  sourceAccount: string,
  destinationAccount: string,
  sourceAmount: Balance,
  destinationAmount: Balance,
  paths: {
    from: Balance;
    to: Balance;
    rippling?: string,
    type: {
      offer: boolean;
      amm: boolean;
      rippling: boolean;
    };
  }[][]
};

export const PathFlow: FC<Props> = ({ sourceAccount, sourceAmount, destinationAccount, destinationAmount, paths }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<{ label: string | JSX.Element }>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    let edges: PathEdge[] = [];
    const pathsColCount = paths.length
    const pathsRowCount = Math.max(
      ...paths.map((path) => path.length)
    );
    const inputNode: PathNode = {
      id: "start",
      type: "input",
      position: { x: 200 * (pathsColCount - 1) * 0.5, y: 0 },
      data: {
        label: <div>{parseCurrencyName(sourceAmount!, { forDisp: true })}<br /><span >{parseAmountValue(sourceAmount!)}</span></div>
        
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
        label: <div>{parseCurrencyName(destinationAmount!, { forDisp: true })}<br /><span >{parseAmountValue(destinationAmount!)}</span></div>
      },
    };
    const middleNodes = paths
      .map((computed, computedIndex, originalPath) => {
        let cur_currency: Balance = sourceAmount;
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

          const getEdgeLabel = (balance: Balance) => `${balance.value.replace("-", "")} ${parseCurrencyName(balance, { forDisp: true })}`

          const label = (
          ) => {
            edges = edges.map((edge) => {
              if (edge.target !== id) return edge;
              edge.label = getEdgeLabel(step.from)
              return edge;
            });
            edge.label = getEdgeLabel(step.to);

            const source = parseCurrencyName(cur_currency, { forDisp: true });
            const dest = parseCurrencyName(step.to, { forDisp: true, });
            const additionalContext = (() => {
              const hasAMM = step.type.amm
              const hasOffer = step.type.offer
              if (hasAMM && hasOffer) return "AMM & Offer"
              if (hasAMM) return "AMM"
              if (hasOffer) return "Offer"
              return "　"
            })()
            if (step.type.amm || step.type.offer)
              return <div>{source}/{dest}<br /><span style={{ fontSize: '7pt' }}>{additionalContext}</span></div>;
            if (step.type.rippling)
              return <div>{parseAccount(step.rippling!)}<br /><span style={{ fontSize: '7pt' }}>Rippling</span></div>;
            return parseCurrencyName(step.to, { forDisp: true });
          };
          const node = {
            id: computedIndex + "-" + stepIndex,
            position: {
              x: 200 * (computedIndex + 1 - 1),
              y: 100 * (stepIndex + 1),
            },
            data: {
              label: label(),
            },
          };
          if (step.to) {
            cur_currency = step.to;
          }
          edges = [...edges, { ...edge }];
          return node;
        });
      })
      .flatMap((path) => path);
    setNodes([inputNode, ...middleNodes, outputNode]);
    setEdges(edges);
  }, [
    sourceAmount,
    destinationAmount,
    paths,
    setNodes,
    setEdges,
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

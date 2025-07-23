import { useState, useCallback } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
  Controls,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeId, setNodeId] = useState('');
  const [nodeLabel, setNodeLabel] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');
  const [isDirected, setIsDirected] = useState(true);
  const [sourceAlgoNode, setSourceAlgoNode] = useState('');
  const [algoResult, setAlgoResult] = useState('');
  const [highlightedEdges, setHighlightedEdges] = useState([]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const handleAddNode = () => {
    if (!nodeId || nodes.find((n) => n.id === nodeId)) return;
    const newNode = {
      id: nodeId,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: nodeLabel || nodeId },
      style: {
        borderRadius: '9999px',
        width: 80,
        height: 80,
        backgroundColor: '#2563eb',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        border: '2px solid white',
        cursor: 'pointer',
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setNodeId('');
    setNodeLabel('');
  };

  const handleAddEdge = () => {
    if (!edgeSource || !edgeTarget) return;
    const newEdge = {
      id: `${edgeSource}-${edgeTarget}`,
      source: edgeSource,
      target: edgeTarget,
      label: `w: ${edgeWeight}`,
      data: { weight: parseInt(edgeWeight) },
      animated: highlightedEdges.includes(`${edgeSource}-${edgeTarget}`),
      style: highlightedEdges.includes(`${edgeSource}-${edgeTarget}`) ? { stroke: 'red', strokeWidth: 2 } : {}
    };
    setEdges((prev) => {
      const updated = [...prev, newEdge];
      if (!isDirected) {
        updated.push({ ...newEdge, id: `${edgeTarget}-${edgeSource}`, source: edgeTarget, target: edgeSource });
      }
      return updated;
    });
    setEdgeSource('');
    setEdgeTarget('');
    setEdgeWeight('1');
  };

  const handleDeleteNode = () => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setNodeId('');
    setNodeLabel('');
  };

  const handleDeleteEdge = () => {
    setEdges((prev) =>
      prev.filter((edge) => !(edge.source === edgeSource && edge.target === edgeTarget))
    );
    setEdgeSource('');
    setEdgeTarget('');
  };

  const buildAdjList = () => {
    const adj = {};
    nodes.forEach((node) => (adj[node.id] = []));
    edges.forEach((edge) => {
      adj[edge.source].push({ node: edge.target, weight: edge.data?.weight || 1 });
    });
    return adj;
  };

  const dijkstra = () => {
    const adj = buildAdjList();
    const dist = {};
    const prev = {};
    nodes.forEach((node) => (dist[node.id] = Infinity));
    dist[sourceAlgoNode] = 0;
    const visited = new Set();

    while (visited.size < nodes.length) {
      let u = null;
      for (const node in dist) {
        if (!visited.has(node) && (u === null || dist[node] < dist[u])) u = node;
      }
      if (u === null) break;
      visited.add(u);
      for (const neighbor of adj[u]) {
        const alt = dist[u] + neighbor.weight;
        if (alt < dist[neighbor.node]) {
          dist[neighbor.node] = alt;
          prev[neighbor.node] = u;
        }
      }
    }
    const output = Object.entries(dist).map(([node, distance]) => `${node}: ${distance === Infinity ? '∞' : distance}`).join('\n');

    const pathEdges = [];
    for (const target in prev) {
      const source = prev[target];
      if (source) pathEdges.push(`${source}-${target}`);
    }

    setHighlightedEdges(pathEdges);
    setEdges((prev) => prev.map((edge) => ({
      ...edge,
      animated: pathEdges.includes(`${edge.source}-${edge.target}`),
      style: pathEdges.includes(`${edge.source}-${edge.target}`) ? { stroke: 'red', strokeWidth: 2 } : {}
    })));

    setAlgoResult(`Dijkstra Shortest Paths:\n${output}`);
  };

  const bfs = () => {
    const adj = buildAdjList();
    const visited = new Set();
    const queue = [sourceAlgoNode];
    const order = [];
    while (queue.length) {
      const curr = queue.shift();
      if (!visited.has(curr)) {
        visited.add(curr);
        order.push(curr);
        for (const neighbor of adj[curr]) {
          if (!visited.has(neighbor.node)) queue.push(neighbor.node);
        }
      }
    }
    setAlgoResult(`BFS Order: ${order.join(' → ')}`);
  };

  const dfs = () => {
    const adj = buildAdjList();
    const visited = new Set();
    const order = [];
    function dfsHelper(node) {
      if (!visited.has(node)) {
        visited.add(node);
        order.push(node);
        for (const neighbor of adj[node]) dfsHelper(neighbor.node);
      }
    }
    dfsHelper(sourceAlgoNode);
    setAlgoResult(`DFS Order: ${order.join(' → ')}`);
  };

  const bellmanFord = () => {
    const dist = {};
    nodes.forEach((node) => (dist[node.id] = Infinity));
    dist[sourceAlgoNode] = 0;
    for (let i = 0; i < nodes.length - 1; i++) {
      for (const edge of edges) {
        const { source, target } = edge;
        if (dist[source] + 1 < dist[target]) dist[target] = dist[source] + 1;
      }
    }
    for (const edge of edges) {
      const { source, target } = edge;
      if (dist[source] + 1 < dist[target]) {
        setAlgoResult('Negative weight cycle detected');
        return;
      }
    }
    const output = Object.entries(dist)
      .map(([node, distance]) => `${node}: ${distance === Infinity ? '∞' : distance}`)
      .join('\n');
    setAlgoResult(`Bellman-Ford Distances:\n${output}`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <div className="w-full md:w-96 min-w-[300px] max-h-[50vh] md:max-h-full overflow-y-auto bg-gray-100 p-4 flex flex-col gap-4 shadow-md">
        <h1 className="text-xl font-bold text-center text-gray-800">Graph Visualizer</h1>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isDirected} onChange={() => setIsDirected(!isDirected)} className="form-checkbox h-5 w-5 text-blue-600" />
          <span className="text-gray-700">Directed Graph</span>
        </label>

        {/* Node Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <input
              placeholder="Node ID"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-3 py-2"
            />
            <input
              placeholder="Node Label"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddNode}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded"
            >
              Add Node
            </button>
            <button
              onClick={handleDeleteNode}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
            >
              Delete Node
            </button>
          </div>

        </div>

        {/* Edge Controls */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex flex-col gap-1">
            <input
              placeholder="Source Node ID"
              value={edgeSource}
              onChange={(e) => setEdgeSource(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-3 py-2"
            />
            <input
              placeholder="Target Node ID"
              value={edgeTarget}
              onChange={(e) => setEdgeTarget(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-3 py-2"
            />
          </div>
          <input
            placeholder="Edge Weight"
            type="number"
            value={edgeWeight}
            onChange={(e) => setEdgeWeight(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-3 py-2"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAddEdge}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded"
            >
              Add Edge
            </button>
            <button
              onClick={handleDeleteEdge}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
            >
              Delete Edge
            </button>
          </div>
        </div>


        <div className="flex flex-col gap-2 mt-4">
          <input
            placeholder="Source for Algorithm"
            value={sourceAlgoNode}
            onChange={(e) => setSourceAlgoNode(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-3 py-2"
          />
          <div className="flex flex-col gap-2">
            <button onClick={bfs} className="btn bg-cyan-500">BFS</button>
            <button onClick={dfs} className="btn bg-cyan-500">DFS</button>
            <button onClick={dijkstra} className="btn bg-cyan-500">Dijkstra</button>
            <button onClick={bellmanFord} className="btn bg-cyan-500">Bellman-Ford</button>
          </div>
        </div>

        {algoResult && (
          <div className="bg-white border border-gray-300 rounded p-3 mt-2 text-sm whitespace-pre-wrap text-gray-800 shadow">
            <strong>Result:</strong>
            <pre>{algoResult}</pre>
          </div>
        )}
      </div>

      <div className="flex-grow h-[50vh] md:h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          panOnScroll={false}
          panOnDrag={true}
          preventScrolling={false}
        >
          <Background className="bg-gray-50" />
          <MiniMap
            nodeColor={() => '#3b82f6'}
            nodeStrokeColor={() => '#ffffff'}
            nodeBorderRadius={20}
            maskColor="rgba(243, 244, 246, 0.6)"
          />
          <Controls
            position="bottom-left"
            className="bg-white rounded-lg shadow-md p-1 text-black"
            showInteractive={true}
          />
        </ReactFlow>
      </div>
    </div >
  );
}

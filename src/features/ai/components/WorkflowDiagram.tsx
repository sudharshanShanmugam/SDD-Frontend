import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography, Chip, Paper, Button, CircularProgress } from '@mui/material';
import { Refresh, Fullscreen } from '@mui/icons-material';
import { motion } from 'framer-motion';
import WorkflowNode, { WorkflowNodeData, WorkflowNodeStatus } from './WorkflowNode';

const nodeTypes = { workflowNode: WorkflowNode };

export interface WorkflowStage {
  id: string;
  label: string;
  stage: string;
  status: WorkflowNodeStatus;
  description?: string;
  artifactCount?: number;
  confidence?: number;
  processingTime?: number;
  position: { x: number; y: number };
  dependencies?: string[];
}

const defaultStages: WorkflowStage[] = [
  {
    id: 'doc-ingest',
    label: 'Document Ingestion',
    stage: 'INPUT',
    status: 'pending',
    description: 'Parse and chunk uploaded documents',
    position: { x: 50, y: 200 },
  },
  {
    id: 'req-extract',
    label: 'Requirement Extraction',
    stage: 'ANALYSIS',
    status: 'pending',
    description: 'Extract functional and non-functional requirements',
    position: { x: 280, y: 200 },
    dependencies: ['doc-ingest'],
  },
  {
    id: 'epic-gen',
    label: 'Epic Generation',
    stage: 'PLANNING',
    status: 'pending',
    description: 'Group requirements into coherent epics',
    position: { x: 510, y: 120 },
    dependencies: ['req-extract'],
  },
  {
    id: 'story-gen',
    label: 'Story Generation',
    stage: 'PLANNING',
    status: 'pending',
    description: 'Decompose epics into atomic user stories',
    position: { x: 510, y: 280 },
    dependencies: ['req-extract'],
  },
  {
    id: 'epic-approval',
    label: 'Epic Approval',
    stage: 'REVIEW',
    status: 'pending',
    description: 'Human review and approval of epics',
    position: { x: 740, y: 120 },
    dependencies: ['epic-gen'],
  },
  {
    id: 'story-approval',
    label: 'Story Approval',
    stage: 'REVIEW',
    status: 'pending',
    description: 'Human review and approval of user stories',
    position: { x: 740, y: 280 },
    dependencies: ['story-gen'],
  },
  {
    id: 'sprint-plan',
    label: 'Sprint Planning',
    stage: 'SCHEDULING',
    status: 'pending',
    description: 'Organize approved stories into sprints',
    position: { x: 970, y: 200 },
    dependencies: ['epic-approval', 'story-approval'],
  },
  {
    id: 'task-decomp',
    label: 'Task Decomposition',
    stage: 'EXECUTION',
    status: 'pending',
    description: 'Break stories into development tasks',
    position: { x: 1200, y: 120 },
    dependencies: ['sprint-plan'],
  },
  {
    id: 'test-gen',
    label: 'Test Generation',
    stage: 'QA',
    status: 'pending',
    description: 'Generate test cases from acceptance criteria',
    position: { x: 1200, y: 280 },
    dependencies: ['sprint-plan'],
  },
  {
    id: 'release',
    label: 'Release Planning',
    stage: 'RELEASE',
    status: 'pending',
    description: 'Compile release notes and deployment plans',
    position: { x: 1430, y: 200 },
    dependencies: ['task-decomp', 'test-gen'],
  },
];

const statusToEdgeStyle = (sourceStatus: WorkflowNodeStatus): React.CSSProperties => {
  switch (sourceStatus) {
    case 'approved': return { stroke: '#10b981', strokeWidth: 2 };
    case 'active': return { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 3' };
    case 'failed': return { stroke: '#ef4444', strokeWidth: 2 };
    default: return { stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '4 4' };
  }
};

interface WorkflowDiagramProps {
  stages?: WorkflowStage[];
  onNodeClick?: (stage: WorkflowStage) => void;
  isLive?: boolean;
}

const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({
  stages = defaultStages,
  onNodeClick,
  isLive = false,
}) => {
  const buildGraph = useCallback(() => {
    const nodes: Node[] = stages.map((s) => ({
      id: s.id,
      type: 'workflowNode',
      position: s.position,
      data: {
        label: s.label,
        stage: s.stage,
        status: s.status,
        description: s.description,
        artifactCount: s.artifactCount,
        confidence: s.confidence,
        processingTime: s.processingTime,
        onClick: () => onNodeClick?.(s),
      } as WorkflowNodeData,
    }));

    const edges: Edge[] = [];
    stages.forEach((s) => {
      (s.dependencies || []).forEach((dep) => {
        const depStage = stages.find((st) => st.id === dep);
        const style = statusToEdgeStyle(depStage?.status || 'pending');
        edges.push({
          id: `${dep}-${s.id}`,
          source: dep,
          target: s.id,
          style,
          markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke as string },
          animated: depStage?.status === 'active',
        });
      });
    });

    return { nodes, edges };
  }, [stages, onNodeClick]);

  const { nodes: initialNodes, edges: initialEdges } = buildGraph();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [stages, buildGraph, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const activeCount = stages.filter((s) => s.status === 'active').length;
  const approvedCount = stages.filter((s) => s.status === 'approved').length;
  const pendingCount = stages.filter((s) => s.status === 'pending').length;

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            const status: WorkflowNodeStatus = n.data?.status || 'pending';
            return { pending: '#94a3b8', active: '#3b82f6', approved: '#10b981', failed: '#ef4444', skipped: '#94a3b8' }[status];
          }}
          style={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
        />

        <Panel position="top-left">
          <Paper
            elevation={2}
            sx={{ p: 1.5, borderRadius: 2, display: 'flex', gap: 1, flexWrap: 'wrap', bgcolor: 'background.paper' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isLive && <CircularProgress size={12} />}
              <Typography variant="caption" fontWeight={600}>
                {isLive ? 'Live' : 'Snapshot'}
              </Typography>
            </Box>
            <Chip label={`${activeCount} active`} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
            <Chip label={`${approvedCount} done`} size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
            <Chip label={`${pendingCount} pending`} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
          </Paper>
        </Panel>
      </ReactFlow>
    </Box>
  );
};

export default WorkflowDiagram;

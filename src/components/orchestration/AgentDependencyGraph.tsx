import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AgentType, AGENT_DEFINITIONS } from '@/types/agent';
import { cn } from '@/lib/utils';

interface AgentNode {
  type: AgentType;
  name: string;
  icon: string;
  x: number;
  y: number;
}

interface DependencyEdge {
  from: AgentType;
  to: AgentType;
  label: string;
}

// Define the dependency relationships between agents
const AGENT_DEPENDENCIES: DependencyEdge[] = [
  { from: 'research', to: 'preparation', label: 'context' },
  { from: 'research', to: 'documentation', label: 'data' },
  { from: 'preparation', to: 'communication', label: 'agenda' },
  { from: 'scheduling', to: 'communication', label: 'times' },
  { from: 'documentation', to: 'follow-up', label: 'notes' },
  { from: 'follow-up', to: 'communication', label: 'actions' },
];

interface AgentDependencyGraphProps {
  activeAgents?: AgentType[];
  highlightPath?: AgentType[];
  compact?: boolean;
}

export function AgentDependencyGraph({ 
  activeAgents = [], 
  highlightPath = [],
  compact = false 
}: AgentDependencyGraphProps) {
  // Position agents in a circular layout
  const nodes = useMemo((): AgentNode[] => {
    const centerX = compact ? 120 : 180;
    const centerY = compact ? 100 : 140;
    const radius = compact ? 70 : 110;
    
    return AGENT_DEFINITIONS.map((def, i) => {
      const angle = (i * 2 * Math.PI) / AGENT_DEFINITIONS.length - Math.PI / 2;
      return {
        type: def.type,
        name: def.name,
        icon: def.icon,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [compact]);

  const getNodePos = (type: AgentType) => {
    const node = nodes.find(n => n.type === type);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const isEdgeActive = (edge: DependencyEdge) => {
    return highlightPath.includes(edge.from) && highlightPath.includes(edge.to);
  };

  const isNodeActive = (type: AgentType) => {
    return activeAgents.includes(type) || highlightPath.includes(type);
  };

  const svgWidth = compact ? 240 : 360;
  const svgHeight = compact ? 200 : 280;

  return (
    <div className="relative">
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        className="w-full h-auto"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              className="fill-muted-foreground/50"
            />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              className="fill-primary"
            />
          </marker>
        </defs>

        {/* Edges */}
        {AGENT_DEPENDENCIES.map((edge, i) => {
          const from = getNodePos(edge.from);
          const to = getNodePos(edge.to);
          
          // Calculate control point for curved line
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const offset = 20;
          const controlX = midX - dy * offset / Math.sqrt(dx * dx + dy * dy);
          const controlY = midY + dx * offset / Math.sqrt(dx * dx + dy * dy);
          
          // Shorten the line to not overlap with nodes
          const nodeRadius = compact ? 16 : 22;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const startX = from.x + (dx / dist) * nodeRadius;
          const startY = from.y + (dy / dist) * nodeRadius;
          const endX = to.x - (dx / dist) * nodeRadius;
          const endY = to.y - (dy / dist) * nodeRadius;

          const active = isEdgeActive(edge);

          return (
            <g key={i}>
              <motion.path
                d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                fill="none"
                strokeWidth={active ? 2 : 1}
                markerEnd={active ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                className={cn(
                  "transition-all duration-300",
                  active ? "stroke-primary" : "stroke-muted-foreground/30"
                )}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
              {/* Edge label */}
              {!compact && (
                <text
                  x={controlX}
                  y={controlY - 5}
                  textAnchor="middle"
                  className={cn(
                    "text-[8px] fill-muted-foreground/60",
                    active && "fill-primary font-medium"
                  )}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const active = isNodeActive(node.type);
          const working = activeAgents.includes(node.type);
          const nodeRadius = compact ? 16 : 22;

          return (
            <motion.g
              key={node.type}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: "spring" }}
            >
              {/* Node background */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                className={cn(
                  "transition-all duration-300",
                  active 
                    ? "fill-primary/20 stroke-primary stroke-2" 
                    : "fill-muted stroke-border stroke-1",
                  working && "animate-pulse"
                )}
              />
              
              {/* Pulse animation for working agents */}
              {working && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth={2}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              {/* Icon */}
              <text
                x={node.x}
                y={node.y + (compact ? 4 : 5)}
                textAnchor="middle"
                className={cn(
                  "pointer-events-none",
                  compact ? "text-sm" : "text-base"
                )}
              >
                {node.icon}
              </text>

              {/* Label */}
              {!compact && (
                <text
                  x={node.x}
                  y={node.y + nodeRadius + 12}
                  textAnchor="middle"
                  className={cn(
                    "text-[9px] fill-muted-foreground",
                    active && "fill-foreground font-medium"
                  )}
                >
                  {node.name.replace(' Agent', '')}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Legend */}
      {!compact && (
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-muted border border-border" />
            <span>Idle</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/20 border-2 border-primary" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-px bg-muted-foreground/30" />
            <span>Handoff</span>
          </div>
        </div>
      )}
    </div>
  );
}

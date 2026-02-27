import { useEffect, useState } from 'react';
import { Cluster, ClusterThought } from '@/hooks/useClusters';
import { ZenStone } from './ZenStone';
import { anchorPosition, scatterPosition } from './zenPlacement';

import anchorImg1 from '@/assets/zen/stone-anchor-1.png';
import anchorImg2 from '@/assets/zen/stone-anchor-2.png';
import plantAnchor1 from '@/assets/zen/plant-1.png';
import plantAnchor2 from '@/assets/zen/plant-2.png';

const ANCHOR_IMAGES = [anchorImg1, plantAnchor1, anchorImg2, plantAnchor2];

interface ZenClusterGroupProps {
  cluster: Cluster;
  clusterIndex: number;
  fetchThoughts: (clusterId: string) => Promise<ClusterThought[]>;
  visible: boolean;
}

export function ZenClusterGroup({ cluster, clusterIndex, fetchThoughts, visible }: ZenClusterGroupProps) {
  const [thoughts, setThoughts] = useState<ClusterThought[]>([]);
  const anchor = anchorPosition(cluster.id, clusterIndex);

  useEffect(() => {
    if (visible) {
      fetchThoughts(cluster.id).then(setThoughts);
    }
  }, [cluster.id, visible, fetchThoughts]);

  const visibleThoughts = thoughts.slice(0, 5);
  const anchorImg = ANCHOR_IMAGES[clusterIndex % ANCHOR_IMAGES.length];

  return (
    <div
      className={`zen-cluster-group absolute inset-0 transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Child stones */}
      {visibleThoughts.map((thought, i) => {
        const pos = scatterPosition(thought.id, anchor, i);
        return (
          <div
            key={thought.id}
            className="absolute zen-stone-enter"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(${pos.scale})`,
              animationDelay: `${0.3 + i * 0.15}s`,
            }}
          >
            <ZenStone
              thought={{
                id: thought.id,
                content: thought.content,
                createdAt: thought.createdAt,
                aiTheme: thought.aiTheme,
                archived: false,
                composted: false,
              }}
              index={i}
              clusterSize={1}
            />
          </div>
        );
      })}

      {/* Cluster anchor stone — larger, sumi-e image */}
      <div
        className="absolute zen-stone-enter"
        style={{
          left: `${anchor.x}%`,
          top: `${anchor.y}%`,
          transform: `translate(-50%, -50%) rotate(${anchor.rotation}deg) scale(${anchor.scale})`,
          zIndex: 10,
        }}
      >
        <div className="zen-anchor-wrapper relative flex items-center justify-center cursor-default select-none"
          style={{ width: '160px', height: '120px' }}
        >
          <img
            src={anchorImg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-95"
            draggable={false}
          />
          <p className="zen-anchor-text relative z-10 text-center px-3 leading-snug">
            {cluster.title}
          </p>
          {cluster.thoughtCount != null && cluster.thoughtCount > 0 && (
            <span className="zen-anchor-count absolute -bottom-5 text-[10px] tracking-widest opacity-50 z-10">
              {cluster.thoughtCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

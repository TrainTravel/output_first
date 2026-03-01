import { useEffect, useState } from 'react';
import { Cluster, ClusterThought } from '@/hooks/useClusters';
import { ZenStone } from './ZenStone';
import { anchorPosition, scatterPosition } from './zenPlacement';
import { lantern, WATER, BRIDGES } from './gardenTiers';

interface ZenClusterGroupProps {
  cluster: Cluster;
  clusterIndex: number;
  fetchThoughts: (clusterId: string) => Promise<ClusterThought[]>;
  visible: boolean;
  stonePool: string[];
  anchorPool: string[];
  activeClusterId: string | null;
  onClusterClick: (clusterId: string) => void;
}

export function ZenClusterGroup({
  cluster, clusterIndex, fetchThoughts, visible,
  stonePool, anchorPool, activeClusterId, onClusterClick,
}: ZenClusterGroupProps) {
  const [thoughts, setThoughts] = useState<ClusterThought[]>([]);
  const [loaded, setLoaded] = useState(false);
  const anchor = anchorPosition(cluster.id, clusterIndex);

  const isActive = activeClusterId === cluster.id;

  useEffect(() => {
    if (visible && !loaded) {
      fetchThoughts(cluster.id).then(t => { setThoughts(t); setLoaded(true); });
    }
  }, [cluster.id, visible, fetchThoughts, loaded]);

  const visibleThoughts = thoughts.slice(0, 5);
  const anchorImg = anchorPool[clusterIndex % anchorPool.length];
  const isLantern = anchorImg === lantern;
  const isWater = WATER.includes(anchorImg);
  const isBridge = BRIDGES.includes(anchorImg);
  const isTall = isLantern || isWater;

  return (
    <div
      className={`zen-cluster-group absolute inset-0 transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Child stones — only show when this cluster is active */}
      {isActive && visibleThoughts.map((thought, i) => {
        const pos = scatterPosition(thought.id, anchor, i);
        return (
          <div
            key={thought.id}
            className="absolute zen-thought-reveal"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(${pos.scale})`,
              animationDelay: `${i * 0.1}s`,
              zIndex: 5,
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
              elementPool={stonePool}
            />
          </div>
        );
      })}

      {/* Ripple effect when active */}
      {isActive && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${anchor.x}%`,
            top: `${anchor.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 8,
          }}
        >
          <div className="zen-ripple absolute w-40 h-40 -ml-20 -mt-20" />
          <div className="zen-ripple absolute w-40 h-40 -ml-20 -mt-20" style={{ animationDelay: '0.8s' }} />
        </div>
      )}

      {/* Cluster anchor — clickable */}
      <div
        className="absolute zen-stone-enter"
        style={{
          left: `${anchor.x}%`,
          top: `${anchor.y}%`,
          transform: `translate(-50%, -50%) rotate(${anchor.rotation}deg) scale(${anchor.scale})`,
          zIndex: 10,
        }}
      >
        <div
          className={`zen-anchor-wrapper relative flex items-center justify-center select-none ${isActive ? 'zen-active' : ''}`}
          style={{
            width: isTall ? '120px' : isBridge ? '180px' : '160px',
            height: isTall ? '160px' : isBridge ? '100px' : '120px',
          }}
          onClick={(e) => { e.stopPropagation(); onClusterClick(cluster.id); }}
          role="button"
          tabIndex={0}
          aria-label={`${cluster.title} — ${cluster.thoughtCount ?? 0} thoughts`}
          onKeyDown={(e) => { if (e.key === 'Enter') onClusterClick(cluster.id); }}
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

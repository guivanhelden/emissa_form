import React, { useEffect } from 'react';
import { useSafeDomOperations } from '../../hooks/useSafeDomOperations';

interface SafeDomWrapperProps {
  children: React.ReactNode;
  id: string;
}

export function SafeDomWrapper({ children, id }: SafeDomWrapperProps) {
  const { registerNode } = useSafeDomOperations();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (wrapperRef.current) {
      registerNode(id, wrapperRef.current);
    }
  }, [id, registerNode]);
  
  return <div ref={wrapperRef}>{children}</div>;
}

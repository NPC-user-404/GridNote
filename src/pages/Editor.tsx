import React from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { EditorSidebar } from '@/components/layout/EditorSidebar';
import { Canvas } from '@/components/canvas/Canvas';
import { useDocumentStore } from '@/store/documentStore';

const Editor = () => {
  const mode = useDocumentStore((s) => s.mode);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar />
        <Canvas />
      </div>
    </div>
  );
};

export default Editor;

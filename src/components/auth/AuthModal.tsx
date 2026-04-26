import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AuthForm } from './AuthForm';

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [isLoginView, setIsLoginView] = useState(true);
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{isLoginView ? 'Login' : 'Sign Up'}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <AuthForm 
          initialIsLogin={isLoginView} 
          onSuccess={onClose} 
          onToggleMode={setIsLoginView} 
          hideHeader={true} 
        />
      </div>
    </div>,
    document.body
  );
}

import React from 'react';
import { FileText, ArrowRight, Sparkles, Layout, Zap, Lock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Layout className="h-4 w-4" />,
      title: 'Canvas Workspace',
      description: 'Flexible, infinite canvas for your ideas.',
      hoverTint: 'hover:bg-blue-500/5',
      hoverBorder: 'hover:border-blue-500/20',
      hoverIcon: 'group-hover:bg-blue-500/20 group-hover:text-blue-500'
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: 'Rich Cards',
      description: 'Text, code, images, links, tables, todos.',
      hoverTint: 'hover:bg-purple-500/5',
      hoverBorder: 'hover:border-purple-500/20',
      hoverIcon: 'group-hover:bg-purple-500/20 group-hover:text-purple-500'
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: 'Lightning Fast',
      description: 'Instant sync and real-time collaboration.',
      hoverTint: 'hover:bg-amber-500/5',
      hoverBorder: 'hover:border-amber-500/20',
      hoverIcon: 'group-hover:bg-amber-500/20 group-hover:text-amber-500'
    },
    {
      icon: <Lock className="h-4 w-4" />,
      title: 'Secure & Private',
      description: 'Your data stays yours, encrypted.',
      hoverTint: 'hover:bg-emerald-500/5',
      hoverBorder: 'hover:border-emerald-500/20',
      hoverIcon: 'group-hover:bg-emerald-500/20 group-hover:text-emerald-500'
    }
  ];

  const benefits = [
    { icon: <Check className="h-3 w-3" />, text: 'No credit card' },
    { icon: <Check className="h-3 w-3" />, text: 'Free forever' },
    { icon: <Check className="h-3 w-3" />, text: 'Works offline' },
    { icon: <Check className="h-3 w-3" />, text: 'Export to PDF' }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-canvas via-background to-muted/20 flex flex-col relative overflow-hidden">
      {/* Subtle Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(to right, currentColor 1px, transparent 1px),
          linear-gradient(to bottom, currentColor 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px'
      }} />

      <div className="container mx-auto px-4 flex-1 flex flex-col justify-center relative z-10">
        {/* Header - Centered */}
        <div className="flex flex-col items-center text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 shadow-sm animate-[float_3s_ease-in-out_infinite]">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-2">
            Welcome to{' '}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              GridNote
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground/80 max-w-xl leading-relaxed">
            A flexible, canvas-based workspace for your ideas.
          </p>
        </div>

        {/* Split Layout */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center max-w-5xl mx-auto w-full">
          {/* Left Side - Features (Vertical Stack) */}
          <div className="flex-1 w-full max-w-xs space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group rounded-lg border border-border/30 bg-card/40 backdrop-blur-sm p-4 shadow-sm transition-all duration-300 hover:shadow-md ${feature.hoverTint} ${feature.hoverBorder}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 ${feature.hoverIcon}`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground/90 mb-1 group-hover:text-foreground transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground/60 leading-tight group-hover:text-muted-foreground/80 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - CTA Box */}
          <div className="w-full max-w-sm">
            <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-lg shadow-primary/5">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/entry')}
                  className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  Get Started Free
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate('/entry')}
                  className="w-full rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm px-5 py-3 text-sm font-medium text-foreground/90 hover:bg-muted hover:text-foreground hover:scale-[1.01] transition-all duration-300"
                >
                  I Already Have an Account
                </button>
              </div>

              {/* Benefits - Compact Micro-Section with Badges */}
              <div className="mt-5 pt-4 border-t border-border/50">
                <div className="flex flex-wrap justify-center gap-2">
                  {benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground/80 border border-border/30 hover:bg-muted/70 hover:text-muted-foreground transition-colors duration-200"
                    >
                      <span className="text-primary/80">{benefit.icon}</span>
                      {benefit.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground/60 mt-6">
          Built with care for creators, thinkers, and doers.
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

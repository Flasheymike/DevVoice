import { motion } from "framer-motion";
import { type Plan, type IntentType } from "@shared/schema";
import { AlertTriangle, ShieldCheck, ShieldAlert, Check, X, Terminal, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlanCardProps {
  plan: Plan;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}

const RiskBadge = ({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) => {
  const colors = {
    LOW: "bg-green-500/10 text-green-500 border-green-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  
  const icons = {
    LOW: ShieldCheck,
    MEDIUM: AlertTriangle,
    HIGH: ShieldAlert,
  };

  const Icon = icons[level];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${colors[level]}`}>
      <Icon className="w-3.5 h-3.5" />
      {level} Risk
    </div>
  );
};

const IntentIcon = ({ type }: { type: string }) => {
  // Map simplified icons for visual flair
  return (
    <div className="p-2 rounded-lg bg-primary/10 text-primary">
      <Terminal className="w-5 h-5" />
    </div>
  );
};

export function PlanCard({ plan, onConfirm, onCancel, isExecuting }: PlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto mt-8"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-secondary/30 backdrop-blur-sm flex justify-between items-start gap-4">
          <div className="flex gap-4">
            <IntentIcon type={plan.intent.intent_type} />
            <div>
              <h3 className="text-xl font-bold text-foreground leading-tight">
                {plan.summary}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                ID: {plan.plan_id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <RiskBadge level={plan.intent.risk_level} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Execution Plan
            </div>
            <div className="space-y-2">
              {plan.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start group">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-mono group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed py-0.5">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {plan.intent.risk_level === "HIGH" && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">High Risk Action</p>
                <p className="text-xs text-destructive/80">
                  This action involves significant changes or deletions. Please review carefully.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-secondary/20 flex items-center justify-end gap-3 border-t border-border/50">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            disabled={isExecuting}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isExecuting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 min-w-[140px]"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                Confirm & Run
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
        
        {/* Progress Bar for loader */}
        {isExecuting && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

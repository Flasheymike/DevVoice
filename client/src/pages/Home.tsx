import { useState, useRef, useEffect } from "react";
import { usePlan, useExecute } from "@/hooks/use-assistant";
import { useSpeech } from "@/hooks/use-speech";
import { VoiceInput } from "@/components/VoiceInput";
import { PlanCard } from "@/components/PlanCard";
import { ExecutionResult } from "@/components/ExecutionResult";
import { type Plan, type ExecuteResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Sparkles, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecuteResponse | null>(null);
  const { toast } = useToast();
  
  const createPlan = usePlan();
  const executePlan = useExecute();
  const { speak } = useSpeech();

  const handlePlanRequest = (text: string) => {
    // Reset states
    setCurrentPlan(null);
    setExecutionResult(null);

    createPlan.mutate(
      { text },
      {
        onSuccess: (data) => {
          if (data.success && 'plan' in data) {
            setCurrentPlan(data.plan);
            speak(data.plan.summary);
          } else {
            toast({
              title: "Planning Failed",
              description: 'error' in data ? data.error : "Could not generate a plan.",
              variant: "destructive",
            });
            speak("I couldn't create a plan for that request.");
          }
        },
        onError: (err) => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
          speak("Sorry, something went wrong.");
        },
      }
    );
  };

  const handleConfirm = () => {
    if (!currentPlan) return;

    executePlan.mutate(
      {
        plan_id: currentPlan.plan_id,
        confirmation_token: currentPlan.confirmation_token,
      },
      {
        onSuccess: (data) => {
          setExecutionResult(data);
          setCurrentPlan(null); // Hide plan card
          
          if (data.success) {
            speak("Execution complete.");
          } else {
            speak("There was an error during execution.");
          }
        },
        onError: (err) => {
          toast({
            title: "Execution Error",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCancel = () => {
    setCurrentPlan(null);
    setExecutionResult(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-[#050505] text-foreground p-4 md:p-8 flex flex-col">
      
      {/* Header */}
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">DevVoice</h1>
            <p className="text-xs text-muted-foreground">AI Command Interface</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
          SYSTEM ONLINE
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full flex flex-col items-center justify-start pt-10 pb-20 relative">
        
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full z-10 space-y-8">
          
          {/* Hero Text (only show when no active state) */}
          {!currentPlan && !executionResult && !createPlan.isPending && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4 mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                How can I assist you?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Speak or type naturally to manage files, run tests, or analyze code.
              </p>
            </motion.div>
          )}

          {/* Voice/Text Input */}
          <div className="sticky top-4 z-50">
            <VoiceInput 
              onPlanRequest={handlePlanRequest} 
              isProcessing={createPlan.isPending} 
            />
          </div>

          {/* Status Indicators */}
          {createPlan.isPending && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full" />
                <Sparkles className="w-8 h-8 text-indigo-400 animate-spin-slow" />
              </div>
              <p className="text-lg font-medium text-indigo-300 animate-pulse">Analyzing request & formulating plan...</p>
            </motion.div>
          )}

          {/* Plan Card */}
          {currentPlan && (
            <PlanCard
              plan={currentPlan}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              isExecuting={executePlan.isPending}
            />
          )}

          {/* Execution Result */}
          {executionResult && (
            <ExecutionResult
              result={executionResult}
              onReset={handleCancel}
            />
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground/50 py-4">
        DevVoice Assistant v1.0 • Ready for Command
      </footer>
    </div>
  );
}

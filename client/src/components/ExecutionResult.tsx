import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Copy, Terminal } from "lucide-react";
import { type ExecuteResponse } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ExecutionResultProps {
  result: ExecuteResponse;
  onReset: () => void;
}

export function ExecutionResult({ result, onReset }: ExecutionResultProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = typeof result.result === 'string' 
      ? result.result 
      : JSON.stringify(result.result, null, 2);
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-3xl mx-auto mt-8"
    >
      <div className={`rounded-2xl border shadow-2xl overflow-hidden ${result.success ? 'border-green-500/20 bg-card' : 'border-red-500/20 bg-card'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${result.success ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
          <div className="flex items-center gap-3">
            {result.success ? (
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <XCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold">
                {result.success ? "Execution Successful" : "Execution Failed"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {result.message || (result.success ? "Task completed without errors." : "An error occurred during execution.")}
              </p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={onReset}>
            New Task
          </Button>
        </div>

        {/* Output */}
        <div className="relative group">
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-[300px] w-full bg-[#0d1117] p-4 font-mono text-sm">
            <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs uppercase tracking-wider select-none">
              <Terminal className="w-3 h-3" />
              Output Log
            </div>
            
            {result.error && (
              <div className="text-red-400 mb-4 pb-4 border-b border-white/10">
                Error: {result.error}
              </div>
            )}
            
            <pre className="text-gray-300 whitespace-pre-wrap break-all">
              {typeof result.result === 'object' 
                ? JSON.stringify(result.result, null, 2) 
                : String(result.result)}
            </pre>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
}

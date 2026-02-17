import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeech } from "@/hooks/use-speech";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface VoiceInputProps {
  onPlanRequest: (text: string) => void;
  isProcessing: boolean;
}

export function VoiceInput({ onPlanRequest, isProcessing }: VoiceInputProps) {
  const { isListening, transcript, startListening, stopListening, isSupported, setTranscript } = useSpeech();
  const [localText, setLocalText] = useState("");

  // Sync transcript to local text when listening updates it
  useEffect(() => {
    if (transcript) {
      setLocalText(transcript);
    }
  }, [transcript]);

  const handleSubmit = () => {
    if (!localText.trim()) return;
    onPlanRequest(localText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
        <div className="relative bg-card rounded-xl border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row p-1 gap-2">
          
          <div className="flex-1 min-h-[120px] md:min-h-[80px]">
             <Textarea
              value={localText}
              onChange={(e) => {
                setLocalText(e.target.value);
                setTranscript(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Describe what you want to do (e.g., 'Check for security vulnerabilities in package.json')..."}
              className="w-full h-full border-0 focus-visible:ring-0 bg-transparent text-lg resize-none p-4 placeholder:text-muted-foreground/50 font-medium"
              disabled={isProcessing}
            />
          </div>

          <div className="flex md:flex-col gap-2 p-2 border-t md:border-t-0 md:border-l border-white/5 items-center justify-center bg-black/20">
            {isSupported && (
              <Button
                size="icon"
                variant={isListening ? "destructive" : "secondary"}
                onClick={isListening ? stopListening : startListening}
                className={`h-12 w-12 rounded-full transition-all duration-300 ${isListening ? 'animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'hover:bg-primary/20'}`}
                disabled={isProcessing}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}

            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!localText.trim() || isProcessing}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-purple-900/20"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center gap-1"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{
                  height: [10, 24, 10],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
                className="w-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

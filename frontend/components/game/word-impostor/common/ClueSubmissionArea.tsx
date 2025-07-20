'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface ClueSubmissionAreaProps {
    isMyTurn: boolean;
    onClueSubmit: (clue: string) => void;
}

export function ClueSubmissionArea({
    isMyTurn,
    onClueSubmit,
}: ClueSubmissionAreaProps) {
    const [clue, setClue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isMyTurn && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isMyTurn]);

    const hasMultipleWords = clue.trim().includes(' ');

    const handleSubmitClue = () => {
        const trimmed = clue.trim();
        if (!trimmed) {
            toast.error('Clue cannot be empty');
            return;
        }
        if (trimmed.includes(' ')) {
            toast.error('Only one word is allowed per clue');
            return;
        }

        setIsSubmitting(true);
        onClueSubmit(trimmed);
        setClue('');
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-4">
            <motion.div
                className={cn(
                    "flex flex-col sm:flex-row gap-3 p-4 rounded-lg shadow-sm transition-all duration-300",
                    isMyTurn
                        ? "bg-primary/10 border-2 border-primary/30"
                        : "bg-muted/30 border border-muted-foreground/20"
                )}
            >
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Input
                        ref={inputRef}
                        placeholder={isMyTurn ? "Enter your one-word clue..." : "Waiting for your turn..."}
                        value={clue}
                        onChange={(e) => setClue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && isMyTurn && handleSubmitClue()}
                        className={cn(
                            "flex-grow p-3 h-auto text-sm rounded-md transition-all duration-300",
                            isMyTurn && "ring-2 ring-primary/50 shadow-sm bg-card",
                            !isMyTurn && "bg-muted/50 text-muted-foreground"
                        )}
                        disabled={!isMyTurn}
                    />
                    <Button
                        onClick={handleSubmitClue}
                        className={cn(
                            "px-6 py-3 text-sm rounded-md shadow-sm h-auto w-full sm:w-auto transition-all duration-300",
                            isSubmitting && "opacity-80",
                            hasMultipleWords && "opacity-60"
                        )}
                        disabled={!isMyTurn || isSubmitting}
                    >
                        <motion.div
                            className="flex items-center gap-2"
                            animate={{
                                scale: isSubmitting ? 0.95 : 1,
                                opacity: isSubmitting ? 0.8 : 1
                            }}
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? "Submitting..." : "Submit Clue"}
                        </motion.div>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
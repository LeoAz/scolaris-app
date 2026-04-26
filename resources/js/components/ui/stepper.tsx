import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepperProps {
    steps: { label?: string }[];
    current: number; // 1-indexed
    className?: string;
}

/**
 * Horizontal stepper using framer-motion for smooth transitions.
 * - Aligns to full width to match the Card container.
 * - Smoothly animates colors and the progress bar.
 */
export function Stepper({ steps, current, className }: StepperProps) {
    const total = steps.length;

    return (
        <div
            className={cn('flex w-full items-center justify-between', className)}
            aria-label="progression du formulaire"
        >
            {steps.map((step, idx) => {
                const stepNumber = idx + 1;
                const isDone = stepNumber < current;
                const isCurrent = stepNumber === current;
                const isLast = idx === total - 1;

                return (
                    <React.Fragment key={stepNumber}>
                        <div className="flex flex-col items-center gap-2">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isDone || isCurrent ? 'var(--color-primary)' : 'var(--color-background)',
                                    borderColor: isDone || isCurrent ? 'var(--color-primary)' : 'var(--color-muted)',
                                    color: isDone || isCurrent ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
                                }}
                                transition={{ duration: 0.3 }}
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium z-10 shadow-sm'
                                )}
                                aria-current={isCurrent ? 'step' : undefined}
                                aria-label={`Étape ${stepNumber}${isDone ? ' terminée' : isCurrent ? ' en cours' : ''}`}
                            >
                                {isDone ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        <CheckCircle2 className="h-6 w-6" />
                                    </motion.div>
                                ) : (
                                    stepNumber
                                )}
                            </motion.div>
                            {step.label && (
                                <motion.span
                                    animate={{
                                        color: isDone || isCurrent ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                                        fontWeight: isCurrent ? 600 : 400
                                    }}
                                    className="text-xs absolute translate-y-12 whitespace-nowrap hidden sm:block"
                                >
                                    {step.label}
                                </motion.span>
                            )}
                        </div>

                        {!isLast && (
                            <div className="relative flex-1 mx-2 h-1 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        width: isDone ? '100%' : '0%',
                                    }}
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default Stepper;

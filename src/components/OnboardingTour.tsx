import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Calendar, Layers, GripVertical, Sparkles, CheckCircle, Zap, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  title: string;
  description: string;
  icon: typeof Calendar;
  color: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to Dayflow! 🎉',
    description: 'Your modern calendar for seamless scheduling. Let us show you around!',
    icon: Sparkles,
    color: 'from-event-violet to-primary',
    position: 'center',
  },
  {
    title: 'Multiple Views',
    description: 'Switch between Month, Week, and Day views to see your schedule at different scales.',
    icon: Layers,
    color: 'from-event-coral to-event-rose',
    position: 'top-right',
  },
  {
    title: 'Drag & Drop',
    description: 'Easily reschedule events by dragging them to new dates or time slots.',
    icon: GripVertical,
    color: 'from-event-teal to-event-emerald',
    position: 'center',
  },
  {
    title: 'Quick Add Events',
    description: 'Click the "Add Event" button or click any date to quickly create new events.',
    icon: Calendar,
    color: 'from-event-amber to-event-coral',
    position: 'top-right',
  },
  {
    title: "You're All Set! ✨",
    description: 'Start scheduling your life with Dayflow. Enjoy the flow!',
    icon: CheckCircle,
    color: 'from-event-emerald to-event-teal',
    position: 'center',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none"
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border/50 p-8 max-w-md w-full mx-4 pointer-events-auto">
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary/80 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Icon */}
              <motion.div
                key={currentStep}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
                className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}
              >
                <Icon className="h-10 w-10 text-white" />
              </motion.div>

              {/* Content */}
              <motion.div
                key={`content-${currentStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                <h3 className={`text-2xl font-bold mb-3 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-lg">
                  {step.description}
                </p>
              </motion.div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-6">
                {tourSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{
                      scale: index === currentStep ? 1.2 : 1,
                      backgroundColor: index === currentStep 
                        ? 'hsl(var(--primary))' 
                        : index < currentStep 
                          ? 'hsl(var(--event-emerald))' 
                          : 'hsl(var(--muted))',
                    }}
                    className="h-2 w-2 rounded-full transition-colors"
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={isFirstStep}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip tour
                </Button>

                <Button
                  onClick={handleNext}
                  className={`gap-2 bg-gradient-to-r ${step.color} hover:opacity-90`}
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                  {!isLastStep && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

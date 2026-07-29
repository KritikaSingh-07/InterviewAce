import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
}

export default function StepIndicator({ currentStep, totalSteps, stepNames = [] }: StepIndicatorProps) {
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
        <span>
          Step <span className="text-indigo-600 dark:text-indigo-400">{currentStep}</span> of {totalSteps}
        </span>
        {stepNames[currentStep - 1] && (
          <span className="text-gray-900 dark:text-white font-semibold">
            {stepNames[currentStep - 1]}
          </span>
        )}
      </div>
      
      {/* Visual Dots / Line */}
      <div className="flex items-center justify-between gap-2 py-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={index} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-4 ring-indigo-500/20'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded transition-all duration-300 ${
                    stepNum < currentStep
                      ? 'bg-emerald-500'
                      : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

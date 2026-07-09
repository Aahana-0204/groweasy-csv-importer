import clsx from 'clsx';
import { Check } from 'lucide-react';
import { Step } from '@/types/crm';

const steps = [
  { id: 1, label: 'Upload CSV' },
  { id: 2, label: 'Preview' },
  { id: 3, label: 'Confirm' },
  { id: 4, label: 'Results' },
] as const;

export default function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="mx-auto mb-8 flex w-full max-w-2xl items-center justify-center">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex flex-1 items-center">
          <div className="flex flex-1 flex-col items-center">
            <div
              className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300',
                currentStep > step.id
                  ? 'border-green-500 bg-green-500 text-white'
                  : currentStep === step.id
                    ? 'border-green-500 bg-white text-green-600 shadow-lg shadow-green-500/20 dark:bg-gray-900 dark:text-green-400'
                    : 'border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800'
              )}
            >
              {currentStep > step.id ? <Check size={16} /> : step.id}
            </div>
            <span
              className={clsx(
                'mt-1 hidden text-xs font-medium sm:block',
                currentStep === step.id ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={clsx(
                'mx-1 h-0.5 flex-1 transition-all duration-500',
                currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

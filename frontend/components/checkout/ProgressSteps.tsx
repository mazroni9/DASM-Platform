"use client";

import { Check, FileSearch, CreditCard, Building2 } from "lucide-react";

interface ProgressStepsProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  {
    number: 1,
    label: "مراجعة الطلب",
    icon: FileSearch,
  },
  {
    number: 2,
    label: "دفع رسوم الخدمة",
    icon: CreditCard,
  },
  {
    number: 3,
    label: "تحويل سعر السيارة",
    icon: Building2,
  },
];

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="bg-white border-b border-slate-200 py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isUpcoming = currentStep < step.number;

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      isCompleted
                        ? "text-green-600"
                        : isCurrent
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        currentStep > step.number
                          ? "bg-green-500"
                          : "bg-slate-200"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

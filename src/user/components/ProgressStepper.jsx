import React from 'react';

export default function ProgressStepper({ currentStep, steps = [] }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            {/* Step Circle */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.completed
                ? 'bg-green-500 text-white'
                : index < currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step.completed ? '✓' : index + 1}
            </div>
            
            {/* Step Label */}
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                step.completed
                  ? 'text-green-600'
                  : index < currentStep
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}>
                {step.name}
              </p>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                step.completed ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Step {currentStep} of {steps.length} completed
        </p>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent } from '@intellect-kanban/ui';
import { InfoIcon } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  description?: string;
}

export function ErrorDisplay({ error, description }: ErrorDisplayProps) {
  return (
    <Card className="bg-red-50/50 border-red-200">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="bg-red-100 p-2 rounded-full">
            <InfoIcon className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-800">
              {error}
            </p>
            {description && (
              <p className="text-sm text-red-600 mt-1">
                {description}
              </p>
            )}
            {!description && (
              <p className="text-sm text-red-600 mt-1">
                Please try again later or contact support if the problem persists.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
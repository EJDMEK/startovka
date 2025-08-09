"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TemplatePreviewProps {
  htmlContent: string;
}

export function TemplatePreview({ htmlContent }: TemplatePreviewProps) {
  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle>Náhled šablony</CardTitle>
      </CardHeader>
      <CardContent className="h-[max(80vh,800px)] p-2 sm:p-6">
        {htmlContent ? (
          <iframe
            srcDoc={htmlContent}
            title="Template Preview"
            className="w-full h-full border rounded-md bg-white"
            sandbox="allow-same-origin"
          />
        ) : (
          <div className="w-full h-full border rounded-md bg-white p-4">
            <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
            <Skeleton className="h-[200px] w-full rounded-xl mb-4" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
                 <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-full" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

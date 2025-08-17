"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect, forwardRef } from "react";

interface TemplatePreviewProps {
  htmlContent: string;
}

export const TemplatePreview = forwardRef<HTMLIFrameElement, TemplatePreviewProps>(({ htmlContent }, ref) => {
  const internalRef = useRef<HTMLIFrameElement>(null);
  const combinedRef = (el: HTMLIFrameElement) => {
    (internalRef as React.MutableRefObject<HTMLIFrameElement | null>).current = el;
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      ref.current = el;
    }
  };


  useEffect(() => {
    const iframe = internalRef.current;
    if (iframe) {
      const handleLoad = () => {
        if (iframe.contentWindow) {
          const body = iframe.contentWindow.document.body;
          const html = iframe.contentWindow.document.documentElement;
          const height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
          );
          iframe.style.height = `${height}px`;
        }
      };
      // Manually trigger a load to set initial height, especially for srcDoc
      if (iframe.contentWindow?.document.readyState === 'complete') {
        handleLoad();
      }
      iframe.addEventListener('load', handleLoad);
      
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [htmlContent]);


  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle>Náhled šablony</CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {htmlContent ? (
          <iframe
            ref={combinedRef}
            srcDoc={htmlContent}
            title="Template Preview"
            className="w-full border rounded-md bg-white"
            sandbox="allow-same-origin"
            scrolling="no"
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
});

TemplatePreview.displayName = 'TemplatePreview';

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Copy, Check, ExternalLink, Code2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormEmbedProps {
  formId: string;
  formName: string;
  baseUrl?: string;
}

export function FormEmbed({ formId, formName, baseUrl }: FormEmbedProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [iframeHeight, setIframeHeight] = useState("600");
  const [iframeWidth, setIframeWidth] = useState("100%");

  // Determine base URL
  const siteUrl = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const formUrl = `${siteUrl}/form/${formId}`;

  // Generate embed codes
  const iframeCode = `<iframe
  src="${formUrl}"
  width="${iframeWidth}"
  height="${iframeHeight}"
  frameborder="0"
  style="border: none; max-width: 100%;"
  title="${formName}"
></iframe>`;

  const scriptCode = `<div id="convex-form-${formId}"></div>
<script>
  (function() {
    var container = document.getElementById('convex-form-${formId}');
    var iframe = document.createElement('iframe');
    iframe.src = '${formUrl}';
    iframe.width = '${iframeWidth}';
    iframe.height = '${iframeHeight}';
    iframe.frameBorder = '0';
    iframe.style.border = 'none';
    iframe.style.maxWidth = '100%';
    iframe.title = '${formName}';
    container.appendChild(iframe);
  })();
</script>`;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="iframe" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="iframe">
            <Code2 className="h-4 w-4 mr-2" />
            iFrame
          </TabsTrigger>
          <TabsTrigger value="script">
            <Code2 className="h-4 w-4 mr-2" />
            Script
          </TabsTrigger>
          <TabsTrigger value="link">
            <Link2 className="h-4 w-4 mr-2" />
            Direct Link
          </TabsTrigger>
        </TabsList>

        {/* iFrame Tab */}
        <TabsContent value="iframe" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input
                value={iframeWidth}
                onChange={(e) => setIframeWidth(e.target.value)}
                placeholder="100% or 500px"
              />
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <Input
                value={iframeHeight}
                onChange={(e) => setIframeHeight(e.target.value)}
                placeholder="600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Embed Code</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(iframeCode, "iframe")}
              >
                {copied === "iframe" ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Card className="p-4 bg-zinc-900 text-zinc-100">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all">
                <code>{iframeCode}</code>
              </pre>
            </Card>
          </div>

          <p className="text-sm text-zinc-500">
            Copy and paste this code into your website&apos;s HTML where you want the form to appear.
          </p>
        </TabsContent>

        {/* Script Tab */}
        <TabsContent value="script" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input
                value={iframeWidth}
                onChange={(e) => setIframeWidth(e.target.value)}
                placeholder="100% or 500px"
              />
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <Input
                value={iframeHeight}
                onChange={(e) => setIframeHeight(e.target.value)}
                placeholder="600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Script Embed Code</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(scriptCode, "script")}
              >
                {copied === "script" ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Card className="p-4 bg-zinc-900 text-zinc-100">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all">
                <code>{scriptCode}</code>
              </pre>
            </Card>
          </div>

          <p className="text-sm text-zinc-500">
            This script-based embed provides more flexibility and can be placed anywhere on your page.
          </p>
        </TabsContent>

        {/* Direct Link Tab */}
        <TabsContent value="link" className="space-y-4">
          <div className="space-y-2">
            <Label>Form URL</Label>
            <div className="flex gap-2">
              <Input value={formUrl} readOnly className="flex-1" />
              <Button
                variant="outline"
                onClick={() => handleCopy(formUrl, "link")}
              >
                {copied === "link" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(formUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-zinc-500">
            Share this link directly with your audience to access the form.
          </p>

          {/* QR Code placeholder */}
          <Card className="p-6 text-center">
            <div className="w-32 h-32 bg-zinc-100 rounded-lg mx-auto flex items-center justify-center">
              <span className="text-zinc-400 text-sm">QR Code</span>
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              QR code generation coming soon
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Preview</h4>
        <div className="border rounded-lg overflow-hidden bg-white">
          <iframe
            src={formUrl}
            width={iframeWidth}
            height={Math.min(parseInt(iframeHeight) || 400, 400)}
            style={{ border: "none", maxWidth: "100%" }}
            title={`${formName} Preview`}
          />
        </div>
      </Card>
    </div>
  );
}

export default FormEmbed;

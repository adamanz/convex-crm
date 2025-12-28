"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { CreateFAB } from "@/components/layout/create-fab";
import { SearchResultsModal } from "@/components/agent/SearchResultsModal";
import { AgentResultsProvider, useAgentResults } from "@/contexts/agent-results-context";
import { SearchResult } from "@/components/agent/SearchResultsModal";
import { ElevenLabsSetup } from "@/components/layout/elevenlabs-setup";

interface RootLayoutClientProps {
  children: React.ReactNode;
}

function RootLayoutClientContent({ children }: RootLayoutClientProps) {
  const router = useRouter();
  const { isOpen, results, isLoading, title, openResults, closeResults, setIsLoading } =
    useAgentResults();

  useEffect(() => {
    // Expose agent callback functions to window
    (window as any).crmAgent = {
      // Called by agent when search results are ready
      showSearchResults: (results: SearchResult[], searchTitle?: string) => {
        // Check if we have exactly one result - auto-navigate
        if (results.length === 1) {
          const result = results[0];
          const paths: Record<string, string> = {
            contact: `/contacts/${result.id}`,
            company: `/companies/${result.id}`,
            deal: `/deals/${result.id}`,
          };
          const path = paths[result.type];
          if (path) {
            router.push(path);
            return;
          }
        }

        // Multiple results or unknown type - show modal
        openResults(results, searchTitle);
      },

      // Called by agent to show loading state
      setSearchLoading: (loading: boolean) => {
        setIsLoading(loading);
      },

      // Called by agent to close results
      closeSearchResults: () => {
        closeResults();
      },
    };

    return () => {
      // Clean up on unmount
      if ((window as any).crmAgent) {
        delete (window as any).crmAgent;
      }
    };
  }, [router, openResults, closeResults, setIsLoading]);

  return (
    <>
      {children}
      <Toaster position="top-right" theme="dark" richColors closeButton />

      {/* Create FAB - accessible from all pages */}
      <CreateFAB />

      {/* Search Results Modal */}
      <SearchResultsModal
        open={isOpen}
        onOpenChange={closeResults}
        results={results}
        isLoading={isLoading}
        title={title}
      />

      {/* ElevenLabs Widget Setup and Initialization */}
      <ElevenLabsSetup />

      {/* ElevenLabs ConvAI Widget v2 */}
      {process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const container = document.createElement('div');
                  container.innerHTML = '<elevenlabs-convai agent-id="${process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID}"></elevenlabs-convai>';
                  document.body.appendChild(container.firstChild);
                })();
              `,
            }}
          />
          <script
            src="https://unpkg.com/@elevenlabs/convai-widget-embed@beta"
            async
            type="text/javascript"
          />
        </>
      )}
    </>
  );
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <AgentResultsProvider>
      <RootLayoutClientContent>{children}</RootLayoutClientContent>
    </AgentResultsProvider>
  );
}

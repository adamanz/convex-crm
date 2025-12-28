"use client";

import { useEffect } from "react";

export function ElevenLabsSetup() {
  useEffect(() => {
    // Wait for the ElevenLabs widget to be loaded
    const setupWidget = () => {
      const widget = document.querySelector("elevenlabs-convai") as any;
      const windowWithAgent = window as any;

      if (widget && windowWithAgent.crmAgent) {
        // Configure client tools that the agent can call
        widget.setClientTools?.({
          displaySearchResults: async (results: any[]) => {
            // Transform results to SearchResult format
            const searchResults = results.map((result: any) => ({
              id: result.id,
              name: result.name,
              type: result.type || "contact",
              subtitle: result.subtitle || "",
              metadata: result.metadata || {},
            }));

            windowWithAgent.crmAgent.showSearchResults(
              searchResults,
              "Search Results"
            );
          },

          navigateToRecord: async (recordId: string, recordType: string) => {
            const paths: Record<string, string> = {
              contact: `/contacts/${recordId}`,
              company: `/companies/${recordId}`,
              deal: `/deals/${recordId}`,
            };

            const path = paths[recordType];
            if (path) {
              window.location.href = path;
            }
          },

          createRecord: async (data: any) => {
            // Trigger create dialog with prefilled data
            const queryString = new URLSearchParams({
              new: "true",
              prefill: JSON.stringify(data),
            }).toString();

            window.location.href = `/contacts?${queryString}`;
          },
        });
      } else if (!widget) {
        // Widget not loaded yet, try again
        setTimeout(setupWidget, 1000);
      }
    };

    // Initial setup
    setupWidget();
  }, []);

  return null;
}

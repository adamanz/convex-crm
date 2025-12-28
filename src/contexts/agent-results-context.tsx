"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { SearchResult } from "@/components/agent/SearchResultsModal";

interface AgentResultsContextType {
  isOpen: boolean;
  results: SearchResult[];
  isLoading: boolean;
  title: string;
  openResults: (results: SearchResult[], title?: string) => void;
  closeResults: () => void;
  setIsLoading: (loading: boolean) => void;
}

const AgentResultsContext = createContext<AgentResultsContextType | undefined>(
  undefined
);

export function AgentResultsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("Search Results");

  const openResults = useCallback(
    (newResults: SearchResult[], newTitle = "Search Results") => {
      setResults(newResults);
      setTitle(newTitle);
      setIsOpen(true);
      setIsLoading(false);
    },
    []
  );

  const closeResults = useCallback(() => {
    setIsOpen(false);
    setResults([]);
  }, []);

  const value: AgentResultsContextType = {
    isOpen,
    results,
    isLoading,
    title,
    openResults,
    closeResults,
    setIsLoading,
  };

  return (
    <AgentResultsContext.Provider value={value}>
      {children}
    </AgentResultsContext.Provider>
  );
}

export function useAgentResults() {
  const context = useContext(AgentResultsContext);
  if (context === undefined) {
    throw new Error(
      "useAgentResults must be used within AgentResultsProvider"
    );
  }
  return context;
}

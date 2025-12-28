"use client";

/**
 * Special layout for conversations page
 * Removes the default padding to allow full-height split view
 */
export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full -mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      {children}
    </div>
  );
}

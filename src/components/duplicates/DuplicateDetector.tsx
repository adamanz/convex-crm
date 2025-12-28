"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Users,
  Building2,
  Merge,
  Eye,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { MergeDialog } from "./MergeDialog";
import { CompareView } from "./CompareView";

interface DuplicateDetectorProps {
  defaultTab?: "contacts" | "companies";
}

export function DuplicateDetector({ defaultTab = "contacts" }: DuplicateDetectorProps) {
  const [activeTab, setActiveTab] = useState<"contacts" | "companies">(defaultTab);
  const [selectedContactGroup, setSelectedContactGroup] = useState<{
    primary: { _id: Id<"contacts"> };
    duplicates: Array<{ contact: { _id: Id<"contacts"> } }>;
  } | null>(null);
  const [selectedCompanyGroup, setSelectedCompanyGroup] = useState<{
    primary: { _id: Id<"companies"> };
    duplicates: Array<{ company: { _id: Id<"companies"> } }>;
  } | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);
  const [mergeType, setMergeType] = useState<"contact" | "company">("contact");

  // Query for contact duplicates
  const contactDuplicates = useQuery(api.duplicates.findAllContactDuplicates, {
    limit: 50,
    minConfidence: 0.6,
  });

  // Query for company duplicates
  const companyDuplicates = useQuery(api.duplicates.findAllCompanyDuplicates, {
    limit: 50,
    minConfidence: 0.6,
  });

  const handleMergeContacts = (group: typeof selectedContactGroup) => {
    setSelectedContactGroup(group);
    setMergeType("contact");
    setShowMergeDialog(true);
  };

  const handleMergeCompanies = (group: typeof selectedCompanyGroup) => {
    setSelectedCompanyGroup(group);
    setMergeType("company");
    setShowMergeDialog(true);
  };

  const handleCompareContacts = (group: typeof selectedContactGroup) => {
    setSelectedContactGroup(group);
    setMergeType("contact");
    setShowCompareView(true);
  };

  const handleCompareCompanies = (group: typeof selectedCompanyGroup) => {
    setSelectedCompanyGroup(group);
    setMergeType("company");
    setShowCompareView(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "destructive";
    if (confidence >= 0.7) return "secondary";
    return "outline";
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Duplicate Detection</h2>
          <p className="text-muted-foreground">
            Find and merge duplicate records in your CRM
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact Duplicates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contactDuplicates?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Potential duplicate groups found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Duplicates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyDuplicates?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Potential duplicate groups found
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "contacts" | "companies")}>
        <TabsList>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
            {contactDuplicates && contactDuplicates.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {contactDuplicates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Companies
            {companyDuplicates && companyDuplicates.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {companyDuplicates.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Contacts</CardTitle>
              <CardDescription>
                Review and merge contacts that appear to be duplicates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!contactDuplicates ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading duplicates...
                </div>
              ) : contactDuplicates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No duplicate contacts found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your contact database is clean!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {contactDuplicates.map((group, index) => (
                      <div
                        key={group.primary._id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {group.primary.firstName} {group.primary.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {group.primary.email || "No email"}
                              </p>
                              {group.primary.company && (
                                <p className="text-sm text-muted-foreground">
                                  {group.primary.company.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {group.duplicates.length + 1} records
                          </Badge>
                        </div>

                        <div className="pl-13 space-y-2">
                          {group.duplicates.map((dup) => (
                            <div
                              key={dup.contact._id}
                              className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {dup.contact.firstName} {dup.contact.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {dup.contact.email || "No email"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {dup.matchReasons.map((reason, i) => (
                                  <Badge
                                    key={i}
                                    variant={getConfidenceColor(dup.confidence)}
                                    className="text-xs"
                                  >
                                    {reason}
                                  </Badge>
                                ))}
                                <Badge variant="outline">
                                  {formatConfidence(dup.confidence)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompareContacts(group as typeof selectedContactGroup)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Compare
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMergeContacts(group as typeof selectedContactGroup)}
                          >
                            <Merge className="h-4 w-4 mr-2" />
                            Merge
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Companies</CardTitle>
              <CardDescription>
                Review and merge companies that appear to be duplicates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!companyDuplicates ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading duplicates...
                </div>
              ) : companyDuplicates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No duplicate companies found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your company database is clean!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {companyDuplicates.map((group, index) => (
                      <div
                        key={group.primary._id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{group.primary.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {group.primary.domain || "No domain"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {group.primary.contactCount} contacts
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {group.duplicates.length + 1} records
                          </Badge>
                        </div>

                        <div className="pl-13 space-y-2">
                          {group.duplicates.map((dup) => (
                            <div
                              key={dup.company._id}
                              className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {dup.company.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {dup.company.domain || "No domain"} - {dup.company.contactCount} contacts
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {dup.matchReasons.map((reason, i) => (
                                  <Badge
                                    key={i}
                                    variant={getConfidenceColor(dup.confidence)}
                                    className="text-xs"
                                  >
                                    {reason}
                                  </Badge>
                                ))}
                                <Badge variant="outline">
                                  {formatConfidence(dup.confidence)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompareCompanies(group as typeof selectedCompanyGroup)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Compare
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMergeCompanies(group as typeof selectedCompanyGroup)}
                          >
                            <Merge className="h-4 w-4 mr-2" />
                            Merge
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Merge Dialog */}
      {mergeType === "contact" && selectedContactGroup && (
        <MergeDialog
          open={showMergeDialog}
          onOpenChange={setShowMergeDialog}
          type="contact"
          primaryId={selectedContactGroup.primary._id}
          duplicateIds={selectedContactGroup.duplicates.map((d) => d.contact._id)}
        />
      )}

      {mergeType === "company" && selectedCompanyGroup && (
        <MergeDialog
          open={showMergeDialog}
          onOpenChange={setShowMergeDialog}
          type="company"
          primaryId={selectedCompanyGroup.primary._id}
          duplicateIds={selectedCompanyGroup.duplicates.map((d) => d.company._id)}
        />
      )}

      {/* Compare View */}
      {mergeType === "contact" && selectedContactGroup && (
        <CompareView
          open={showCompareView}
          onOpenChange={setShowCompareView}
          type="contact"
          recordIds={[
            selectedContactGroup.primary._id,
            ...selectedContactGroup.duplicates.map((d) => d.contact._id),
          ]}
          onMerge={() => {
            setShowCompareView(false);
            setShowMergeDialog(true);
          }}
        />
      )}

      {mergeType === "company" && selectedCompanyGroup && (
        <CompareView
          open={showCompareView}
          onOpenChange={setShowCompareView}
          type="company"
          recordIds={[
            selectedCompanyGroup.primary._id,
            ...selectedCompanyGroup.duplicates.map((d) => d.company._id),
          ]}
          onMerge={() => {
            setShowCompareView(false);
            setShowMergeDialog(true);
          }}
        />
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { EmployerExamCard } from "@/components/shared/ExamCard";

interface EmployerExamListProps {
  initialExams: any[];
}

export default function EmployerExamList({
  initialExams,
}: EmployerExamListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExams = useMemo(() => {
    return initialExams.filter((exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [initialExams, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by exam title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filteredExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-muted/20">
          <p className="text-sm text-muted-foreground">
            No exams matching &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredExams.map((exam) => (
            <EmployerExamCard
              key={exam.id}
              exam={exam as Parameters<typeof EmployerExamCard>[0]["exam"]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

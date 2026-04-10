"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, ChevronLeft, Loader2 } from "lucide-react";
import { QuestionType } from "@/types";
import { QuestionSetData } from "./CreateExamStepper";
import QuestionModal from "./QuestionModal";

interface QuestionSetManagerProps {
  questionSets: QuestionSetData[];
  defaultType: QuestionType;
  onUpdate: (sets: QuestionSetData[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function QuestionSetManager({
  questionSets,
  defaultType,
  onUpdate,
  onBack,
  onSubmit,
  isSubmitting,
}: QuestionSetManagerProps) {
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [modalState, setModalState] = useState<{
    open: boolean;
    setIndex: number;
    questionIndex: number | null;
  }>({ open: false, setIndex: 0, questionIndex: null });

  const updateSetTitle = (index: number, title: string) => {
    const updated = [...questionSets];
    updated[index] = { ...updated[index], title };
    onUpdate(updated);
  };

  const openAddQuestion = (setIndex: number) => {
    setModalState({ open: true, setIndex, questionIndex: null });
  };

  const openEditQuestion = (setIndex: number, qIndex: number) => {
    setModalState({ open: true, setIndex, questionIndex: qIndex });
  };

  const deleteQuestion = (setIndex: number, qIndex: number) => {
    const updated = [...questionSets];
    updated[setIndex] = {
      ...updated[setIndex],
      questions: updated[setIndex].questions.filter((_, i) => i !== qIndex),
    };
    onUpdate(updated);
  };

  const handleModalSave = (question: QuestionSetData["questions"][0]) => {
    const updated = [...questionSets];
    const set = { ...updated[modalState.setIndex] };
    if (modalState.questionIndex !== null) {
      const qs = [...set.questions];
      qs[modalState.questionIndex] = question;
      set.questions = qs;
    } else {
      set.questions = [...set.questions, question];
    }
    updated[modalState.setIndex] = set;
    onUpdate(updated);
    setModalState((s) => ({ ...s, open: false }));
  };

  const totalQuestions = questionSets.reduce(
    (acc, qs) => acc + qs.questions.length,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Question Sets</h2>
          <p className="text-sm text-muted-foreground">
            {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} total
            across {questionSets.length} set
            {questionSets.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {questionSets.map((set, setIdx) => (
        <Card key={setIdx}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {editingSetIndex === setIdx ? (
                <Input
                  value={set.title}
                  onChange={(e) => updateSetTitle(setIdx, e.target.value)}
                  onBlur={() => setEditingSetIndex(null)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setEditingSetIndex(null)
                  }
                  className="h-8 font-semibold"
                  autoFocus
                />
              ) : (
                <CardTitle
                  className="text-base cursor-pointer hover:text-primary"
                  onClick={() => setEditingSetIndex(setIdx)}
                >
                  {set.title}
                </CardTitle>
              )}
              <Badge variant="secondary">
                {set.questions.length} questions
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 ml-auto"
                onClick={() => setEditingSetIndex(setIdx)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {set.questions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No questions yet — click &quot;Add Question&quot; below
              </p>
            ) : (
              set.questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 rounded-md border p-3 text-sm"
                >
                  <span className="font-medium text-muted-foreground w-5 shrink-0">
                    {qIdx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{q.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {q.type}
                      </Badge>
                      {q.options.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {q.options.length} options
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditQuestion(setIdx, qIdx)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteQuestion(setIdx, qIdx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => openAddQuestion(setIdx)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Question
            </Button>
          </CardContent>
        </Card>
      ))}

      <Separator />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || totalQuestions === 0}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Exam
        </Button>
      </div>

      <QuestionModal
        open={modalState.open}
        defaultType={defaultType}
        initialData={
          modalState.questionIndex !== null
            ? questionSets[modalState.setIndex]?.questions[
                modalState.questionIndex
              ]
            : undefined
        }
        onClose={() => setModalState((s) => ({ ...s, open: false }))}
        onSave={handleModalSave}
      />
    </div>
  );
}

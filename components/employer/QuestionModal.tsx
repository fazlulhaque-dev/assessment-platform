"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { QuestionType } from "@/types";
import { QuestionSetData } from "./CreateExamStepper";
import { v4 as uuidv4 } from "uuid";

const questionSchema = z
  .object({
    title: z.string().min(3, "Question must be at least 3 characters"),
    type: z.enum(["checkbox", "radio", "text"] as const),
    options: z.array(z.object({ value: z.string() })).optional(),
    correct_answers: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "radio" || data.type === "checkbox") {
      const filled = (data.options ?? []).filter((o) => o.value.trim());
      if (filled.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least 2 options are required",
          path: ["options"],
        });
      }
    }
  });

type FormValues = z.infer<typeof questionSchema>;

interface QuestionModalProps {
  open: boolean;
  defaultType: QuestionType;
  initialData?: QuestionSetData["questions"][0];
  onClose: () => void;
  onSave: (question: QuestionSetData["questions"][0]) => void;
}

export default function QuestionModal({
  open,
  defaultType,
  initialData,
  onClose,
  onSave,
}: QuestionModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: defaultType,
      options: [{ value: "" }, { value: "" }],
      correct_answers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const questionType = watch("type");

  // Clear stale options when switching to text so Zod doesn't validate them
  useEffect(() => {
    if (questionType === "text") {
      setValue("options", []);
      setValue("correct_answers", []);
    }
  }, [questionType, setValue]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          title: initialData.title,
          type: initialData.type,
          options: initialData.options.map((v) => ({ value: v })),
          correct_answers: initialData.correct_answers,
        });
      } else {
        reset({
          type: defaultType,
          options: [{ value: "" }, { value: "" }],
          correct_answers: [],
        });
      }
    }
  }, [open, initialData, defaultType, reset]);

  const onSubmit = (data: FormValues) => {
    const options = (data.options ?? []).map((o) => o.value).filter(Boolean);
    onSave({
      id: initialData?.id ?? uuidv4(),
      title: data.title,
      type: data.type,
      options,
      correct_answers: data.correct_answers ?? [],
    });
  };

  const showOptions = questionType === "radio" || questionType === "checkbox";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Question" : "Add Question"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Question Type</Label>
            <Select
              value={questionType}
              onValueChange={(v) => setValue("type", v as QuestionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="radio">Single Choice (Radio)</SelectItem>
                <SelectItem value="checkbox">
                  Multi Choice (Checkbox)
                </SelectItem>
                <SelectItem value="text">Text / Essay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Question Title</Label>
            {questionType === "text" ? (
              <Textarea
                placeholder="Enter your question..."
                rows={3}
                {...register("title")}
              />
            ) : (
              <Input
                placeholder="Enter your question..."
                {...register("title")}
              />
            )}
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {showOptions && (
            <div className="space-y-2">
              <Label>Answer Options</Label>
              <p className="text-xs text-muted-foreground">
                {questionType === "radio"
                  ? "Select the correct answer"
                  : "Check all correct answers"}
              </p>
              {fields.map((field, idx) => {
                const optionValue = watch(`options.${idx}.value`);
                const correctAnswers = watch("correct_answers") ?? [];
                const isCorrect = correctAnswers.includes(optionValue);

                const toggleCorrect = () => {
                  if (questionType === "radio") {
                    setValue(
                      "correct_answers",
                      optionValue ? [optionValue] : [],
                    );
                  } else {
                    if (isCorrect) {
                      setValue(
                        "correct_answers",
                        correctAnswers.filter((a) => a !== optionValue),
                      );
                    } else {
                      setValue("correct_answers", [
                        ...correctAnswers,
                        optionValue,
                      ]);
                    }
                  }
                };

                return (
                  <div key={field.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleCorrect}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border text-xs transition-colors ${
                        questionType === "radio" ? "rounded-full" : "rounded"
                      } ${
                        isCorrect
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:border-primary"
                      }`}
                      title="Mark as correct answer"
                    >
                      {isCorrect &&
                        (questionType === "radio" ? (
                          <div className="h-2 w-2 rounded-full bg-current" />
                        ) : (
                          <svg
                            viewBox="0 0 10 10"
                            className="h-3 w-3 fill-current"
                          >
                            <path
                              d="M1.5 5L4 7.5L8.5 2.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ))}
                    </button>
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      {...register(`options.${idx}.value`)}
                    />
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => remove(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "" })}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Option
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Update" : "Add Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

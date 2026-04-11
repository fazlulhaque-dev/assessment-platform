"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { QuestionType } from "@/types";
import QuestionSetManager from "./QuestionSetManager";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const step1Schema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    total_candidates: z.number().int().min(1, "At least 1 candidate"),
    total_slots: z.number().int().min(1, "At least 1 slot"),
    question_sets_count: z.number().int().min(1).max(10),
    question_type: z.enum(["checkbox", "radio", "text"] as const),
    start_time: z.string().min(1, "Required"),
    end_time: z.string().min(1, "Required"),
    duration: z.number().int().min(1, "At least 1 minute"),
    negative_marking: z.boolean(),
  })
  .refine((d) => new Date(d.end_time) > new Date(d.start_time), {
    message: "End time must be after start time",
    path: ["end_time"],
  });

type Step1Values = z.infer<typeof step1Schema>;

export interface QuestionSetData {
  title: string;
  questions: {
    id: string;
    title: string;
    type: QuestionType;
    options: string[];
    correct_answers: string[];
  }[];
}

const STEPS = ["Basic Info", "Questions"];

export default function CreateExamStepper() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [questionSets, setQuestionSets] = useState<QuestionSetData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      question_type: "radio",
      question_sets_count: 1,
      negative_marking: false,
    },
  });

  const questionType = watch("question_type");
  const negativeMarking = watch("negative_marking");

  const onStep1Submit = (data: Step1Values) => {
    const processedData = {
      ...data,
      start_time: new Date(data.start_time).toISOString(),
      end_time: new Date(data.end_time).toISOString(),
    };
    setStep1Data(processedData);
    // Initialize question sets based on count
    const count = data.question_sets_count;
    setQuestionSets(
      Array.from({ length: count }, (_, i) => ({
        title: `Set ${i + 1}`,
        questions: [],
      })),
    );
    setStep(1);
  };

  const handleFinalSubmit = async () => {
    if (!step1Data) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/employer/exams", {
        basicInfo: step1Data,
        questionSets,
      });
      toast.success("Exam created successfully!");
      router.push("/employer/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create exam";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-3">
          {" "}
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  i === step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => router.push("/employer/dashboard")}
          variant="outline"
          size="sm"
          className="hidden md:inline-flex items-center gap-1"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to dashboard
        </Button>
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the exam details and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Exam Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Frontend Developer Assessment"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="total_candidates">Total Candidates</Label>
                  <Input
                    id="total_candidates"
                    type="number"
                    min={1}
                    {...register("total_candidates", { valueAsNumber: true })}
                  />
                  {errors.total_candidates && (
                    <p className="text-xs text-destructive">
                      {errors.total_candidates.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="total_slots">Total Slots</Label>
                  <Input
                    id="total_slots"
                    type="number"
                    min={1}
                    {...register("total_slots", { valueAsNumber: true })}
                  />
                  {errors.total_slots && (
                    <p className="text-xs text-destructive">
                      {errors.total_slots.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="question_sets_count">
                    Number of Question Sets
                  </Label>
                  <Input
                    id="question_sets_count"
                    type="number"
                    min={1}
                    max={10}
                    {...register("question_sets_count", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Question Type</Label>
                  <Select
                    value={questionType}
                    onValueChange={(v) =>
                      setValue("question_type", v as QuestionType)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="radio">
                        Single Choice (Radio)
                      </SelectItem>
                      <SelectItem value="checkbox">
                        Multi Choice (Checkbox)
                      </SelectItem>
                      <SelectItem value="text">Text / Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    {...register("start_time")}
                  />
                  {errors.start_time && (
                    <p className="text-xs text-destructive">
                      {errors.start_time.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    {...register("end_time")}
                  />
                  {errors.end_time && (
                    <p className="text-xs text-destructive">
                      {errors.end_time.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    {...register("duration", { valueAsNumber: true })}
                  />
                  {errors.duration && (
                    <p className="text-xs text-destructive">
                      {errors.duration.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Negative Marking</Label>
                  <div className="flex items-center gap-3 h-10">
                    <button
                      type="button"
                      onClick={() =>
                        setValue("negative_marking", !negativeMarking)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        negativeMarking ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          negativeMarking ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <Badge
                      variant={negativeMarking ? "destructive" : "outline"}
                    >
                      {negativeMarking ? "Enabled (0.25/wrong)" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button type="submit">
                  Next: Add Questions
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 1 && step1Data && (
        <QuestionSetManager
          questionSets={questionSets}
          defaultType={step1Data.question_type}
          onUpdate={setQuestionSets}
          onBack={() => setStep(0)}
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

"use client";

import { Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  currentAnswer: string | string[] | undefined;
  skipped: boolean;
  onAnswer: (answer: string | string[]) => void;
  onSkip: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function QuestionRenderer({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  skipped,
  onAnswer,
  onSkip,
  onPrev,
  onNext,
}: QuestionRendererProps) {
  const handleRadioChange = (option: string) => {
    onAnswer(option);
  };

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const current = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
    if (checked) {
      if (!current.includes(option)) {
        onAnswer([...current, option]);
      }
    } else {
      onAnswer(current.filter((v) => v !== option));
    }
  };

  const handleTextChange = (value: string) => {
    onAnswer(value);
  };

  const isAnswered =
    currentAnswer !== undefined &&
    currentAnswer !== "" &&
    (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          <Badge
            variant={isAnswered ? "default" : skipped ? "outline" : "secondary"}
            className={`text-xs ${skipped && !isAnswered ? "border-amber-400 text-amber-600" : ""}`}
          >
            {isAnswered ? "Answered" : skipped ? "Skipped" : "Not Answered"}
          </Badge>
        </div>
        <CardTitle className="text-base font-semibold leading-relaxed">
          {question.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {question.type === "radio" && question.options && (
          <div className="space-y-2">
            {question.options.map((option, idx) => {
              const isSelected = currentAnswer === option;
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleRadioChange(option)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "checkbox" && question.options && (
          <div className="space-y-2">
            {question.options.map((option, idx) => {
              const isChecked = Array.isArray(currentAnswer)
                ? currentAnswer.includes(option)
                : false;
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    isChecked
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={isChecked}
                    onChange={(e) =>
                      handleCheckboxChange(option, e.target.checked)
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "text" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Your answer</Label>
            <Textarea
              value={typeof currentAnswer === "string" ? currentAnswer : ""}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Type your answer here..."
              rows={5}
              className="resize-none"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={questionNumber === 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center gap-2">
          {!isAnswered && questionNumber < totalQuestions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <SkipForward className="mr-1 h-4 w-4" />
              Skip
            </Button>
          )}
          <Button
            size="sm"
            onClick={onNext}
            disabled={questionNumber === totalQuestions}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

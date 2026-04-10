import CreateExamStepper from "@/components/employer/CreateExamStepper";

export default function CreateExamPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Create New Exam</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fill in the details to set up your assessment
        </p>
      </div>
      <CreateExamStepper />
    </div>
  );
}

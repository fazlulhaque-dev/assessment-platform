import ExamScreen from "@/components/candidate/ExamScreen";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExamScreen examId={id} />;
}

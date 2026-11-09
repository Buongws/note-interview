import { DrawingEditor } from "@/components/drawing-editor";

export default async function DrawingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DrawingEditor drawingId={id} />;
}

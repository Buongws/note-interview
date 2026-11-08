import { TopicView } from "@/components/topic-view";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TopicView topicId={id} />;
}

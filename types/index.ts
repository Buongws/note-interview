export type NoteType = "knowledge" | "qa";
export type NoteStatus = "learning" | "reviewing" | "mastered";

export interface TopicDTO {
  _id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  noteCount: number;
}

export interface NoteDTO {
  _id: string;
  topicId: string;
  title: string;
  content?: unknown;
  contentText?: string;
  preview: string;
  tags: string[];
  type: NoteType;
  question?: string;
  answer?: string;
  status: NoteStatus;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatsDTO {
  total: number;
  status: Record<NoteStatus, number>;
  types: Record<NoteType, number>;
  recent: NoteDTO[];
}

export interface DrawingDTO {
  _id: string;
  title: string;
  shapes: number;
  createdAt: string;
  updatedAt: string;
}

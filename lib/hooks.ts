"use client";
import useSWR from "swr";
import { fetcher } from "./fetcher";
import type { NoteDTO, StatsDTO, TopicDTO } from "@/types";

export const useTopics = () => useSWR<TopicDTO[]>("/api/topics", fetcher);
export const useStats = () => useSWR<StatsDTO>("/api/stats", fetcher);
export const useNotes = (params: Record<string, string | undefined> = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return useSWR<NoteDTO[]>(`/api/notes${qs ? `?${qs}` : ""}`, fetcher);
};

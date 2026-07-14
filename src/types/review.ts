export type ReviewItemCategory = "letter" | "word" | "sentence";

export interface ReviewItem {
  id: string;
  english: string;
  chinese: string;
  category: ReviewItemCategory;
  emoji: string;
  note?: string;
}

export interface ReviewLesson {
  id: string;
  title: string;
  dateLabel: string;
  theme: string;
  summary: string;
  teacherText: string;
  items: ReviewItem[];
}

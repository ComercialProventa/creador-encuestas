export type QuestionType =
  | 'rating_stars'
  | 'nps'
  | 'single_choice'
  | 'multiple_choice'
  | 'text_open'
  | 'likert'
  | 'linear_scale'
  | 'csat';

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  options?: string[];
  isRequired: boolean;
  scaleMax?: 7 | 10;
}

export interface Survey {
  title: string;
  description: string;
  questions: Question[];
  primaryColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  rewardType?: RewardType;
  rewardText?: string;
  rewardImageUrl?: string;
  requireContact?: boolean;
  couponImageUrl?: string;
}

export type RewardType = 'none' | 'discount' | 'giveaway';

export const QuestionTypeLabels: Record<QuestionType, string> = {
  rating_stars: 'Puntuación (Estrellas)',
  nps: 'Net Promoter Score (NPS)',
  single_choice: 'Selección Única',
  multiple_choice: 'Selección Múltiple',
  text_open: 'Texto Abierto',
  likert: 'Escala Likert (Acuerdo)',
  linear_scale: 'Escala Numérica (Lineal)',
  csat: 'Satisfacción (Caritas)',
};

export function createEmptyQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    title: '',
    type: 'rating_stars',
    isRequired: false,
  };
}
import {useQuery} from '@tanstack/react-query';

export type ExamPost = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export const POSTS_EXAM_QUERY_KEY = ['exam-posts'] as const;
export const POSTS_EXAM_ENDPOINT =
  'https://jsonplaceholder.typicode.com/posts?_limit=12';

const fetchPostsExam = async (): Promise<ExamPost[]> => {
  const response = await fetch(POSTS_EXAM_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Unable to load exam posts (${response.status}).`);
  }

  const payload = (await response.json()) as ExamPost[];

  return Array.isArray(payload) ? payload : [];
};

export const usePostsExam = () =>
  useQuery({
    queryKey: POSTS_EXAM_QUERY_KEY,
    queryFn: fetchPostsExam,
  });

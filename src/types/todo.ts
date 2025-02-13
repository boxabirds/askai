export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface TodoRow {
  id: string;
  text: string;
  completed: number;
  created_at: string;
}

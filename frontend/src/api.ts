export interface QueryRequest {
  query: string;
  session_id?: string;
  grade_level: string;
  language: string;
}

export interface QueryResponse {
  category: string;
  solution: string;
  steps: any[];
  source: string;
  current_step_index: number;
  hint_count: number;
  practice_mode: boolean;
  grade_level: string;
  session_id: string;
  language: string;
}

export async function sendChatQuery(request: QueryRequest): Promise<QueryResponse> {
  const response = await fetch('/api/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

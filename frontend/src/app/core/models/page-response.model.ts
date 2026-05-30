export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function unwrapPage<T>(response: PageResponse<T>): T[] {
  return response?.content ?? [];
}

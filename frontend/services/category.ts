import { apiFetch } from './api';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
};

export type CreateCategoryPayload = {
  name: string;
  icon: string;
  color: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/categories', { auth: true });
}

export function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  return apiFetch<Category>('/categories', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/categories/${id}`, { method: 'DELETE', auth: true });
}

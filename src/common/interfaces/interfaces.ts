export interface IPagination {
  page: number;
  per_page: number;
  total_pages: number;
  first_page: number;
  last_page: number;
  next?: number;
  prev?: number;
}

export interface IQueryString {
  search?: string;
  sort?: string;
  limit?: string;
  page?: string;
}

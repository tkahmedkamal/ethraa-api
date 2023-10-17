import { IPagination } from '../interfaces';

export const statsPagination = ({ total, page, limit }) => {
  const totalRecords = total;
  const totalPages = Math.ceil(totalRecords / limit);

  const pagination: IPagination = {
    page,
    per_page: limit,
    total_pages: totalPages,
    first_page: 1,
    last_page: totalPages,
  };

  if (page > 1) {
    pagination.prev = page - 1;
  }
  if (page < totalPages) {
    pagination.next = page + 1;
  }

  return pagination;
};

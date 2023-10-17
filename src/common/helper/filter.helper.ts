import { IPagination, IQueryString } from '../interfaces';

export class Filter {
  private paginationObj: IPagination;

  constructor(
    private query: any,
    private queryString: IQueryString,
  ) {}

  filter() {
    const queries = {
      ...this.queryString,
    };
    const excludeFields = ['search', 'sort', 'page', 'limit'];
    excludeFields.forEach(field => delete queries[field]);
    this.query = this.query.find(queries);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortQuery = this.queryString.sort.split(',').join();
      this.query = this.query.sort(sortQuery).select('-__v');
    } else {
      this.query = this.query.sort('-createdAt').select('-__v');
    }

    return this;
  }

  search(model: string = 'user') {
    if (this.queryString.search) {
      model === 'user'
        ? (this.query = this.query.find({
            $or: [
              { name: { $regex: this.queryString.search, $options: 'i' } },
              { bio: { $regex: this.queryString.search, $options: 'i' } },
            ],
          }))
        : (this.query = this.query.find({
            $or: [
              { quote: { $regex: this.queryString.search, $options: 'i' } },
              { quoteFor: { $regex: this.queryString.search, $options: 'i' } },
            ],
          }));
    }

    return this;
  }

  pagination(totalRecords: number) {
    const pageQuery = +this.queryString.page || 1;
    const limitQuery = +this.queryString.limit || 10;
    const skip = (pageQuery - 1) * limitQuery;
    const totalPages = Math.ceil(totalRecords / limitQuery);

    this.query = this.query.skip(skip).limit(limitQuery);

    this.paginationObj = {
      page: pageQuery,
      per_page: limitQuery,
      total_pages: totalPages,
      first_page: 1,
      last_page: totalPages,
    };

    if (pageQuery > 1) {
      this.paginationObj.prev = pageQuery - 1;
    }

    if (pageQuery < totalPages) {
      this.paginationObj.next = pageQuery + 1;
    }

    return this;
  }

  get getPagination() {
    return this.paginationObj;
  }

  get getQuery() {
    return this.query;
  }
}

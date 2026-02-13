/**
 * Standardized API response wrapper.
 * The TransformInterceptor auto-wraps controller returns into this shape.
 * Use this type when you need to manually construct a response.
 */
export class ResponseDto<T> {
  data: T;
  message: string;
  statusCode: number;

  constructor(data: T, message = 'Success', statusCode = 200) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
  }

  static success<T>(data: T, message = 'Success'): ResponseDto<T> {
    return new ResponseDto(data, message, 200);
  }

  static created<T>(data: T, message = 'Created'): ResponseDto<T> {
    return new ResponseDto(data, message, 201);
  }
}

/**
 * Paginated response wrapper for list endpoints.
 */
export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
  statusCode: number;

  constructor(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success',
  ) {
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    this.message = message;
    this.statusCode = 200;
  }
}

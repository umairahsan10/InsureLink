import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  message?: string;
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  private convertDecimals(obj: any): any {
    // Handle null/undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Check for Decimal object by constructor name
    if (obj.constructor && obj.constructor.name === 'Decimal') {
      return parseFloat(obj.toString());
    }

    // Check for Decimal structure: { s: number, e: number, d: array }
    if (
      typeof obj === 'object' &&
      typeof obj.s === 'number' &&
      typeof obj.e === 'number' &&
      Array.isArray(obj.d) &&
      obj.d.length > 0
    ) {
      // For actual Decimal class instances, toString() gives the correct number string
      if (obj.constructor && obj.constructor.name === 'Decimal') {
        return parseFloat(obj.toString());
      }
      // Fallback for plain { s, e, d } objects (e.g. after ClassSerializerInterceptor):
      // Decimal.js uses base 1e7 per coefficient; reconstruct as s * d[0] * 10^(e - (len-1))
      const sign = obj.s < 0 ? -1 : 1;
      const coeff = obj.d[0];
      const coeffLen = String(coeff).length;
      return sign * coeff * Math.pow(10, obj.e - (coeffLen - 1));
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertDecimals(item));
    }

    // Handle objects recursively
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          converted[key] = this.convertDecimals(obj[key]);
        }
      }
      return converted;
    }

    return obj;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        data: this.convertDecimals(data),
        message: 'Success',
        statusCode: 200,
      })),
    );
  }
}

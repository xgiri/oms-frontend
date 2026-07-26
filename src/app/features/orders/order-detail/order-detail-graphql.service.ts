import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { print } from 'graphql';
import { environment } from '../../../../environments/environment';
import {
  OrderDetailDocument,
  OrderDetailQuery,
  OrderDetailQueryVariables,
} from './order-detail.generated';

type OrderDetailResult = NonNullable<OrderDetailQuery['orderDetail']>;

interface GraphQlError {
  message: string;
}

interface GraphQlResponse<T> {
  data?: T | null;
  errors?: GraphQlError[];
}

/**
 * Runs the generated OrderDetail query against oms-gateway's /graphql route
 * using the app's existing HttpClient — not a dedicated GraphQL client
 * (Apollo, urql, etc.) — specifically so this one-view slice rides the same
 * authInterceptor/errorInterceptor pipeline every REST call already goes
 * through, rather than needing a second, separately-configured auth path
 * for just this page. Revisit if/when more views move to GraphQL and a
 * proper client's caching/dedup actually starts paying for itself.
 */
@Service()
export class OrderDetailGraphqlService {
  private readonly http = inject(HttpClient);

  getOrderDetail(id: number): Observable<OrderDetailResult> {
    const variables: OrderDetailQueryVariables = { id: String(id) };

    return this.http
      .post<GraphQlResponse<OrderDetailQuery>>(environment.graphqlUrl, {
        query: print(OrderDetailDocument),
        variables,
      })
      .pipe(
        map((response) => {
          // GraphQL's own convention: errors can come back inside a 200
          // response body rather than as an HTTP error status — the
          // interceptor-based error handling REST calls rely on doesn't
          // catch this shape, so it's checked explicitly here instead.
          if (response.errors?.length) {
            throw new Error(response.errors.map((e) => e.message).join('; '));
          }
          if (!response.data?.orderDetail) {
            throw new Error(`Order ${id} not found`);
          }
          return response.data.orderDetail;
        }),
      );
  }
}

/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Customer = {
  __typename?: 'Customer';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type OrderDetail = {
  __typename?: 'OrderDetail';
  customer: Customer;
  id: Scalars['ID']['output'];
  payment?: Maybe<Payment>;
  shipment?: Maybe<Shipment>;
  status: Scalars['String']['output'];
  totalAmount: Scalars['Float']['output'];
};

export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /**
   * Aggregates a single order with its payment, shipment, and customer —
   * the one resolver this step exists to prove out end to end. Backed by
   * OrderDetailResolver, calling oms-main via OrderClient/PaymentClient/
   * ShipmentClient/CustomerClient. payment/shipment are null until they
   * exist (e.g. a brand-new PENDING order has neither yet).
   */
  orderDetail?: Maybe<OrderDetail>;
};


export type QueryOrderDetailArgs = {
  id: Scalars['ID']['input'];
};

export type Shipment = {
  __typename?: 'Shipment';
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  trackingNumber?: Maybe<Scalars['String']['output']>;
};

export type OrderDetailQueryVariables = Exact<{
  id: string | number;
}>;


export type OrderDetailQuery = { orderDetail: { id: string, status: string, totalAmount: number, customer: { id: string, name: string, email: string }, payment: { id: string, status: string, amount: number } | null, shipment: { id: string, status: string, trackingNumber: string | null } | null } | null };


export const OrderDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrderDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"totalAmount"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"shipment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"trackingNumber"}}]}}]}}]}}]} as unknown as DocumentNode<OrderDetailQuery, OrderDetailQueryVariables>;
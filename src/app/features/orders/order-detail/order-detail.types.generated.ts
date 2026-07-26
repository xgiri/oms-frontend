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
  status: OrderStatus;
  totalAmount: Scalars['Float']['output'];
};

/**
 * Mirrors oms-main's com.giri.oms.order.entity.OrderStatus. The resolver
 * still passes the value straight through from oms-main as a String (see
 * OrderClient) rather than parsing it into a Java enum here — a value that
 * doesn't match one of these literals (e.g. oms-main adds a new status
 * before oms-bff is updated) becomes a coercion error on this field alone,
 * not a broken query, which is the safer failure mode across two
 * independently-deployed services.
 */
export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'CANCELLED'
  | 'CONFIRMED'
  | 'DELIVERED'
  | 'PENDING'
  | 'SHIPPED';

export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  status: PaymentStatus;
};

/** Mirrors oms-main's com.giri.oms.payment.entity.PaymentStatus. */
export type PaymentStatus =
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING'
  | 'REFUNDED';

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
  status: ShipmentStatus;
  trackingNumber?: Maybe<Scalars['String']['output']>;
};

/** Mirrors oms-main's com.giri.oms.shipment.entity.ShipmentStatus. */
export type ShipmentStatus =
  | 'DELIVERED'
  | 'IN_TRANSIT'
  | 'PENDING'
  | 'RETURNED'
  | 'SHIPPED';

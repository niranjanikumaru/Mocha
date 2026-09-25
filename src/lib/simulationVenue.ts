import { OrderStateRecord, OrderSide, ContractSymbol, AuditLogEntry, OrderExecutionStatus } from '../types/trading';

let auditLog: AuditLogEntry[] = [];

// Internal-only extension to hold hidden venue fill data during ACK-drop simulation
interface OrderStateInternal extends OrderStateRecord {
  _venueFilledQty?: number;
  _venueFillPrice?: number;
}

const processedOrders: Map<string, OrderStateInternal> = new Map();

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function addAudit(order: OrderStateRecord, stage: string, details: string, payload?: Record<string, unknown>) {
  const entry: AuditLogEntry = { id: makeId(), timestamp: Date.now(), stage, details, payload };
  order.auditTrail.push(entry);
  auditLog.push(entry);
}

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog];
}

export interface SubmitOrderOptions {
  simulatePartialFill?: boolean;  // fill only 60% of qty
  simulateAckDrop?: boolean;      // venue fills but client never gets ACK
  simulateReject?: boolean;
}

export function submitOrder(
  symbol: ContractSymbol,
  side: OrderSide,
  qty: number,
  markPrice: number,
  opts: SubmitOrderOptions = {}
): OrderStateRecord {
  const requestId = 'REQ-' + makeId().toUpperCase();
  const idempotencyKey = 'IK-' + makeId().toUpperCase();
  const venueOrderId = 'VEN-' + makeId().toUpperCase();

  const order: OrderStateInternal = {
    requestId,
    idempotencyKey,
    symbol,
    side,
    orderType: 'MARKET',
    requestedQty: qty,
    filledQty: 0,
    remainingQty: qty,
    avgFillPrice: 0,
    status: 'SUBMITTING',
    timestampSent: Date.now(),
    isSimulatedFailure: !!(opts.simulateAckDrop || opts.simulatePartialFill || opts.simulateReject),
    venueOrderId,
    auditTrail: [],
  };

  addAudit(order, 'ORDER_SUBMITTED', `Order ${requestId} submitted to venue. Idempotency key: ${idempotencyKey}`, { qty, side, symbol });
  processedOrders.set(requestId, order);

  if (opts.simulateReject) {
    order.status = 'REJECTED';
    order.failureReason = 'Simulated venue rejection: insufficient liquidity.';
    addAudit(order, 'ORDER_REJECTED', 'Venue rejected order.', { reason: order.failureReason });
    return order;
  }

  // Venue-side execution (always happens in simulation)
  const fillQty = opts.simulatePartialFill ? Math.floor(qty * 0.6) : qty;
  const fillPrice = markPrice + (side === 'BUY' ? 0.02 : -0.02); // slight slippage

  if (opts.simulateAckDrop) {
    // Venue executed internally but ACK is lost — client stays in limbo
    order.status = 'ACK_LOST_PENDING_RECON';
    order.failureReason = 'Network interruption: venue acknowledgement not received.';
    addAudit(order, 'ACK_LOST', 'Venue filled the order but network dropped the acknowledgement. Status is UNRESOLVED.', {
      venueFilledQty: fillQty,
      fillPrice,
      note: 'Do NOT submit duplicate. Reconcile first.',
    });
    // Store what venue actually did (hidden from client until reconcile)
    order._venueFilledQty = fillQty;
    order._venueFillPrice = fillPrice;
    return order;
  }

  // Normal path
  order.filledQty = fillQty;
  order.remainingQty = qty - fillQty;
  order.avgFillPrice = fillPrice;
  order.timestampAcked = Date.now();
  order.lastVenueTimestamp = Date.now();

  if (fillQty < qty) {
    order.status = 'PARTIALLY_FILLED';
    addAudit(order, 'PARTIAL_FILL', `Venue filled ${fillQty}/${qty} contracts at $${fillPrice.toFixed(2)}. Remaining: ${qty - fillQty} contracts still open.`, { fillQty, remaining: qty - fillQty });
  } else {
    order.status = 'FILLED';
    addAudit(order, 'FILLED', `Order fully filled: ${fillQty} contracts at $${fillPrice.toFixed(2)}.`, { fillQty, fillPrice });
  }

  return order;
}

export function reconcileOrder(requestId: string): OrderStateRecord | null {
  const order = processedOrders.get(requestId);
  if (!order) return null;
  if (order.status !== 'ACK_LOST_PENDING_RECON') return order;

  addAudit(order, 'RECONCILE_STARTED', `Querying venue for order ${requestId}.`);

  // Reveal what the venue actually did
  const venueFilledQty = order._venueFilledQty ?? 0;
  const venueFillPrice = order._venueFillPrice ?? 0;

  order.filledQty = venueFilledQty;
  order.remainingQty = order.requestedQty - venueFilledQty;
  order.avgFillPrice = venueFillPrice;
  order.timestampAcked = Date.now();
  order.lastVenueTimestamp = Date.now();
  order.status = venueFilledQty < order.requestedQty ? 'PARTIALLY_FILLED' : 'FILLED';

  addAudit(order, 'RECONCILED', `Reconciliation complete. Venue confirmed: ${venueFilledQty}/${order.requestedQty} filled at $${venueFillPrice.toFixed(2)}. Remaining exposure: ${order.remainingQty} contracts.`, {
    filledQty: venueFilledQty,
    remainingQty: order.remainingQty,
    fillPrice: venueFillPrice,
  });

  return order;
}

export function isDuplicateOrder(requestId: string): boolean {
  return processedOrders.has(requestId);
}

export function getOrder(requestId: string): OrderStateRecord | undefined {
  return processedOrders.get(requestId);
}

export function resetVenue() {
  processedOrders.clear();
  auditLog = [];
}

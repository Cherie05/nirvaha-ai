import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Pushes aggregation changes to the vendor dashboard the moment they happen,
 * so a scan taken on someone's phone appears on the vendor's screen without
 * anyone pressing refresh.
 *
 * CORS is open because the dashboard is served from a different origin
 * (localhost:5173 in dev, a CDN if deployed).
 */
@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class AggregationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AggregationGateway.name);

  @WebSocketServer()
  server: Server;

  private clients = 0;

  handleConnection(client: Socket) {
    this.clients++;
    this.logger.log(
      `Vendor dashboard connected (${client.id}) — ${this.clients} online`,
    );
  }

  handleDisconnect(client: Socket) {
    this.clients = Math.max(0, this.clients - 1);
    this.logger.log(
      `Vendor dashboard disconnected (${client.id}) — ${this.clients} online`,
    );
  }

  /** A household added plastic to their Digital Bin. */
  emitBinUpdated(payload: {
    zone: string;
    userId: string;
    materialType: string;
    weightGrams: number;
  }) {
    this.server?.emit('bin:updated', { ...payload, at: Date.now() });
  }

  /**
   * A household pressed "Schedule pickup". Stronger than [emitBinUpdated] —
   * this zone is not just heavy, someone is actively waiting on it.
   */
  emitPickupRequested(payload: {
    zone: string;
    userId: string;
    weightGrams: number;
    itemCount: number;
  }) {
    this.server?.emit('pickup:requested', { ...payload, at: Date.now() });
  }

  /** A vendor took a zone — every dashboard should drop it from the list. */
  emitRouteClaimed(payload: {
    zone: string;
    vendorId: string;
    householdsNotified: number;
  }) {
    this.server?.emit('route:claimed', { ...payload, at: Date.now() });
  }

  /** A claimed route was marked collected. */
  emitRouteCollected(payload: { zone: string; vendorId: string }) {
    this.server?.emit('route:collected', { ...payload, at: Date.now() });
  }
}

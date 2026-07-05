import { describe, expect, it } from "vitest";

import {
  createWorkOrderFromTicket,
  getTicket,
  listTicketEvents,
  listTickets,
} from "./tickets";
import { completeWorkOrder } from "./workorders";

// Integration over the MSW layer (resetMockDb runs before each test). Proves
// the repair loop (P3.B.4): a repair WO created from a ticket carries the
// ticketId, and completing it auto-resolves the ticket + logs a timeline event.
describe("repair loop (P3.B.4)", () => {
  it("links the repair WO to its ticket and closes the ticket on completion", async () => {
    const { items } = await listTickets();
    const ticket = items.find(
      (t) => t.status !== "resolved" && t.status !== "breached",
    );
    if (!ticket) throw new Error("seed has no open ticket");

    const wo = await createWorkOrderFromTicket(ticket.id);
    expect(wo.type).toBe("repair");
    expect(wo.ticketId).toBe(ticket.id);

    await completeWorkOrder(wo.id);

    const closed = await getTicket(ticket.id);
    // Resolving past the SLA deadline records 'breached' instead of 'resolved';
    // either is a terminal close.
    expect(["resolved", "breached"]).toContain(closed.status);

    const { items: events } = await listTicketEvents(ticket.id);
    expect(
      events.some((e) => e.kind === "workorder" && e.body.includes(wo.code)),
    ).toBe(true);
  });
});

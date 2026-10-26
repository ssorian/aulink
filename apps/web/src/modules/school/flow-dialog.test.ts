// @ts-expect-error — Bun test types are not part of the browser app.
import { expect, test } from "bun:test";
import { flowDraftKey, type Flow } from "./flow-dialog";
test("draft identity separates dates and preserves other flow identities", () => {
 const flow: Flow = { kind: "exception", title: "Sin clases", description: "", fields: [], values: { date: "2026-04-01" } };
 expect(flowDraftKey(flow)).not.toBe(flowDraftKey({...flow, values:{date:"2026-04-02"}}));
 expect(flowDraftKey(flow)).toBe(flowDraftKey({...flow}));
 expect(flowDraftKey({...flow,values:{id:"a"}})).not.toBe(flowDraftKey({...flow,values:{id:"b"}}));
});

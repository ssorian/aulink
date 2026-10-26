// @ts-expect-error — Bun test types are not part of the browser app.
import { expect, test } from "bun:test";
import { openCalendarDayAction } from "./calendar-day-actions";
import type { ViewProps } from "./view-types";
import { initialState } from "./workflows";
test("day actions prefill dates and create reviewable drafts with contextual audience validation", () => {
 const s = initialState();
 const calls: Parameters<ViewProps["open"]>[] = [];
 const open: ViewProps["open"] = (...args) => { calls.push(args); };
 for (const kind of ["exception", "calendar-holiday", "calendar-event"] as const) openCalendarDayAction(kind, "2026-04-02", s, open);
 expect(calls.map(c=>c[0])).toEqual(["exception","calendar-holiday","calendar-event"]);
 for(const c of calls) expect(c[3]?.date).toBe("2026-04-02");
 expect(calls[0][2].some(f=>f.key === "reason")).toBe(true);
 expect(calls[1][3]?.title).toBe("Feriado");
 expect(calls[1][4]?.join(" ")).toContain("asistencia");
 const event = calls[2];
 expect(event[3]?.audience).toBe("school");
 expect(event[2].find(f=>f.key === "text")?.rows).toBe(8);
 const target = event[2].find(f=>f.key === "target")!;
 expect(target.optional).toBe(true);
 expect(target.validate?.("",{audience:"school"})).toBeUndefined();
 expect(target.validate?.("",{audience:"group"})).toBeTruthy();
 expect(target.validate?.("missing",{audience:"student"})).toBeTruthy();
 expect(target.validate?.(s.groups[0].id,{audience:"group"})).toBeUndefined();
 expect(target.validate?.(s.students[0].id,{audience:"student"})).toBeUndefined();
 expect(target.validate?.(s.students[0].id,{audience:"group"})).toBeTruthy();
 expect(target.validate?.(s.groups[0].id,{audience:"student"})).toBeTruthy();
 expect(event[4]?.join(" ")).toContain("borrador");
});

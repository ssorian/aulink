import { expect, test } from "bun:test";
import { apply, initialState, restore } from "../apps/web/src/modules/school/workflows";

const dates = { startDate: "2028-02-29", endDate: "2028-07-01" };
test("legacy snapshots and legacy create keep dates absent", () => {
 const s = initialState();
 expect(restore(JSON.stringify(s))).toEqual(s);
 expect(apply(s, { kind: "cycle", data: { name: "Nuevo" } }).cycles.at(-1)).not.toHaveProperty("startDate");
});
test("create and restore retain exact cycle dates", () => {
 const s = apply(initialState(), { kind: "cycle", data: { name: "Nuevo", ...dates } });
 expect(s.cycles.at(-1)).toMatchObject(dates);
 expect(restore(JSON.stringify(s))).toEqual(s);
});
test("edit dates preserves identity and all other state", () => {
 const s = initialState();
 const next = apply(s, { kind: "cycle-dates", data: { id: "c1", ...dates } });
 expect(next).toEqual({ ...s, cycles: [{ ...s.cycles[0], ...dates }] });
 expect(s.cycles[0]).not.toHaveProperty("startDate");
 expect(apply(next, {kind: "cycle-dates", data: { id: "c1", startDate: dates.startDate, endDate: dates.startDate }}).cycles[0]?.endDate).toBe(dates.startDate);
});
for (const range of [ {startDate: "2028-02-29"}, {endDate: "2028-07-01"}, {startDate: "", endDate: ""}, {startDate: "2027-02-29", endDate: "2028-07-01"}, {startDate: "2028-04-31", endDate: "2028-07-01"}, {startDate: "bad", endDate: "2028-07-01"}, {startDate: "2028-07-02", endDate: "2028-07-01"}, {startDate: "0000-01-01", endDate: "2028-07-01"}]) {
 test(`reject invalid range ${JSON.stringify(range)} without mutation`, () => {
  const s = initialState(); const before = structuredClone(s);
  for (const kind of ["cycle", "cycle-dates"]) expect(() => apply(s, {kind, data: {id: "c1", name: "Nuevo", ...range} as Record<string,string>})).toThrow();
  expect(restore(JSON.stringify({...s, cycles: [{...s.cycles[0], ...range}]}))).toBeNull();
  expect(s).toEqual(before);
 });
}
test("date editing requires existing cycle and complete range", () => {
 for (const data of [{id: "missing", ...dates}, {id: "c1"}]) expect(() => apply(initialState(), {kind: "cycle-dates", data})).toThrow();
});

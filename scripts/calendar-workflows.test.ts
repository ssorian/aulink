import { describe, expect, test } from "bun:test";
import { apply, initialState, restore } from "../apps/web/src/modules/school/shared/workflows";

const event = { date: "2026-10-20", title: "Festival", text: "Aviso del festival", audience: "school", target: "ignored" };

describe("calendar workflows", () => {
	test("old snapshots restore with optional defaults without losing data", () => {
		const raw = JSON.parse(JSON.stringify(initialState()));
		delete raw.calendarHolidays;
		delete raw.calendarEvents;
		raw.school.name = "Escuela conservada";
		const restored = restore(JSON.stringify(raw));
		expect(restored).toEqual({ ...raw, calendarHolidays: [], calendarEvents: [] });
		expect(restore(JSON.stringify(restored))).toEqual(restored);
	});
	test("holiday is visual only, rejects duplicate dates, and roundtrips", () => {
		const before = initialState();
		const next = apply(before, { kind: "calendar-holiday", data: event });
		expect(next.calendarHolidays).toEqual([{ id: expect.any(String), date: event.date, title: event.title }]);
		for (const key of ["exceptions", "events", "notices"] as const) expect(next[key]).toEqual(before[key]);
		expect(before.calendarHolidays).toEqual([]);
		expect(restore(JSON.stringify(next))).toEqual(next);
		expect(() => apply(next, { kind: "calendar-holiday", data: { ...event, title: "Otro" } })).toThrow();
		expect(next.calendarHolidays).toHaveLength(1);
	});
	for (const [audience, target] of [["school", "ignored"], ["group", "g1"], ["student", "s1"]]) {
		test(`event links an unpublished notice for ${audience}`, () => {
			const before = initialState();
			const next = apply(before, { kind: "calendar-event", data: { ...event, audience, target } });
			const notice = next.notices[0];
			expect(notice).toEqual({ id: expect.any(String), title: event.title, text: event.text, audience, target: audience === "school" ? "" : target, published: false, recipients: [] });
			expect(next.calendarEvents).toEqual([{ id: expect.any(String), date: event.date, title: event.title, noticeId: notice.id }]);
			expect(next.calendarEvents[0].id).not.toBe(notice.id);
			expect(next.events).toEqual(before.events);
			expect(next.exceptions).toEqual(before.exceptions);
			expect(before).toEqual(initialState());
			expect(restore(JSON.stringify(next))).toEqual(next);
		});
	}
	for (const kind of ["calendar-event", "calendar-holiday"]) {
		for (const patch of [{ date: "" }, { date: "2026-02-30" }, { date: "20/10/2026" }, { title: "  " }]) {
			test(`${kind} rejects ${JSON.stringify(patch)} atomically`, () => {
				const state = initialState();
				expect(() => apply(state, { kind, data: { ...event, ...patch } })).toThrow();
				expect(state).toEqual(initialState());
			});
		}
	}
	for (const patch of [{ text: " " }, { audience: "" }, { audience: "other" }, { audience: "group", target: "" }, { audience: "group", target: "s1" }, { audience: "student", target: "" }, { audience: "student", target: "g1" }]) {
		test(`event rejects ${JSON.stringify(patch)} atomically`, () => {
			const state = initialState();
			expect(() => apply(state, { kind: "calendar-event", data: { ...event, ...patch } })).toThrow();
			expect(state).toEqual(initialState());
		});
	}
	test("persisted calendar dates must be real ISO dates", () => {
		for (const key of ["calendarHolidays", "calendarEvents"]) {
			expect(restore(JSON.stringify({ ...initialState(), [key]: [{ id: "x", date: "2026-02-30", title: "Festival", noticeId: "n" }] }))).toBeNull();
		}
	});
	test("later publication still requires currently verified guardians", () => {
		const draft = apply(initialState(), { kind: "calendar-event", data: event });
		const id = draft.notices[0].id;
		const revoked = apply(draft, { kind: "guardian-status", data: { id: "l1", status: "Revocado", reason: "Prueba" } });
		expect(() => apply(revoked, { kind: "notice-publish", data: { id } })).toThrow("No hay tutores verificados");
		expect(revoked.notices[0]).toMatchObject({ published: false, recipients: [] });
		const published = apply(draft, { kind: "notice-publish", data: { id } });
		expect(published.notices[0]).toMatchObject({ published: true, recipients: [draft.links[0].name] });
		expect(published.calendarEvents).toEqual(draft.calendarEvents);
		expect(draft.notices[0].published).toBe(false);
	});
});

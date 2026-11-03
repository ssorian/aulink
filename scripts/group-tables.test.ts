import { expect, test } from "bun:test";
import { createRequire } from "node:module";
import { GroupAttendanceTable } from "../apps/web/src/modules/school/group-attendance-table";
import { GroupWorkspace } from "../apps/web/src/modules/school/group-workspace";
import { GroupGradesTable } from "../apps/web/src/modules/school/group-grades-table";
const requireWeb = createRequire(new URL("../apps/web/package.json", import.meta.url));
const { createElement } = requireWeb("react");
const { renderToStaticMarkup } = requireWeb("react-dom/server");
import { attendanceStatus, rangeDays, gradeAverage } from "../apps/web/src/modules/school/group-table-helpers";
import { initialState } from "../apps/web/src/modules/school/workflows";
import { groupScope } from "../apps/web/src/modules/school/group-context";
test("rendered tables expose scoped evidence, accessible days and draft grades", () => {
 const s=initialState();
 s.events.push({...s.events[0],id:"foreign",student:"s2",group:"g2",kind:"Inasistencia"});
 const attendance=renderToStaticMarkup(createElement(GroupAttendanceTable,{s,groupId:"g1",open:()=>{}}));
 expect(attendance).toContain("<table");
 expect(attendance).toContain("Ana Sofía Mendoza Ruiz · 2026-10-19: Entrada sin salida");
 expect(attendance).not.toContain("Leonardo Castillo Vega");
 expect((attendance.match(/class=\"day-square\"/g)||[]).length).toBe(7);
 s.assignments=[{id:"a",subject:"Historia",period:"P1",teacher:"Demo",min:0,max:10,group:"g1"}];
 s.grades=[{id:"r",student:"s1",assignment:"a",value:8,published:false,history:[]}];
 const grades=renderToStaticMarkup(createElement(GroupGradesTable,{s,groupId:"g1",open:()=>{}}));
 expect(grades).toContain("Borrador");
 expect(grades).toContain("Con borradores");
 expect(grades).not.toContain("Corregir con motivo");
 expect(grades).not.toContain("Capturar P1");
 const workspace=renderToStaticMarkup(createElement(GroupWorkspace,{s,groupId:"g1",open:()=>{},onBack:()=>{},onStudent:()=>{},onNotice:()=>{},tab:"Alumnos",setTab:()=>{}}));
 for (const [markup,label] of [[attendance,"Asistencia por alumno y día"],[grades,"Calificaciones por alumno"],[workspace,"Alumnos del grupo"]]) {
  const region=markup.match(/<section\b[^>]*class="(?:group-table-scroll|ui-table-scroll)[^"]*"[^>]*>/)?.[0];
  expect(region).toBeDefined();
  expect(region).toContain('tabindex="0"');
  expect(region).toContain(`aria-label="${label}`);
  expect(region).not.toContain('role=');
 }
});
test("calendar ranges use calendar days, Monday weeks and leap months", () => {
 expect(rangeDays("2024-02-15", "Mes")).toHaveLength(29);
 expect(rangeDays("2026-01-18", "Semana")[0]).toBe("2026-01-12");
 expect(rangeDays("", "Día")).toEqual([]);
});
test("attendance requires explicit evidence and ordered entry/exit", () => {
 const e = initialState().events[0];
 expect(attendanceStatus([])).toBe("Sin registros");
 expect(attendanceStatus([e])).toBe("Entrada sin salida");
 expect(attendanceStatus([e, {...e, time:"14:00", kind:"Salida"}])).toBe("Entrada y salida");
 expect(attendanceStatus([e, {...e, time:"06:00", kind:"Salida"}])).toBe("Pendiente de revisión");
 expect(attendanceStatus([{...e,kind:"Inasistencia"}])).toBe("Inasistencia explícita");
 expect(attendanceStatus([{...e,kind:"Salida"}])).toBe("Pendiente de revisión");
 expect(groupScope({...initialState(),events:[{...e,cycle:"other"}]},"g1").events).toEqual([]);
});
test("averages omit missing values and reject mixed scales or subjects", () => {
 const a = {id:"a",group:"g1",subject:"Historia",period:"P1",teacher:"Demo",min:0,max:10};
 const b = {...a,id:"b",period:"P2"};
 const grade = {id:"r",assignment:"a",student:"s1",value:8,published:false,history:[]};
 expect(gradeAverage([a,b],[grade],"s1")).toEqual({value:8,partial:true,draft:true});
 expect(gradeAverage([a,b],[],"s1").value).toBeNull();
 expect(gradeAverage([a,{...b,max:100}],[grade],"s1").value).toBeNull();
 expect(gradeAverage([a,{...b,subject:"Otra"}],[grade],"s1").value).toBeNull();
 expect(gradeAverage([a,b],[grade,{...grade,id:"r2",assignment:"b",value:0,published:true}],"s1").value).toBe(4);
});

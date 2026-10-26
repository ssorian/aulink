import { expect, test } from "bun:test";
import { validateFlow } from "../apps/web/src/modules/school/flow-validation";
import { communicationSummary, validateCommunicationTarget } from "../apps/web/src/modules/school/communication-summary";
import { initialState } from "../apps/web/src/modules/school/workflows";

test("field validation rejects whitespace, invalid email and nonfinite numbers", () => {
 const fields = [{key:"name",label:"Nombre"}, {key:"email",label:"Correo",type:"email"}, {key:"value",label:"Valor",type:"number"}];
 expect(Object.keys(validateFlow(fields, {name:"  ",email:"bad@",value:"Infinity"}))).toEqual(["name","email","value"]);
 expect(validateFlow(fields, {name:" Ana ",email:"ana@example.com",value:"2.5"})).toEqual({});
 expect(validateFlow([{key:"x",label:"Opcional",optional:true,type:"email"}], {x:" "})).toEqual({});
 expect(validateFlow([{key:"x",label:"Número",type:"number"}], {x:"0x12"})).toHaveProperty("x");
});

test("contextual target validation rejects incompatible audiences before review", () => {
 const s = initialState();
 const fields = [{
  key: "target", label: "Destino", optional: true,
  validate: (value: string, values: Record<string, string>) =>
   validateCommunicationTarget(s, values.audience, value),
 }];
 for (const [audience, target] of [["group", ""], ["group", "s1"], ["student", "g1"], ["student", ""], ["group", "missing"]]) {
  expect(validateFlow(fields, {audience, target})).toHaveProperty("target");
 }
 for (const [audience, target] of [["school", ""], ["group", "g1"], ["student", "s1"]]) {
  expect(validateFlow(fields, {audience, target})).toEqual({});
 }
});

test("publication summary names scope and preserves published recipient snapshot", () => {
 const s = initialState();
 const n = {id:"n",title:"Título",text:"Público",audience:"group",target:"g1",published:false,recipients:[]};
 const summary = communicationSummary(s,n);
 expect(summary.audience).toContain("1° A");
 expect(summary.audience).toContain("2026–2027");
 expect(summary.recipients).toEqual(["Mariana Ruiz Salcedo"]);
 expect(summary.canPublish).toBe(true);
 expect(summary.preview).toEqual({title:"Título",text:"Público"});
 expect(communicationSummary(s,{...n,target:"g2"}).canPublish).toBe(false);
 expect(communicationSummary(s,{...n,audience:"student",target:"s1"}).audience).toContain("Ana Sofía Mendoza Ruiz");
 expect(communicationSummary(s,{...n,audience:"school"}).audience).toContain(s.school.name);
 expect(communicationSummary(s,{...n,published:true,recipients:["Original"]}).recipients).toEqual(["Original"]);
 expect(communicationSummary(s,{...n,published:true}).canPublish).toBe(false);
});

import { DevicesView } from "./credentials-view";
import { field, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
export function SetupView({
	s,
	open,
	storageStatus,
	onLoadExamples,
	tab = "Escuela",
}: Pick<ViewProps, "s" | "open"> & {
	storageStatus?: string;
	onLoadExamples?: () => void;
	tab?: "Escuela" | "Ciclos y calendario" | "Terminales";
}) {
	return (
		<>
			{tab === "Escuela" && (
				<section className="panel">
					<h2>Identidad y operación</h2>
					<p>
						{s.school.name} · {s.school.timezone} · {s.school.shift}
					</p>
					<button
						type="button"
						onClick={() =>
							open(
								"school",
								"Editar institución",
								[
									field("name", "Institución"),
									field("timezone", "Zona horaria IANA"),
									field("shift", "Turno"),
								],
								s.school,
							)
						}
					>
						Editar institución
					</button>
					<p>
						Las escalas académicas pertenecen a cada asignación en Gestión
						académica → Grupos → Horario. No hay una escala global que
						sobrescriba registros históricos.
					</p>
				</section>
			)}
			{tab === "Ciclos y calendario" && (
				<div className="two-columns">
					<section className="panel">
						<h2>Ciclos escolares</h2>
						<button
							type="button"
							onClick={() =>
								open("cycle", "Crear ciclo", [
									field("name", "Nombre del ciclo"),
								])
							}
						>
							Crear ciclo
						</button>
						{s.cycles.map((c) => (
							<article className="list-row" key={c.id}>
								<h3>{c.name}</h3>
								<p>
									{s.groups.filter((g) => g.cycle === c.id).length} grupos ·
									administra sus alumnos y materias en Grupos.
								</p>
							</article>
						))}
					</section>
					<section className="panel">
						<h2>Calendario global</h2>
						<button
							type="button"
							onClick={() =>
								open("exception", "Agregar día sin clase", [
									field("date", "Fecha", "date"),
									reason,
								])
							}
						>
							Agregar día sin clase
						</button>
						{s.exceptions.map((x) => (
							<p key={x.id}>
								{x.date} · {x.reason}
							</p>
						))}
						<p>No se generan faltas automáticas.</p>
					</section>
				</div>
			)}
			{tab === "Terminales" && <DevicesView s={s} open={open} />}
			{tab === "Escuela" && (
				<details className="storage-tools">
					<summary>Almacenamiento y herramientas</summary>
					<p>
						Los cambios se guardan en este navegador. Los servicios externos
						están sin conexión.
					</p>
					{storageStatus && <output>{storageStatus}</output>}
					{onLoadExamples && (
						<button type="button" onClick={onLoadExamples}>
							Añadir registros de ejemplo
						</button>
					)}
				</details>
			)}
		</>
	);
}

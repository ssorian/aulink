import { createFileRoute } from "@tanstack/react-router";
import { SchoolApp } from "../modules/school/shell/school-app";

export const Route = createFileRoute("/")({ component: SchoolApp });

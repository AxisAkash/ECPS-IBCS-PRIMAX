"use client";

import { httpServices } from "./http";
import { mockServices } from "./mock";
import type { EcpsServices } from "./types";

const mode = process.env.NEXT_PUBLIC_ECPS_API_MODE === "http" ? "http" : "mock";

/** Single entry point for all ECPS actions. Defaults to the mock demonstration adapter. */
export const ecps: EcpsServices = mode === "http" ? httpServices : mockServices;
export type { EcpsServices } from "./types";

// Orbit Website — Moth Behaviour Stabilizer Autoload
// Drop into: js/moth-behaviour-autoload.js
// Then load this module BEFORE ./js/main.js in index.html.

import * as THREE from "https://esm.sh/three@0.160.0";
import { MothSystem } from "./moth-system.js";
import { installMothBehaviourStabilizer } from "./moth-behaviour-stabilizer.js";

installMothBehaviourStabilizer(MothSystem, THREE);

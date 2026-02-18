import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "airabot", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "airabot", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "airabot", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "airabot", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "airabot", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "airabot", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "airabot", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "airabot"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "airabot", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "airabot", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "airabot", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "airabot", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "airabot", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "airabot", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "airabot", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "airabot", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "airabot", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "airabot", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "airabot", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "airabot", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "airabot", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "airabot", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["node", "airabot", "status"],
    });
    expect(nodeArgv).toEqual(["node", "airabot", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["node-22", "airabot", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "airabot", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["node-22.2.0.exe", "airabot", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "airabot", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["node-22.2", "airabot", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "airabot", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["node-22.2.exe", "airabot", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "airabot", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["/usr/bin/node-22.2.0", "airabot", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "airabot", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["nodejs", "airabot", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "airabot", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["node-dev", "airabot", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "airabot", "node-dev", "airabot", "status"]);

    const directArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["airabot", "status"],
    });
    expect(directArgv).toEqual(["node", "airabot", "status"]);

    const bunArgv = buildParseArgv({
      programName: "airabot",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "airabot",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "airabot", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "airabot", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "config", "get", "update"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "config", "unset", "update"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "models", "list"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "models", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "airabot", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "airabot", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["config", "get"])).toBe(false);
    expect(shouldMigrateStateFromPath(["models", "status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});

import type { AiraBotConfig } from "../config/config.js";

export function applyOnboardingLocalWorkspaceConfig(
  baseConfig: AiraBotConfig,
  workspaceDir: string,
): AiraBotConfig {
  return {
    ...baseConfig,
    agents: {
      ...baseConfig.agents,
      defaults: {
        ...baseConfig.agents?.defaults,
        workspace: workspaceDir,
      },
    },
    gateway: {
      ...baseConfig.gateway,
      mode: "local",
    },
  };
}

import 'dotenv/config';
import { Logger } from '@aneuhold/core-ts-lib';
import { parse } from 'jsonc-parser';
import Config from './ConfigDefinition';
import GitHubService from '../GitHubService';

export type ConfigEnv = 'local' | 'dev' | 'prod';

/**
 * A class which can be used to load configuration into the ConfigService
 * from a pre-defined location. This requries that a `.env` file exists in the
 * root of the project / machine with a `CONFIG_GITHUB_TOKEN` variable set.
 */
export default class ConfigService {
  static env: ConfigEnv | null = null;

  private static configObject: Config | null = null;

  /**
   * Returns the configuration object that has been loaded in for the current
   * environment.
   */
  static get config(): Config {
    if (!ConfigService.configObject) {
      throw new Error(
        'ConfigService has not been initialized yet. Use ConfigService.useConfig() to initialize it.'
      );
    }
    return ConfigService.configObject;
  }

  static get isInitialized(): boolean {
    return !!ConfigService.configObject;
  }

  /**
   * Loads configuration from the GitHub repository into the ConfigService.
   */
  static async useConfig(env: ConfigEnv): Promise<void> {
    ConfigService.env = env;
    try {
      const jsonString = await GitHubService.getContentFromRepo(
        'config',
        `${env}.jsonc`
      );
      ConfigService.configObject = parse(jsonString) as Config;
    } catch (error) {
      Logger.error(`Failed to load ${env}.json, error: ${error as string}`);
      throw error;
    }
  }

  /**
   * Inserts the provided configuration into the local environment.
   *
   * This may not actually need to happen.
   */
  private static insertPropertiesIntoEnv(config: object) {
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'object') {
        ConfigService.insertPropertiesIntoEnv(value as object);
      } else {
        process.env[key] = value as string;
      }
    });
  }
}

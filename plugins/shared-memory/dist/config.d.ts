import { ConfigStatus } from './types';
export interface Config {
    mem0_api_key: string;
    default_scope: string;
    auto_summarize: boolean;
}
export declare function getConfigPath(): string;
export declare function checkConfig(): ConfigStatus;
export declare function saveConfig(config: Config): void;
export declare function loadConfig(): Config | null;
export declare function getMissingConfigMessage(): string;
//# sourceMappingURL=config.d.ts.map
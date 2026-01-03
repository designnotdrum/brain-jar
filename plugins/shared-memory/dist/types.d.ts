export interface Memory {
    id: string;
    content: string;
    scope: string;
    tags: string[];
    source: {
        agent: string;
        action?: string;
    };
    created_at: Date;
    updated_at: Date;
}
export interface AddMemoryInput {
    content: string;
    scope?: string;
    tags?: string[];
}
export interface SearchMemoryInput {
    query: string;
    scope?: string;
    limit?: number;
}
export interface ListMemoriesInput {
    scope?: string;
    tags?: string[];
    since?: string;
    limit?: number;
}
export interface ConfigStatus {
    status: 'configured' | 'missing';
    apiKey?: string;
    configPath: string;
}
//# sourceMappingURL=types.d.ts.map
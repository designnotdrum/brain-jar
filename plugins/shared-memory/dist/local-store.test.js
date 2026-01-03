"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const local_store_1 = require("./local-store");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
describe('LocalStore', () => {
    let store;
    let testDbPath;
    beforeEach(() => {
        testDbPath = path.join(os.tmpdir(), `test-memory-${Date.now()}.db`);
        store = new local_store_1.LocalStore(testDbPath);
    });
    afterEach(() => {
        store.close();
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });
    describe('add', () => {
        it('should add a memory and return it with id', () => {
            const memory = store.add({
                content: 'Test memory content',
                scope: 'global',
                tags: ['test'],
            });
            expect(memory.id).toBeDefined();
            expect(memory.content).toBe('Test memory content');
            expect(memory.scope).toBe('global');
            expect(memory.tags).toEqual(['test']);
        });
    });
    describe('search', () => {
        it('should find memories by content substring', () => {
            store.add({ content: 'User prefers TypeScript', scope: 'global', tags: [] });
            store.add({ content: 'Project uses React', scope: 'project:test', tags: [] });
            const results = store.search('TypeScript');
            expect(results).toHaveLength(1);
            expect(results[0].content).toContain('TypeScript');
        });
        it('should filter by scope', () => {
            store.add({ content: 'Global memory', scope: 'global', tags: [] });
            store.add({ content: 'Project memory', scope: 'project:test', tags: [] });
            const results = store.search('memory', 'global');
            expect(results).toHaveLength(1);
            expect(results[0].scope).toBe('global');
        });
    });
    describe('list', () => {
        it('should list all memories', () => {
            store.add({ content: 'Memory 1', scope: 'global', tags: [] });
            store.add({ content: 'Memory 2', scope: 'global', tags: [] });
            const results = store.list();
            expect(results).toHaveLength(2);
        });
        it('should filter by tags', () => {
            store.add({ content: 'Tagged', scope: 'global', tags: ['important'] });
            store.add({ content: 'Untagged', scope: 'global', tags: [] });
            const results = store.list({ tags: ['important'] });
            expect(results).toHaveLength(1);
            expect(results[0].content).toBe('Tagged');
        });
    });
    describe('delete', () => {
        it('should delete a memory by id', () => {
            const memory = store.add({ content: 'To delete', scope: 'global', tags: [] });
            const deleted = store.delete(memory.id);
            expect(deleted).toBe(true);
            const results = store.list();
            expect(results).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=local-store.test.js.map
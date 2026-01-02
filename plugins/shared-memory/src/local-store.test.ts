import { LocalStore } from './local-store';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('LocalStore', () => {
  let store: LocalStore;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `test-memory-${Date.now()}.db`);
    store = new LocalStore(testDbPath);
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

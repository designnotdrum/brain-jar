import { AnalyzeCaptureTool } from './analyze-capture';

const SAMPLE_HAR = JSON.stringify({
  log: {
    version: '1.2',
    entries: [
      {
        request: {
          method: 'GET',
          url: 'https://api.example.com/v1/status',
          headers: [{ name: 'Authorization', value: 'Bearer token123' }],
        },
        response: {
          status: 200,
          headers: [],
          content: { text: '{"status":"ok"}' },
        },
      },
    ],
  },
});

describe('AnalyzeCaptureTool', () => {
  let tool: AnalyzeCaptureTool;

  beforeEach(() => {
    tool = new AnalyzeCaptureTool();
  });

  describe('analyze', () => {
    it('auto-detects HAR format', async () => {
      const result = await tool.analyze(SAMPLE_HAR);

      expect(result.format).toBe('har');
      expect(result.parsed.endpoints).toHaveLength(1);
    });

    it('returns formatted analysis', async () => {
      const result = await tool.analyze(SAMPLE_HAR);

      expect(result.formatted).toContain('GET');
      expect(result.formatted).toContain('/v1/status');
      expect(result.formatted).toContain('bearer');
    });
  });

  describe('format detection', () => {
    it('detects HAR by log property', () => {
      expect(tool.detectFormat('{"log":{"entries":[]}}')).toBe('har');
    });

    it('detects curl output', () => {
      const curl = '< HTTP/1.1 200 OK\n< Content-Type: application/json';
      expect(tool.detectFormat(curl)).toBe('curl');
    });

    it('returns unknown for unrecognized format', () => {
      expect(tool.detectFormat('random text')).toBe('unknown');
    });
  });
});

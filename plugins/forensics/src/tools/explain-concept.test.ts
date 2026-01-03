import { ExplainConceptTool } from './explain-concept';

describe('ExplainConceptTool', () => {
  let tool: ExplainConceptTool;

  beforeEach(() => {
    tool = new ExplainConceptTool();
  });

  describe('explain', () => {
    it('returns explanation for known concept', async () => {
      const result = await tool.explain('HAR file');

      expect(result.concept).toBe('HAR file');
      expect(result.explanation).toContain('HTTP Archive');
      expect(result.skillLevel).toBe('beginner');
    });

    it('returns explanation for mitmproxy', async () => {
      const result = await tool.explain('mitmproxy');

      expect(result.explanation).toContain('proxy');
      expect(result.relatedConcepts).toContain('HTTPS');
    });

    it('handles unknown concepts gracefully', async () => {
      const result = await tool.explain('xyzzy123');

      expect(result.explanation).toContain('not familiar');
      expect(result.suggestSearch).toBe(true);
    });
  });

  describe('getConceptsForMode', () => {
    it('returns protocol-related concepts for protocol mode', () => {
      const concepts = tool.getConceptsForMode('protocol');

      expect(concepts).toContain('Har File');
      expect(concepts).toContain('Mitmproxy');
      expect(concepts).toContain('Rest Api');
    });

    it('returns feature-related concepts for feature mode', () => {
      const concepts = tool.getConceptsForMode('feature');

      expect(concepts).toContain('Competitive Analysis');
    });
  });
});

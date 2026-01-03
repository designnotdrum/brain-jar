import { SuggestNextStepTool, InvestigationContext } from './suggest-next-step';

describe('SuggestNextStepTool', () => {
  let tool: SuggestNextStepTool;

  beforeEach(() => {
    tool = new SuggestNextStepTool();
  });

  describe('protocol mode', () => {
    it('suggests capture when no capture exists', async () => {
      const context: InvestigationContext = {
        mode: 'protocol',
        skillLevel: 'beginner',
        hasCapture: false,
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('capture');
      expect(result.explanation).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(0);
    });

    it('suggests analysis when capture exists but no spec', async () => {
      const context: InvestigationContext = {
        mode: 'protocol',
        skillLevel: 'beginner',
        hasCapture: true,
        hasSpec: false,
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('analy');
      expect(result.explanation).toBeDefined();
    });

    it('suggests implementation when spec exists', async () => {
      const context: InvestigationContext = {
        mode: 'protocol',
        skillLevel: 'beginner',
        hasCapture: true,
        hasSpec: true,
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('implement');
      expect(result.explanation).toBeDefined();
    });
  });

  describe('skill level verbosity', () => {
    it('provides commands and tips for beginners', async () => {
      const context: InvestigationContext = {
        mode: 'protocol',
        skillLevel: 'beginner',
        hasCapture: false,
      };

      const result = await tool.suggest(context);

      expect(result.commands).toBeDefined();
      expect(result.commands!.length).toBeGreaterThan(0);
      expect(result.tips).toBeDefined();
      expect(result.tips!.length).toBeGreaterThan(0);
    });

    it('omits commands and tips for advanced users', async () => {
      const context: InvestigationContext = {
        mode: 'protocol',
        skillLevel: 'advanced',
        hasCapture: false,
      };

      const result = await tool.suggest(context);

      expect(result.commands).toBeUndefined();
      expect(result.tips).toBeUndefined();
    });

    it('provides shorter explanation for advanced users', async () => {
      const beginnerContext: InvestigationContext = {
        mode: 'protocol',
        skillLevel: 'beginner',
        hasCapture: false,
      };

      const advancedContext: InvestigationContext = {
        mode: 'protocol',
        skillLevel: 'advanced',
        hasCapture: false,
      };

      const beginnerResult = await tool.suggest(beginnerContext);
      const advancedResult = await tool.suggest(advancedContext);

      expect(beginnerResult.explanation.length).toBeGreaterThan(
        advancedResult.explanation.length
      );
    });
  });

  describe('feature mode', () => {
    it('suggests research when no research exists', async () => {
      const context: InvestigationContext = {
        mode: 'feature',
        skillLevel: 'beginner',
        hasResearch: false,
        targetFeature: 'authentication',
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('research');
      expect(result.explanation).toBeDefined();
    });

    it('suggests mapping when research exists', async () => {
      const context: InvestigationContext = {
        mode: 'feature',
        skillLevel: 'beginner',
        hasResearch: true,
        targetFeature: 'authentication',
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('map');
      expect(result.explanation).toBeDefined();
    });
  });

  describe('codebase mode', () => {
    it('suggests entry point identification', async () => {
      const context: InvestigationContext = {
        mode: 'codebase',
        skillLevel: 'beginner',
        targetCodebase: 'my-project',
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('entry');
      expect(result.explanation).toBeDefined();
    });
  });

  describe('decision mode', () => {
    it('suggests git history analysis', async () => {
      const context: InvestigationContext = {
        mode: 'decision',
        skillLevel: 'beginner',
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('git');
      expect(result.explanation).toBeDefined();
    });
  });

  describe('format mode', () => {
    it('suggests byte pattern analysis', async () => {
      const context: InvestigationContext = {
        mode: 'format',
        skillLevel: 'beginner',
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('byte');
      expect(result.explanation).toBeDefined();
    });
  });

  describe('default behavior', () => {
    it('suggests mode selection for unknown mode', async () => {
      const context = {
        mode: 'unknown' as any,
        skillLevel: 'beginner' as const,
      };

      const result = await tool.suggest(context);

      expect(result.step.toLowerCase()).toContain('mode');
      expect(result.explanation).toBeDefined();
    });
  });
});

import { getForensicsMemory, type SkillLevel, type InvestigationMode } from '../interop/index.js';

export interface InvestigationContext {
  mode: InvestigationMode;
  skillLevel?: SkillLevel; // Now optional, will use profile if not provided
  hasCapture?: boolean;
  hasSpec?: boolean;
  hasResearch?: boolean;
  targetFeature?: string;
  targetCodebase?: string;
}

export interface NextStepSuggestion {
  step: string;
  explanation: string;
  commands?: string[];
  tips?: string[];
  userStack?: { languages: string[]; frameworks: string[] }; // For implementation suggestions
}

export class SuggestNextStepTool {
  private memory = getForensicsMemory();

  /**
   * Suggest next step. Now async to fetch skill level from profile.
   */
  async suggest(context: InvestigationContext): Promise<NextStepSuggestion> {
    // Get skill level from profile if not explicitly provided
    const skillLevel = context.skillLevel || await this.memory.getSkillLevel();
    const contextWithSkill = { ...context, skillLevel };

    // Get user stack for implementation suggestions
    const userStack = await this.memory.getUserStack();

    let suggestion: NextStepSuggestion;
    switch (context.mode) {
      case 'protocol':
        suggestion = this.suggestProtocolStep(contextWithSkill, userStack);
        break;
      case 'feature':
        suggestion = this.suggestFeatureStep(contextWithSkill);
        break;
      case 'codebase':
        suggestion = this.suggestCodebaseStep(contextWithSkill);
        break;
      case 'decision':
        suggestion = this.suggestDecisionStep(contextWithSkill);
        break;
      case 'format':
        suggestion = this.suggestFormatStep(contextWithSkill);
        break;
      default:
        suggestion = {
          step: 'Select a mode',
          explanation: 'Choose an investigation mode to get started.',
        };
    }

    // Include user stack in suggestion
    if (userStack.languages.length > 0 || userStack.frameworks.length > 0) {
      suggestion.userStack = userStack;
    }

    return suggestion;
  }

  /**
   * Synchronous version for compatibility. Uses beginner as default skill level.
   * @deprecated Use async suggest() instead
   */
  suggestSync(context: InvestigationContext): NextStepSuggestion {
    // Default to beginner if skillLevel not provided
    const contextWithSkill = {
      ...context,
      skillLevel: context.skillLevel || 'beginner' as SkillLevel,
    };

    switch (context.mode) {
      case 'protocol':
        return this.suggestProtocolStep(contextWithSkill);
      case 'feature':
        return this.suggestFeatureStep(contextWithSkill);
      case 'codebase':
        return this.suggestCodebaseStep(contextWithSkill);
      case 'decision':
        return this.suggestDecisionStep(contextWithSkill);
      case 'format':
        return this.suggestFormatStep(contextWithSkill);
      default:
        return {
          step: 'Select a mode',
          explanation: 'Choose an investigation mode to get started.',
        };
    }
  }

  private suggestProtocolStep(
    context: InvestigationContext & { skillLevel: SkillLevel },
    userStack?: { languages: string[]; frameworks: string[] }
  ): NextStepSuggestion {
    const isVerbose = context.skillLevel === 'beginner';

    if (!context.hasCapture) {
      return this.buildSuggestion({
        step: 'Capture network traffic',
        explanationVerbose:
          'Before you can analyze an API, you need to capture the network traffic between the client and server. This involves setting up a proxy to intercept HTTPS requests and recording them for analysis.',
        explanationTerse: 'Set up traffic capture with mitmproxy or browser DevTools.',
        commands: [
          'mitmproxy -p 8080',
          'mitmdump -w capture.flow',
          'Open browser DevTools > Network tab > Export HAR',
        ],
        tips: [
          'Use mitmproxy for comprehensive capture with HTTPS interception',
          'Browser DevTools is simpler but may miss some requests',
          'Remember to export captures for later analysis',
        ],
        isVerbose,
      });
    }

    if (!context.hasSpec) {
      return this.buildSuggestion({
        step: 'Analyze captured traffic',
        explanationVerbose:
          'Now that you have captured traffic, analyze it to identify API endpoints, authentication patterns, request/response formats, and any interesting behaviors. Look for patterns in headers, payloads, and status codes.',
        explanationTerse: 'Extract endpoints, auth patterns, and data formats from capture.',
        commands: [
          'Use analyze_capture tool with your HAR file',
          'grep for Authorization headers',
          'Look for JSON schemas in responses',
        ],
        tips: [
          'Focus on authentication flows first',
          'Document endpoint patterns (REST paths, query params)',
          'Note any rate limiting or pagination patterns',
        ],
        isVerbose,
      });
    }

    // Tailor implementation advice to user's stack
    const stackHint = this.getStackHint(userStack);

    return this.buildSuggestion({
      step: 'Implement the API client',
      explanationVerbose:
        `With your API specification in hand, you can now implement a client that replicates the observed behavior. ${stackHint}Start with authentication, then implement core endpoints, and add error handling based on observed error responses.`,
      explanationTerse: `Build client${stackHint ? ` in ${stackHint}` : ''} starting with auth, then core endpoints.`,
      commands: [
        'Create auth module matching observed flow',
        'Implement endpoints from your spec',
        'Add retry logic for observed error patterns',
      ],
      tips: [
        'Match headers exactly as observed',
        'Implement rate limiting if you observed 429 responses',
        'Test against real API with caution',
      ],
      isVerbose,
    });
  }

  private getStackHint(userStack?: { languages: string[]; frameworks: string[] }): string {
    if (!userStack || (userStack.languages.length === 0 && userStack.frameworks.length === 0)) {
      return '';
    }
    const parts: string[] = [];
    if (userStack.languages.length > 0) {
      parts.push(userStack.languages[0]); // Primary language
    }
    if (userStack.frameworks.length > 0) {
      parts.push(userStack.frameworks[0]); // Primary framework
    }
    return parts.length > 0 ? `Based on your profile, I'd suggest ${parts.join(' with ')}. ` : '';
  }

  private suggestFeatureStep(context: InvestigationContext): NextStepSuggestion {
    const isVerbose = context.skillLevel === 'beginner';

    if (!context.hasResearch) {
      const featureDesc = context.targetFeature
        ? ` for "${context.targetFeature}"`
        : '';

      return this.buildSuggestion({
        step: `Research competitive implementations${featureDesc}`,
        explanationVerbose:
          'Start by researching how other products implement this feature. Look at competitors, open source alternatives, and industry standards. This helps you understand common patterns and avoid reinventing the wheel.',
        explanationTerse: 'Survey competitive implementations and industry patterns.',
        commands: [
          'Search for similar features in open source projects',
          'Review competitor documentation and APIs',
          'Check relevant RFCs or standards',
        ],
        tips: [
          'Document what works well in existing implementations',
          'Note pain points users mention in forums/reviews',
          'Consider both technical and UX aspects',
        ],
        isVerbose,
      });
    }

    return this.buildSuggestion({
      step: 'Map feature to codebase components',
      explanationVerbose:
        'With research complete, map out how this feature would integrate with your existing codebase. Identify which components need modification, what new modules are needed, and how data will flow through the system.',
      explanationTerse: 'Identify components, modules, and data flows for integration.',
      commands: [
        'Create architecture diagram',
        'List affected files and modules',
        'Define interfaces between components',
      ],
      tips: [
        'Start with the data model',
        'Consider backward compatibility',
        'Plan for incremental delivery',
      ],
      isVerbose,
    });
  }

  private suggestCodebaseStep(context: InvestigationContext): NextStepSuggestion {
    const isVerbose = context.skillLevel === 'beginner';
    const codebaseDesc = context.targetCodebase
      ? ` for "${context.targetCodebase}"`
      : '';

    return this.buildSuggestion({
      step: `Identify entry points${codebaseDesc}`,
      explanationVerbose:
        'When exploring an unfamiliar codebase, start by finding the entry points. These are where execution begins (main functions, route handlers, event listeners) and provide a roadmap for understanding the rest of the code.',
      explanationTerse: 'Find main(), route handlers, and event listeners.',
      commands: [
        'grep -r "main\\|entry\\|app\\.listen" .',
        'Look for package.json "main" or "bin" fields',
        'Search for route definitions or command handlers',
      ],
      tips: [
        'README and docs often point to entry points',
        'Build scripts reveal how the app is started',
        'Tests can show how components are used',
      ],
      isVerbose,
    });
  }

  private suggestDecisionStep(context: InvestigationContext): NextStepSuggestion {
    const isVerbose = context.skillLevel === 'beginner';

    return this.buildSuggestion({
      step: 'Analyze git history for decisions',
      explanationVerbose:
        'Git history is a goldmine for understanding why code was written a certain way. Look at commit messages, pull request descriptions, and blame annotations to uncover the reasoning behind architectural decisions.',
      explanationTerse: 'Use git log, blame, and PR history to understand decisions.',
      commands: [
        'git log --oneline --since="1 year ago" -- <file>',
        'git blame <file>',
        'git log --grep="why\\|because\\|decision"',
      ],
      tips: [
        'Large commits often indicate architectural changes',
        'Look for commit messages mentioning "refactor" or "fix"',
        'Check if there are ADRs (Architecture Decision Records)',
      ],
      isVerbose,
    });
  }

  private suggestFormatStep(context: InvestigationContext): NextStepSuggestion {
    const isVerbose = context.skillLevel === 'beginner';

    return this.buildSuggestion({
      step: 'Analyze byte patterns and structure',
      explanationVerbose:
        'For binary format reverse engineering, start by examining byte patterns. Look for magic numbers (file signatures), length fields, string tables, and repeating structures. Tools like hex editors and xxd help visualize the data.',
      explanationTerse: 'Find magic bytes, length fields, and repeating structures.',
      commands: [
        'xxd <file> | head -100',
        'file <file>',
        'hexdump -C <file> | less',
      ],
      tips: [
        'Magic bytes are usually in the first 4-8 bytes',
        'Look for 0x00 null terminators for strings',
        'Powers of 2 often indicate struct sizes',
      ],
      isVerbose,
    });
  }

  private buildSuggestion(params: {
    step: string;
    explanationVerbose: string;
    explanationTerse: string;
    commands: string[];
    tips: string[];
    isVerbose: boolean;
  }): NextStepSuggestion {
    const { step, explanationVerbose, explanationTerse, commands, tips, isVerbose } =
      params;

    if (isVerbose) {
      return {
        step,
        explanation: explanationVerbose,
        commands,
        tips,
      };
    }

    return {
      step,
      explanation: explanationTerse,
    };
  }
}

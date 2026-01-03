import { getForensicsMemory, type SkillLevel } from '../interop/index.js';

export interface ConceptExplanation {
  concept: string;
  explanation: string;
  skillLevel: SkillLevel;
  relatedConcepts: string[];
  suggestSearch: boolean;
  alreadyKnown: boolean; // True if user has seen this before
}

interface ConceptDefinition {
  explanation: string;
  briefExplanation: string; // Shorter version for users who already know
  relatedConcepts: string[];
  modes: string[];
}

const CONCEPTS: Record<string, ConceptDefinition> = {
  'har file': {
    explanation:
      'HAR (HTTP Archive) file is a JSON-formatted log of web browser interactions with a site. It captures all HTTP requests and responses, including headers, cookies, timing, and body content. Browser DevTools can export HAR files via Network tab > Export HAR.',
    briefExplanation: 'JSON log of browser HTTP traffic. Export from DevTools Network tab.',
    relatedConcepts: ['HTTP', 'browser DevTools', 'network traffic'],
    modes: ['protocol'],
  },
  mitmproxy: {
    explanation:
      'mitmproxy is a free, open-source interactive HTTPS proxy. It intercepts traffic between your device and the internet, allowing you to inspect, modify, and replay requests. Install with "brew install mitmproxy" on Mac.',
    briefExplanation: 'HTTPS proxy for intercepting traffic. Install: brew install mitmproxy',
    relatedConcepts: ['HTTPS', 'proxy', 'certificate', 'traffic interception'],
    modes: ['protocol'],
  },
  'rest api': {
    explanation:
      'REST (Representational State Transfer) API is a web service architecture using HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources identified by URLs. Most modern web and mobile apps use REST APIs.',
    briefExplanation: 'HTTP-based API using GET/POST/PUT/DELETE on URL resources.',
    relatedConcepts: ['HTTP', 'JSON', 'endpoints', 'CRUD'],
    modes: ['protocol', 'feature'],
  },
  protobuf: {
    explanation:
      "Protocol Buffers (protobuf) is Google's binary serialization format. More compact than JSON but not human-readable. Common in high-performance APIs and gRPC. Decoding requires the .proto schema file.",
    briefExplanation: 'Google binary serialization. Needs .proto schema to decode.',
    relatedConcepts: ['gRPC', 'serialization', 'binary format', 'schema'],
    modes: ['protocol', 'format'],
  },
  websocket: {
    explanation:
      'WebSocket is a protocol providing full-duplex communication over a single TCP connection. Unlike HTTP request/response, it allows real-time bidirectional data flow. Used for chat, live updates, gaming.',
    briefExplanation: 'Full-duplex TCP for real-time bidirectional data.',
    relatedConcepts: ['TCP', 'real-time', 'HTTP upgrade', 'socket.io'],
    modes: ['protocol', 'feature'],
  },
  jwt: {
    explanation:
      'JSON Web Token (JWT) is a compact, URL-safe token format for securely transmitting claims between parties. Contains three base64-encoded parts: header, payload, signature. Decode at jwt.io.',
    briefExplanation: 'Base64 token: header.payload.signature. Decode at jwt.io',
    relatedConcepts: ['authentication', 'bearer token', 'OAuth', 'base64'],
    modes: ['protocol', 'feature'],
  },
  'competitive analysis': {
    explanation:
      'Studying how competitors implement features to inform your own design. In forensics context: researching product features, UX patterns, and technical approaches to understand and potentially replicate them.',
    briefExplanation: 'Researching competitor features to inform your implementation.',
    relatedConcepts: ['product research', 'feature parity', 'UX patterns'],
    modes: ['feature'],
  },
  wireshark: {
    explanation:
      'Wireshark is a network protocol analyzer that captures and inspects packets at a low level. More powerful than HAR (sees all network traffic, not just HTTP) but also more complex. Good for non-HTTP protocols.',
    briefExplanation: 'Packet analyzer for all network traffic, not just HTTP.',
    relatedConcepts: ['pcap', 'packet capture', 'network analysis', 'tcpdump'],
    modes: ['protocol', 'format'],
  },
  pcap: {
    explanation:
      'PCAP (Packet Capture) is a file format for storing network traffic captures. Created by tools like Wireshark or tcpdump. Contains raw packet data including headers and payloads at all network layers.',
    briefExplanation: 'File format for raw packet captures from Wireshark/tcpdump.',
    relatedConcepts: ['Wireshark', 'tcpdump', 'network packets', 'libpcap'],
    modes: ['protocol', 'format'],
  },
  'magic number': {
    explanation:
      'Magic numbers are fixed byte sequences at the start of files that identify the file format. Examples: PNG starts with 0x89504E47, PDF with 0x25504446. Used to detect file types regardless of extension.',
    briefExplanation: 'Fixed bytes at file start identifying format (e.g., PNG: 0x89504E47).',
    relatedConcepts: ['file format', 'binary analysis', 'file signature', 'hex'],
    modes: ['format'],
  },
};

export class ExplainConceptTool {
  private memory = getForensicsMemory();

  async explain(concept: string): Promise<ConceptExplanation> {
    const key = concept.toLowerCase().trim();
    const definition = CONCEPTS[key];

    // Check if user already knows this concept
    const alreadyKnown = await this.memory.isConceptKnown(key);

    // Get user's skill level for verbosity
    const skillLevel = await this.memory.getSkillLevel();

    if (definition) {
      // Choose explanation based on whether user knows it and skill level
      let explanation: string;
      if (alreadyKnown) {
        explanation = `(Quick reminder) ${definition.briefExplanation}`;
      } else if (skillLevel === 'advanced') {
        explanation = definition.briefExplanation;
      } else {
        explanation = definition.explanation;
      }

      // Mark concept as known (non-blocking)
      if (!alreadyKnown) {
        this.memory.markConceptKnown(key).catch(() => {});
      }

      return {
        concept,
        explanation,
        skillLevel,
        relatedConcepts: definition.relatedConcepts,
        suggestSearch: false,
        alreadyKnown,
      };
    }

    // Unknown concept
    return {
      concept,
      explanation: `I'm not familiar with "${concept}" in my built-in knowledge. This might be a specialized term or tool. Would you like me to search for information about it?`,
      skillLevel,
      relatedConcepts: [],
      suggestSearch: true,
      alreadyKnown: false,
    };
  }

  getConceptsForMode(mode: string): string[] {
    return Object.entries(CONCEPTS)
      .filter(([_, def]) => def.modes.includes(mode))
      .map(([name, _]) => this.titleCase(name));
  }

  private titleCase(str: string): string {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

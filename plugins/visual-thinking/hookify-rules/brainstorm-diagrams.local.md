---
name: visual-thinking-brainstorm
enabled: true
event: prompt
pattern: \b(architecture|workflow|wireflow|data\s*flow|user\s*journey|customer\s*journey|state\s*machine|states?\s*and\s*transitions|data\s*model|ERD|schema|relationships|wireframe|mockup|UI\s*design|screens?|diagram|visualize|draw\s*(this|it|out)?|flow\s*chart|sequence\s*diagram|mind\s*map)\b
---

**Visual Thinking Available**

The user is discussing something that could benefit from a diagram. Consider offering to capture it visually:

"Want me to create a diagram for this? I can make a [flowchart/sequence diagram/mindmap/ERD] and open it in draw.io for you to edit."

**When to offer:**
- Architecture discussions → flowchart or sequence diagram
- User journeys/flows → flowchart
- Data models → ERD or class diagram
- State machines → state diagram
- Brainstorming/ideation → mindmap
- UI discussions → mention draw.io has mockup shapes

**How to create:**
Use the `create_diagram` tool with appropriate type, then offer to export to draw.io.

**Don't be pushy** - offer once per topic. If declined, continue without mentioning again.

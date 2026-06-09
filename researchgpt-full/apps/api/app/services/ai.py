from app.agents.prompts import AGENT_PROMPTS

async def run_agent(agent_type: str, task: str, context: str = "", style: str = "academic", target_venue: str | None = None) -> str:
    system = AGENT_PROMPTS.get(agent_type, AGENT_PROMPTS["literature_review"])
    # Production: call OpenAI/Claude here. MVP fallback returns deterministic useful output.
    return f"""# ResearchGPT Output — {agent_type.replace('_', ' ').title()}

## Task
{task}

## Generated Result
This is the MVP deterministic response. Connect OpenAI/Claude in `app/services/ai.py` for live generation.

## Recommended Structure
1. Background and motivation
2. Key literature themes
3. Methodological comparison
4. Research gaps
5. Proposed contribution
6. Limitations and next steps

## Supervisor-Style Feedback
- Clarify the research question early.
- Add a comparison table of related studies.
- Separate results from interpretation.
- Make claims only when supported by uploaded sources.
- Add venue-specific formatting for {target_venue or 'your target venue'}.

## Source Context Preview
{context[:1800] if context else 'No documents retrieved yet.'}

## Prompt Used
{system}
"""

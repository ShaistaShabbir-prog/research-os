from app.services.llm.provider import LLMProvider

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str | None):
        self.api_key = api_key

    async def complete(self, system: str, user: str, *, temperature: float = 0.2) -> str:
        # Production task: connect official OpenAI SDK here.
        if not self.api_key:
            return "OpenAI API key missing."
        return "OpenAI provider stub: wire SDK call in production deployment."

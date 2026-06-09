from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system: str, user: str, *, temperature: float = 0.2) -> str:
        raise NotImplementedError

class OfflineProvider(LLMProvider):
    async def complete(self, system: str, user: str, *, temperature: float = 0.2) -> str:
        return "Offline mode: deterministic heuristic review was used. Configure OPENAI_API_KEY/ANTHROPIC_API_KEY for LLM critique."

import os
from pathlib import Path
from string import Template
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


class PromptManager:
    """
    Manages loading and rendering of agent prompts.
    Decouples prompt text from Python business logic.
    """
    
    def __init__(self, prompt_dir: str = "app/prompts"):
        # Resolve path relative to the project root or backend dir
        self.prompt_dir = Path(prompt_dir)
        if not self.prompt_dir.exists():
            self.prompt_dir.mkdir(parents=True, exist_ok=True)
            logger.info("prompt_dir_created", path=str(self.prompt_dir))

    def load_system_prompt(self, agent_type: str) -> str:
        """Load the static system prompt for a specific agent."""
        file_path = self.prompt_dir / f"{agent_type}_system.txt"
        if not file_path.exists():
            logger.warning("missing_system_prompt_file", agent_type=agent_type)
            return f"You are the {agent_type} agent. Provide structured JSON analysis."
        return file_path.read_text(encoding="utf-8").strip()

    def render_user_prompt(self, agent_type: str, context: dict[str, Any]) -> str:
        """Load and render the user prompt template with the provided context."""
        file_path = self.prompt_dir / f"{agent_type}_user.txt"
        if not file_path.exists():
            logger.warning("missing_user_prompt_file", agent_type=agent_type)
            # Fallback simple render
            return f"Context:\n{context}"
        
        template_str = file_path.read_text(encoding="utf-8").strip()
        # Using standard string.Template for safe substitution without Jinja2 dependency
        template = Template(template_str)
        # safe_substitute ignores missing keys
        return template.safe_substitute(**context)


prompt_manager = PromptManager()

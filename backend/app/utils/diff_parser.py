"""
Unified diff parser.

Converts a unified diff string into a list of structured file hunks,
making it easy to extract changed lines per file for agent analysis.
"""
import re
from dataclasses import dataclass, field


@dataclass
class DiffHunk:
    """A single changed block within a file."""
    start_line: int
    lines: list[str] = field(default_factory=list)


@dataclass
class FileDiff:
    """All changes to a single file in a PR."""
    file_path: str
    status: str  # added / modified / deleted
    hunks: list[DiffHunk] = field(default_factory=list)
    additions: int = 0
    deletions: int = 0


def parse_unified_diff(diff_text: str) -> list[FileDiff]:
    """
    Parse a unified diff string into a list of FileDiff objects.

    Args:
        diff_text: Raw unified diff string (output of `git diff`)

    Returns:
        List of FileDiff objects, one per changed file.
    """
    files: list[FileDiff] = []
    current_file: FileDiff | None = None
    current_hunk: DiffHunk | None = None
    current_line = 0

    for line in diff_text.splitlines():
        if line.startswith("diff --git"):
            if current_file:
                files.append(current_file)
            current_file = None
            current_hunk = None

        elif line.startswith("+++ b/") and current_file is None:
            path = line[6:]
            current_file = FileDiff(file_path=path, status="modified")

        elif line.startswith("--- /dev/null"):
            if current_file:
                current_file.status = "added"

        elif line.startswith("+++ /dev/null"):
            if current_file:
                current_file.status = "deleted"

        elif line.startswith("@@ "):
            # Parse hunk header: @@ -a,b +c,d @@
            match = re.search(r"\+(\d+)", line)
            if match and current_file:
                current_line = int(match.group(1))
                current_hunk = DiffHunk(start_line=current_line)
                current_file.hunks.append(current_hunk)

        elif current_file and current_hunk:
            if line.startswith("+"):
                current_hunk.lines.append(line)
                current_file.additions += 1
                current_line += 1
            elif line.startswith("-"):
                current_hunk.lines.append(line)
                current_file.deletions += 1
            elif not line.startswith("\\"):
                current_hunk.lines.append(line)
                current_line += 1

    if current_file:
        files.append(current_file)

    return files

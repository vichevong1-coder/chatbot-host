"""
Pytest configuration and root path resolution for all test suites.
Ensures `orchestrator` and repository root are on `sys.path` regardless of invocation directory.
"""
import os
import sys
from pathlib import Path

# Find repository root by searching upward for orchestrator directory
_current = Path(__file__).resolve().parent
while _current != _current.parent:
    if (_current / "orchestrator").is_dir():
        break
    _current = _current.parent

REPO_ROOT = _current
ORCHESTRATOR_DIR = REPO_ROOT / "orchestrator"
PROJECT_ROOT = REPO_ROOT.parent

for _p in (str(REPO_ROOT), str(ORCHESTRATOR_DIR), str(PROJECT_ROOT)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import logging
import sys

# Force UTF-8 stream output on Windows to prevent UnicodeEncodeError with emojis/box-draw characters
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


class SafeStreamHandler(logging.StreamHandler):
    """A stream handler that safely handles Unicode/emoji encoding errors on Windows."""

    def emit(self, record):
        try:
            super().emit(record)
        except (UnicodeEncodeError, Exception):
            try:
                msg = self.format(record)
                stream = self.stream
                stream.write(msg.encode("ascii", "replace").decode("ascii") + self.terminator)
                self.flush()
            except Exception:
                self.handleError(record)


# Configure root logging formatter and handlers
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        SafeStreamHandler(sys.stdout)
    ]
)

# Custom logger instance for the orchestrator app
logger = logging.getLogger("orchestrator")

"""
Unified single-terminal dev runner for WEG MVP Chatbot & Science Platform.
Runs all 5 services concurrently in ONE terminal window with color-coded log streams.
Gracefully kills all child processes on CTRL+C.
"""

import os
import sys
import time
import signal
import subprocess
import threading
from pathlib import Path

# Force UTF-8 stdout/stderr on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ANSI colors for nice terminal output
COLORS = {
    "FRONT": "\033[96m",   # Cyan
    "ORCH":  "\033[92m",   # Green
    "SCAN":  "\033[93m",   # Yellow
    "MATH":  "\033[95m",   # Magenta
    "SCI":   "\033[94m",   # Blue
    "RESET": "\033[0m",
    "BOLD":  "\033[1m",
    "GRAY":  "\033[90m",
}

ROOT = Path(__file__).resolve().parent
VENV_PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"
PYTHON = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

SERVICES = [
    {
        "name": "SCAN",
        "label": "OCR Scanner (9003)",
        "color": COLORS["SCAN"],
        "cwd": ROOT / "backend" / "homework_ocr_vlm",
        "env": {"PYTHONPATH": f"{ROOT / 'backend'};{ROOT / 'backend' / 'homework_ocr_vlm'};{ROOT}"},
        "cmd": [PYTHON, "run.py"]
    },
    {
        "name": "MATH",
        "label": "Math Svc   (9001)",
        "color": COLORS["MATH"],
        "cwd": ROOT / "backend" / "services" / "math_service",
        "env": {"PYTHONPATH": f"{ROOT / 'backend'};{ROOT / 'backend' / 'services' / 'math_service'};{ROOT}"},
        "cmd": [PYTHON, "-m", "uvicorn", "app.main:app", "--port", "9001", "--reload"]
    },
    {
        "name": "SCI",
        "label": "Science Svc(9002)",
        "color": COLORS["SCI"],
        "cwd": ROOT / "backend" / "services" / "science_service",
        "env": {"PYTHONPATH": f"{ROOT / 'backend'};{ROOT / 'backend' / 'services' / 'science_service'};{ROOT}"},
        "cmd": [PYTHON, "-m", "uvicorn", "app.main:app", "--port", "9002", "--reload"]
    },
    {
        "name": "ORCH",
        "label": "Gateway    (9000)",
        "color": COLORS["ORCH"],
        "cwd": ROOT / "backend" / "orchestrator",
        "env": {"PYTHONPATH": f"{ROOT / 'backend'};{ROOT / 'backend' / 'orchestrator'};{ROOT}"},
        "cmd": [PYTHON, "-m", "uvicorn", "app.main:app", "--port", "9000", "--reload"]
    },
    {
        "name": "FRONT",
        "label": "Frontend   (5173)",
        "color": COLORS["FRONT"],
        "cwd": ROOT / "frontend",
        "env": {},
        "cmd": ["npm.cmd" if os.name == "nt" else "npm", "run", "dev"]
    },
]

processes = []
running = True


def stream_output(proc, svc):
    name = svc["name"]
    color = svc["color"]
    reset = COLORS["RESET"]
    prefix = f"{color}[{name:5}]{reset} "

    try:
        for line in iter(proc.stdout.readline, ''):
            if not running and not line:
                break
            line_str = line.rstrip()
            if line_str:
                print(f"{prefix}{line_str}", flush=True)
    except Exception:
        pass


def kill_all_processes():
    global running
    running = False
    print(f"\n{COLORS['BOLD']}🛑 Stopping all services...{COLORS['RESET']}", flush=True)
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    time.sleep(0.5)
    for p in processes:
        try:
            p.kill()
        except Exception:
            pass
    print(f"{COLORS['BOLD']}✅ All services terminated.{COLORS['RESET']}\n", flush=True)


def main():
    # Enable ANSI escape processing in Windows console
    if os.name == "nt":
        os.system("")

    print(f"{COLORS['BOLD']}============================================================={COLORS['RESET']}")
    print(f"{COLORS['BOLD']}🚀 WEG Platform - Single Unified Dev Terminal{COLORS['RESET']}")
    print(f"{COLORS['BOLD']}============================================================={COLORS['RESET']}")
    print(f"  {COLORS['FRONT']}• Frontend UI:{COLORS['RESET']}           http://localhost:5173")
    print(f"  {COLORS['ORCH']}• Orchestrator Gateway:{COLORS['RESET']}  http://localhost:9000/docs")
    print(f"  {COLORS['SCAN']}• Homework Scanner:{COLORS['RESET']}      http://localhost:9003/docs")
    print(f"  {COLORS['MATH']}• Math Service:{COLORS['RESET']}          http://localhost:9001/docs")
    print(f"  {COLORS['SCI']}• Science Service:{COLORS['RESET']}       http://localhost:9002/docs")
    print(f"{COLORS['BOLD']}============================================================={COLORS['RESET']}")
    print(f"{COLORS['GRAY']}Press CTRL+C anytime to stop all services simultaneously.{COLORS['RESET']}\n")

    threads = []
    for svc in SERVICES:
        env = os.environ.copy()
        env.update(svc["env"])
        
        try:
            proc = subprocess.Popen(
                svc["cmd"],
                cwd=str(svc["cwd"]),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding="utf-8",
                errors="replace"
            )
            processes.append(proc)
            t = threading.Thread(target=stream_output, args=(proc, svc), daemon=True)
            t.start()
            threads.append(t)
        except Exception as e:
            print(f"❌ Failed to start {svc['label']}: {e}")

    try:
        while True:
            time.sleep(0.5)
            # If all processes have exited, exit the loop
            if all(p.poll() is not None for p in processes):
                break
    except KeyboardInterrupt:
        pass
    finally:
        kill_all_processes()


if __name__ == "__main__":
    main()

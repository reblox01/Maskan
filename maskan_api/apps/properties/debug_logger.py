import logging
import os
from datetime import datetime

# Use an absolute path that we know exists
LOG_FILE = r"c:\Users\0x8D\Desktop\immobiliere\maskan_api\backend_debug.log"

def log_debug(message):
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now().isoformat()}] {message}\n")
            f.flush()
            os.fsync(f.fileno())
    except Exception as e:
        # If we can't write to the file, we can't do much
        pass

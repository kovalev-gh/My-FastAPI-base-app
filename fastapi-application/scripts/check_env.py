import sys
from pathlib import Path

# Добавляем корень проекта в PYTHONPATH
sys.path.append(str(Path(__file__).resolve().parent.parent))


import os

print("SMTP_USER:", os.getenv("SMTP_USER"))
print("SMTP_FROM:", os.getenv("SMTP_FROM"))
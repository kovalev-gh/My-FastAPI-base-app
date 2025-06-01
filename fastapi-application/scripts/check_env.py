from dotenv import load_dotenv
load_dotenv()
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))


from core.config import settings

print("SMTP config loaded:")
print(settings.smtp.dict())
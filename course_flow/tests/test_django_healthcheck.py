import importlib.util
import io
from pathlib import Path
from types import ModuleType


def _load_healthcheck_module() -> ModuleType:
    script = Path(__file__).parents[2] / "docker" / "django-healthcheck.py"
    spec = importlib.util.spec_from_file_location("django_healthcheck", script)
    assert spec is not None
    assert spec.loader is not None

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class _HealthyResponse(io.BytesIO):
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()


def test_healthcheck_marks_direct_gunicorn_request_as_https(monkeypatch):
    module = _load_healthcheck_module()
    monkeypatch.setenv("DJANGO_ALLOWED_HOSTS", "api.example.test,django,127.0.0.1")

    def urlopen(request, timeout):
        assert request.full_url == "http://127.0.0.1:8000/api/ready"
        assert request.get_header("Host") == "api.example.test"
        assert request.get_header("X-forwarded-proto") == "https"
        assert timeout == 2
        return _HealthyResponse(b'{"status": "ok"}')

    monkeypatch.setattr(module.urllib.request, "urlopen", urlopen)

    assert module.main() == 0

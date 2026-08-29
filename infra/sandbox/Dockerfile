FROM python:3.12-slim-bookworm

RUN useradd --create-home --uid 1000 sandbox \
  && mkdir /workspace \
  && chown sandbox:sandbox /workspace

USER sandbox
WORKDIR /workspace

# Default command overridden by the runner (python -u /workspace/main.py).
CMD ["python", "-u", "/workspace/main.py"]

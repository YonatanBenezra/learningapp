FROM python:3.12-slim-bookworm

RUN useradd --create-home --uid 1000 sandbox \
  && mkdir /workspace \
  && chown sandbox:sandbox /workspace

COPY python /opt/labpath
RUN chown -R root:root /opt/labpath && chmod -R a+rX /opt/labpath

ENV PYTHONPATH=/opt/labpath

USER sandbox
WORKDIR /workspace

# Default command overridden by the runner (python -u /workspace/main.py).
CMD ["python", "-u", "/workspace/main.py"]

"""Allowlisted tools that run inside the LabPath sandbox.

Learner code imports this package. Calls are appended to an in-memory log
and flushed to LABPATH_TOOL_LOG (default /tmp/labpath_tool_log.json).
"""

from __future__ import annotations

import ast
import atexit
import json
import operator
import os
import sys
import time
from typing import Any
from urllib.parse import urlparse
from urllib.request import urlopen

def _int_env(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return value if value > 0 else default


MAX_TOOL_CALLS = _int_env("LABPATH_MAX_TOOL_CALLS", 12)
MAX_STEPS = _int_env("LABPATH_MAX_STEPS", 8)
MAX_EXPR_LEN = 128
MAX_STORE_KEY = 64
MAX_STORE_VALUE = 2048
MAX_FETCH_BYTES = 8192
MAX_LOG_FIELD = 512

_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

_STORE: dict[str, Any] = {}
_LOG: list[dict[str, Any]] = []
_CALLS = 0


def _log_path() -> str:
    return os.environ.get("LABPATH_TOOL_LOG", "/tmp/labpath_tool_log.json")


def _nbytes(value: Any) -> int:
    try:
        return len(json.dumps(value, default=str))
    except TypeError:
        return len(str(value))


def _clip(value: Any) -> Any:
    try:
        raw = json.dumps(value, default=str)
    except TypeError:
        raw = str(value)
    if len(raw) > MAX_LOG_FIELD:
        return raw[:MAX_LOG_FIELD] + "…"
    return value


def _flush() -> None:
    payload = json.dumps(_LOG, separators=(",", ":"))
    path = _log_path()
    try:
        directory = os.path.dirname(path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as handle:
            handle.write(payload)
        os.replace(tmp, path)
    except OSError:
        pass
    try:
        sys.stderr.write("LABPATH_TOOL_LOG:" + payload + "\n")
        sys.stderr.flush()
    except OSError:
        pass


def _record(
    name: str,
    args: dict[str, Any],
    ok: bool,
    duration_ms: int,
    result: Any = None,
    error: str | None = None,
) -> None:
    payload = error if error is not None else result
    entry: dict[str, Any] = {
        "name": name,
        "args": args,
        "ok": ok,
        "durationMs": duration_ms,
        "resultBytes": _nbytes(payload),
    }
    if error is not None:
        entry["error"] = str(error)[:MAX_LOG_FIELD]
    elif result is not None:
        entry["result"] = _clip(result)
    _LOG.append(entry)
    _flush()


def _guard(name: str, args: dict[str, Any], fn):
    global _CALLS
    if _CALLS >= MAX_TOOL_CALLS or len(_LOG) >= MAX_STEPS:
        _record(name, args, False, 0, error="killed_loop")
        raise RuntimeError("killed_loop")
    _CALLS += 1
    started = time.perf_counter()
    try:
        result = fn()
        _record(
            name,
            args,
            True,
            int((time.perf_counter() - started) * 1000),
            result=result,
        )
        return result
    except Exception as error:
        if str(error) == "killed_loop":
            raise
        _record(
            name,
            args,
            False,
            int((time.perf_counter() - started) * 1000),
            error=str(error),
        )
        raise


def _eval_node(node: ast.AST) -> int | float:
    if isinstance(node, ast.Expression):
        return _eval_node(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        if isinstance(node.value, bool):
            raise ValueError("unsupported expression")
        return node.value
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval_node(node.operand))
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        if isinstance(node.op, ast.Pow) and (
            not isinstance(right, int) or right < 0 or right > 32
        ):
            raise ValueError("unsupported expression")
        return _OPS[type(node.op)](left, right)
    raise ValueError("unsupported expression")


def calculator(expr: str) -> int | float:
    if not isinstance(expr, str) or not expr.strip() or len(expr) > MAX_EXPR_LEN:
        raise ValueError("invalid expression")

    def run() -> int | float:
        tree = ast.parse(expr, mode="eval")
        return _eval_node(tree)

    return _guard("calculator", {"expr": expr}, run)


def json_store(op: str, key: str, value: Any = None) -> Any:
    if op not in ("put", "get"):
        raise ValueError("op must be put or get")
    if not isinstance(key, str) or not key or len(key) > MAX_STORE_KEY:
        raise ValueError("invalid key")

    def run() -> Any:
        if op == "put":
            encoded = json.dumps(value, default=str)
            if len(encoded) > MAX_STORE_VALUE:
                raise ValueError("value too large")
            _STORE[key] = json.loads(encoded)
            return True
        return _STORE.get(key)

    args: dict[str, Any] = {"op": op, "key": key}
    if op == "put":
        args["value"] = _clip(value)
    return _guard("json_store", args, run)


def fixture_fetch(path: str) -> str:
    if not isinstance(path, str) or not path.startswith("/") or path.startswith("//"):
        raise ValueError("invalid path")
    if ".." in path or "\\" in path or ":" in path or "@" in path:
        raise ValueError("invalid path")

    def run() -> str:
        base = os.environ.get(
            "SANDBOX_GATEWAY_URL", "http://sandbox-gateway:8080"
        ).rstrip("/")
        url = f"{base}{path}"
        parsed = urlparse(url)
        allowed = urlparse(base)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("blocked url")
        if parsed.netloc != allowed.netloc:
            raise ValueError("blocked host")
        with urlopen(url, timeout=5) as response:  # nosec B310 - host allowlisted
            return response.read()[:MAX_FETCH_BYTES].decode("utf-8", "replace")

    return _guard("fixture_fetch", {"path": path}, run)


TOOLS = {
    "calculator": calculator,
    "json_store": json_store,
    "fixture_fetch": fixture_fetch,
}


def call(name: str, **kwargs: Any) -> Any:
    tool = TOOLS.get(name)
    if tool is None:
        raise ValueError(f"unknown tool: {name}")
    return tool(**kwargs)


atexit.register(_flush)

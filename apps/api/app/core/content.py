"""Memuat konten materi dari folder content/ (JSON) dan menyembunyikan kunci jawaban."""
from __future__ import annotations

import copy
import json
from functools import lru_cache
from pathlib import Path

from .. import config

# Kolom yang TIDAK boleh dikirim ke peramban sebelum siswa menjawab.
SECRET_FIELDS = {"answer", "answer_pairs", "common_errors", "linear", "explain",
                 "option_feedback", "tolerance"}


@lru_cache(maxsize=1)
def _load_all() -> dict:
    modules_dir = Path(config.CONTENT_DIR) / "modules"
    modules = {}
    for path in sorted(modules_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        modules[data["id"]] = data
    glossary = json.loads((Path(config.CONTENT_DIR) / "glossary.json").read_text(encoding="utf-8"))
    presets = json.loads((Path(config.CONTENT_DIR) / "modeler_presets.json").read_text(encoding="utf-8"))
    return {"modules": modules, "glossary": glossary, "presets": presets}


def reload() -> None:
    _load_all.cache_clear()


def all_modules() -> list[dict]:
    return sorted(_load_all()["modules"].values(), key=lambda m: m["order"])


def get_module(module_id: str) -> dict | None:
    return _load_all()["modules"].get(module_id)


def get_item(module_id: str, item_id: str) -> dict | None:
    module = get_module(module_id)
    if not module:
        return None
    return next((it for it in module.get("items", []) if it["id"] == item_id), None)


def public_item(item: dict) -> dict:
    return {k: v for k, v in item.items() if k not in SECRET_FIELDS}


def public_module(module: dict) -> dict:
    m = copy.deepcopy(module)
    m["items"] = [public_item(it) for it in module.get("items", [])]
    return m


def module_summary(module: dict) -> dict:
    keys = ("id", "order", "group", "title", "subtitle", "icon", "minutes", "interview_codes", "objectives")
    out = {k: module.get(k) for k in keys}
    out["item_count"] = len(module.get("items", []))
    out["step_count"] = len(module.get("steps", []))
    return out


def glossary() -> list[dict]:
    return _load_all()["glossary"]


def modeler_presets() -> list[dict]:
    return _load_all()["presets"]

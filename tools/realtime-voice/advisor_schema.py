"""Shared JSON shapes and small validation helpers for the realtime advisor."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any


SESSION_STATE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "session_id",
        "operator_role",
        "case_ref",
        "confirmed_facts",
        "open_questions",
        "current_mental_model",
        "quote_signals",
        "last_analysis_ts",
        "pending_response_options",
        "adoption_events",
    ],
    "properties": {
        "session_id": {"type": "string", "minLength": 1},
        "operator_role": {"type": "string", "enum": ["pm"]},
        "case_ref": {"type": "string"},
        "confirmed_facts": {"type": "array", "items": {"type": "string"}},
        "open_questions": {"type": "array", "items": {"type": "string"}},
        "current_mental_model": {"type": "string"},
        "quote_signals": {"type": "array", "items": {"type": "string"}},
        "last_analysis_ts": {"type": "string"},
        "pending_response_options": {
            "type": "array",
            "items": {"type": "string"},
            "maxItems": 3,
        },
        "adoption_events": {"type": "array", "items": {"type": "object"}},
    },
    "additionalProperties": False,
}


ANALYSIS_OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "client_response",
        "current_state",
        "confirmed",
        "open_questions",
        "quote_impact",
        "mental_model",
        "evidence",
        "recommended_next_move",
        "response_options",
        "speaker_attribution",
        "route",
    ],
    "properties": {
        "client_response": {"type": "array", "items": {"type": "string"}},
        "current_state": {"type": "string"},
        "confirmed": {"type": "array", "items": {"type": "string"}},
        "open_questions": {"type": "array", "items": {"type": "string"}},
        "quote_impact": {"type": "string"},
        "mental_model": {"type": "string"},
        "evidence": {"type": "array", "items": {"type": "string"}},
        "recommended_next_move": {"type": "string"},
        "response_options": {
            "type": "array",
            "items": {"type": "string"},
            "maxItems": 3,
        },
        "speaker_attribution": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["segment_id", "role", "confidence", "reason"],
                "properties": {
                    "segment_id": {"type": "string"},
                    "role": {"type": "string", "enum": ["pm", "client", "unknown"]},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    "reason": {"type": "string"},
                },
                "additionalProperties": False,
            },
        },
        "route": {
            "type": "string",
            "enum": ["realtime-need-capture", "pm", "quote", "web-design", "none"],
        },
    },
    "additionalProperties": False,
}


def _check_type(value: Any, expected: str, path: str) -> None:
    valid = {
        "object": isinstance(value, Mapping),
        "array": isinstance(value, list),
        "string": isinstance(value, str),
        "number": isinstance(value, (int, float)) and not isinstance(value, bool),
    }[expected]
    if not valid:
        raise ValueError(f"{path} must be {expected}")


def validate_schema_payload(payload: Any, schema: Mapping[str, Any]) -> None:
    """Validate the subset of JSON Schema used by the advisor without a dependency."""
    _check_type(payload, schema["type"], "payload")
    required = schema.get("required", [])
    for field in required:
        if field not in payload:
            raise ValueError(f"missing required field: {field}")
    if schema.get("additionalProperties") is False:
        unknown = set(payload) - set(schema.get("properties", {}))
        if unknown:
            raise ValueError(f"unknown fields: {sorted(unknown)}")
    for field, field_schema in schema.get("properties", {}).items():
        if field not in payload:
            continue
        value = payload[field]
        path = f"payload.{field}"
        _check_type(value, field_schema["type"], path)
        if "enum" in field_schema and value not in field_schema["enum"]:
            raise ValueError(f"{path} must be one of {field_schema['enum']}")
        if "minLength" in field_schema and len(value) < field_schema["minLength"]:
            raise ValueError(f"{path} must not be empty")
        if "minimum" in field_schema and value < field_schema["minimum"]:
            raise ValueError(f"{path} is below minimum")
        if "maximum" in field_schema and value > field_schema["maximum"]:
            raise ValueError(f"{path} is above maximum")
        if value and field_schema["type"] == "array":
            if "maxItems" in field_schema and len(value) > field_schema["maxItems"]:
                raise ValueError(f"{path} has too many items")
            item_schema = field_schema.get("items")
            if item_schema and item_schema.get("type") == "object":
                for index, item in enumerate(value):
                    _validate_object_item(item, item_schema, f"{path}[{index}]")
            elif item_schema:
                for index, item in enumerate(value):
                    _check_type(item, item_schema["type"], f"{path}[{index}]")


def _validate_object_item(value: Any, schema: Mapping[str, Any], path: str) -> None:
    _check_type(value, schema["type"], path)
    for field in schema.get("required", []):
        if field not in value:
            raise ValueError(f"missing required field: {path}.{field}")
    if schema.get("additionalProperties") is False:
        unknown = set(value) - set(schema.get("properties", {}))
        if unknown:
            raise ValueError(f"unknown fields: {path}.{sorted(unknown)}")
    for field, field_schema in schema.get("properties", {}).items():
        if field not in value:
            continue
        item = value[field]
        item_path = f"{path}.{field}"
        _check_type(item, field_schema["type"], item_path)
        if "enum" in field_schema and item not in field_schema["enum"]:
            raise ValueError(f"{item_path} must be one of {field_schema['enum']}")
        if "minimum" in field_schema and item < field_schema["minimum"]:
            raise ValueError(f"{item_path} is below minimum")
        if "maximum" in field_schema and item > field_schema["maximum"]:
            raise ValueError(f"{item_path} is above maximum")


def validate_session_state(payload: Any) -> None:
    validate_schema_payload(payload, SESSION_STATE_SCHEMA)


def validate_analysis_output(payload: Any) -> None:
    validate_schema_payload(payload, ANALYSIS_OUTPUT_SCHEMA)

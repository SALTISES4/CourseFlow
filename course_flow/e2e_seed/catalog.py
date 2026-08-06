"""Stable E2E asset catalog and human-readable dependency export."""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from importlib.resources import files
from pathlib import Path
from typing import Any

CATALOG_RESOURCE = "assets.json"


@dataclass(frozen=True)
class SeedAsset:
    id: str
    kind: str
    builder: str
    lifecycle: str
    purpose: str
    provides: tuple[str, ...]


def load_seed_asset_catalog() -> dict[str, Any]:
    resource = files("course_flow.e2e_seed").joinpath(CATALOG_RESOURCE)
    payload = json.loads(resource.read_text(encoding="utf-8"))
    if payload.get("catalog_version") != 1:
        raise ValueError("Unsupported E2E seed asset catalog version")

    assets = payload.get("assets")
    if not isinstance(assets, list) or not assets:
        raise ValueError("E2E seed asset catalog must contain assets")

    ids = [asset.get("id") for asset in assets if isinstance(asset, dict)]
    if len(ids) != len(assets) or len(set(ids)) != len(ids):
        raise ValueError("E2E seed asset catalog IDs must be present and unique")
    return payload


def seed_assets_by_id() -> dict[str, SeedAsset]:
    catalog = load_seed_asset_catalog()
    return {
        item["id"]: SeedAsset(
            id=item["id"],
            kind=item["kind"],
            builder=item["builder"],
            lifecycle=item["lifecycle"],
            purpose=item["purpose"],
            provides=tuple(item.get("provides", [])),
        )
        for item in catalog["assets"]
    }


def require_seed_asset(asset_id: str, *, kind: str | None = None) -> SeedAsset:
    try:
        asset = seed_assets_by_id()[asset_id]
    except KeyError as exc:
        raise ValueError(f"Unknown E2E seed asset: {asset_id}") from exc
    if kind is not None and asset.kind != kind:
        raise ValueError(
            f"E2E seed asset {asset_id} has kind {asset.kind}, expected {kind}"
        )
    return asset


ASSET_ID_PATTERN = re.compile(
    r"['\"]((?:actor|project|workflow)\.[a-z0-9_]+)['\"]"
)
REQUIREMENT_ID_PATTERN = re.compile(r"FR-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+")
ACCESS_PATTERN = re.compile(
    r"seedAccess\s*:\s*['\"](?P<access>read-only|disposable-copy)['\"]"
)


def discover_seed_asset_dependencies(tests_root: Path) -> list[dict[str, str]]:
    """Collect declared stable asset IDs from Playwright spec source."""
    known_assets = seed_assets_by_id()
    dependencies: list[dict[str, str]] = []
    for spec_path in sorted(tests_root.glob("e2e/**/*.spec.ts")):
        source = spec_path.read_text(encoding="utf-8")
        declared_ids = sorted(set(ASSET_ID_PATTERN.findall(source)))
        if "loadWorkflowManifest" in source and not declared_ids:
            raise ValueError(
                f"{spec_path} reads the E2E manifest without declaring stable seed assets"
            )
        if "seedAccess" in source and not any(
            asset_id.startswith("workflow.") for asset_id in declared_ids
        ):
            raise ValueError(
                f"{spec_path} configures workflow access without a workflow asset declaration"
            )

        unknown = [asset_id for asset_id in declared_ids if asset_id not in known_assets]
        if unknown:
            raise ValueError(f"{spec_path} declares unknown seed assets: {unknown}")

        access_modes = sorted(set(ACCESS_PATTERN.findall(source)))
        actor_ids = [asset_id for asset_id in declared_ids if asset_id.startswith("actor.")]
        requirements = sorted(set(REQUIREMENT_ID_PATTERN.findall(source)))
        consumer = spec_path.relative_to(tests_root.parent).as_posix()
        for asset_id in declared_ids:
            dependencies.append(
                {
                    "asset_id": asset_id,
                    "consumer": consumer,
                    "requirements": ";".join(requirements),
                    "access_mode": ";".join(access_modes),
                    "actor_asset": ";".join(actor_ids),
                }
            )
    return dependencies


def write_seed_asset_dependency_csv(output_path: Path, *, tests_root: Path) -> None:
    """Write a spreadsheet-friendly catalog/dependency view from the JSON authority."""
    catalog = load_seed_asset_catalog()
    dependencies_by_asset: dict[str, list[dict[str, str]]] = {}
    dependencies = [
        *catalog.get("dependencies", []),
        *discover_seed_asset_dependencies(tests_root),
    ]
    for dependency in dependencies:
        dependencies_by_asset.setdefault(dependency["asset_id"], []).append(dependency)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(
            csv_file,
            fieldnames=(
                "asset_id",
                "kind",
                "lifecycle",
                "purpose",
                "provides",
                "consumer",
                "requirements",
                "access_mode",
                "actor_asset",
            ),
        )
        writer.writeheader()
        for asset in catalog["assets"]:
            dependencies = dependencies_by_asset.get(asset["id"], [{}])
            for dependency in dependencies:
                writer.writerow(
                    {
                        "asset_id": asset["id"],
                        "kind": asset["kind"],
                        "lifecycle": asset["lifecycle"],
                        "purpose": asset["purpose"],
                        "provides": ";".join(asset.get("provides", [])),
                        "consumer": dependency.get("consumer", ""),
                        "requirements": dependency.get("requirements", ""),
                        "access_mode": dependency.get("access_mode", ""),
                        "actor_asset": dependency.get("actor_asset", ""),
                    }
                )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or check E2E seed asset CSV")
    parser.add_argument("--check", action="store_true")
    parser.add_argument(
        "--output",
        default="tests/docs/testing/e2e-seed-asset-dependencies.csv",
    )
    options = parser.parse_args()

    repo_root = Path.cwd()
    output_path = repo_root / options.output
    if options.check:
        expected_path = output_path.with_suffix(".expected.csv")
        write_seed_asset_dependency_csv(
            expected_path,
            tests_root=repo_root / "tests",
        )
        try:
            expected = expected_path.read_text(encoding="utf-8")
            actual = output_path.read_text(encoding="utf-8") if output_path.exists() else ""
        finally:
            expected_path.unlink(missing_ok=True)
        if actual != expected:
            raise SystemExit(
                f"{output_path} is stale; run cf-check-e2e-assets without --check"
            )
        return 0

    write_seed_asset_dependency_csv(
        output_path,
        tests_root=repo_root / "tests",
    )
    return 0

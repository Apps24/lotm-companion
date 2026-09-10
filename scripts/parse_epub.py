#!/usr/bin/env python3
"""Parse a LOTM EPUB into metadata-only manifests.

This intentionally does NOT export novel prose. The public companion repository stores
chapter/volume/image metadata only. A later private/local reader can load the user's EPUB.
"""
from __future__ import annotations

import argparse
import json
import posixpath
import re
import zipfile
from collections import defaultdict
from pathlib import Path
from bs4 import BeautifulSoup

CHAPTER_RE = re.compile(r"^Chapter\s+(\d+)\s*:\s*(.+)$", re.I)
VOLUME_RE = re.compile(r"^Volume\s+(\d+)\s*:\s*(.+)$", re.I)


def clean_text(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("epub", type=Path)
    parser.add_argument("--out", type=Path, default=Path("data/generated"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(args.epub) as zf:
        names = zf.namelist()
        nav_name = next((n for n in names if n.endswith("nav.xhtml")), None)
        if not nav_name:
            raise SystemExit("EPUB navigation document not found")

        nav = BeautifulSoup(zf.read(nav_name), "html.parser")
        nav_root = posixpath.dirname(nav_name)
        current_volume = None
        volumes = []
        chapters = []
        chapter_by_doc = {}

        for order, a in enumerate(nav.find_all("a")):
            label = clean_text(a.get_text(" ", strip=True))
            href = a.get("href") or ""
            source = href.split("#", 1)[0]
            resolved = posixpath.normpath(posixpath.join(nav_root, source)) if source else ""
            vm = VOLUME_RE.match(label)
            if vm:
                current_volume = int(vm.group(1))
                volumes.append({"number": current_volume, "name": clean_text(vm.group(2)), "navOrder": order, "sourceDocument": resolved, "chapterStart": None, "chapterEnd": None})
                continue
            cm = CHAPTER_RE.match(label)
            if not cm:
                continue
            number = int(cm.group(1))
            chapter = {"number": number, "title": clean_text(cm.group(2)), "volume": current_volume, "navOrder": order, "sourceDocument": resolved, "embeddedImages": []}
            chapters.append(chapter)
            if resolved:
                chapter_by_doc[resolved] = chapter

        by_volume = defaultdict(list)
        for chapter in chapters:
            if chapter["volume"] is not None:
                by_volume[chapter["volume"]].append(chapter["number"])
        for volume in volumes:
            nums = by_volume.get(volume["number"], [])
            volume["chapterStart"] = min(nums) if nums else None
            volume["chapterEnd"] = max(nums) if nums else None
            volume["chapterCount"] = len(nums)

        image_names = [n for n in names if n.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"))]
        image_usage = defaultdict(list)
        for doc, chapter in chapter_by_doc.items():
            if doc not in names:
                continue
            soup = BeautifulSoup(zf.read(doc), "html.parser")
            base = posixpath.dirname(doc)
            refs = []
            for tag in soup.find_all(["img", "image"]):
                src = tag.get("src") or tag.get("href") or tag.get("xlink:href")
                if not src or src.startswith(("http://", "https://", "data:")):
                    continue
                resolved = posixpath.normpath(posixpath.join(base, src.split("#", 1)[0]))
                refs.append(resolved)
                image_usage[resolved].append(chapter["number"])
            chapter["embeddedImages"] = sorted(set(refs))

        images = []
        for name in sorted(image_names):
            info = zf.getinfo(name)
            images.append({"path": name, "bytes": info.file_size, "extension": Path(name).suffix.lower(), "usedInChapters": sorted(set(image_usage.get(name, [])))})

        summary = {"sourceFile": args.epub.name, "archiveEntries": len(names), "chapterCount": len(chapters), "minChapter": min(c["number"] for c in chapters), "maxChapter": max(c["number"] for c in chapters), "volumeCount": len(volumes), "imageCount": len(images), "navigationEntryCount": len(nav.find_all("a")), "exportsNovelProse": False}

    for filename, payload in {"epub-summary.json": summary, "volumes.json": volumes, "chapters.json": chapters, "images.json": images}.items():
        (args.out / filename).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

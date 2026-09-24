#!/usr/bin/env python3
"""Generate Elementor page JSON (section-by-section) from index.html."""

import json
import re
import shutil
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent
SECTIONS_DIR = OUT / "sections"
INDEX = ROOT / "index.html"
STYLES = ROOT / "styles.css"
SCRIPT = ROOT / "script.js"

TOP_LEVEL_TAGS = {"header", "footer", "section", "div"}


def gen_id() -> str:
    return uuid.uuid4().hex[:8]


def slugify(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower())
    return text.strip("-")[:60] or "section"


def fix_asset_paths(html: str) -> str:
    html = html.replace('src="assets/', 'src="/wp-content/uploads/kdp-mafia/assets/')
    html = html.replace("src='assets/", "src='/wp-content/uploads/kdp-mafia/assets/")
    return html


def make_html_widget(html: str, element_id: str = "") -> dict:
    settings = {"html": html}
    if element_id:
        settings["_element_id"] = element_id
    return {
        "id": gen_id(),
        "elType": "widget",
        "widgetType": "html",
        "isInner": False,
        "settings": settings,
        "elements": [],
    }


def make_column(widgets: list) -> dict:
    return {
        "id": gen_id(),
        "elType": "column",
        "isInner": False,
        "settings": {"_column_size": 100, "_inline_size": None},
        "elements": widgets,
    }


def make_section(title: str, html: str, slug: str) -> dict:
    html = fix_asset_paths(html)
    return {
        "id": gen_id(),
        "elType": "section",
        "isInner": False,
        "settings": {
            "layout": "full_width",
            "gap": "no",
            "content_width": {"unit": "px", "size": 1200, "sizes": []},
            "padding": {
                "unit": "px",
                "top": "0",
                "right": "0",
                "bottom": "0",
                "left": "0",
                "isLinked": True,
            },
            "_title": title,
            "css_classes": f"kdp-section kdp-{slug}",
        },
        "elements": [make_column([make_html_widget(html, slug)])],
    }


def make_page_json(title: str, content: list) -> dict:
    return {
        "title": title,
        "type": "page",
        "version": "0.4",
        "page_settings": {
            "hide_title": "yes",
            "template": "elementor_canvas",
        },
        "content": content,
    }


def extract_cta_break_html(full_html: str) -> str:
    match = re.search(
        r'<template id="cta-break-template">\s*(<section class="cta-break".*?</section>)\s*</template>',
        full_html,
        re.DOTALL,
    )
    return match.group(1).strip() if match else ""


def parse_tag_at(html: str, pos: int):
    """Parse opening tag at pos. Returns (tag_name, attrs, end_pos) or None."""
    if html[pos] != "<":
        return None
    m = re.match(r"<\s*(/?)\s*([a-zA-Z0-9]+)\b", html[pos:])
    if not m:
        return None
    closing = m.group(1) == "/"
    tag = m.group(2).lower()
    # find end of tag
    i = pos + 1
    in_quote = None
    while i < len(html):
        c = html[i]
        if in_quote:
            if c == in_quote:
                in_quote = None
        elif c in "\"'":
            in_quote = c
        elif c == ">":
            return (tag, html[pos : i + 1], i + 1, closing)
        i += 1
    return None


def extract_element(html: str, pos: int) -> tuple[str, int] | None:
    """Extract one balanced element starting at pos."""
    parsed = parse_tag_at(html, pos)
    if not parsed:
        return None
    tag, open_tag_str, after_open, is_closing = parsed
    if is_closing:
        return None

    void_tags = {"img", "br", "hr", "input", "meta", "link"}
    if tag in void_tags or open_tag_str.rstrip().endswith("/>"):
        return html[pos:after_open], after_open

    depth = 1
    i = after_open
    tag_pattern = re.compile(rf"<\s*(/?)\s*{re.escape(tag)}\b", re.IGNORECASE)

    while i < len(html) and depth > 0:
        m = tag_pattern.search(html, i)
        if not m:
            break
        if m.group(1) == "/":
            depth -= 1
            i = m.end()
            if depth == 0:
                close_end = html.find(">", m.start())
                if close_end == -1:
                    break
                return html[pos : close_end + 1], close_end + 1
        else:
            depth += 1
            i = m.end()

    return None


def is_top_level_block(tag: str, open_tag: str) -> bool:
    if tag == "section" or tag == "header" or tag == "footer":
        return True
    if tag == "div":
        markers = (
            'class="top-ticker"',
            "class='top-ticker'",
            'id="stickyBar"',
            "id='stickyBar'",
            "data-cta-break",
        )
        return any(m in open_tag for m in markers)
    return False


def comment_before(html: str, pos: int) -> str:
    before = html[:pos]
    comments = re.findall(r"<!--(.*?)-->", before, re.DOTALL)
    if not comments:
        return ""
    last = comments[-1].strip()
    # ignore template/script comments
    if "template" in last.lower():
        return ""
    return last


def infer_title(html: str, fallback: str) -> str:
    id_match = re.search(r'\bid="([^"]+)"', html)
    if id_match:
        return id_match.group(1).replace("-", " ").title()
    class_match = re.search(r'class="([^"]+)"', html)
    if class_match:
        for cls in class_match.group(1).split():
            if cls in {"sec-editorial", "container", "overlay-layer"}:
                continue
            return cls.replace("-", " ").title()
    return fallback


def extract_body_blocks(full_html: str) -> list[tuple[str, str]]:
    body_match = re.search(r"<body>(.*)</body>", full_html, re.DOTALL)
    if not body_match:
        return []
    body = body_match.group(1)
    cta_html = extract_cta_break_html(full_html)

    # Strip template & scripts
    body = re.sub(r"<template[^>]*>.*?</template>", "", body, flags=re.DOTALL)
    body = re.sub(r"<script[^>]*>.*?</script>", "", body, flags=re.DOTALL)

    blocks: list[tuple[str, str]] = []
    pos = 0
    length = len(body)

    while pos < length:
        # skip whitespace
        ws = re.match(r"\s+", body[pos:])
        if ws:
            pos += ws.end()
            continue

        # skip standalone comments
        cm = re.match(r"<!--.*?-->", body[pos:], re.DOTALL)
        if cm:
            pos += cm.end()
            continue

        if body[pos] != "<":
            pos += 1
            continue

        parsed = parse_tag_at(body, pos)
        if not parsed:
            pos += 1
            continue

        tag, open_tag_str, _, is_closing = parsed
        if is_closing:
            pos += 1
            continue

        if not is_top_level_block(tag, open_tag_str):
            pos += 1
            continue

        extracted = extract_element(body, pos)
        if not extracted:
            pos += 1
            continue

        el_html, next_pos = extracted
        title = comment_before(body, pos) or infer_title(el_html, f"Block {len(blocks) + 1}")

        if "data-cta-break" in el_html:
            idx = sum(1 for t, _ in blocks if t.lower().startswith("cta break")) + 1
            if cta_html:
                blocks.append((f"CTA Break #{idx}", cta_html))
        else:
            blocks.append((title, el_html.strip()))

        pos = next_pos

    return blocks


def main() -> None:
    full_html = INDEX.read_text(encoding="utf-8")
    blocks = extract_body_blocks(full_html)

    if len(blocks) < 10:
        raise SystemExit(f"Parser found only {len(blocks)} blocks — check index.html")

    SECTIONS_DIR.mkdir(parents=True, exist_ok=True)
    for old in SECTIONS_DIR.glob("*.json"):
        old.unlink()

    all_sections = []
    manifest = []

    for i, (title, html) in enumerate(blocks, start=1):
        slug = slugify(title)
        if not slug or slug == "section":
            slug = f"section-{i:02d}"

        base_slug = slug
        n = 2
        while any(m["slug"] == slug for m in manifest):
            slug = f"{base_slug}-{n}"
            n += 1

        display_title = f"{i:02d}. {title}"
        section = make_section(title=display_title, html=html, slug=slug)
        all_sections.append(section)

        section_page = make_page_json(f"KDP Profit Machine — {title}", [section])
        filename = f"{i:02d}-{slug}.json"
        out_path = SECTIONS_DIR / filename
        out_path.write_text(json.dumps(section_page, indent=2, ensure_ascii=False), encoding="utf-8")

        manifest.append({
            "order": i,
            "title": title,
            "elementor_section_title": display_title,
            "slug": slug,
            "file": f"sections/{filename}",
        })

    full_page = make_page_json("KDP Profit Machine — Full Landing Page", all_sections)
    (OUT / "kdp-mafia-full-page.json").write_text(
        json.dumps(full_page, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    (OUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    shutil.copy2(STYLES, OUT / "elementor-custom.css")
    shutil.copy2(SCRIPT, OUT / "elementor-custom.js")

    print(f"Generated {len(blocks)} sections")
    print(f"Full page: {OUT / 'kdp-mafia-full-page.json'}")
    print(f"Sections:  {SECTIONS_DIR}")


if __name__ == "__main__":
    main()

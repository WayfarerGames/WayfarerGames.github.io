#!/usr/bin/env python3
"""
Post-build script: remove top navbar and replace sidebar with full nav + per-page TOC dropdowns.
Run after: mkdocs build

Usage:
  python transform_docs.py [site_dir]
  If site_dir is omitted, uses ./site relative to this script.
"""
import re
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(SCRIPT_DIR, "site")

# (file path relative to site/, base path for links, current page key)
PAGES = [
    ("index.html", ".", "home"),
    ("getting-started/setup-and-first-spawn/index.html", "../../", "setup"),
    ("modules/free-modules/index.html", "../../", "modules"),
    ("patterns/basic-patterns/index.html", "../../", "patterns"),
    ("extending/write-your-own-modules/index.html", "../../", "extending"),
    ("paid-version/index.html", "../", "paid"),
]

NAV = [
    ("home", "Home", ""),
    ("setup", "Setup and First Spawn", "getting-started/setup-and-first-spawn/"),
    ("modules", "Free Modules", "modules/free-modules/"),
    ("patterns", "Basic Patterns", "patterns/basic-patterns/"),
    ("extending", "Write Your Own Modules", "extending/write-your-own-modules/"),
    ("paid", "Paid Version", "paid-version/"),
]


def resolve_url(base: str, path: str) -> str:
    """Resolve nav path relative to base. base ends with / or is ."""
    if not path:
        return base if base != "." else "."
    if base == ".":
        return path
    return base + path


def extract_toc(html: str) -> str:
    """Extract the inner TOC (level-2 items) from the page sidebar."""
    start = html.find('<div id="toc-collapse"')
    if start == -1:
        return ""
    # Find the first level-1 li and the inner <ul> inside it
    ul_start = html.find('<ul class="nav flex-column">', start)
    if ul_start == -1:
        return ""
    li1 = html.find('<li class="nav-item" data-bs-level="1">', ul_start)
    if li1 == -1:
        return ""
    inner_ul = html.find('<ul class="nav flex-column">', li1 + 1)
    if inner_ul == -1:
        return ""
    content_start = inner_ul + len('<ul class="nav flex-column">')
    # Find matching closing </ul> by counting
    pos = content_start
    depth = 1
    while depth > 0 and pos < len(html):
        next_open = html.find("<ul", pos)
        next_close = html.find("</ul>", pos)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            depth += 1
            pos = next_open + 2
        else:
            depth -= 1
            if depth == 0:
                return html[content_start:next_close].strip()
            pos = next_close + 5
    return ""


def build_sidebar(base: str, current: str, toc_html: str) -> str:
    """Build the full sidebar HTML with nav + current page TOC dropdown."""
    lines = [
        '<div class="col-md-3"><div class="navbar-expand-md bs-sidebar hidden-print affix" role="complementary">',
        '  <div class="navbar-header mb-2">',
        '    <a class="navbar-brand d-block mb-2" href="' + resolve_url(base, "") + '">Bulletfury Documentation</a>',
        '    <a href="#" class="nav-link small" data-bs-toggle="modal" data-bs-target="#mkdocs_search_modal"><i class="fa fa-search"></i> Search</a>',
        "  </div>",
        '  <div id="toc-collapse" class="navbar-collapse collapse card bg-body-tertiary">',
        '    <ul class="nav flex-column">',
    ]
    for key, label, path in NAV:
        href = resolve_url(base, path)
        is_current = key == current
        active = ' active" aria-current="page"' if is_current else '"'
        if is_current and toc_html:
            collapse_id = "side-toc-" + key
            lines.append('      <li class="nav-item">')
            lines.append(
                '        <a class="nav-link' + active + ' data-bs-toggle="collapse" href="#' + collapse_id + '" role="button" aria-expanded="true">' + label + ' <span class="fa fa-angle-down"></span></a>'
            )
            lines.append('        <div id="' + collapse_id + '" class="collapse show">')
            lines.append('          <ul class="nav flex-column ms-2">')
            lines.append(toc_html)
            lines.append("          </ul>")
            lines.append("        </div>")
            lines.append("      </li>")
        else:
            lines.append('      <li class="nav-item">')
            lines.append('        <a class="nav-link' + active + ' href="' + href + '">' + label + "</a>")
            lines.append("      </li>")
    lines.extend(["    </ul>", "  </div>", "</div></div>"])
    return "\n".join(lines)


def remove_navbar(html: str) -> str:
    """Remove the fixed top navbar."""
    return re.sub(
        r'<div class="navbar fixed-top navbar-expand-lg navbar-dark bg-primary">.*?</div>\s*</div>\s*</div>\s*\n\s*<div class="container">',
        "\n        <div class=\"container\">",
        html,
        flags=re.DOTALL,
    )


def replace_sidebar(html: str, new_sidebar: str) -> str:
    """Replace the existing sidebar column with the new sidebar, or insert sidebar for index (col-md-12)."""
    # Pages that have a sidebar (col-md-3 + col-md-9)
    pattern_with_sidebar = re.compile(
        r'<div class="col-md-3"><div class="navbar-expand-md bs-sidebar hidden-print affix" role="complementary">.*?</div></div>\s*\n\s*<div class="col-md-9" role="main">',
        re.DOTALL,
    )
    if pattern_with_sidebar.search(html):
        return pattern_with_sidebar.sub(
            new_sidebar + "\n                    <div class=\"col-md-9\" role=\"main\">",
            html,
        )
    # Index (or similar) has no sidebar: <div class="col-md-12" role="main">
    pattern_no_sidebar = re.compile(
        r'<div class="row">\s*<div class="col-md-12" role="main">',
        re.DOTALL,
    )
    return pattern_no_sidebar.sub(
        '<div class="row">\n                    ' + new_sidebar + "\n                    <div class=\"col-md-9\" role=\"main\">",
        html,
    )


def add_body_class(html: str) -> str:
    """Add class to body so we can remove top padding when navbar is gone."""
    return html.replace('<body class="homepage">', '<body class="homepage docs-sidebar-only">').replace(
        '<body>', '<body class="docs-sidebar-only">'
    )


def main():
    for rel_path, base, current in PAGES:
        path = os.path.join(SITE_DIR, rel_path)
        if not os.path.isfile(path):
            print("Skip (not found):", rel_path)
            continue
        with open(path, "r", encoding="utf-8") as f:
            html = f.read()
        toc = extract_toc(html)
        sidebar = build_sidebar(base, current, toc)
        html = remove_navbar(html)
        html = replace_sidebar(html, sidebar)
        html = add_body_class(html)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print("Updated:", rel_path)
    print("Done.")


if __name__ == "__main__":
    main()

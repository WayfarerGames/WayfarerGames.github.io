(() => {
  const NAV_GROUPS = [
    {
      title: "Intro",
      href: "/",
    },
    {
      title: "Setup",
      children: [
        { label: "Install the package", href: "/getting-started/setup-and-first-spawn/#1-install-the-package" },
        { label: "Create a spawner object", href: "/getting-started/setup-and-first-spawn/#2-create-a-spawner-object" },
        { label: "Make it visible", href: "/getting-started/setup-and-first-spawn/#3-make-it-visible" },
        { label: "Configure the basics", href: "/getting-started/setup-and-first-spawn/#4-configure-the-basics" },
        { label: "Fire", href: "/getting-started/setup-and-first-spawn/#5-fire" },
        { label: "Manual spawning", href: "/getting-started/setup-and-first-spawn/#manual-spawning" },
        { label: "Troubleshooting", href: "/getting-started/setup-and-first-spawn/#troubleshooting" },
      ],
    },
    {
      title: "Free Modules",
      children: [
        { label: "How modules work", href: "/modules/free-modules/#how-modules-work" },
        { label: "The modules", href: "/modules/free-modules/#the-modules" },
        { label: "Performance tips", href: "/modules/free-modules/#performance-tips" },
      ],
    },
    {
      title: "Patterns",
      children: [
        { label: "Straight stream", href: "/patterns/basic-patterns/#1-straight-stream" },
        { label: "Radial burst", href: "/patterns/basic-patterns/#2-radial-burst" },
        { label: "Rotating spiral", href: "/patterns/basic-patterns/#3-rotating-spiral" },
        { label: "Wave stream", href: "/patterns/basic-patterns/#4-wave-stream" },
        { label: "Hold and release", href: "/patterns/basic-patterns/#5-hold-release" },
        { label: "Shotgun blast", href: "/patterns/basic-patterns/#6-shotgun-blast" },
        { label: "Tuning tips", href: "/patterns/basic-patterns/#tuning-tips" },
      ],
    },
    {
      title: "Write Your Own Modules",
      children: [
        { label: "How it works", href: "/extending/write-your-own-modules/#how-it-works" },
        { label: "Choose your interface", href: "/extending/write-your-own-modules/#choose-your-weapon-interface" },
        { label: "Examples", href: "/extending/write-your-own-modules/#example-1-making-bullets-drift-sideways" },
        { label: "Performance note", href: "/extending/write-your-own-modules/#a-note-on-performance-parallel-vs-main-thread" },
      ],
    },
    {
      title: "Paid Version",
      children: [
        { label: "Why upgrade", href: "/paid-version/#why-upgrade" },
        { label: "Free vs Pro", href: "/paid-version/#free-vs-pro-whats-the-difference" },
      ],
    },
  ];

  function normalizePath(value) {
    if (!value) return "/";
    let path = value;
    if (/^https?:\/\//.test(path)) {
      path = new URL(path).pathname;
    }
    path = path.split("#")[0];
    if (!path.endsWith("/")) path += "/";
    return path;
  }

  function docsRootFromBase(basePath) {
    const root = new URL(`${basePath}/`, window.location.href).pathname;
    return root.endsWith("/") ? root : `${root}/`;
  }

  function buildHref(docsRoot, target) {
    const [pathPart, hashPart] = target.split("#");
    const relativePath = pathPart.replace(/^\/+/, "");
    const path = `${docsRoot}${relativePath}`.replace(/\/{2,}/g, "/");
    if (!hashPart) return path;
    return `${path}#${hashPart}`;
  }

  function isCurrentPath(linkPath, currentPath) {
    return normalizePath(linkPath) === normalizePath(currentPath);
  }

  function isCurrentGroup(group, docsRoot, currentPath) {
    if (group.href && isCurrentPath(buildHref(docsRoot, group.href), currentPath)) return true;
    if (!group.children) return false;
    return group.children.some((child) => isCurrentPath(buildHref(docsRoot, child.href), currentPath));
  }

  function isCurrentLink(fullHref, currentPath, currentHash) {
    const [linkPath, linkHash = ""] = fullHref.split("#");
    if (!isCurrentPath(linkPath, currentPath)) return false;
    if (!linkHash) return normalizePath(currentPath) === normalizePath(linkPath);
    return `#${linkHash}` === currentHash;
  }

  function createLink({ label, href }, docsRoot, currentPath, currentHash) {
    const anchor = document.createElement("a");
    const fullHref = buildHref(docsRoot, href);
    anchor.href = fullHref;
    anchor.className = "nav-link";
    anchor.textContent = label;
    if (isCurrentLink(fullHref, currentPath, currentHash)) {
      anchor.classList.add("active");
      anchor.setAttribute("aria-current", "page");
    }
    return anchor;
  }

  function renderSidebar(sidebar, docsRoot, currentPath, currentHash) {
    const wrapper = document.createElement("ul");
    wrapper.className = "nav flex-column docs-global-nav";

    NAV_GROUPS.forEach((group) => {
      const item = document.createElement("li");
      item.className = "nav-item docs-global-item";

      if (group.href) {
        item.appendChild(
          createLink(
            { label: group.title, href: group.href },
            docsRoot,
            currentPath,
            currentHash,
          ),
        );
        wrapper.appendChild(item);
        return;
      }

      const details = document.createElement("details");
      details.className = "docs-nav-group";
      details.open = isCurrentGroup(group, docsRoot, currentPath);

      const summary = document.createElement("summary");
      summary.className = "docs-nav-summary";
      summary.textContent = group.title;
      details.appendChild(summary);

      const childList = document.createElement("ul");
      childList.className = "nav flex-column docs-sub-nav";

      group.children.forEach((child) => {
        const childItem = document.createElement("li");
        childItem.className = "nav-item docs-sub-item";
        childItem.appendChild(createLink(child, docsRoot, currentPath, currentHash));
        childList.appendChild(childItem);
      });

      details.appendChild(childList);
      item.appendChild(details);
      wrapper.appendChild(item);
    });

    sidebar.innerHTML = "";
    sidebar.appendChild(wrapper);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tocContainer = document.querySelector("#toc-collapse .nav.flex-column");
    if (!tocContainer) return;

    const basePath = typeof window.base_url === "string" ? window.base_url : ".";
    const docsRoot = docsRootFromBase(basePath);
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    renderSidebar(tocContainer, docsRoot, currentPath, currentHash);
  });
})();

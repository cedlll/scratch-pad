(async function () {
  "use strict";

  // Import utilities
  const { sanitizeHTML, sanitizeMarkdown } = await import('./src/core/sanitize.js');
  const { STORAGE, TIMING, MENU } = await import('./src/config/constants.js');
  const { parseMarkdownToHTML } = await import('./src/utils/markdown.js');
  const { debounce } = await import('./src/utils/debounce.js');

  const STORAGE_KEY = STORAGE.CONTENT_KEY;
  const THEME_KEY = STORAGE.THEME_KEY;
  const SAVE_DEBOUNCE_MS = TIMING.SAVE_DEBOUNCE_MS;

  const editor = document.getElementById("editor");

  let saveTimeout = null;

  function normalizeEmptyEditor() {
    if (editor.textContent.trim()) return false;
    if (editor.innerHTML !== "<br>") {
      editor.innerHTML = "<br>";
    }
    return true;
  }

  // ── Theme ───────────────────────────────────────────
  let currentTheme = "dark";

  function applyTheme(theme) {
    currentTheme = theme;
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try { localStorage.setItem("scratchpad_theme", theme); } catch {}
  }

  function toggleTheme() {
    const next = currentTheme === "dark" ? "light" : "dark";
    applyTheme(next);
    chrome.storage.local.set({ [THEME_KEY]: next });
  }

  // ── Load saved content + theme ─────────────────────
  chrome.storage.local.get([STORAGE_KEY, THEME_KEY], (result) => {
    if (result[THEME_KEY]) {
      applyTheme(result[THEME_KEY]);
    }
    if (result[STORAGE_KEY] != null) {
      // SECURITY FIX: Sanitize HTML from storage to prevent XSS
      editor.innerHTML = sanitizeHTML(result[STORAGE_KEY]);
      migrateTodoItems();
    }
    normalizeEmptyEditor();
    updatePlaceholder();
    editor.focus();
  });

  // ── Migrate old todo items to use .todo-text wrapper ─
  function migrateTodoItems() {
    editor.querySelectorAll(".todo-item").forEach((item) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      checkbox.setAttribute("contenteditable", "false");
      checkbox.setAttribute("aria-label", "Mark task complete");
      if (item.querySelector(".todo-text")) return;
      const span = document.createElement("span");
      span.className = "todo-text";
      while (checkbox.nextSibling) {
        span.appendChild(checkbox.nextSibling);
      }
      if (!span.textContent.trim()) {
        span.textContent = "\u00A0";
      }
      item.appendChild(span);
    });
  }

  // ── Placeholder visibility ─────────────────────────
  function updatePlaceholder() {
    const hasText = editor.textContent.trim();
    const hasBlocks = editor.querySelector(".todo-item, h1, h2, h3, ul, ol, hr, blockquote");
    editor.classList.toggle("is-empty", !hasText && !hasBlocks);
  }

  function insertTodoItemAtSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const todoDiv = document.createElement("div");
    todoDiv.className = "todo-item";
    todoDiv.innerHTML =
      '<input type="checkbox" contenteditable="false" aria-label="Mark task complete">' +
      '<span class="todo-text">\u00A0</span>';

    const afterDiv = document.createElement("div");
    afterDiv.innerHTML = "<br>";

    let block = sel.getRangeAt(0).startContainer;
    while (block && block !== editor && block.parentNode !== editor) {
      block = block.parentNode;
    }

    if (block && block !== editor) {
      if (!block.textContent.trim()) {
        block.replaceWith(todoDiv, afterDiv);
      } else {
        block.after(todoDiv, afterDiv);
      }
    } else {
      editor.appendChild(todoDiv);
      editor.appendChild(afterDiv);
    }

    const textSpan = todoDiv.querySelector(".todo-text");
    const range = document.createRange();
    range.setStart(textSpan.firstChild, 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ── Open links on click ─────────────────────────────
  editor.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link) return;
    e.preventDefault();
    window.open(link.href, "_blank", "noopener");
  });

  // ── Paste as plain text (auto-link URLs) ────────────
  const URL_RE = /^https?:\/\/\S+$/;

  editor.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData.getData("text/plain") || "").trim();
    if (!text) return;

    if (URL_RE.test(text)) {
      const a = document.createElement("a");
      a.href = text;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = text;
      document.execCommand("insertHTML", false, a.outerHTML);
    } else {
      document.execCommand("insertText", false, text);
    }
  });

  // ── Auto-save on input (debounced) ───────────────────
  editor.addEventListener("input", () => {
    scheduleSave();
    handleSlashInput();
  });

  function save() {
    chrome.storage.local.set({ [STORAGE_KEY]: editor.innerHTML });
  }

  function scheduleSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(save, SAVE_DEBOUNCE_MS);
    updatePlaceholder();
  }

  // ── Keyboard handling ───────────────────────────────
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "\t");
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleTodoToggle(e);
    } else if (e.key === "Enter" && !e.shiftKey) {
      handleTodoEnter(e);
    }

    if (e.key === "Backspace") {
      handleBackspaceUnformat(e);
    }

    if (slashMenuOpen) {
      handleSlashKeydown(e);
    }
  });

  // ── Cmd/Ctrl+Enter inside todo → toggle checkbox ───
  function handleTodoToggle(e) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const node = sel.getRangeAt(0).startContainer;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    const todoItem = el?.closest?.(".todo-item");
    if (!todoItem) return;
    e.preventDefault();
    const checkbox = todoItem.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    checkbox.checked = !checkbox.checked;
    if (checkbox.checked) {
      checkbox.setAttribute("checked", "");
      todoItem.classList.add("checked");
    } else {
      checkbox.removeAttribute("checked");
      todoItem.classList.remove("checked");
    }
    scheduleSave();
  }

  // ── Enter inside todo → new todo item below ────────
  function handleTodoEnter(e) {
    const sel = window.getSelection();
    if (!sel.rangeCount || !sel.isCollapsed) return;

    const node = sel.getRangeAt(0).startContainer;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    const todoItem = el?.closest?.(".todo-item");
    if (!todoItem) return;

    e.preventDefault();

    const newTodo = document.createElement("div");
    newTodo.className = "todo-item";
    newTodo.innerHTML =
      '<input type="checkbox" contenteditable="false" aria-label="Mark task complete">' +
      '<span class="todo-text">\u00A0</span>';

    todoItem.after(newTodo);

    const textSpan = newTodo.querySelector(".todo-text");
    const range = document.createRange();
    range.setStart(textSpan.firstChild, 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    scheduleSave();
  }

  // ── Backspace at start of block → revert to plain text ──
  function handleBackspaceUnformat(e) {
    const sel = window.getSelection();
    if (!sel.rangeCount || !sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const offset = range.startOffset;

    if (offset !== 0) return;

    let block = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (block && block !== editor && block.parentNode !== editor) {
      block = block.parentNode;
    }
    if (!block || block === editor) return;

    const tag = block.tagName;

    // Lists: remove list formatting on backspace at start of first/empty item
    if (tag === "UL" || tag === "OL") {
      const li = node.closest ? node.closest("LI") : null;
      if (li) {
        const isEmpty = !li.textContent.trim();
        const isFirst = li === block.firstElementChild;
        if (isEmpty || isFirst) {
          e.preventDefault();
          if (tag === "UL") {
            document.execCommand("insertUnorderedList");
          } else {
            document.execCommand("insertOrderedList");
          }
          return;
        }
      }
    }
    if (tag === "LI") {
      const list = block.parentElement;
      if (list && (list.tagName === "UL" || list.tagName === "OL")) {
        const isEmpty = !block.textContent.trim();
        const isFirst = block === list.firstElementChild;
        if (isEmpty || isFirst) {
          e.preventDefault();
          if (list.tagName === "UL") {
            document.execCommand("insertUnorderedList");
          } else {
            document.execCommand("insertOrderedList");
          }
          return;
        }
      }
    }

    // Headings, blockquote, todo, callout → revert to plain div
    const formattedTags = ["H1", "H2", "H3", "BLOCKQUOTE"];
    const isTodoItem = block.classList?.contains("todo-item");
    const isFormatted = formattedTags.includes(tag) ||
                        isTodoItem ||
                        block.classList?.contains("callout");

    if (isFormatted && !block.textContent.trim()) {
      e.preventDefault();
      const div = document.createElement("div");
      div.innerHTML = "<br>";
      block.replaceWith(div);
      const newRange = document.createRange();
      newRange.setStart(div, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      scheduleSave();
    }
  }

  // ── Keyboard shortcuts ───────────────────────────────
  document.addEventListener("keydown", (e) => {
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key === "e") {
      e.preventDefault();
      exportMarkdown();
    }
  });

  // ── Checkbox toggle ──────────────────────────────────
  editor.addEventListener("click", (e) => {
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (!checkbox) return;
    const item = checkbox.closest(".todo-item");
    if (!item) return;
    // FIX: Removed unnecessary setTimeout - handle synchronously
    if (checkbox.checked) {
      checkbox.setAttribute("checked", "");
      item.classList.add("checked");
    } else {
      checkbox.removeAttribute("checked");
      item.classList.remove("checked");
    }
    scheduleSave();
  });

  editor.addEventListener("mousedown", (e) => {
    const item = e.target.closest(".todo-item");
    if (!item) return;
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (checkbox) return;
    const text = item.querySelector(".todo-text");
    if (!text) return;

    // FIX: Only override cursor position if clicking OUTSIDE the text span
    // If clicking directly on text, allow natural cursor placement
    if (text.contains(e.target)) {
      // User clicked directly on the text - let browser handle cursor position naturally
      return;
    }

    // User clicked on todo-item container but not on text - place cursor at end
    e.preventDefault();
    editor.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    if (!text.firstChild) {
      text.textContent = "\u00A0";
    }
    range.setStart(text.firstChild, text.firstChild.textContent.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  });

  // ── Keep cursor inside .todo-text ───────────────────
  // PERFORMANCE: Debounce selectionchange to avoid excessive firing
  const handleSelectionChange = debounce(() => {
    const sel = window.getSelection();
    if (!sel.rangeCount || !sel.isCollapsed) return;

    const node = sel.getRangeAt(0).startContainer;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    const todoItem = el?.closest?.(".todo-item");
    if (!todoItem) return;

    const textSpan = todoItem.querySelector(".todo-text");
    if (!textSpan || textSpan.contains(node)) return;

    const range = document.createRange();
    if (textSpan.firstChild) {
      range.setStart(textSpan.firstChild, textSpan.firstChild.textContent.length);
    } else {
      textSpan.textContent = "\u00A0";
      range.setStart(textSpan.firstChild, 1);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }, TIMING.SELECTION_DEBOUNCE_MS);

  document.addEventListener("selectionchange", handleSelectionChange);

  // ── Close slash menu on outside click ────────────────
  document.addEventListener("mousedown", (e) => {
    if (slashMenuOpen && menuEl && !menuEl.contains(e.target)) {
      closeSlashMenu();
    }
  });

  // ══════════════════════════════════════════════════════
  //  Slash Commands
  // ══════════════════════════════════════════════════════

  function getCommands() {
    const themeLabel = currentTheme === "dark" ? "Light mode" : "Dark mode";
    const themeIcon = currentTheme === "dark" ? "☀" : "☾";
    return [
      { icon: themeIcon, label: themeLabel,     hint: "",    action: "theme",   group: "theme" },
      { icon: "⤒",  label: "Open .md",     hint: "",    action: "upload",  group: "file" },
      { icon: "⤓",  label: "Save as .md",  hint: "",    action: "export",  group: "file" },
      { icon: "T",  label: "Text",         hint: "",    action: "text",    group: "blocks" },
      { icon: "H1", label: "Heading 1",    hint: "#",   action: "h1",      group: "blocks" },
      { icon: "H2", label: "Heading 2",    hint: "##",  action: "h2",      group: "blocks" },
      { icon: "H3", label: "Heading 3",    hint: "###", action: "h3",      group: "blocks" },
      { icon: "•",  label: "Bulleted list",hint: "-",   action: "ul",      group: "blocks" },
      { icon: "1.", label: "Numbered list", hint: "1.",  action: "ol",      group: "blocks" },
      { icon: "☐",  label: "To-do list",   hint: "[]",  action: "todo",    group: "blocks" },
      { icon: "❝",  label: "Quote",        hint: "",    action: "quote",   group: "blocks" },
      { icon: "—",  label: "Divider",      hint: "---", action: "divider", group: "blocks" },
    ];
  }

  let menuEl = null;
  let slashMenuOpen = false;
  let activeIndex = 0;
  let filteredCommands = getCommands();
  let menuPosition = null;

  function createMenuEl() {
    const el = document.createElement("div");
    el.className = "slash-menu";
    el.id = "slash-menu";
    el.setAttribute("role", "listbox");
    el.style.display = "none";
    document.body.appendChild(el);
    return el;
  }

  function renderMenu(commands) {
    if (!menuEl) menuEl = createMenuEl();
    filteredCommands = commands;

    if (commands.length === 0) {
      menuEl.innerHTML = '<div class="slash-empty">No results</div>';
      return;
    }

    activeIndex = Math.min(activeIndex, commands.length - 1);

    let html = "";
    let lastGroup = null;
    commands.forEach((cmd, i) => {
      if (lastGroup && cmd.group && cmd.group !== lastGroup) {
        html += '<div class="slash-separator"></div>';
      }
      lastGroup = cmd.group || lastGroup;
      html += `<div class="slash-item${i === activeIndex ? " active" : ""}" data-index="${i}" role="option" id="slash-opt-${i}" aria-selected="${i === activeIndex}">
        <div class="slash-icon">${cmd.icon}</div>
        <div class="slash-label">${cmd.label}</div>
        ${cmd.hint ? `<div class="slash-hint">${cmd.hint}</div>` : ""}
      </div>`;
    });
    menuEl.innerHTML = html;

    editor.setAttribute("aria-activedescendant", `slash-opt-${activeIndex}`);

    menuEl.querySelectorAll(".slash-item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        activeIndex = parseInt(item.dataset.index);
        menuEl.querySelectorAll(".slash-item").forEach((el, i) => {
          el.classList.toggle("active", i === activeIndex);
          el.setAttribute("aria-selected", i === activeIndex);
        });
        editor.setAttribute("aria-activedescendant", `slash-opt-${activeIndex}`);
      });
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectCommand(parseInt(item.dataset.index));
      });
    });
  }

  function getCaretRect() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    if (rect.x === 0 && rect.y === 0) return null;
    return rect;
  }

  function showSlashMenu() {
    const rect = getCaretRect();
    if (!rect) return;

    slashMenuOpen = true;
    activeIndex = 0;

    renderMenu(getCommands());
    editor.setAttribute("aria-expanded", "true");
    editor.setAttribute("aria-controls", "slash-menu");

    // IMPROVED: Better positioning with actual menu dimensions
    menuEl.style.display = "";
    const menuRect = menuEl.getBoundingClientRect();
    const menuHeight = menuRect.height || MENU.MAX_HEIGHT;
    const menuWidth = menuRect.width || MENU.WIDTH;

    let top = rect.bottom + MENU.OFFSET;
    let left = rect.left;

    // Vertical positioning with smart fallback
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < menuHeight + MENU.VIEWPORT_PADDING) {
      // Not enough space below
      if (spaceAbove >= menuHeight || spaceAbove > spaceBelow) {
        // Position above if there's more space or enough room
        top = rect.top - menuHeight - MENU.OFFSET;
      } else {
        // Not enough space anywhere, align to viewport bottom
        top = window.innerHeight - menuHeight - MENU.VIEWPORT_PADDING;
      }
    }

    // Horizontal positioning
    if (left + menuWidth > window.innerWidth - MENU.VIEWPORT_PADDING) {
      left = Math.max(MENU.VIEWPORT_PADDING, window.innerWidth - menuWidth - MENU.VIEWPORT_PADDING);
    }

    // Ensure menu stays within viewport
    top = Math.max(MENU.VIEWPORT_PADDING, Math.min(top, window.innerHeight - menuHeight - MENU.VIEWPORT_PADDING));
    left = Math.max(MENU.VIEWPORT_PADDING, left);

    menuPosition = { top, left };
    menuEl.style.top = `${top}px`;
    menuEl.style.left = `${left}px`;
  }

  function closeSlashMenu() {
    slashMenuOpen = false;
    if (menuEl) menuEl.style.display = "none";
    editor.removeAttribute("aria-expanded");
    editor.removeAttribute("aria-activedescendant");
    editor.removeAttribute("aria-controls");
  }

  function getSlashContext() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    const node = sel.getRangeAt(0).startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;
    const offset = sel.getRangeAt(0).startOffset;
    const text = node.textContent.substring(0, offset);
    const slashIdx = text.lastIndexOf("/");
    if (slashIdx === -1) return null;
    return {
      node,
      slashOffset: slashIdx,
      caretOffset: offset,
      filter: text.substring(slashIdx + 1),
    };
  }

  function handleSlashInput() {
    if (slashMenuOpen) {
      const ctx = getSlashContext();
      if (!ctx) {
        closeSlashMenu();
        return;
      }
      const query = ctx.filter.toLowerCase();
      const commands = getCommands();
      const filtered = commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query) ||
          cmd.hint.toLowerCase().includes(query) ||
          cmd.action.toLowerCase().includes(query)
      );
      activeIndex = 0;
      renderMenu(filtered);
      return;
    }

    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const node = sel.getRangeAt(0).startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const offset = sel.getRangeAt(0).startOffset;
    if (offset === 0) return;
    if (node.textContent[offset - 1] !== "/") return;

    // FIX: Don't trigger slash menu inside links
    const linkParent = node.parentElement?.closest?.('a[href]');
    if (linkParent) return;

    // FIX: Don't trigger if part of a URL (e.g., http://)
    const text = node.textContent;
    const beforeSlash = text.substring(Math.max(0, offset - 10), offset);
    if (/https?:$/.test(beforeSlash) || /ftp:$/.test(beforeSlash)) return;

    if (offset >= 2) {
      const before = node.textContent[offset - 2];
      if (before !== " " && before !== "\n" && before !== "\t" && before !== "\u00A0") return;
    }

    showSlashMenu();
  }

  function handleSlashKeydown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % filteredCommands.length;
      updateActiveItem();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + filteredCommands.length) % filteredCommands.length;
      updateActiveItem();
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectCommand(activeIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSlashMenu();
    }
  }

  function updateActiveItem() {
    if (!menuEl) return;
    menuEl.querySelectorAll(".slash-item").forEach((el, i) => {
      el.classList.toggle("active", i === activeIndex);
      el.setAttribute("aria-selected", i === activeIndex);
    });
    editor.setAttribute("aria-activedescendant", `slash-opt-${activeIndex}`);
    const active = menuEl.querySelector(".slash-item.active");
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  function deleteSlashText() {
    const ctx = getSlashContext();
    if (!ctx) return false;
    const range = document.createRange();
    range.setStart(ctx.node, ctx.slashOffset);
    range.setEnd(ctx.node, ctx.caretOffset);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("delete");
    return true;
  }

  function selectCommand(index) {
    if (index < 0 || index >= filteredCommands.length) return;
    const cmd = filteredCommands[index];
    closeSlashMenu();
    editor.focus();
    deleteSlashText();

    switch (cmd.action) {
      case "text":
        break;
      case "h1":
        document.execCommand("formatBlock", false, "H1");
        break;
      case "h2":
        document.execCommand("formatBlock", false, "H2");
        break;
      case "h3":
        document.execCommand("formatBlock", false, "H3");
        break;
      case "ul":
        document.execCommand("insertUnorderedList");
        break;
      case "ol":
        document.execCommand("insertOrderedList");
        break;
      case "todo":
        insertTodoItemAtSelection();
        break;
      case "quote":
        document.execCommand("formatBlock", false, "BLOCKQUOTE");
        break;
      case "divider":
        document.execCommand("insertHTML", false, "<hr><div><br></div>");
        break;
      case "export":
        exportMarkdown();
        break;
      case "upload":
        uploadMarkdown();
        break;
      case "theme":
        toggleTheme();
        break;
    }

    scheduleSave();
  }

  // ── Export as .md ────────────────────────────────────
  function exportMarkdown() {
    const content = editor.innerText;
    if (!content.trim()) {
      showToast("Nothing to export");
      return;
    }

    // IMPROVED UX: Allow user to customize filename
    const defaultName = `scratchpad-${formatDate()}`;
    const filename = prompt('Export filename (without .md extension):', defaultName);

    // User cancelled
    if (filename === null) return;

    // Sanitize filename
    const sanitizedFilename = (filename.trim() || defaultName)
      .replace(/[^a-z0-9_\-\.]/gi, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizedFilename}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as ${sanitizedFilename}.md`);
  }

  function formatDate() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // ── Upload / Import .md ──────────────────────────────
  function uploadMarkdown() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,text/markdown";
    input.onchange = () => {
      if (input.files[0]) loadMarkdownFile(input.files[0]);
    };
    input.click();
  }

  function loadMarkdownFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const md = e.target.result;
      if (editor.textContent.trim() && !confirm("Replace current content with " + file.name + "?")) {
        return;
      }
      // SECURITY FIX: Sanitize markdown-converted HTML to prevent XSS
      try {
        const html = parseMarkdownToHTML(md);
        editor.innerHTML = sanitizeMarkdown(html);
        migrateTodoItems();
        normalizeEmptyEditor();
        updatePlaceholder();
        scheduleSave();
        showToast("Loaded " + file.name);
      } catch (error) {
        showToast("Failed to load " + file.name + ": " + error.message, true);
        console.error('Import error:', error);
      }
    };
    reader.onerror = (error) => {
      showToast("Failed to read file: " + (error.message || 'Unknown error'), true);
      console.error('File read error:', error);
    };
    reader.readAsText(file);
  }

  // parseMarkdownToHTML is now imported from src/utils/markdown.js
  // (removed old implementation - enhanced version supports inline formatting like **bold**, *italic*, `code`, [links](url))

  // ── Drag & Drop .md files ──────────────────────────
  let dragCounter = 0;
  let dropOverlay = null;

  function showDropOverlay() {
    if (dropOverlay) return;
    dropOverlay = document.createElement("div");
    dropOverlay.className = "drop-overlay";
    dropOverlay.innerHTML = '<div class="drop-overlay-label">Drop .md file to open</div>';
    document.body.appendChild(dropOverlay);
  }

  function hideDropOverlay() {
    if (!dropOverlay) return;
    dropOverlay.remove();
    dropOverlay = null;
  }

  document.addEventListener("dragenter", (e) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) showDropOverlay();
  });

  document.addEventListener("dragleave", () => {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      hideDropOverlay();
    }
  });

  document.addEventListener("dragover", (e) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
    dragCounter = 0;
    hideDropOverlay();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!/\.(md|markdown)$/i.test(file.name)) {
      showToast("Only .md files are supported", true);
      return;
    }
    loadMarkdownFile(file);
  });

  // ── Toast ────────────────────────────────────────────
  const toastEl = document.getElementById("toast");
  let toastTimeout = null;

  function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.className = isError ? "toast error" : "toast";
    toastTimeout = setTimeout(() => {
      toastEl.classList.add("hidden");
    }, 3000);
  }

})();

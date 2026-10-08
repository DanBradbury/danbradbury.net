// Vim-style navigation, search, statusline and image zoom for danbradbury.net
(function () {
    'use strict';

    const statusLine = document.querySelector('.status-line');
    const modeEl = statusLine && statusLine.querySelector('.mode-indicator');
    const fileEl = statusLine && statusLine.querySelector('.seg-file');
    const posEl = statusLine && statusLine.querySelector('.seg-pos');
    const searchRoot = document.querySelector('main') || document.body;
    const defaultFile = fileEl ? fileEl.textContent : '';

    let searchMode = false;
    let searchQuery = '';
    let matches = [];
    let current = -1;
    let pendingG = false;

    function isTyping() {
        const el = document.activeElement;
        return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    }

    function setMode(mode, text) {
        if (!modeEl) return;
        modeEl.textContent = mode;
        modeEl.classList.toggle('is-search', mode === 'SEARCH');
        modeEl.classList.toggle('is-insert', mode === 'INSERT');
        if (fileEl) fileEl.textContent = text !== undefined ? text : defaultFile;
    }

    // ---- Position indicator -------------------------------------------------
    function updatePosition() {
        if (!posEl) return;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) { posEl.textContent = 'All'; return; }
        const pct = Math.round((window.scrollY / max) * 100);
        posEl.textContent = pct <= 0 ? 'Top' : pct >= 99 ? 'Bot' : pct + '%';
    }

    // ---- Search -------------------------------------------------------------
    function clearHighlights() {
        searchRoot.querySelectorAll('mark.search-highlight').forEach(function (mark) {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
        matches = [];
        current = -1;
    }

    function highlight(query) {
        clearHighlights();
        if (!query) return;
        const needle = query.toLowerCase();
        const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                const p = node.parentNode;
                if (!p || /^(SCRIPT|STYLE|NOSCRIPT|MARK)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
                if (p.closest('[hidden], .post-filter')) return NodeFilter.FILTER_REJECT;
                return node.textContent.toLowerCase().includes(needle) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
        });

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach(function (node) {
            const text = node.textContent;
            const lower = text.toLowerCase();
            const frag = document.createDocumentFragment();
            let last = 0;
            let idx = lower.indexOf(needle);
            while (idx !== -1) {
                if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = text.slice(idx, idx + needle.length);
                frag.appendChild(mark);
                matches.push(mark);
                last = idx + needle.length;
                idx = lower.indexOf(needle, last);
            }
            if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode.replaceChild(frag, node);
        });
    }

    function jump(step) {
        if (!matches.length) {
            if (searchQuery) setMode('SEARCH', 'E486: Pattern not found: ' + searchQuery);
            return;
        }
        if (current >= 0) matches[current].classList.remove('is-current');
        current = (current + step + matches.length) % matches.length;
        const m = matches[current];
        m.classList.add('is-current');
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setMode('SEARCH', '/' + searchQuery + '  [' + (current + 1) + '/' + matches.length + ']');
    }

    function renderPrompt() {
        setMode('SEARCH', '/' + searchQuery + '\u2588');
    }

    function exitSearch(keepHighlights) {
        searchMode = false;
        if (!keepHighlights) {
            clearHighlights();
            searchQuery = '';
            setMode('NORMAL');
        }
    }

    // ---- Keybindings --------------------------------------------------------
    document.addEventListener('keydown', function (e) {
        if (isTyping() || e.altKey || e.metaKey) return;

        if (searchMode) {
            if (e.key === 'Escape') {
                e.preventDefault();
                exitSearch(false);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                exitSearch(true);
                jump(1);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                if (!searchQuery) { exitSearch(false); return; }
                searchQuery = searchQuery.slice(0, -1);
                highlight(searchQuery);
                renderPrompt();
            } else if (e.key.length === 1 && !e.ctrlKey) {
                e.preventDefault();
                searchQuery += e.key;
                highlight(searchQuery);
                renderPrompt();
            }
            return;
        }

        if (e.ctrlKey) {
            if (e.key === 'd') { e.preventDefault(); window.scrollBy(0, window.innerHeight / 2); }
            if (e.key === 'u') { e.preventDefault(); window.scrollBy(0, -window.innerHeight / 2); }
            return;
        }

        switch (e.key) {
            case '/':
                e.preventDefault();
                clearHighlights();
                searchMode = true;
                searchQuery = '';
                renderPrompt();
                break;
            case 'n':
                if (matches.length) { e.preventDefault(); jump(1); }
                break;
            case 'N':
                if (matches.length) { e.preventDefault(); jump(-1); }
                break;
            case 'Escape':
                if (matches.length || searchQuery) exitSearch(false);
                break;
            case 'j':
                window.scrollBy(0, 48);
                break;
            case 'k':
                window.scrollBy(0, -48);
                break;
            case 'G':
                window.scrollTo(0, document.documentElement.scrollHeight);
                break;
            case 'g':
                if (pendingG) {
                    window.scrollTo(0, 0);
                    pendingG = false;
                } else {
                    pendingG = true;
                    setTimeout(function () { pendingG = false; }, 500);
                }
                break;
            case 'i':
                setMode('INSERT', '-- INSERT -- (just kidding, this is read-only)');
                setTimeout(function () { if (!searchMode) setMode('NORMAL'); }, 1200);
                break;
        }
    });

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    updatePosition();

    // ---- Post tag filter ----------------------------------------------------
    const postFilter = document.querySelector('.post-filter');
    if (postFilter) {
        const input = postFilter.querySelector('input');
        const suggestions = postFilter.querySelector('.tag-suggestions');
        const chips = postFilter.querySelector('.selected-tags');
        const selected = new Set();
        let matches = [];
        let active = -1;
        const count = postFilter.querySelector('.post-filter-count');
        const posts = Array.from(document.querySelectorAll('.post-list .post-row')).map(function (row) {
            return {
                row: row,
                tags: Array.from(row.querySelectorAll('.post-tags .tag')).map(function (tag) {
                    return tag.textContent.trim();
                }).filter(Boolean)
            };
        });
        const tags = Array.from(new Set(posts.flatMap(function (post) { return post.tags; })));
        tags.sort(function (a, b) { return a.localeCompare(b); });
        function closeSuggestions() {
            suggestions.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            active = -1;
        }

        function activate(index) {
            active = index;
            Array.from(suggestions.children).forEach(function (option, i) {
                option.setAttribute('aria-selected', String(i === active));
            });
            if (active >= 0) {
                input.setAttribute('aria-activedescendant', suggestions.children[active].id);
                suggestions.children[active].scrollIntoView({ block: 'nearest' });
            } else {
                input.removeAttribute('aria-activedescendant');
            }
        }

        function suggestTags() {
            const query = input.value.trim().toLowerCase();
            matches = tags.filter(function (tag) {
                return !selected.has(tag) && tag.toLowerCase().includes(query);
            });
            suggestions.replaceChildren();
            matches.forEach(function (tag, i) {
                const option = document.createElement('li');
                option.id = 'tag-option-' + i;
                option.setAttribute('role', 'option');
                option.setAttribute('aria-selected', 'false');
                option.textContent = tag;
                option.addEventListener('mousedown', function (event) { event.preventDefault(); });
                option.addEventListener('click', function () { selectTag(tag); });
                suggestions.appendChild(option);
            });
            if (!matches.length) {
                const empty = document.createElement('li');
                empty.textContent = 'No matching tags';
                empty.setAttribute('role', 'presentation');
                suggestions.appendChild(empty);
            }
            suggestions.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            activate(-1);
        }

        function renderSelected() {
            chips.replaceChildren();
            selected.forEach(function (tag) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'tag selected-tag';
                button.textContent = tag + ' ×';
                button.setAttribute('aria-label', 'Remove tag ' + tag);
                button.addEventListener('click', function () {
                    selected.delete(tag);
                    renderSelected();
                    filterPosts();
                    input.focus();
                    suggestTags();
                });
                chips.appendChild(button);
            });
        }

        function selectTag(tag) {
            selected.add(tag);
            input.value = '';
            renderSelected();
            filterPosts();
            input.focus();
            suggestTags();
        }

        function filterPosts() {
            let visible = 0;
            posts.forEach(function (post) {
                post.row.hidden = selected.size > 0 && !post.tags.some(function (tag) { return selected.has(tag); });
                if (!post.row.hidden) visible++;
            });
            count.textContent = visible + ' of ' + posts.length + ' posts';
            if (searchQuery) {
                highlight(searchQuery);
                setMode('NORMAL');
            }
            updatePosition();
        }

        input.addEventListener('input', suggestTags);
        input.addEventListener('focus', suggestTags);
        input.addEventListener('blur', closeSuggestions);
        input.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (suggestions.hidden) suggestTags();
                if (matches.length) {
                    activate((active + (event.key === 'ArrowDown' ? 1 : (active < 0 ? 0 : -1)) + matches.length) % matches.length);
                }
            } else if (event.key === 'Enter' && !suggestions.hidden && matches.length) {
                event.preventDefault();
                selectTag(matches[active >= 0 ? active : 0]);
            } else if (event.key === 'Escape') {
                closeSuggestions();
            }
        });
        filterPosts();
        postFilter.hidden = tags.length === 0;
    }

    // ---- Image zoom ---------------------------------------------------------
    const images = document.querySelectorAll('.content img');
    if (images.length) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML =
            '<button class="image-modal-close" aria-label="Close">&times;</button>' +
            '<img class="image-modal-content" alt="">' +
            '<div class="image-modal-info">:q &mdash; click anywhere or press Esc to close</div>';
        document.body.appendChild(modal);
        const modalImg = modal.querySelector('img');

        const close = function () {
            modal.classList.remove('is-open');
            document.body.style.overflow = '';
        };

        images.forEach(function (img) {
            img.addEventListener('click', function () {
                modalImg.src = img.currentSrc || img.src;
                modalImg.alt = img.alt || 'Expanded image';
                modal.classList.add('is-open');
                document.body.style.overflow = 'hidden';
            });
        });

        modal.addEventListener('click', close);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
        });
    }
})();

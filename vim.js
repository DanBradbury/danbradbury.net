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
                if (p.closest('[hidden], select, .post-filter-count')) return NodeFilter.FILTER_REJECT;
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
        const select = postFilter.querySelector('select');
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
        tags.forEach(function (tag) {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            select.appendChild(option);
        });

        function filterPosts() {
            let visible = 0;
            posts.forEach(function (post) {
                post.row.hidden = !!select.value && !post.tags.includes(select.value);
                if (!post.row.hidden) visible++;
            });
            count.textContent = visible + ' of ' + posts.length + ' posts';
            if (searchQuery) {
                highlight(searchQuery);
                setMode('NORMAL');
            }
            updatePosition();
        }

        select.addEventListener('change', filterPosts);
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

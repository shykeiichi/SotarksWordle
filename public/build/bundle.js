
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    let names = [
        "Kyoukai no Kanata",
        "Zankyo Sanka",
        "Kaikai Kitan",
        "Super * Affection",
        "Honey Come!!",
        "One In A Billion",
        "Yakusoku -Promise code-",
        "Last Chapter",
        "STONE OCEAN",
        "Say Goodbye",
        "Gyakkyou Spectrum",
        "Tomadoi Recipe",
        "Delta Decision",
        "I'm so excited (feat. Bobby John)",
        "Yuke",
        "Cynthia no Hikari",
        "Flamewall",
        "AVENGE WORLD",
        "Heavy Rotation",
        "Sing My Pleasure",
        "Koko kara Saki wa Uta ni Naranai",
        "START!! True dreams",
        "Like Flames",
        "reiwa anthem",
        "Plastic Smile",
        "Kira Kira Days",
        "The Big Black",
        "I Wanna Guinea Pig For Christmas",
        "Zutto Summer de Koishiteru",
        "Acacia",
        "CLOSER",
        "over and over",
        "FLAME",
        "Shiny Smily Story",
        "Nanairo Symphony",
        "FLYING OUT TO THE SKY",
        "Realize",
        "Songs Compilation IV",
        "Starlight Wonder",
        "Triple Baka",
        "sabotage",
        "Make you happy",
        "Beginner's Sailing",
        "Theater of Life",
        "Angel With A Shotgun",
        "Scar/let",
        "ChuChu Lovely MuniMuni MuraMura PrinPrin Boron Nururu ReroRero",
        "HAPPY PARTY TRAIN",
        "ANIMA",
        "1,000,000 TIMES",
        "crossing field",
        "Till the End",
        "courage",
        "IGNITE",
        "INNOCENCE",
        "Realize",
        "The Guinea Pig Is In Your Mind",
        "Wonder Stella",
        "Shuriken School",
        "Dori Dori",
        "Bubble Gun",
        "Megumi no Ame (TV Size)",
        "Songs Compilation III",
        "Hoshi o Atsumete",
        "Gurenge feat. Un3h [ dj-Jo Remix ]",
        "Anemone no Hana",
        "DROPOUT!?",
        "Sunflower",
        "Kyuukyoku Unbalance!",
        "Play the world",
        "Yasashisa no Riyuu",
        "starlog",
        "Cold Green Eyes feat. Roos Denayer",
        "Road of Resistance",
        "Dance with Minotaurus",
        "PADORU / PADORU",
        "Mitaiken HORIZON",
        "Yuuki wa Doko ni? Kimi no Mune ni!",
        "where you are",
        "Koukai no Uta",
        "Resolution",
        "Berry Go!!",
        "HAPPY HAPPY",
        "Selfrontier",
        "identity",
        "Yosoku Fukano Driving!",
        "Guinea Pig Olympics",
        "Bouken Type A, B, C!!",
        "Ima Suki ni Naru.",
        "AaAaAaAAaAaAAa",
        "WINGS OF JUSTICE",
        "Brightest Melody",
        "Natsuzora Yell",
        "Louder than steel",
        "osu!memories 2",
        "Til Death",
        "Team Magma & Aqua Leader Battle Theme (Unofficial)",
        "Guinea Pig Bridge",
        "Ao no Kanata",
        "Boku o Mitsukete",
        "Diamond",
        "MIIRO",
        "JUSTadICE",
        "American Girls",
        "narrative",
        "Watashi o Kureta Minna e",
        "Totsugeki Rock",
        "Rockefeller Street",
        "Ai no Sukima",
        "Scarlet Flower",
        "Kyouran Hey Kids!!",
        "Overkill",
        "Colorful",
        "Gold Dust",
        "United (L.A.O.S Remix)",
        "Ringo Ribbon",
        "Taisetsu no Tsukurikata (Asterisk Remix)",
        "Niji o Ametara",
        "U Got That",
        "Taisetsu no Tsukurikata",
        "Kimi to Iu Tokuiten",
        "POP/STARS",
        "Walk This Way!",
        "Idola no Circus",
        "A New Journey",
        "Guess Who Is Back",
        "Kaze no Uta",
        "Sorairo Picture",
        "RESISTER",
        "STORIES",
        "Reimei",
        "Fatima",
        "BLACK MEMORY",
        "quaver",
        "RAISE MY SWORD",
        "Reimei",
        "Snow Halation",
        "Tenshi ni Fureta yo!",
        "Kimi no Bouken",
        "Clock Strikes",
        "Heart Shaker",
        "1HOPE SNIPER",
        "The Noise of Rain",
        "color",
        "Storyteller",
        "Cry Thunder",
        "Echame La Culpa",
        "Kimi no Sei",
        "Sora ni Utaeba",
        "Unmei Dilemma",
        "Watashi, Idol Sengen",
        "Sword Art Online Compilation",
        "ADAMAS",
        "Natsuiro Egao de 1, 2, Jump!",
        "DANZEN! Futari wa PreCure Ver. MaxHeart",
        "Hoshikuzu no Interlude",
        "Super Driver",
        "Harumachi Clover",
        "km/h",
        "CHEER UP",
        "MY LIBERATION",
        "Songs Compilation II",
        "Black Rover",
        "Star!!",
        "MAYDAY",
        "Despacito",
        "Q&A Recital!",
        "o!IMC#2 Compilation",
        "ReI",
        "How Far I'll Go",
        "Leave It All To Me",
        "Do you realize?",
        "SLATEPORT CITY",
        "Sidetracked Day",
        "Monochrome Butterfly",
        "Make a Move",
        "FREEDOM DIVE",
        "Shounen Ripples",
        "Dead To Me",
        "(can you) understand me?",
        "Yugioh! Theme",
        "Kimi no Sumu Machi",
        "Los! Los! Los!",
        "Blade Dance",
        "Colors Power ni Omakasero!",
        "Natsu no Owari",
        "Best FriendS",
        "Airman ga Taosenai",
        "Orange",
        "Putin's Boner",
        "Platform Syndrome",
        "Tsuki to Hanatabe",
        "Songs Compilation",
        "Passcode 4854",
        "Hashi no Kakera",
        "Kimi no shiranai monogatari",
        "Toumei Elegy",
        "Immortal Flame"
    ];

    /* src\App.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (157:5) {:else}
    function create_else_block_3(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*letter*/ ctx[23]);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			add_location(div, file, 157, 6, 4030);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(157:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (153:5) {#if i == 0}
    function create_if_block_10(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*letter*/ ctx[23]);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			set_style(div, "background-color", "#d4ff8a");
    			add_location(div, file, 153, 6, 3913);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(153:5) {#if i == 0}",
    		ctx
    	});

    	return block;
    }

    // (152:4) {#each "Harumachi".split("") as letter, i}
    function create_each_block_6(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[19] == 0) return create_if_block_10;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(152:4) {#each \\\"Harumachi\\\".split(\\\"\\\") as letter, i}",
    		ctx
    	});

    	return block;
    }

    // (178:5) {:else}
    function create_else_block_2(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*letter*/ ctx[23]);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			add_location(div, file, 178, 6, 4473);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(178:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (174:5) {#if i == 1}
    function create_if_block_9(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*letter*/ ctx[23]);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			set_style(div, "background-color", "#fffd8c");
    			add_location(div, file, 174, 6, 4356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(174:5) {#if i == 1}",
    		ctx
    	});

    	return block;
    }

    // (173:4) {#each "Harumachi".split("") as letter, i}
    function create_each_block_5(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*i*/ ctx[19] == 1) return create_if_block_9;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(173:4) {#each \\\"Harumachi\\\".split(\\\"\\\") as letter, i}",
    		ctx
    	});

    	return block;
    }

    // (194:4) {#each "Harumachi".split("") as letter, i}
    function create_each_block_4(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*letter*/ ctx[23]);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			add_location(div, file, 194, 5, 4795);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(194:4) {#each \\\"Harumachi\\\".split(\\\"\\\") as letter, i}",
    		ctx
    	});

    	return block;
    }

    // (273:42) 
    function create_if_block_8(ctx) {
    	let each_1_anchor;
    	let each_value_3 = /*name*/ ctx[0];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 1) {
    				each_value_3 = /*name*/ ctx[0];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(273:42) ",
    		ctx
    	});

    	return block;
    }

    // (257:5) {#if guessedNames.length > row}
    function create_if_block_4(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*guessedNames*/ ctx[2][/*row*/ ctx[20]];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*guessedNames, calculateLetter*/ 132) {
    				each_value_2 = /*guessedNames*/ ctx[2][/*row*/ ctx[20]];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(257:5) {#if guessedNames.length > row}",
    		ctx
    	});

    	return block;
    }

    // (274:6) {#each name as letter, i}
    function create_each_block_3(ctx) {
    	let div;
    	let t0_value = /*letter*/ ctx[23] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			add_location(div, file, 274, 7, 7275);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 1 && t0_value !== (t0_value = /*letter*/ ctx[23] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(274:6) {#each name as letter, i}",
    		ctx
    	});

    	return block;
    }

    // (267:68) 
    function create_if_block_7(ctx) {
    	let div;
    	let t0_value = /*letter*/ ctx[23] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			add_location(div, file, 267, 8, 7096);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*guessedNames*/ 4 && t0_value !== (t0_value = /*letter*/ ctx[23] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(267:68) ",
    		ctx
    	});

    	return block;
    }

    // (263:68) 
    function create_if_block_6(ctx) {
    	let div;
    	let t0_value = /*letter*/ ctx[23] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			set_style(div, "background-color", "#fffd8c");
    			add_location(div, file, 263, 8, 6917);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*guessedNames*/ 4 && t0_value !== (t0_value = /*letter*/ ctx[23] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(263:68) ",
    		ctx
    	});

    	return block;
    }

    // (259:7) {#if calculateLetter(i, letter, guessedNames[row]) == 2}
    function create_if_block_5(ctx) {
    	let div;
    	let t0_value = /*letter*/ ctx[23] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "resultBarLetter svelte-14u2ngc");
    			set_style(div, "background-color", "#d4ff8a");
    			add_location(div, file, 259, 8, 6738);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*guessedNames*/ 4 && t0_value !== (t0_value = /*letter*/ ctx[23] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(259:7) {#if calculateLetter(i, letter, guessedNames[row]) == 2}",
    		ctx
    	});

    	return block;
    }

    // (258:6) {#each guessedNames[row] as letter, i}
    function create_each_block_2(ctx) {
    	let show_if;
    	let show_if_1;
    	let show_if_2;
    	let if_block_anchor;

    	function select_block_type_3(ctx, dirty) {
    		if (dirty & /*guessedNames*/ 4) show_if = null;
    		if (dirty & /*guessedNames*/ 4) show_if_1 = null;
    		if (dirty & /*guessedNames*/ 4) show_if_2 = null;
    		if (show_if == null) show_if = !!(/*calculateLetter*/ ctx[7](/*i*/ ctx[19], /*letter*/ ctx[23], /*guessedNames*/ ctx[2][/*row*/ ctx[20]]) == 2);
    		if (show_if) return create_if_block_5;
    		if (show_if_1 == null) show_if_1 = !!(/*calculateLetter*/ ctx[7](/*i*/ ctx[19], /*letter*/ ctx[23], /*guessedNames*/ ctx[2][/*row*/ ctx[20]]) == 1);
    		if (show_if_1) return create_if_block_6;
    		if (show_if_2 == null) show_if_2 = !!(/*calculateLetter*/ ctx[7](/*i*/ ctx[19], /*letter*/ ctx[23], /*guessedNames*/ ctx[2][/*row*/ ctx[20]]) == 0);
    		if (show_if_2) return create_if_block_7;
    	}

    	let current_block_type = select_block_type_3(ctx, -1);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(258:6) {#each guessedNames[row] as letter, i}",
    		ctx
    	});

    	return block;
    }

    // (280:5) {#if guessedNames[row] != undefined}
    function create_if_block_1(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type_4(ctx, dirty) {
    		if (dirty & /*guessedNames*/ 4) show_if = null;
    		if (/*guessedNames*/ ctx[2][/*row*/ ctx[20]].length == /*nameToday*/ ctx[4].length) return create_if_block_2;
    		if (show_if == null) show_if = !!(Math.abs(/*guessedNames*/ ctx[2][/*row*/ ctx[20]].length - /*nameToday*/ ctx[4].length) < 3);
    		if (show_if) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_4(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_4(ctx, dirty))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(280:5) {#if guessedNames[row] != undefined}",
    		ctx
    	});

    	return block;
    }

    // (285:6) {:else}
    function create_else_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "resultBarLength svelte-14u2ngc");
    			add_location(div, file, 285, 7, 7714);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(285:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (283:74) 
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "resultBarLength svelte-14u2ngc");
    			set_style(div, "background-color", "#fffd8c");
    			add_location(div, file, 283, 7, 7625);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(283:74) ",
    		ctx
    	});

    	return block;
    }

    // (281:6) {#if guessedNames[row].length == nameToday.length}
    function create_if_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "resultBarLength svelte-14u2ngc");
    			set_style(div, "background-color", "#d4ff8a");
    			add_location(div, file, 281, 7, 7474);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(281:6) {#if guessedNames[row].length == nameToday.length}",
    		ctx
    	});

    	return block;
    }

    // (255:3) {#each [0, 1, 2, 3, 4, 5, 6, 7] as row}
    function create_each_block_1(ctx) {
    	let div;
    	let t;

    	function select_block_type_2(ctx, dirty) {
    		if (/*guessedNames*/ ctx[2].length > /*row*/ ctx[20]) return create_if_block_4;
    		if (/*guessedNames*/ ctx[2].length == /*row*/ ctx[20]) return create_if_block_8;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*guessedNames*/ ctx[2][/*row*/ ctx[20]] != undefined && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "resultBar svelte-14u2ngc");
    			add_location(div, file, 255, 4, 6556);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			}

    			if (/*guessedNames*/ ctx[2][/*row*/ ctx[20]] != undefined) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(255:3) {#each [0, 1, 2, 3, 4, 5, 6, 7] as row}",
    		ctx
    	});

    	return block;
    }

    // (296:3) {:else}
    function create_else_block(ctx) {
    	let div16;
    	let div0;
    	let t1;
    	let div13;
    	let div3;
    	let div1;
    	let t2_value = /*saveData*/ ctx[3]["gamesPlayed"] + "";
    	let t2;
    	let t3;
    	let div2;
    	let t5;
    	let div6;
    	let div4;
    	let t6_value = /*saveData*/ ctx[3]["winPercentage"] + "";
    	let t6;
    	let t7;
    	let div5;
    	let t9;
    	let div9;
    	let div7;
    	let t10_value = /*saveData*/ ctx[3]["currentStreak"] + "";
    	let t10;
    	let t11;
    	let div8;
    	let t13;
    	let div12;
    	let div10;
    	let t14_value = /*saveData*/ ctx[3]["maxStreak"] + "";
    	let t14;
    	let t15;
    	let div11;
    	let t17;
    	let div14;
    	let t19;
    	let div15;
    	let each_value = Object.keys(/*saveData*/ ctx[3]["guesses"]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div16 = element("div");
    			div0 = element("div");
    			div0.textContent = "Statistik";
    			t1 = space();
    			div13 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Played Rounds";
    			t5 = space();
    			div6 = element("div");
    			div4 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			div5 = element("div");
    			div5.textContent = "Win %";
    			t9 = space();
    			div9 = element("div");
    			div7 = element("div");
    			t10 = text(t10_value);
    			t11 = space();
    			div8 = element("div");
    			div8.textContent = "Current Streak";
    			t13 = space();
    			div12 = element("div");
    			div10 = element("div");
    			t14 = text(t14_value);
    			t15 = space();
    			div11 = element("div");
    			div11.textContent = "Highest Streak";
    			t17 = space();
    			div14 = element("div");
    			div14.textContent = "Guesses";
    			t19 = space();
    			div15 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "statisticsTitle svelte-14u2ngc");
    			add_location(div0, file, 297, 5, 8016);
    			attr_dev(div1, "class", "statistic svelte-14u2ngc");
    			add_location(div1, file, 302, 7, 8171);
    			attr_dev(div2, "class", "label svelte-14u2ngc");
    			add_location(div2, file, 305, 7, 8253);
    			attr_dev(div3, "class", "statisticsContainer svelte-14u2ngc");
    			add_location(div3, file, 301, 6, 8129);
    			attr_dev(div4, "class", "statistic svelte-14u2ngc");
    			add_location(div4, file, 310, 7, 8374);
    			attr_dev(div5, "class", "label svelte-14u2ngc");
    			add_location(div5, file, 313, 7, 8458);
    			attr_dev(div6, "class", "statisticsContainer svelte-14u2ngc");
    			add_location(div6, file, 309, 6, 8332);
    			attr_dev(div7, "class", "statistic svelte-14u2ngc");
    			add_location(div7, file, 318, 7, 8571);
    			attr_dev(div8, "class", "label svelte-14u2ngc");
    			add_location(div8, file, 321, 7, 8655);
    			attr_dev(div9, "class", "statisticsContainer svelte-14u2ngc");
    			add_location(div9, file, 317, 6, 8529);
    			attr_dev(div10, "class", "statistic svelte-14u2ngc");
    			add_location(div10, file, 326, 7, 8777);
    			attr_dev(div11, "class", "label svelte-14u2ngc");
    			add_location(div11, file, 329, 7, 8857);
    			attr_dev(div12, "class", "statisticsContainer svelte-14u2ngc");
    			add_location(div12, file, 325, 6, 8735);
    			attr_dev(div13, "class", "statisticsContainerHolder svelte-14u2ngc");
    			add_location(div13, file, 300, 5, 8082);
    			attr_dev(div14, "class", "statisticsTitle svelte-14u2ngc");
    			add_location(div14, file, 335, 5, 8951);
    			attr_dev(div15, "class", "guessesContainer svelte-14u2ngc");
    			add_location(div15, file, 338, 5, 9015);
    			attr_dev(div16, "class", "statistics svelte-14u2ngc");
    			add_location(div16, file, 296, 4, 7985);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div0);
    			append_dev(div16, t1);
    			append_dev(div16, div13);
    			append_dev(div13, div3);
    			append_dev(div3, div1);
    			append_dev(div1, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div13, t5);
    			append_dev(div13, div6);
    			append_dev(div6, div4);
    			append_dev(div4, t6);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div13, t9);
    			append_dev(div13, div9);
    			append_dev(div9, div7);
    			append_dev(div7, t10);
    			append_dev(div9, t11);
    			append_dev(div9, div8);
    			append_dev(div13, t13);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, t14);
    			append_dev(div12, t15);
    			append_dev(div12, div11);
    			append_dev(div16, t17);
    			append_dev(div16, div14);
    			append_dev(div16, t19);
    			append_dev(div16, div15);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div15, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*saveData*/ 8 && t2_value !== (t2_value = /*saveData*/ ctx[3]["gamesPlayed"] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*saveData*/ 8 && t6_value !== (t6_value = /*saveData*/ ctx[3]["winPercentage"] + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*saveData*/ 8 && t10_value !== (t10_value = /*saveData*/ ctx[3]["currentStreak"] + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*saveData*/ 8 && t14_value !== (t14_value = /*saveData*/ ctx[3]["maxStreak"] + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*saveData, Object*/ 8) {
    				each_value = Object.keys(/*saveData*/ ctx[3]["guesses"]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div15, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div16);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(296:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (292:3) {#if !stop}
    function create_if_block(ctx) {
    	let span;
    	let t0;
    	let input;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Namn: ");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Välj";
    			add_location(input, file, 293, 11, 7838);
    			add_location(button, file, 293, 76, 7903);
    			add_location(span, file, 292, 4, 7818);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, input);
    			set_input_value(input, /*name*/ ctx[0]);
    			append_dev(span, t1);
    			append_dev(span, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(input, "keypress", /*submitNameInputKeyPress*/ ctx[6], false, false, false),
    					listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 1 && input.value !== /*name*/ ctx[0]) {
    				set_input_value(input, /*name*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(292:3) {#if !stop}",
    		ctx
    	});

    	return block;
    }

    // (340:6) {#each Object.keys(saveData["guesses"]) as guess, i}
    function create_each_block(ctx) {
    	let span;
    	let t0_value = /*guess*/ ctx[17].charAt(0).toUpperCase() + /*guess*/ ctx[17].slice(1) + "";
    	let t0;
    	let t1;
    	let progress;
    	let progress_value_value;
    	let progress_max_value;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			progress = element("progress");
    			t2 = space();
    			progress.value = progress_value_value = /*saveData*/ ctx[3]["guesses"][/*guess*/ ctx[17]].toString();
    			attr_dev(progress, "max", progress_max_value = /*saveData*/ ctx[3]["gamesPlayed"].toString());
    			set_style(progress, "width", "300px");
    			add_location(progress, file, 341, 57, 9179);
    			add_location(span, file, 340, 7, 9114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, progress);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*saveData*/ 8 && t0_value !== (t0_value = /*guess*/ ctx[17].charAt(0).toUpperCase() + /*guess*/ ctx[17].slice(1) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*saveData*/ 8 && progress_value_value !== (progress_value_value = /*saveData*/ ctx[3]["guesses"][/*guess*/ ctx[17]].toString())) {
    				prop_dev(progress, "value", progress_value_value);
    			}

    			if (dirty & /*saveData*/ 8 && progress_max_value !== (progress_max_value = /*saveData*/ ctx[3]["gamesPlayed"].toString())) {
    				attr_dev(progress, "max", progress_max_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(340:6) {#each Object.keys(saveData[\\\"guesses\\\"]) as guess, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let container;
    	let div24;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let br;
    	let t3;
    	let t4;
    	let div3;
    	let div2;
    	let t5;
    	let div4;
    	let t6;
    	let b0;
    	let t8;
    	let t9;
    	let div5;
    	let t10;
    	let div7;
    	let div6;
    	let t11;
    	let div8;
    	let t12;
    	let b1;
    	let t14;
    	let t15;
    	let div9;
    	let t16;
    	let div11;
    	let div10;
    	let t17;
    	let div12;
    	let t19;
    	let div13;
    	let t20;
    	let div14;
    	let t21;
    	let div16;
    	let t22;
    	let div15;
    	let t24;
    	let t25;
    	let div17;
    	let t26;
    	let div18;
    	let t27;
    	let div20;
    	let t28;
    	let div19;
    	let t30;
    	let t31;
    	let div21;
    	let t32;
    	let div22;
    	let t33;
    	let div23;
    	let t35;
    	let main;
    	let div25;
    	let t36;
    	let t37;
    	let footer;
    	let t38;
    	let a;
    	let each_value_6 = ("Harumachi").split("");
    	validate_each_argument(each_value_6);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_3[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	let each_value_5 = ("Harumachi").split("");
    	validate_each_argument(each_value_5);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_2[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let each_value_4 = ("Harumachi").split("");
    	validate_each_argument(each_value_4);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_1[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let each_value_1 = [0, 1, 2, 3, 4, 5, 6, 7];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < 8; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function select_block_type_5(ctx, dirty) {
    		if (!/*stop*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_5(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			container = element("container");
    			div24 = element("div");
    			div0 = element("div");
    			div0.textContent = "How to play";
    			t1 = space();
    			div1 = element("div");
    			t2 = text("You are searching for a Sotarks Map from after Jan 2018 ");
    			br = element("br");
    			t3 = text("\r\n\t\t\tOnly the base name so no (TV Size) or (Cut ver.)");
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t5 = space();
    			div4 = element("div");
    			t6 = text("The letter ");
    			b0 = element("b");
    			b0.textContent = "H";
    			t8 = text(" is in the right place.");
    			t9 = space();
    			div5 = element("div");
    			t10 = space();
    			div7 = element("div");
    			div6 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t11 = space();
    			div8 = element("div");
    			t12 = text("The letter ");
    			b1 = element("b");
    			b1.textContent = "a";
    			t14 = text(" is in the name but in the wrong place.");
    			t15 = space();
    			div9 = element("div");
    			t16 = space();
    			div11 = element("div");
    			div10 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t17 = space();
    			div12 = element("div");
    			div12.textContent = "If the letter doesn't have a color then it doesn't exist in the name.";
    			t19 = space();
    			div13 = element("div");
    			t20 = space();
    			div14 = element("div");
    			t21 = space();
    			div16 = element("div");
    			t22 = text("If the box to the right is   ");
    			div15 = element("div");
    			div15.textContent = "green";
    			t24 = text("   then the name is the right length.");
    			t25 = space();
    			div17 = element("div");
    			t26 = space();
    			div18 = element("div");
    			t27 = space();
    			div20 = element("div");
    			t28 = text("If the box to the right is   ");
    			div19 = element("div");
    			div19.textContent = "yellow";
    			t30 = text("   then the length of the name is +- 2.");
    			t31 = space();
    			div21 = element("div");
    			t32 = space();
    			div22 = element("div");
    			t33 = space();
    			div23 = element("div");
    			div23.textContent = "If the box to the right is gray then the length of name has a bigger difference than 2.";
    			t35 = space();
    			main = element("main");
    			div25 = element("div");

    			for (let i = 0; i < 8; i += 1) {
    				each_blocks[i].c();
    			}

    			t36 = space();
    			if_block.c();
    			t37 = space();
    			footer = element("footer");
    			t38 = text("© Made by ");
    			a = element("a");
    			a.textContent = "oncelastapril";
    			attr_dev(div0, "class", "helpTitle svelte-14u2ngc");
    			add_location(div0, file, 141, 2, 3585);
    			add_location(br, file, 145, 59, 3721);
    			attr_dev(div1, "class", "helpName svelte-14u2ngc");
    			add_location(div1, file, 144, 2, 3638);
    			attr_dev(div2, "class", "helpName resultBar svelte-14u2ngc");
    			add_location(div2, file, 150, 3, 3806);
    			add_location(div3, file, 149, 2, 3796);
    			add_location(b0, file, 165, 14, 4161);
    			add_location(div4, file, 164, 2, 4140);
    			attr_dev(div5, "class", "helpSpacer svelte-14u2ngc");
    			add_location(div5, file, 168, 2, 4208);
    			attr_dev(div6, "class", "helpName resultBar svelte-14u2ngc");
    			add_location(div6, file, 171, 3, 4249);
    			add_location(div7, file, 170, 2, 4239);
    			add_location(b1, file, 186, 14, 4604);
    			add_location(div8, file, 185, 2, 4583);
    			attr_dev(div9, "class", "helpSpacer svelte-14u2ngc");
    			add_location(div9, file, 189, 2, 4667);
    			attr_dev(div10, "class", "helpName resultBar svelte-14u2ngc");
    			add_location(div10, file, 192, 3, 4708);
    			add_location(div11, file, 191, 2, 4698);
    			add_location(div12, file, 200, 2, 4891);
    			set_style(div13, "margin-top", "30px");
    			add_location(div13, file, 204, 2, 4986);
    			attr_dev(div14, "class", "helpLength svelte-14u2ngc");
    			set_style(div14, "background-color", "#d4ff8a");
    			add_location(div14, file, 206, 2, 5023);
    			set_style(div15, "background-color", "#d4ff8a");
    			add_location(div15, file, 208, 37, 5149);
    			attr_dev(div16, "class", "helpName svelte-14u2ngc");
    			add_location(div16, file, 207, 2, 5088);
    			attr_dev(div17, "class", "helpSpacer svelte-14u2ngc");
    			add_location(div17, file, 211, 2, 5258);
    			attr_dev(div18, "class", "helpLength svelte-14u2ngc");
    			set_style(div18, "background-color", "#fffd8c");
    			set_style(div18, "float", "left");
    			add_location(div18, file, 213, 2, 5289);
    			set_style(div19, "background-color", "#fffd8c");
    			add_location(div19, file, 215, 37, 5428);
    			attr_dev(div20, "class", "helpName svelte-14u2ngc");
    			add_location(div20, file, 214, 2, 5367);
    			attr_dev(div21, "class", "helpSpacer svelte-14u2ngc");
    			add_location(div21, file, 218, 2, 5540);
    			attr_dev(div22, "class", "helpLength svelte-14u2ngc");
    			add_location(div22, file, 220, 2, 5571);
    			add_location(div23, file, 221, 2, 5600);
    			attr_dev(div24, "class", "helpContainer svelte-14u2ngc");
    			add_location(div24, file, 140, 1, 3554);
    			attr_dev(div25, "class", "resultContainer svelte-14u2ngc");
    			add_location(div25, file, 253, 2, 6477);
    			attr_dev(main, "class", "svelte-14u2ngc");
    			add_location(main, file, 226, 1, 5721);
    			attr_dev(a, "href", "https://twitter.com/oncelastapril");
    			add_location(a, file, 351, 17, 9416);
    			attr_dev(footer, "class", "svelte-14u2ngc");
    			add_location(footer, file, 350, 1, 9389);
    			attr_dev(container, "class", "svelte-14u2ngc");
    			add_location(container, file, 139, 0, 3540);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, container, anchor);
    			append_dev(container, div24);
    			append_dev(div24, div0);
    			append_dev(div24, t1);
    			append_dev(div24, div1);
    			append_dev(div1, t2);
    			append_dev(div1, br);
    			append_dev(div1, t3);
    			append_dev(div24, t4);
    			append_dev(div24, div3);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div2, null);
    			}

    			append_dev(div24, t5);
    			append_dev(div24, div4);
    			append_dev(div4, t6);
    			append_dev(div4, b0);
    			append_dev(div4, t8);
    			append_dev(div24, t9);
    			append_dev(div24, div5);
    			append_dev(div24, t10);
    			append_dev(div24, div7);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div6, null);
    			}

    			append_dev(div24, t11);
    			append_dev(div24, div8);
    			append_dev(div8, t12);
    			append_dev(div8, b1);
    			append_dev(div8, t14);
    			append_dev(div24, t15);
    			append_dev(div24, div9);
    			append_dev(div24, t16);
    			append_dev(div24, div11);
    			append_dev(div11, div10);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div10, null);
    			}

    			append_dev(div24, t17);
    			append_dev(div24, div12);
    			append_dev(div24, t19);
    			append_dev(div24, div13);
    			append_dev(div24, t20);
    			append_dev(div24, div14);
    			append_dev(div24, t21);
    			append_dev(div24, div16);
    			append_dev(div16, t22);
    			append_dev(div16, div15);
    			append_dev(div16, t24);
    			append_dev(div24, t25);
    			append_dev(div24, div17);
    			append_dev(div24, t26);
    			append_dev(div24, div18);
    			append_dev(div24, t27);
    			append_dev(div24, div20);
    			append_dev(div20, t28);
    			append_dev(div20, div19);
    			append_dev(div20, t30);
    			append_dev(div24, t31);
    			append_dev(div24, div21);
    			append_dev(div24, t32);
    			append_dev(div24, div22);
    			append_dev(div24, t33);
    			append_dev(div24, div23);
    			append_dev(container, t35);
    			append_dev(container, main);
    			append_dev(main, div25);

    			for (let i = 0; i < 8; i += 1) {
    				each_blocks[i].m(div25, null);
    			}

    			append_dev(div25, t36);
    			if_block.m(div25, null);
    			append_dev(container, t37);
    			append_dev(container, footer);
    			append_dev(footer, t38);
    			append_dev(footer, a);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*guessedNames, nameToday, Math, undefined, calculateLetter, name*/ 149) {
    				each_value_1 = [0, 1, 2, 3, 4, 5, 6, 7];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < 8; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div25, t36);
    					}
    				}

    				for (; i < 8; i += 1) {
    					each_blocks[i].d(1);
    				}
    			}

    			if (current_block_type === (current_block_type = select_block_type_5(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div25, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(container);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function randomArrayShuffle(array) {
    	var currentIndex = array.length, temporaryValue, randomIndex;

    	while (0 !== currentIndex) {
    		randomIndex = Math.floor(Math.random() * currentIndex);
    		currentIndex -= 1;
    		temporaryValue = array[currentIndex];
    		array[currentIndex] = array[randomIndex];
    		array[randomIndex] = temporaryValue;
    	}

    	return array;
    }

    // if(saveData["lastPlayed"] == new Date().toDateString()) {
    // 	guessedNames = saveData["lastGuesses"];
    // 	stop = true;
    // }
    function isWhatPercentOf(numA, numB) {
    	let num = numA / numB * 100;
    	return num;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let words = randomArrayShuffle(names);
    	let startDate = "2022-01-01";
    	let date1 = new Date();
    	let date2 = new Date(startDate);
    	let timeInMilisec = date1.getTime() - date2.getTime();
    	let daysBetweenDates = Math.ceil(timeInMilisec / (1000 * 60 * 60 * 24));
    	let nameToday = words[daysBetweenDates - 1];
    	let name = "";
    	console.log(nameToday);
    	let difficulty = 0;
    	let stop = false;
    	let guessedNames = [];

    	let saveData = JSON.parse(localStorage.getItem('stats')) != undefined
    	? JSON.parse(localStorage.getItem('stats'))
    	: {
    			"lastPlayed": "",
    			"lastGuesses": [],
    			"currentStreak": 0,
    			"maxStreak": 0,
    			"guesses": {
    				"1": 0,
    				"2": 0,
    				"3": 0,
    				"4": 0,
    				"5": 0,
    				"6": 0,
    				"7": 0,
    				"8": 0,
    				"fail": 0
    			},
    			"winPercentage": 0,
    			"gamesPlayed": 0,
    			"gamesWon": 0
    		};

    	localStorage.setItem("stats", JSON.stringify(saveData));

    	function submitName() {
    		if (name != "" && name.length < 23) {
    			guessedNames.push(name);
    			$$invalidate(2, guessedNames);

    			if (name.toLowerCase() == nameToday.toLowerCase()) {
    				$$invalidate(1, stop = true);
    				$$invalidate(3, saveData["lastPlayed"] = new Date().toDateString(), saveData);
    				$$invalidate(3, saveData["lastGuesses"] = guessedNames, saveData);
    				$$invalidate(3, saveData["currentStreak"] += 1, saveData);

    				if (saveData["currentStreak"] > saveData["maxStreak"]) {
    					$$invalidate(3, saveData["maxStreak"] = saveData["currentStreak"], saveData);
    				}

    				$$invalidate(3, saveData["guesses"][guessedNames.length.toString()] += 1, saveData);
    				$$invalidate(3, saveData["gamesPlayed"] += 1, saveData);
    				$$invalidate(3, saveData["gamesWon"] += 1, saveData);
    				$$invalidate(3, saveData["winPercentage"] = isWhatPercentOf(saveData["gamesWon"], saveData["gamesPlayed"]), saveData);
    				localStorage.setItem('stats', JSON.stringify(saveData));
    			} else if (guessedNames.length == 8) {
    				$$invalidate(1, stop = true);
    				$$invalidate(3, saveData["lastPlayed"] = new Date().toDateString(), saveData);
    				$$invalidate(3, saveData["lastGuesses"] = guessedNames, saveData);
    				$$invalidate(3, saveData["currentStreak"] = 0, saveData);
    				$$invalidate(3, saveData["maxStreak"] = 0, saveData);
    				$$invalidate(3, saveData["guesses"]["fail"] += 1, saveData);
    				$$invalidate(3, saveData["gamesPlayed"] += 1, saveData);
    				$$invalidate(3, saveData["winPercentage"] = isWhatPercentOf(saveData["gamesWon"], saveData["gamesPlayed"]), saveData);
    				localStorage.setItem('stats', JSON.stringify(saveData));
    			}

    			$$invalidate(0, name = "");
    		}
    	}

    	const submitNameInputKeyPress = e => {
    		if (name.length > 22) {
    			$$invalidate(0, name = name.substring(0, 22));
    		}

    		if (e.charCode === 13) {
    			submitName();
    		}
    	};

    	function calculateLetter(index, letter, word) {
    		if (index < nameToday.length) {
    			if (nameToday[index].toLowerCase() == letter.toLowerCase()) {
    				return 2;
    			}
    		}

    		let amountOf = nameToday.toLowerCase().split(letter.toLowerCase()).length - 1;
    		let letterPosition = 0;

    		for (var i = 0; i < word.length; i++) {
    			if (word[i].toLowerCase() == letter.toLowerCase()) {
    				letterPosition++;
    			}
    		}

    		// console.log(letterPosition);
    		if (letterPosition > amountOf) {
    			return 0;
    		} else {
    			return 1;
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	const click_handler = () => submitName();

    	$$self.$capture_state = () => ({
    		randomArrayShuffle,
    		names,
    		words,
    		startDate,
    		date1,
    		date2,
    		timeInMilisec,
    		daysBetweenDates,
    		nameToday,
    		name,
    		difficulty,
    		stop,
    		guessedNames,
    		saveData,
    		isWhatPercentOf,
    		submitName,
    		submitNameInputKeyPress,
    		calculateLetter
    	});

    	$$self.$inject_state = $$props => {
    		if ('words' in $$props) words = $$props.words;
    		if ('startDate' in $$props) startDate = $$props.startDate;
    		if ('date1' in $$props) date1 = $$props.date1;
    		if ('date2' in $$props) date2 = $$props.date2;
    		if ('timeInMilisec' in $$props) timeInMilisec = $$props.timeInMilisec;
    		if ('daysBetweenDates' in $$props) daysBetweenDates = $$props.daysBetweenDates;
    		if ('nameToday' in $$props) $$invalidate(4, nameToday = $$props.nameToday);
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('difficulty' in $$props) difficulty = $$props.difficulty;
    		if ('stop' in $$props) $$invalidate(1, stop = $$props.stop);
    		if ('guessedNames' in $$props) $$invalidate(2, guessedNames = $$props.guessedNames);
    		if ('saveData' in $$props) $$invalidate(3, saveData = $$props.saveData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		stop,
    		guessedNames,
    		saveData,
    		nameToday,
    		submitName,
    		submitNameInputKeyPress,
    		calculateLetter,
    		input_input_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {

    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

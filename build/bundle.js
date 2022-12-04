
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
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function to_number(value) {
        return value === '' ? null : +value;
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
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
            ctx: [],
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
            if (!is_function(callback)) {
                return noop;
            }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.53.1' }, detail), { bubbles: true }));
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

    /* src/Matrices.svelte generated by Svelte v3.53.1 */

    const { Error: Error_1, Object: Object_1 } = globals;
    const file$2 = "src/Matrices.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[31] = i;
    	return child_ctx;
    }

    function get_each_context_10(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_11(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[31] = i;
    	return child_ctx;
    }

    function get_each_context_12(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_13(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[31] = i;
    	return child_ctx;
    }

    function get_each_context_14(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[36] = list;
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_15(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[37] = list;
    	child_ctx[31] = i;
    	return child_ctx;
    }

    function get_each_context_16(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[38] = list;
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_17(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[39] = list;
    	child_ctx[31] = i;
    	return child_ctx;
    }

    // (160:4) {#if check === true}
    function create_if_block$1(ctx) {
    	let h20;
    	let t1;
    	let t2;
    	let h21;
    	let t4;
    	let t5;
    	let button0;
    	let t7;
    	let button1;
    	let t9;
    	let button2;
    	let t11;
    	let button3;
    	let t13;
    	let button4;
    	let t15;
    	let button5;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let t22;
    	let if_block5_anchor;
    	let mounted;
    	let dispose;
    	let each_value_16 = /*A*/ ctx[3].data;
    	validate_each_argument(each_value_16);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_16.length; i += 1) {
    		each_blocks_1[i] = create_each_block_16(get_each_context_16(ctx, each_value_16, i));
    	}

    	let each_value_14 = /*B*/ ctx[4].data;
    	validate_each_argument(each_value_14);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_14.length; i += 1) {
    		each_blocks[i] = create_each_block_14(get_each_context_14(ctx, each_value_14, i));
    	}

    	let if_block0 = /*operation*/ ctx[1] === 1 && create_if_block_8(ctx);
    	let if_block1 = /*operation*/ ctx[1] === 2 && create_if_block_7(ctx);
    	let if_block2 = /*operation*/ ctx[1] === 3 && create_if_block_6(ctx);
    	let if_block3 = /*operation*/ ctx[1] === 4 && create_if_block_5(ctx);
    	let if_block4 = /*operation*/ ctx[1] === 5 && create_if_block_4(ctx);
    	let if_block5 = /*operation*/ ctx[1] === 6 && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			h20 = element("h2");
    			h20.textContent = "Matrix A";
    			t1 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			h21 = element("h2");
    			h21.textContent = "Matrix B";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "A + B";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "A - B";
    			t9 = space();
    			button2 = element("button");
    			button2.textContent = "A * B";
    			t11 = space();
    			button3 = element("button");
    			button3.textContent = "det A and det B";
    			t13 = space();
    			button4 = element("button");
    			button4.textContent = "Transpose of A and B";
    			t15 = space();
    			button5 = element("button");
    			button5.textContent = "Inverse of A and B";
    			t17 = space();
    			if (if_block0) if_block0.c();
    			t18 = space();
    			if (if_block1) if_block1.c();
    			t19 = space();
    			if (if_block2) if_block2.c();
    			t20 = space();
    			if (if_block3) if_block3.c();
    			t21 = space();
    			if (if_block4) if_block4.c();
    			t22 = space();
    			if (if_block5) if_block5.c();
    			if_block5_anchor = empty();
    			add_location(h20, file$2, 160, 8, 5387);
    			add_location(h21, file$2, 168, 8, 5696);
    			add_location(button0, file$2, 177, 8, 6006);
    			add_location(button1, file$2, 180, 8, 6089);
    			add_location(button2, file$2, 183, 8, 6172);
    			add_location(button3, file$2, 186, 8, 6255);
    			add_location(button4, file$2, 189, 8, 6348);
    			add_location(button5, file$2, 192, 8, 6446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(target, anchor);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t5, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, button3, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, button4, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, button5, anchor);
    			insert_dev(target, t17, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t18, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t19, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t20, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t21, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, t22, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, if_block5_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[12], false, false, false),
    					listen_dev(button2, "click", /*click_handler_4*/ ctx[13], false, false, false),
    					listen_dev(button3, "click", /*click_handler_5*/ ctx[14], false, false, false),
    					listen_dev(button4, "click", /*click_handler_6*/ ctx[15], false, false, false),
    					listen_dev(button5, "click", /*click_handler_7*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A*/ 8) {
    				each_value_16 = /*A*/ ctx[3].data;
    				validate_each_argument(each_value_16);
    				let i;

    				for (i = 0; i < each_value_16.length; i += 1) {
    					const child_ctx = get_each_context_16(ctx, each_value_16, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_16(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(t2.parentNode, t2);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_16.length;
    			}

    			if (dirty[0] & /*B*/ 16) {
    				each_value_14 = /*B*/ ctx[4].data;
    				validate_each_argument(each_value_14);
    				let i;

    				for (i = 0; i < each_value_14.length; i += 1) {
    					const child_ctx = get_each_context_14(ctx, each_value_14, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_14(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t5.parentNode, t5);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_14.length;
    			}

    			if (/*operation*/ ctx[1] === 1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					if_block0.m(t18.parentNode, t18);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*operation*/ ctx[1] === 2) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_7(ctx);
    					if_block1.c();
    					if_block1.m(t19.parentNode, t19);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*operation*/ ctx[1] === 3) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_6(ctx);
    					if_block2.c();
    					if_block2.m(t20.parentNode, t20);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*operation*/ ctx[1] === 4) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_5(ctx);
    					if_block3.c();
    					if_block3.m(t21.parentNode, t21);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*operation*/ ctx[1] === 5) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_4(ctx);
    					if_block4.c();
    					if_block4.m(t22.parentNode, t22);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*operation*/ ctx[1] === 6) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_1$1(ctx);
    					if_block5.c();
    					if_block5.m(if_block5_anchor.parentNode, if_block5_anchor);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(button3);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(button4);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(button5);
    			if (detaching) detach_dev(t17);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t18);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t19);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t20);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t21);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(t22);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(if_block5_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(160:4) {#if check === true}",
    		ctx
    	});

    	return block;
    }

    // (164:16) {#each row as _, j}
    function create_each_block_17(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_1() {
    		/*input_input_handler_1*/ ctx[9].call(input, /*i*/ ctx[29], /*j*/ ctx[31]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "name", `${/*i*/ ctx[29]}-${/*j*/ ctx[31]}`);
    			set_style(input, "max-width", "3em");
    			add_location(input, file$2, 164, 20, 5512);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*A*/ ctx[3].data[/*i*/ ctx[29]][/*j*/ ctx[31]]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_input_handler_1),
    					listen_dev(
    						input,
    						"input",
    						function () {
    							if (is_function(handleChange(/*A*/ ctx[3]))) handleChange(/*A*/ ctx[3]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*A*/ 8 && to_number(input.value) !== /*A*/ ctx[3].data[/*i*/ ctx[29]][/*j*/ ctx[31]]) {
    				set_input_value(input, /*A*/ ctx[3].data[/*i*/ ctx[29]][/*j*/ ctx[31]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_17.name,
    		type: "each",
    		source: "(164:16) {#each row as _, j}",
    		ctx
    	});

    	return block;
    }

    // (162:8) {#each A.data as row, i}
    function create_each_block_16(ctx) {
    	let div;
    	let each_value_17 = /*row*/ ctx[17];
    	validate_each_argument(each_value_17);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_17.length; i += 1) {
    		each_blocks[i] = create_each_block_17(get_each_context_17(ctx, each_value_17, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div, file$2, 162, 12, 5450);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A*/ 8) {
    				each_value_17 = /*row*/ ctx[17];
    				validate_each_argument(each_value_17);
    				let i;

    				for (i = 0; i < each_value_17.length; i += 1) {
    					const child_ctx = get_each_context_17(ctx, each_value_17, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_17(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_17.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_16.name,
    		type: "each",
    		source: "(162:8) {#each A.data as row, i}",
    		ctx
    	});

    	return block;
    }

    // (173:16) {#each row as _, j}
    function create_each_block_15(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_2() {
    		/*input_input_handler_2*/ ctx[10].call(input, /*i*/ ctx[29], /*j*/ ctx[31]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "name", `${/*i*/ ctx[29]}-${/*j*/ ctx[31]}`);
    			set_style(input, "max-width", "3em");
    			add_location(input, file$2, 173, 20, 5822);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*B*/ ctx[4].data[/*i*/ ctx[29]][/*j*/ ctx[31]]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_input_handler_2),
    					listen_dev(
    						input,
    						"input",
    						function () {
    							if (is_function(handleChange(/*B*/ ctx[4]))) handleChange(/*B*/ ctx[4]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*B*/ 16 && to_number(input.value) !== /*B*/ ctx[4].data[/*i*/ ctx[29]][/*j*/ ctx[31]]) {
    				set_input_value(input, /*B*/ ctx[4].data[/*i*/ ctx[29]][/*j*/ ctx[31]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_15.name,
    		type: "each",
    		source: "(173:16) {#each row as _, j}",
    		ctx
    	});

    	return block;
    }

    // (171:8) {#each B.data as row, i}
    function create_each_block_14(ctx) {
    	let div;
    	let each_value_15 = /*row*/ ctx[17];
    	validate_each_argument(each_value_15);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_15.length; i += 1) {
    		each_blocks[i] = create_each_block_15(get_each_context_15(ctx, each_value_15, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div, file$2, 171, 12, 5760);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*B*/ 16) {
    				each_value_15 = /*row*/ ctx[17];
    				validate_each_argument(each_value_15);
    				let i;

    				for (i = 0; i < each_value_15.length; i += 1) {
    					const child_ctx = get_each_context_15(ctx, each_value_15, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_15(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_15.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_14.name,
    		type: "each",
    		source: "(171:8) {#each B.data as row, i}",
    		ctx
    	});

    	return block;
    }

    // (196:8) {#if operation === 1}
    function create_if_block_8(ctx) {
    	let h3;
    	let t1;
    	let each_1_anchor;
    	let each_value_12 = addition(/*A*/ ctx[3], /*B*/ ctx[4]).data;
    	validate_each_argument(each_value_12);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_12.length; i += 1) {
    		each_blocks[i] = create_each_block_12(get_each_context_12(ctx, each_value_12, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Result of A+B:";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file$2, 196, 12, 6576);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24) {
    				each_value_12 = addition(/*A*/ ctx[3], /*B*/ ctx[4]).data;
    				validate_each_argument(each_value_12);
    				let i;

    				for (i = 0; i < each_value_12.length; i += 1) {
    					const child_ctx = get_each_context_12(ctx, each_value_12, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_12(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_12.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(196:8) {#if operation === 1}",
    		ctx
    	});

    	return block;
    }

    // (201:24) {#each row as ij, j}
    function create_each_block_13(ctx) {
    	let t_value = `${/*ij*/ ctx[20]}  ` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24 && t_value !== (t_value = `${/*ij*/ ctx[20]}  ` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_13.name,
    		type: "each",
    		source: "(201:24) {#each row as ij, j}",
    		ctx
    	});

    	return block;
    }

    // (198:12) {#each addition(A,B).data as row, i}
    function create_each_block_12(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let each_value_13 = /*row*/ ctx[17];
    	validate_each_argument(each_value_13);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_13.length; i += 1) {
    		each_blocks[i] = create_each_block_13(get_each_context_13(ctx, each_value_13, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("[\n                        ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = text("\n                        ]");
    			t2 = space();
    			add_location(p, file$2, 199, 20, 6693);
    			add_location(div, file$2, 198, 16, 6667);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(p, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24) {
    				each_value_13 = /*row*/ ctx[17];
    				validate_each_argument(each_value_13);
    				let i;

    				for (i = 0; i < each_value_13.length; i += 1) {
    					const child_ctx = get_each_context_13(ctx, each_value_13, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_13(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_13.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_12.name,
    		type: "each",
    		source: "(198:12) {#each addition(A,B).data as row, i}",
    		ctx
    	});

    	return block;
    }

    // (208:8) {#if operation === 2}
    function create_if_block_7(ctx) {
    	let h3;
    	let t1;
    	let each_1_anchor;
    	let each_value_10 = subtraction(/*A*/ ctx[3], /*B*/ ctx[4]).data;
    	validate_each_argument(each_value_10);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_10.length; i += 1) {
    		each_blocks[i] = create_each_block_10(get_each_context_10(ctx, each_value_10, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Result of A-B:";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file$2, 208, 12, 6949);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24) {
    				each_value_10 = subtraction(/*A*/ ctx[3], /*B*/ ctx[4]).data;
    				validate_each_argument(each_value_10);
    				let i;

    				for (i = 0; i < each_value_10.length; i += 1) {
    					const child_ctx = get_each_context_10(ctx, each_value_10, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_10(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_10.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(208:8) {#if operation === 2}",
    		ctx
    	});

    	return block;
    }

    // (213:24) {#each row as ij, j}
    function create_each_block_11(ctx) {
    	let t_value = `${/*ij*/ ctx[20]}  ` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24 && t_value !== (t_value = `${/*ij*/ ctx[20]}  ` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_11.name,
    		type: "each",
    		source: "(213:24) {#each row as ij, j}",
    		ctx
    	});

    	return block;
    }

    // (210:12) {#each subtraction(A,B).data as row, i}
    function create_each_block_10(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let each_value_11 = /*row*/ ctx[17];
    	validate_each_argument(each_value_11);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_11.length; i += 1) {
    		each_blocks[i] = create_each_block_11(get_each_context_11(ctx, each_value_11, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("[\n                        ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = text("\n                        ]");
    			t2 = space();
    			add_location(p, file$2, 211, 20, 7069);
    			add_location(div, file$2, 210, 16, 7043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(p, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24) {
    				each_value_11 = /*row*/ ctx[17];
    				validate_each_argument(each_value_11);
    				let i;

    				for (i = 0; i < each_value_11.length; i += 1) {
    					const child_ctx = get_each_context_11(ctx, each_value_11, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_11(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_11.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_10.name,
    		type: "each",
    		source: "(210:12) {#each subtraction(A,B).data as row, i}",
    		ctx
    	});

    	return block;
    }

    // (220:8) {#if operation === 3}
    function create_if_block_6(ctx) {
    	let h3;
    	let t1;
    	let each_1_anchor;
    	let each_value_8 = matrixMultiplication(/*A*/ ctx[3], /*B*/ ctx[4]).data;
    	validate_each_argument(each_value_8);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Product of A*B:";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file$2, 220, 12, 7325);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24) {
    				each_value_8 = matrixMultiplication(/*A*/ ctx[3], /*B*/ ctx[4]).data;
    				validate_each_argument(each_value_8);
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8(ctx, each_value_8, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_8.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(220:8) {#if operation === 3}",
    		ctx
    	});

    	return block;
    }

    // (225:24) {#each row as ij, j}
    function create_each_block_9(ctx) {
    	let t_value = `${/*ij*/ ctx[20]}  ` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24 && t_value !== (t_value = `${/*ij*/ ctx[20]}  ` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_9.name,
    		type: "each",
    		source: "(225:24) {#each row as ij, j}",
    		ctx
    	});

    	return block;
    }

    // (222:12) {#each matrixMultiplication(A,B).data as row, i}
    function create_each_block_8(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let each_value_9 = /*row*/ ctx[17];
    	validate_each_argument(each_value_9);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_9.length; i += 1) {
    		each_blocks[i] = create_each_block_9(get_each_context_9(ctx, each_value_9, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("[\n                        ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = text("\n                        ]");
    			t2 = space();
    			add_location(p, file$2, 223, 20, 7455);
    			add_location(div, file$2, 222, 16, 7429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(p, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A, B*/ 24) {
    				each_value_9 = /*row*/ ctx[17];
    				validate_each_argument(each_value_9);
    				let i;

    				for (i = 0; i < each_value_9.length; i += 1) {
    					const child_ctx = get_each_context_9(ctx, each_value_9, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_9.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(222:12) {#each matrixMultiplication(A,B).data as row, i}",
    		ctx
    	});

    	return block;
    }

    // (232:8) {#if operation === 4 }
    function create_if_block_5(ctx) {
    	let div;
    	let h30;
    	let t0;
    	let t1_value = det(/*A*/ ctx[3]) + "";
    	let t1;
    	let t2;
    	let h31;
    	let t3;
    	let t4_value = det(/*B*/ ctx[4]) + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h30 = element("h3");
    			t0 = text("Determinant of A: ");
    			t1 = text(t1_value);
    			t2 = space();
    			h31 = element("h3");
    			t3 = text("Determinant of B: ");
    			t4 = text(t4_value);
    			add_location(h30, file$2, 233, 16, 7734);
    			add_location(h31, file$2, 236, 16, 7824);
    			add_location(div, file$2, 232, 12, 7712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h30);
    			append_dev(h30, t0);
    			append_dev(h30, t1);
    			append_dev(div, t2);
    			append_dev(div, h31);
    			append_dev(h31, t3);
    			append_dev(h31, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A*/ 8 && t1_value !== (t1_value = det(/*A*/ ctx[3]) + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*B*/ 16 && t4_value !== (t4_value = det(/*B*/ ctx[4]) + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(232:8) {#if operation === 4 }",
    		ctx
    	});

    	return block;
    }

    // (242:8) {#if operation === 5}
    function create_if_block_4(ctx) {
    	let h30;
    	let t1;
    	let t2;
    	let h31;
    	let t4;
    	let each1_anchor;
    	let each_value_6 = transpose(/*A*/ ctx[3]).data;
    	validate_each_argument(each_value_6);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_1[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	let each_value_4 = transpose(/*B*/ ctx[4]).data;
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			h30.textContent = "Transpose of A:";
    			t1 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			h31 = element("h3");
    			h31.textContent = "Transpose of B:";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			add_location(h30, file$2, 242, 12, 7973);
    			add_location(h31, file$2, 252, 12, 8302);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(target, anchor);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A*/ 8) {
    				each_value_6 = transpose(/*A*/ ctx[3]).data;
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_6(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(t2.parentNode, t2);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_6.length;
    			}

    			if (dirty[0] & /*B*/ 16) {
    				each_value_4 = transpose(/*B*/ ctx[4]).data;
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(242:8) {#if operation === 5}",
    		ctx
    	});

    	return block;
    }

    // (247:24) {#each row as ij, _}
    function create_each_block_7(ctx) {
    	let t_value = `${/*ij*/ ctx[20]}  ` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A*/ 8 && t_value !== (t_value = `${/*ij*/ ctx[20]}  ` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(247:24) {#each row as ij, _}",
    		ctx
    	});

    	return block;
    }

    // (244:12) {#each transpose(A).data as row, _}
    function create_each_block_6(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let each_value_7 = /*row*/ ctx[17];
    	validate_each_argument(each_value_7);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("[\n                        ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = text("\n                        ]");
    			add_location(p, file$2, 245, 20, 8090);
    			add_location(div, file$2, 244, 16, 8064);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A*/ 8) {
    				each_value_7 = /*row*/ ctx[17];
    				validate_each_argument(each_value_7);
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7(ctx, each_value_7, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_7.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(244:12) {#each transpose(A).data as row, _}",
    		ctx
    	});

    	return block;
    }

    // (257:24) {#each row as ij, _}
    function create_each_block_5(ctx) {
    	let t_value = `${/*ij*/ ctx[20]}  ` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*B*/ 16 && t_value !== (t_value = `${/*ij*/ ctx[20]}  ` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(257:24) {#each row as ij, _}",
    		ctx
    	});

    	return block;
    }

    // (254:12) {#each transpose(B).data as row, _}
    function create_each_block_4(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let each_value_5 = /*row*/ ctx[17];
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("[\n                        ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = text("\n                        ]");
    			t2 = space();
    			add_location(p, file$2, 255, 20, 8419);
    			add_location(div, file$2, 254, 16, 8393);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(p, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*B*/ 16) {
    				each_value_5 = /*row*/ ctx[17];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(254:12) {#each transpose(B).data as row, _}",
    		ctx
    	});

    	return block;
    }

    // (264:8) {#if operation === 6}
    function create_if_block_1$1(ctx) {
    	let h3;
    	let t1;
    	let show_if_1;
    	let t2;
    	let show_if;
    	let if_block1_anchor;

    	function select_block_type(ctx, dirty) {
    		if (dirty[0] & /*A*/ 8) show_if_1 = null;
    		if (show_if_1 == null) show_if_1 = !!(det(/*A*/ ctx[3]) === 0);
    		if (show_if_1) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx, [-1, -1]);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (dirty[0] & /*B*/ 16) show_if = null;
    		if (show_if == null) show_if = !!(det(/*B*/ ctx[4]) === 0);
    		if (show_if) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx, [-1, -1]);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Inverse of Matrix A:";
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h3, file$2, 264, 12, 8675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t2.parentNode, t2);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx, dirty)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(264:8) {#if operation === 6}",
    		ctx
    	});

    	return block;
    }

    // (268:12) {:else}
    function create_else_block_1(ctx) {
    	let each_1_anchor;
    	let each_value_2 = inverse(/*A*/ ctx[3]).data;
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
    			if (dirty[0] & /*A*/ 8) {
    				each_value_2 = inverse(/*A*/ ctx[3]).data;
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(268:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (266:12) {#if det(A) === 0}
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "A not invertable";
    			add_location(p, file$2, 266, 16, 8754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(266:12) {#if det(A) === 0}",
    		ctx
    	});

    	return block;
    }

    // (272:28) {#each row as ij, _}
    function create_each_block_3(ctx) {
    	let t_value = `${/*ij*/ ctx[20]}  ` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A*/ 8 && t_value !== (t_value = `${/*ij*/ ctx[20]}  ` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(272:28) {#each row as ij, _}",
    		ctx
    	});

    	return block;
    }

    // (269:16) {#each inverse(A).data as row, _}
    function create_each_block_2(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let each_value_3 = /*row*/ ctx[17];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("[\n                            ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = text("\n                            ]");
    			t2 = space();
    			add_location(p, file$2, 270, 24, 8900);
    			add_location(div, file$2, 269, 20, 8870);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(p, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*A*/ 8) {
    				each_value_3 = /*row*/ ctx[17];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(269:16) {#each inverse(A).data as row, _}",
    		ctx
    	});

    	return block;
    }

    // (281:12) {:else}
    function create_else_block(ctx) {
    	let h3;
    	let t1;
    	let each_1_anchor;
    	let each_value = inverse(/*B*/ ctx[4]).data;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Inverse of Matrix B:";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file$2, 281, 16, 9251);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*B*/ 16) {
    				each_value = inverse(/*B*/ ctx[4]).data;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(281:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (279:12) {#if det(B) === 0}
    function create_if_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "B not invertable";
    			add_location(p, file$2, 279, 16, 9189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(279:12) {#if det(B) === 0}",
    		ctx
    	});

    	return block;
    }

    // (286:28) {#each row as ij, _}
    function create_each_block_1(ctx) {
    	let t_value = `${/*ij*/ ctx[20]}  ` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*B*/ 16 && t_value !== (t_value = `${/*ij*/ ctx[20]}  ` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(286:28) {#each row as ij, _}",
    		ctx
    	});

    	return block;
    }

    // (283:16) {#each inverse(B).data as row, _}
    function create_each_block(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*row*/ ctx[17];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("[\n                            ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = text("\n                            ]");
    			t2 = space();
    			add_location(p, file$2, 284, 24, 9383);
    			add_location(div, file$2, 283, 20, 9353);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(p, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*B*/ 16) {
    				each_value_1 = /*row*/ ctx[17];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(283:16) {#each inverse(B).data as row, _}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let label;
    	let t3;
    	let input;
    	let t4;
    	let h3;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let button0;
    	let t10;
    	let button0_disabled_value;
    	let t11;
    	let button1;
    	let t12;
    	let button1_disabled_value;
    	let t13;
    	let mounted;
    	let dispose;
    	let if_block = /*check*/ ctx[2] === true && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Matrices";
    			t1 = space();
    			label = element("label");
    			label.textContent = "Enter size for matrices:";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			h3 = element("h3");
    			t5 = text("Matrix size: ");
    			t6 = text(/*N*/ ctx[0]);
    			t7 = text("x");
    			t8 = text(/*N*/ ctx[0]);
    			t9 = space();
    			button0 = element("button");
    			t10 = text("Generate N x N matrices");
    			t11 = space();
    			button1 = element("button");
    			t12 = text("Clear matrices");
    			t13 = space();
    			if (if_block) if_block.c();
    			add_location(h2, file$2, 148, 4, 4921);
    			attr_dev(label, "for", "intN");
    			add_location(label, file$2, 149, 4, 4943);
    			input.disabled = /*check*/ ctx[2];
    			attr_dev(input, "type", "number");
    			attr_dev(input, "id", "intN");
    			attr_dev(input, "size", "1");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "4");
    			attr_dev(input, "maxlength", "1");
    			add_location(input, file$2, 150, 4, 4999);
    			add_location(h3, file$2, 151, 4, 5101);
    			button0.disabled = button0_disabled_value = /*disableButton*/ ctx[5](/*N*/ ctx[0]);
    			add_location(button0, file$2, 152, 4, 5137);
    			button1.disabled = button1_disabled_value = !/*check*/ ctx[2];
    			add_location(button1, file$2, 155, 4, 5257);
    			add_location(div, file$2, 147, 0, 4911);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, label);
    			append_dev(div, t3);
    			append_dev(div, input);
    			set_input_value(input, /*N*/ ctx[0]);
    			append_dev(div, t4);
    			append_dev(div, h3);
    			append_dev(h3, t5);
    			append_dev(h3, t6);
    			append_dev(h3, t7);
    			append_dev(h3, t8);
    			append_dev(div, t9);
    			append_dev(div, button0);
    			append_dev(button0, t10);
    			append_dev(div, t11);
    			append_dev(div, button1);
    			append_dev(button1, t12);
    			append_dev(div, t13);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*check*/ 4) {
    				prop_dev(input, "disabled", /*check*/ ctx[2]);
    			}

    			if (dirty[0] & /*N*/ 1 && to_number(input.value) !== /*N*/ ctx[0]) {
    				set_input_value(input, /*N*/ ctx[0]);
    			}

    			if (dirty[0] & /*N*/ 1) set_data_dev(t6, /*N*/ ctx[0]);
    			if (dirty[0] & /*N*/ 1) set_data_dev(t8, /*N*/ ctx[0]);

    			if (dirty[0] & /*N*/ 1 && button0_disabled_value !== (button0_disabled_value = /*disableButton*/ ctx[5](/*N*/ ctx[0]))) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty[0] & /*check*/ 4 && button1_disabled_value !== (button1_disabled_value = !/*check*/ ctx[2])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (/*check*/ ctx[2] === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleChange(matrix) {
    	return event => {
    		const { name, value } = event.target;
    		const [row, col] = name.split('-').map(Number);
    		matrix.data[row][col] = parseInt(value);
    	};
    }

    function addition(a, b) {
    	// Make sure the matrices are the same size
    	if (a.rows !== b.rows || a.cols !== b.cols) {
    		throw new Error('Cannot add matrices of different sizes');
    	}

    	// Create a new matrix to store the result
    	const result = { rows: a.rows, cols: a.cols, data: [] };

    	// Add the corresponding elements of the two matrices
    	for (let i = 0; i < a.rows; i++) {
    		result.data[i] = [];

    		for (let j = 0; j < a.cols; j++) {
    			result.data[i][j] = a.data[i][j] + b.data[i][j];
    		}
    	}

    	return result;
    }

    function subtraction(a, b) {
    	// Make sure the matrices are the same size
    	if (a.rows !== b.rows || a.cols !== b.cols) {
    		throw new Error('Cannot add matrices of different sizes');
    	}

    	// Create a new matrix to store the result
    	const result = { rows: a.rows, cols: a.cols, data: [] };

    	// Add the corresponding elements of the two matrices
    	for (let i = 0; i < a.rows; i++) {
    		result.data[i] = [];

    		for (let j = 0; j < a.cols; j++) {
    			result.data[i][j] = a.data[i][j] - b.data[i][j];
    		}
    	}

    	return result;
    }

    function matrixMultiplication(a, b) {
    	// Make sure the matrices are compatible for multiplication
    	if (a.cols !== b.rows) {
    		return;
    	}

    	// Create a new matrix to store the result
    	const result = { rows: a.rows, cols: b.cols, data: [] };

    	// Perform the multiplication
    	for (let i = 0; i < a.rows; i++) {
    		result.data[i] = [];

    		for (let j = 0; j < b.cols; j++) {
    			let sum = 0;

    			for (let k = 0; k < a.cols; k++) {
    				sum += a.data[i][k] * b.data[k][j];
    			}

    			result.data[i][j] = sum;
    		}
    	}

    	return result;
    }

    function getSubMatrix(m, row, col) {
    	// Create a new matrix to store the submatrix
    	const result = {
    		rows: m.rows - 1,
    		cols: m.cols - 1,
    		data: []
    	};

    	// Iterate over the elements of the original matrix, skipping the specified row and column
    	for (let i = 0; i < m.rows; i++) {
    		if (i === row) continue;
    		const newRow = [];

    		for (let j = 0; j < m.cols; j++) {
    			if (j === col) continue;
    			newRow.push(m.data[i][j]);
    		}

    		result.data.push(newRow);
    	}

    	return result;
    }

    function det(m) {
    	if (m.rows === 1) return m.data[0][0];

    	// a*d - b*c
    	if (m.rows === 2) return m.data[0][0] * m.data[1][1] - m.data[0][1] * m.data[1][0];

    	let result = 0;

    	for (let i = 0; i < m.cols; i++) {
    		result += Math.pow(-1, i) * m.data[0][i] * det(getSubMatrix(m, 0, i));
    	}

    	return result;
    }

    function transpose(m) {
    	let result = Object.assign({}, m);

    	// since its a square matrix its just swapping across the diagonal
    	result.data = m.data.map(row => row.slice());

    	for (let i = 0; i < result.rows; i++) {
    		for (let j = 0; j < result.cols; j++) {
    			result.data[i][j] = m.data[j][i];
    		}
    	}

    	return result;
    }

    function inverse(m) {
    	// determinant == 0 check happens before function is called; no need to do in here
    	let result = { rows: m.rows, cols: m.cols, data: [] };

    	result.data = m.data.map(row => row.slice());
    	let determinant = det(m);

    	// 1x1 case
    	if (result.cols === 1) {
    		result.data[0][0] = 1 / result.data[0][0];
    		return result;
    	}

    	// 2x2
    	if (result.cols === 2) {
    		result.data[0][0] = m.data[1][1] / determinant;
    		result.data[0][1] = -m.data[0][1] / determinant;
    		result.data[1][0] = -m.data[1][0] / determinant;
    		result.data[1][1] = m.data[0][0] / determinant;
    		return result;
    	}

    	// 3x3 and 4x4
    	if (result.cols >= 3) {
    		for (let i = 0; i < result.rows; i++) {
    			for (let j = 0; j < result.cols; j++) {
    				result.data[i][j] = Math.pow(-1, i) * det(getSubMatrix(m, i, j));
    			}
    		}

    		result = transpose(result);

    		for (let i = 0; i < result.rows; i++) {
    			for (let j = 0; j < result.cols; j++) {
    				let num = result.data[i][j];
    				result.data[i][j] = parseInt(Math.floor(num / determinant).toFixed(4));
    			}
    		}

    		return result;
    	}

    	return result;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Matrices', slots, []);
    	let N = 1;
    	let operation;
    	let check = false;
    	let A = { rows: 0, cols: 0, data: [] };
    	let B = { rows: 0, cols: 0, data: [] };

    	function disableButton(val) {
    		return check || (val > 4 || val < 1);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Matrices> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		N = to_number(this.value);
    		$$invalidate(0, N);
    	}

    	const click_handler = () => {
    		$$invalidate(2, check = true);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(2, check = false);
    	};

    	function input_input_handler_1(i, j) {
    		A.data[i][j] = to_number(this.value);
    		($$invalidate(3, A), $$invalidate(0, N));
    	}

    	function input_input_handler_2(i, j) {
    		B.data[i][j] = to_number(this.value);
    		($$invalidate(4, B), $$invalidate(0, N));
    	}

    	const click_handler_2 = () => $$invalidate(1, operation = 1);
    	const click_handler_3 = () => $$invalidate(1, operation = 2);
    	const click_handler_4 = () => $$invalidate(1, operation = 3);
    	const click_handler_5 = () => $$invalidate(1, operation = 4);
    	const click_handler_6 = () => $$invalidate(1, operation = 5);
    	const click_handler_7 = () => $$invalidate(1, operation = 6);

    	$$self.$capture_state = () => ({
    		N,
    		operation,
    		check,
    		A,
    		B,
    		handleChange,
    		addition,
    		subtraction,
    		matrixMultiplication,
    		getSubMatrix,
    		det,
    		transpose,
    		inverse,
    		disableButton
    	});

    	$$self.$inject_state = $$props => {
    		if ('N' in $$props) $$invalidate(0, N = $$props.N);
    		if ('operation' in $$props) $$invalidate(1, operation = $$props.operation);
    		if ('check' in $$props) $$invalidate(2, check = $$props.check);
    		if ('A' in $$props) $$invalidate(3, A = $$props.A);
    		if ('B' in $$props) $$invalidate(4, B = $$props.B);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*N*/ 1) {
    			$$invalidate(3, A = {
    				rows: N,
    				cols: N,
    				data: Array(N).fill(0).map(() => Array(N).fill(0))
    			});
    		}

    		if ($$self.$$.dirty[0] & /*N*/ 1) {
    			$$invalidate(4, B = {
    				rows: N,
    				cols: N,
    				data: Array(N).fill(0).map(() => Array(N).fill(0))
    			});
    		}
    	};

    	return [
    		N,
    		operation,
    		check,
    		A,
    		B,
    		disableButton,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		input_input_handler_1,
    		input_input_handler_2,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class Matrices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Matrices",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Primes.svelte generated by Svelte v3.53.1 */

    const file$1 = "src/Primes.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let h30;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let button;
    	let t11;
    	let button_disabled_value;
    	let t12;
    	let h31;
    	let t14;
    	let p0;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let p1;
    	let t19;
    	let t20;
    	let t21;
    	let t22;
    	let p2;
    	let t23;
    	let t24;
    	let t25;
    	let t26;
    	let t27;
    	let t28;
    	let t29;
    	let p3;
    	let t30;
    	let t31;
    	let t32;
    	let t33;
    	let t34;
    	let t35;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			label0.textContent = "Integer a:";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			label1.textContent = "Integer b:";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			h30 = element("h3");
    			t6 = text("Inputs: a = ");
    			t7 = text(/*a*/ ctx[0]);
    			t8 = text(", b = ");
    			t9 = text(/*b*/ ctx[1]);
    			t10 = space();
    			button = element("button");
    			t11 = text("Get primes of a and b, GCD(a,b), LCM(a,b)");
    			t12 = space();
    			h31 = element("h3");
    			h31.textContent = "Outputs:";
    			t14 = space();
    			p0 = element("p");
    			t15 = text("Prime factors of a = [");
    			t16 = text(/*ap*/ ctx[5]);
    			t17 = text("]");
    			t18 = space();
    			p1 = element("p");
    			t19 = text("Prime factors of b = [");
    			t20 = text(/*bp*/ ctx[4]);
    			t21 = text("]");
    			t22 = space();
    			p2 = element("p");
    			t23 = text("GCD(");
    			t24 = text(/*a*/ ctx[0]);
    			t25 = text(",");
    			t26 = text(/*b*/ ctx[1]);
    			t27 = text(") = ");
    			t28 = text(/*_gcd*/ ctx[2]);
    			t29 = space();
    			p3 = element("p");
    			t30 = text("LCM(");
    			t31 = text(/*a*/ ctx[0]);
    			t32 = text(",");
    			t33 = text(/*b*/ ctx[1]);
    			t34 = text(") = ");
    			t35 = text(/*_lcm*/ ctx[3]);
    			attr_dev(label0, "for", "intA");
    			add_location(label0, file$1, 39, 4, 743);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "id", "intA");
    			attr_dev(input0, "size", "1");
    			set_style(input0, "max-width", "3em");
    			add_location(input0, file$1, 40, 4, 785);
    			attr_dev(label1, "for", "intB");
    			add_location(label1, file$1, 41, 4, 867);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "id", "intB");
    			attr_dev(input1, "size", "2");
    			set_style(input1, "max-width", "3em");
    			add_location(input1, file$1, 42, 4, 909);
    			add_location(h30, file$1, 43, 4, 991);
    			button.disabled = button_disabled_value = isButtonDisabled(/*a*/ ctx[0], /*b*/ ctx[1]);
    			add_location(button, file$1, 44, 4, 1030);
    			add_location(h31, file$1, 47, 4, 1164);
    			add_location(p0, file$1, 48, 4, 1188);
    			add_location(p1, file$1, 49, 4, 1229);
    			add_location(p2, file$1, 50, 4, 1270);
    			add_location(p3, file$1, 51, 4, 1305);
    			add_location(div, file$1, 38, 0, 733);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(div, t1);
    			append_dev(div, input0);
    			set_input_value(input0, /*a*/ ctx[0]);
    			append_dev(div, t2);
    			append_dev(div, label1);
    			append_dev(div, t4);
    			append_dev(div, input1);
    			set_input_value(input1, /*b*/ ctx[1]);
    			append_dev(div, t5);
    			append_dev(div, h30);
    			append_dev(h30, t6);
    			append_dev(h30, t7);
    			append_dev(h30, t8);
    			append_dev(h30, t9);
    			append_dev(div, t10);
    			append_dev(div, button);
    			append_dev(button, t11);
    			append_dev(div, t12);
    			append_dev(div, h31);
    			append_dev(div, t14);
    			append_dev(div, p0);
    			append_dev(p0, t15);
    			append_dev(p0, t16);
    			append_dev(p0, t17);
    			append_dev(div, t18);
    			append_dev(div, p1);
    			append_dev(p1, t19);
    			append_dev(p1, t20);
    			append_dev(p1, t21);
    			append_dev(div, t22);
    			append_dev(div, p2);
    			append_dev(p2, t23);
    			append_dev(p2, t24);
    			append_dev(p2, t25);
    			append_dev(p2, t26);
    			append_dev(p2, t27);
    			append_dev(p2, t28);
    			append_dev(div, t29);
    			append_dev(div, p3);
    			append_dev(p3, t30);
    			append_dev(p3, t31);
    			append_dev(p3, t32);
    			append_dev(p3, t33);
    			append_dev(p3, t34);
    			append_dev(p3, t35);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(button, "click", /*updateLists*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*a*/ 1 && to_number(input0.value) !== /*a*/ ctx[0]) {
    				set_input_value(input0, /*a*/ ctx[0]);
    			}

    			if (dirty & /*b*/ 2 && to_number(input1.value) !== /*b*/ ctx[1]) {
    				set_input_value(input1, /*b*/ ctx[1]);
    			}

    			if (dirty & /*a*/ 1) set_data_dev(t7, /*a*/ ctx[0]);
    			if (dirty & /*b*/ 2) set_data_dev(t9, /*b*/ ctx[1]);

    			if (dirty & /*a, b*/ 3 && button_disabled_value !== (button_disabled_value = isButtonDisabled(/*a*/ ctx[0], /*b*/ ctx[1]))) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*ap*/ 32) set_data_dev(t16, /*ap*/ ctx[5]);
    			if (dirty & /*bp*/ 16) set_data_dev(t20, /*bp*/ ctx[4]);
    			if (dirty & /*a*/ 1) set_data_dev(t24, /*a*/ ctx[0]);
    			if (dirty & /*b*/ 2) set_data_dev(t26, /*b*/ ctx[1]);
    			if (dirty & /*_gcd*/ 4) set_data_dev(t28, /*_gcd*/ ctx[2]);
    			if (dirty & /*a*/ 1) set_data_dev(t31, /*a*/ ctx[0]);
    			if (dirty & /*b*/ 2) set_data_dev(t33, /*b*/ ctx[1]);
    			if (dirty & /*_lcm*/ 8) set_data_dev(t35, /*_lcm*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function listPrimes(k) {
    	let ret = [];
    	if (k % 2 === 0) ret.push(2);

    	for (let i = 3; i <= Math.floor(k); i++) {
    		if (i % 2 !== 0 && k % i === 0) {
    			ret.push(i);
    		}
    	}

    	return ret;
    }

    function gcd(k, p) {
    	if (p === 0) return k;
    	return gcd(p, k % p);
    }

    function lcm(k, p) {
    	return Math.floor(k * p / gcd(k, p));
    }

    function isButtonDisabled(field1, field2) {
    	return !field1 || !field2;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let ap;
    	let bp;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Primes', slots, []);
    	let a;
    	let b;
    	let _gcd = -1;
    	let _lcm = -1;
    	let aPrimes = [];
    	let bPrimes = [];

    	function updateLists() {
    		$$invalidate(7, aPrimes = listPrimes(a));
    		$$invalidate(8, bPrimes = listPrimes(b));
    		$$invalidate(2, _gcd = gcd(a, b));
    		$$invalidate(3, _lcm = lcm(a, b));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Primes> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		a = to_number(this.value);
    		$$invalidate(0, a);
    	}

    	function input1_input_handler() {
    		b = to_number(this.value);
    		$$invalidate(1, b);
    	}

    	$$self.$capture_state = () => ({
    		a,
    		b,
    		_gcd,
    		_lcm,
    		aPrimes,
    		bPrimes,
    		listPrimes,
    		updateLists,
    		gcd,
    		lcm,
    		isButtonDisabled,
    		bp,
    		ap
    	});

    	$$self.$inject_state = $$props => {
    		if ('a' in $$props) $$invalidate(0, a = $$props.a);
    		if ('b' in $$props) $$invalidate(1, b = $$props.b);
    		if ('_gcd' in $$props) $$invalidate(2, _gcd = $$props._gcd);
    		if ('_lcm' in $$props) $$invalidate(3, _lcm = $$props._lcm);
    		if ('aPrimes' in $$props) $$invalidate(7, aPrimes = $$props.aPrimes);
    		if ('bPrimes' in $$props) $$invalidate(8, bPrimes = $$props.bPrimes);
    		if ('bp' in $$props) $$invalidate(4, bp = $$props.bp);
    		if ('ap' in $$props) $$invalidate(5, ap = $$props.ap);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*aPrimes*/ 128) {
    			$$invalidate(5, ap = aPrimes);
    		}

    		if ($$self.$$.dirty & /*bPrimes*/ 256) {
    			$$invalidate(4, bp = bPrimes);
    		}
    	};

    	return [
    		a,
    		b,
    		_gcd,
    		_lcm,
    		bp,
    		ap,
    		updateLists,
    		aPrimes,
    		bPrimes,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Primes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Primes",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.53.1 */
    const file = "src/App.svelte";

    // (24:31) 
    function create_if_block_1(ctx) {
    	let div;
    	let matrices;
    	let current;
    	matrices = new Matrices({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(matrices.$$.fragment);
    			add_location(div, file, 24, 8, 624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(matrices, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(matrices.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(matrices.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(matrices);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(24:31) ",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#if topics === 1}
    function create_if_block(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let primes;
    	let current;
    	primes = new Primes({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Primes, GCD, LCM";
    			t1 = space();
    			create_component(primes.$$.fragment);
    			add_location(h2, file, 20, 12, 521);
    			attr_dev(div, "id", "primes");
    			add_location(div, file, 19, 8, 491);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			mount_component(primes, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primes.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primes.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(primes);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(19:4) {#if topics === 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let label0;
    	let input0;
    	let t4;
    	let t5;
    	let label1;
    	let input1;
    	let t6;
    	let t7;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*topics*/ ctx[0] === 1) return 0;
    		if (/*topics*/ ctx[0] === 2) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "WELCOME !";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Choose one of the two main topics below";
    			t3 = space();
    			label0 = element("label");
    			input0 = element("input");
    			t4 = text("\n            Primes, GCD, LCM");
    			t5 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t6 = text("\n            Matrix Operations");
    			t7 = space();
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "svelte-u9qvfs");
    			add_location(h1, file, 6, 4, 136);
    			add_location(p, file, 7, 4, 159);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "topics");
    			input0.__value = 1;
    			input0.value = input0.__value;
    			/*$$binding_groups*/ ctx[2][0].push(input0);
    			add_location(input0, file, 10, 8, 227);
    			add_location(label0, file, 9, 4, 211);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "topics");
    			input1.__value = 2;
    			input1.value = input1.__value;
    			/*$$binding_groups*/ ctx[2][0].push(input1);
    			add_location(input1, file, 15, 8, 353);
    			add_location(label1, file, 14, 4, 337);
    			attr_dev(main, "class", "svelte-u9qvfs");
    			add_location(main, file, 5, 0, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p);
    			append_dev(main, t3);
    			append_dev(main, label0);
    			append_dev(label0, input0);
    			input0.checked = input0.__value === /*topics*/ ctx[0];
    			append_dev(label0, t4);
    			append_dev(main, t5);
    			append_dev(main, label1);
    			append_dev(label1, input1);
    			input1.checked = input1.__value === /*topics*/ ctx[0];
    			append_dev(label1, t6);
    			append_dev(main, t7);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[1]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*topics*/ 1) {
    				input0.checked = input0.__value === /*topics*/ ctx[0];
    			}

    			if (dirty & /*topics*/ 1) {
    				input1.checked = input1.__value === /*topics*/ ctx[0];
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*$$binding_groups*/ ctx[2][0].splice(/*$$binding_groups*/ ctx[2][0].indexOf(input0), 1);
    			/*$$binding_groups*/ ctx[2][0].splice(/*$$binding_groups*/ ctx[2][0].indexOf(input1), 1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			run_all(dispose);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let topics = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_change_handler() {
    		topics = this.__value;
    		$$invalidate(0, topics);
    	}

    	function input1_change_handler() {
    		topics = this.__value;
    		$$invalidate(0, topics);
    	}

    	$$self.$capture_state = () => ({ Matrices, Primes, topics });

    	$$self.$inject_state = $$props => {
    		if ('topics' in $$props) $$invalidate(0, topics = $$props.topics);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [topics, input0_change_handler, $$binding_groups, input1_change_handler];
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
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

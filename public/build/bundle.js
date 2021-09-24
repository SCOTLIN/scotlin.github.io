
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
    * FUNCTION: isArray( value )
    *	Validates if a value is an array.
    *
    * @param {*} value - value to be validated
    * @returns {Boolean} boolean indicating whether value is an array
    */
    function isArray( value ) {
    	return Object.prototype.toString.call( value ) === '[object Array]';
    } // end FUNCTION isArray()

    // EXPORTS //

    var lib = Array.isArray || isArray;

    // MODULES //




    // ISOBJECT //

    /**
    * FUNCTION: isObject( value )
    *	Validates if a value is a object; e.g., {}.
    *
    * @param {*} value - value to be validated
    * @returns {Boolean} boolean indicating whether value is a object
    */
    function isObject( value ) {
    	return ( typeof value === 'object' && value !== null && !lib( value ) );
    } // end FUNCTION isObject()


    // EXPORTS //

    var lib$1 = isObject;

    // MODULES //




    // COVARIANCE //

    /**
    * FUNCTION: covariance( arr1[, arr2,...,opts] )
    *	Computes the covariance between one or more numeric arrays.
    *
    * @param {...Array} arr - numeric array
    * @param {Object} [opts] - function options
    * @param {Boolean} [opts.bias] - boolean indicating whether to calculate a biased or unbiased estimate of the covariance (default: false)
    * @returns {Array} covariance matrix
    */
    function covariance() {
    	var bias = false,
    		args,
    		opts,
    		nArgs,
    		len,
    		deltas,
    		delta,
    		means,
    		C,
    		cov,
    		arr,
    		N, r, A, B, sum, val,
    		i, j, n;

    	args = Array.prototype.slice.call( arguments );
    	nArgs = args.length;

    	if ( lib$1( args[nArgs-1] ) ) {
    		opts = args.pop();
    		nArgs = nArgs - 1;
    		if ( opts.hasOwnProperty( 'bias' ) ) {
    			if ( typeof opts.bias !== 'boolean' ) {
    				throw new TypeError( 'covariance()::invalid input argument. Bias option must be a boolean.' );
    			}
    			bias = opts.bias;
    		}
    	}
    	if ( !nArgs ) {
    		throw new Error( 'covariance()::insufficient input arguments. Must provide array arguments.' );
    	}
    	for ( i = 0; i < nArgs; i++ ) {
    		if ( !Array.isArray( args[i] ) ) {
    			throw new TypeError( 'covariance()::invalid input argument. Must provide array arguments.' );
    		}
    	}
    	if ( Array.isArray( args[0][0] ) ) {
    		// If the first argument is an array of arrays, calculate the covariance over the nested arrays, disregarding any other arguments...
    		args = args[ 0 ];
    	}
    	nArgs = args.length;
    	len = args[ 0 ].length;
    	for ( i = 1; i < nArgs; i++ ) {
    		if ( args[i].length !== len ) {
    			throw new Error( 'covariance()::invalid input argument. All arrays must have equal length.' );
    		}
    	}
    	// [0] Initialization...
    	deltas = new Array( nArgs );
    	means = new Array( nArgs );
    	C = new Array( nArgs );
    	cov = new Array( nArgs );
    	for ( i = 0; i < nArgs; i++ ) {
    		means[ i ] = args[ i ][ 0 ];
    		arr = new Array( nArgs );
    		for ( j = 0; j < nArgs; j++ ) {
    			arr[ j ] = 0;
    		}
    		C[ i ] = arr;
    		cov[ i ] = arr.slice(); // copy!
    	}
    	if ( len < 2 ) {
    		return cov;
    	}
    	// [1] Compute the covariance...
    	for ( n = 1; n < len; n++ ) {

    		N = n + 1;
    		r = n / N;

    		// [a] Extract the values and compute the deltas...
    		for ( i = 0; i < nArgs; i++ ) {
    			deltas[ i ] = args[ i ][ n ] - means[ i ];
    		}

    		// [b] Update the covariance between one array and every other array...
    		for ( i = 0; i < nArgs; i++ ) {
    			arr = C[ i ];
    			delta = deltas[ i ];
    			for ( j = i; j < nArgs; j++ ) {
    				A = arr[ j ];
    				B = r * delta * deltas[ j ];
    				sum = A + B;
    				// Exploit the fact that the covariance matrix is symmetric...
    				if ( i !== j ) {
    					C[ j ][ i ] = sum;
    				}
    				arr[ j ] = sum;
    			} // end FOR j
    		} // end FOR i

    		// [c] Update the means...
    		for ( i = 0; i < nArgs; i++ ) {
    			means[ i ] += deltas[ i ] / N;
    		}
    	} // end FOR n

    	// [2] Normalize the co-moments...
    	n = N - 1;
    	if ( bias ) {
    		n = N;
    	}
    	for ( i = 0; i < nArgs; i++ ) {
    		arr = C[ i ];
    		for ( j = i; j < nArgs; j++ ) {
    			val = arr[ j ] / n;
    			cov[ i ][ j ] = val;
    			if ( i !== j ) {
    				cov[ j ][ i ] = val;
    			}
    		}
    	}
    	return cov;
    } // end FUNCTION covariance()


    // EXPORTS //

    var lib$2 = covariance;

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var svdJs_min = createCommonjsModule(function (module, exports) {
    !function(r,f){f(exports);}(commonjsGlobal,function(r){r.SVD=function(r,f,o,t,e){if(f=void 0===f||f,o=void 0===o||o,e=1e-64/(t=t||Math.pow(2,-52)),!r)throw new TypeError("Matrix a is not defined");var a,i,n,s,h,M,l,d,p,u,b,w,q,v=r[0].length,y=r.length;if(y<v)throw new TypeError("Invalid matrix: m < n");var c=[],x=[],m=[];for(a=b=d=0;a<y;a++)x[a]=new Array(v).fill(0);for(a=0;a<v;a++)m[a]=new Array(v).fill(0);var S,k=new Array(v).fill(0);for(a=0;a<y;a++)for(i=0;i<v;i++)x[a][i]=r[a][i];for(a=0;a<v;a++){for(c[a]=d,u=0,s=a+1,i=a;i<y;i++)u+=Math.pow(x[i][a],2);if(u<e)d=0;else for(p=(l=x[a][a])*(d=l<0?Math.sqrt(u):-Math.sqrt(u))-u,x[a][a]=l-d,i=s;i<v;i++){for(u=0,n=a;n<y;n++)u+=x[n][a]*x[n][i];for(l=u/p,n=a;n<y;n++)x[n][i]=x[n][i]+l*x[n][a];}for(k[a]=d,u=0,i=s;i<v;i++)u+=Math.pow(x[a][i],2);if(u<e)d=0;else {for(p=(l=x[a][a+1])*(d=l<0?Math.sqrt(u):-Math.sqrt(u))-u,x[a][a+1]=l-d,i=s;i<v;i++)c[i]=x[a][i]/p;for(i=s;i<y;i++){for(u=0,n=s;n<v;n++)u+=x[i][n]*x[a][n];for(n=s;n<v;n++)x[i][n]=x[i][n]+u*c[n];}}b<(w=Math.abs(k[a])+Math.abs(c[a]))&&(b=w);}if(o)for(a=v-1;0<=a;a--){if(0!==d){for(p=x[a][a+1]*d,i=s;i<v;i++)m[i][a]=x[a][i]/p;for(i=s;i<v;i++){for(u=0,n=s;n<v;n++)u+=x[a][n]*m[n][i];for(n=s;n<v;n++)m[n][i]=m[n][i]+u*m[n][a];}}for(i=s;i<v;i++)m[a][i]=0,m[i][a]=0;m[a][a]=1,d=c[a],s=a;}if(f)for(a=v-1;0<=a;a--){for(s=a+1,d=k[a],i=s;i<v;i++)x[a][i]=0;if(0!==d){for(p=x[a][a]*d,i=s;i<v;i++){for(u=0,n=s;n<y;n++)u+=x[n][a]*x[n][i];for(l=u/p,n=a;n<y;n++)x[n][i]=x[n][i]+l*x[n][a];}for(i=a;i<y;i++)x[i][a]=x[i][a]/d;}else for(i=a;i<y;i++)x[i][a]=0;x[a][a]=x[a][a]+1;}for(t*=b,n=v-1;0<=n;n--)for(var A=0;A<50;A++){for(S=!1,s=n;0<=s;s--){if(Math.abs(c[s])<=t){S=!0;break}if(Math.abs(k[s-1])<=t)break}if(!S)for(M=0,h=s-(u=1),a=s;a<n+1&&(l=u*c[a],c[a]=M*c[a],!(Math.abs(l)<=t));a++)if(d=k[a],k[a]=Math.sqrt(l*l+d*d),M=d/(p=k[a]),u=-l/p,f)for(i=0;i<y;i++)w=x[i][h],q=x[i][a],x[i][h]=w*M+q*u,x[i][a]=-w*u+q*M;if(q=k[n],s===n){if(q<0&&(k[n]=-q,o))for(i=0;i<v;i++)m[i][n]=-m[i][n];break}for(b=k[s],l=(((w=k[n-1])-q)*(w+q)+((d=c[n-1])-(p=c[n]))*(d+p))/(2*p*w),d=Math.sqrt(l*l+1),l=((b-q)*(b+q)+p*(w/(l<0?l-d:l+d)-p))/b,a=s+(u=M=1);a<n+1;a++){if(d=c[a],w=k[a],p=u*d,d*=M,q=Math.sqrt(l*l+p*p),l=b*(M=l/(c[a-1]=q))+d*(u=p/q),d=-b*u+d*M,p=w*u,w*=M,o)for(i=0;i<v;i++)b=m[i][a-1],q=m[i][a],m[i][a-1]=b*M+q*u,m[i][a]=-b*u+q*M;if(q=Math.sqrt(l*l+p*p),l=(M=l/(k[a-1]=q))*d+(u=p/q)*w,b=-u*d+M*w,f)for(i=0;i<y;i++)w=x[i][a-1],q=x[i][a],x[i][a-1]=w*M+q*u,x[i][a]=-w*u+q*M;}c[s]=0,c[n]=l,k[n]=b;}for(a=0;a<v;a++)k[a]<t&&(k[a]=0);return {u:x,q:k,v:m}},r.VERSION="1.0.6",Object.defineProperty(r,"__esModule",{value:!0});});
    });

    var SingularValueDecomposition = unwrapExports(svdJs_min);

    var citedCoordinates = [{"x0": 0.3158042705195428, "y0": 0.10907848056499249, "grouping1": 0, "grouping2": 0, "grouping3": 1, "grouping4": 0, "grouping5": 2, "grouping6": 2, "Author": "Guido Noto La Diega", "URL": "https://scholar.google.com/citations?user=B3U7yvcAAAAJ&hl=it", "KeyWords": "Intellectual Property, Privacy Law, IoT, AI, blockchain", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=B3U7yvcAAAAJ&hl=it", "Citations": "129", "Affiliation": "University of Stirling", "x1": 0.2796221049927438, "y1": -0.0558998595588307, "x2": 0.17075146249443868, "y2": 0.18205132229733956, "x3": 0.09921526499029414, "y3": 0.267790364547099, "x4": 0.05597334592799251, "y4": 0.3156977274839615, "x5": 0.009427116051739612, "y5": 0.31361858611569365}, {"x0": 0.31186213265697893, "y0": -0.027682350938384215, "grouping1": 0, "grouping2": 0, "grouping3": 1, "grouping4": 0, "grouping5": 2, "grouping6": 2, "Author": "Rossana Ducato", "URL": "https://scholar.google.com/citations?user=JnkeH28AAAAJ&hl=it", "KeyWords": "legal design, privacy and data protection, intellectual property, biobank and ehealth law, platform economy", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=JnkeH28AAAAJ&hl=it", "Citations": "93", "Affiliation": "Postdoc Research Fellow ,  UCLouvain and Université Saint-Louis - Bruxelles", "x1": 0.2749623081320868, "y1": -0.16921351760522138, "x2": 0.16607001633706675, "y2": 0.02904185676779668, "x3": 0.09617796589847878, "y3": 0.1276212391098945, "x4": 0.045420747789565424, "y4": 0.18176632685146513, "x5": -0.0013498431641765815, "y5": 0.18522603980967287}, {"x0": -0.04205575300043798, "y0": 0.593910019687568, "grouping1": 0, "grouping2": 0, "grouping3": 2, "grouping4": 2, "grouping5": 3, "grouping6": 0, "Author": "Martin Kretschmer", "URL": "https://scholar.google.co.uk/citations?user=sbcJOSoAAAAJ&hl=en", "KeyWords": "Copyright and information law, intellectual property, creative industries, regulation theory, methodology", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=sbcJOSoAAAAJ&hl=en", "Citations": "1883", "Affiliation": "Professor ,  School of Law,College of Social Sciences ,  University of Glasgow", "x1": 0.14004363771565545, "y1": 0.48782566174028547, "x2": 0.13455588910158992, "y2": 0.5938685196092097, "x3": 0.09147075466328132, "y3": 0.5825278817400609, "x4": 0.06865554432389105, "y4": 0.5672859066516287, "x5": -0.0006528501399867956, "y5": 0.5708154437937439}, {"x0": -0.09773305681202732, "y0": 0.630078171164632, "grouping1": 0, "grouping2": 0, "grouping3": 2, "grouping4": 2, "grouping5": 3, "grouping6": 0, "Author": "Marta Iljadica", "URL": "https://scholar.google.co.uk/citations?user=JXTpQXIAAAAJ&hl=en", "KeyWords": "", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=JXTpQXIAAAAJ&hl=en", "Citations": "32", "Affiliation": "Lecturer in Intellectual Property ,  University of Glasgow", "x1": 0.08858793605961844, "y1": 0.48239563780429334, "x2": 0.07738452641054902, "y2": 0.49627934496476644, "x3": 0.050699197937835026, "y3": 0.4772866231729416, "x4": 0.04495398053208988, "y4": 0.44805280390924096, "x5": -0.01480152192941407, "y5": 0.4548836347046909}, {"x0": -0.17596998362246813, "y0": -0.21137502942001826, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 1, "Author": "Israel Cedillo Lazcano", "URL": "https://scholar.google.com.mx/citations?user=SPrHADoAAAAJ&hl=en", "KeyWords": "Shadow Banking, FinTech, Cryptoassets, Artificial Intelligence, Intellectual Property", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.com.mx/citations?user=SPrHADoAAAAJ&hl=en", "Citations": "10", "Affiliation": "Lecturer in Banking and IP,IT Law at UDLAP", "x1": -0.33648599619669667, "y1": 0.03327559211267216, "x2": -0.36968305453679223, "y2": 0.17175472202516226, "x3": -0.385353084928453, "y3": 0.16771545583551564, "x4": -0.3705824684411413, "y4": 0.11911823972321384, "x5": -0.40969850030518346, "y5": 0.10378239198999441}, {"x0": 0.4939098944193537, "y0": -0.0882094645305851, "grouping1": 0, "grouping2": 0, "grouping3": 1, "grouping4": 0, "grouping5": 2, "grouping6": 2, "Author": "Dr Lachlan Urquhart", "URL": "https://scholar.google.co.uk/citations?user=o2gCskMAAAAJ&hl=en", "KeyWords": "Human Computer Interaction, Cybersecurity, Data Protection, Technology Law, Ubiquitous Computing.", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=o2gCskMAAAAJ&hl=en", "Citations": "354", "Affiliation": "University of Edinburgh; Horizon Digital Economy Research ,  University of Nottingham", "x1": 0.21824176470950044, "y1": -0.4379065046407753, "x2": 0.009711251831099051, "y2": -0.25433858778887497, "x3": -0.0505970062805058, "y3": -0.14018786052409712, "x4": -0.08597966305635138, "y4": -0.12066581898714913, "x5": -0.07290006296493519, "y5": -0.1539815919287198}, {"x0": -0.229642839535631, "y0": -0.02421825498596441, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 4, "Author": "Mariela de Amstalden", "URL": "https://scholar.google.ch/citations?user=IoKBsjcAAAAJ&hl=en", "KeyWords": "Public International Law, International Economic Law, International Trade Law, Food Law, Public Health and Biotechnologies Law", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.ch/citations?user=IoKBsjcAAAAJ&hl=en", "Citations": "7", "Affiliation": "University of Edinburgh ,  School of Law", "x1": 0.09086315304107186, "y1": 0.13793261286009298, "x2": 0.26203728560488054, "y2": -0.22830410870502582, "x3": 0.3268256065512871, "y3": -0.2726664221147881, "x4": 0.36575553505379815, "y4": -0.27294108921794374, "x5": 0.3949248689010535, "y5": -0.22102133616910805}, {"x0": -0.26694190315232025, "y0": 0.42549408855124543, "grouping1": 0, "grouping2": 0, "grouping3": 2, "grouping4": 2, "grouping5": 3, "grouping6": 5, "Author": "Jade Kouletakis", "URL": "https://scholar.google.com/citations?user=uE1oO1gAAAAJ&hl=en", "KeyWords": "intellectual property, public policy, public law, developing nations, disability", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=uE1oO1gAAAAJ&hl=en", "Citations": "2", "Affiliation": "Abertay University", "x1": -0.012935228495171681, "y1": 0.4711094833211653, "x2": 0.03942795842407334, "y2": 0.46105924995503395, "x3": 0.07137272405240878, "y3": 0.4018286399446027, "x4": 0.04108966582520838, "y4": 0.40500436241789745, "x5": -0.013035372622890722, "y5": 0.3911555358338989}, {"x0": -0.19051721195436871, "y0": -0.03695166664676002, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 4, "Author": "Irene Couzigou, PhD, LLM", "URL": "https://scholar.google.com/citations?user=vNvRYksAAAAJ&hl=en", "KeyWords": "General Public International Law, The law of International Peace and Security, International Cyber Security Law, International H", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=vNvRYksAAAAJ&hl=en", "Citations": "78", "Affiliation": "Senior Lecturer University of Aberdeen School of Law (UK)", "x1": 0.025927843091222584, "y1": 0.11098672192459196, "x2": 0.19228945409121329, "y2": -0.28261653314036334, "x3": 0.25051689423879425, "y3": -0.3341391951028741, "x4": 0.28648104810721475, "y4": -0.3276810153379933, "x5": 0.3080403482124004, "y5": -0.29618380242140524}, {"x0": -0.3634811885878643, "y0": -0.14428761440791138, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 1, "Author": "Patricia Živković", "URL": "https://scholar.google.com/citations?user=wIFFAosAAAAJ&hl=en", "KeyWords": "Commercial Arbitration, Negotiation, Biometrics, Data Protection, Private International Law", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=wIFFAosAAAAJ&hl=en", "Citations": "26", "Affiliation": "Lecturer in International Dispute Resolution", "x1": -0.15246667753099652, "y1": -0.06690143715163814, "x2": -0.06142741091207807, "y2": -0.30267334388179723, "x3": -0.04433593310457626, "y3": -0.3452884892237583, "x4": -0.032425978278622494, "y4": -0.34346392526691616, "x5": -0.03083063464789702, "y5": -0.3199054045445816}, {"x0": -0.24463066056348887, "y0": -0.14209852416646998, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 4, "Author": "Dafouz Milne, Emma", "URL": "https://scholar.google.co.uk/citations?user=iStd81MAAAAJ&hl=en", "KeyWords": "Lingüística aplicada, CLIL, análisis del discurso", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=iStd81MAAAAJ&hl=en", "Citations": "1192", "Affiliation": "Universidad Complutense de Madrid", "x1": -0.49899945759743153, "y1": -0.061256152403063306, "x2": -0.529798595725845, "y2": -0.023419000746059765, "x3": -0.5191494948753219, "y3": -0.09432149454209168, "x4": -0.5288567353334213, "y4": -0.13228561378306836, "x5": -0.4997535718202411, "y5": -0.22536454560926591}, {"x0": 0.21915030188750528, "y0": -0.18051638802391481, "grouping1": 0, "grouping2": 0, "grouping3": 1, "grouping4": 3, "grouping5": 4, "grouping6": 3, "Author": "C William R Webster", "URL": "https://scholar.google.co.uk/citations?user=mdypkb4AAAAJ&hl=en", "KeyWords": "", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=mdypkb4AAAAJ&hl=en", "Citations": "783", "Affiliation": "University of Stirling", "x1": -0.14163424601001537, "y1": -0.26213547319394404, "x2": -0.2676860111489753, "y2": -0.021354790405373397, "x3": -0.306656991570297, "y3": 0.0069288657566609945, "x4": -0.3148954012871318, "y4": -0.010465244784412088, "x5": -0.3135499871947019, "y5": -0.03407989115605009}, {"x0": 0.00249144710487598, "y0": 0.07349620117995571, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 0, "grouping6": 4, "Author": "Péter Cserne", "URL": "https://scholar.google.com/citations?user=qlvq1lwAAAAJ&hl=en", "KeyWords": "law and economics, legal epistemology, private law theory, history of legal and political thought", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=qlvq1lwAAAAJ&hl=en", "Citations": "205", "Affiliation": "University of Aberdeen", "x1": 0.27520864884699986, "y1": 0.06375440003208051, "x2": 0.35981491784340436, "y2": -0.12716985200700973, "x3": 0.385287537656452, "y3": -0.12746939461772025, "x4": 0.3965645570176358, "y4": -0.11740236456066636, "x5": 0.4079707741901428, "y5": -0.06189633094680762}, {"x0": -0.2861527594224879, "y0": -0.2918074209233659, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 1, "Author": "Dr Mo Egan", "URL": "https://scholar.google.co.uk/citations?user=6o0j57EAAAAJ&hl=en", "KeyWords": "Law, Policing", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=6o0j57EAAAAJ&hl=en", "Citations": "10", "Affiliation": "Unknown affiliation", "x1": -0.36553757385079105, "y1": -0.0861556878110178, "x2": -0.3014839642280772, "y2": -0.12222886439055469, "x3": -0.24370563059659095, "y3": -0.16098239528339342, "x4": -0.20525189447738348, "y4": -0.16058673693955253, "x5": -0.1624818420813572, "y5": -0.19892746032306055}, {"x0": 0.46926930025887814, "y0": -0.027685677188709307, "grouping1": 0, "grouping2": 0, "grouping3": 1, "grouping4": 0, "grouping5": 2, "grouping6": 2, "Author": "Lilian Edwards", "URL": "https://scholar.google.com/citations?user=a6-onLoAAAAJ&hl=en", "KeyWords": "Internet law, IT law, e-commerce, privacy", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=a6-onLoAAAAJ&hl=en", "Citations": "2112", "Affiliation": "Newcastle Law School", "x1": 0.32774062258801706, "y1": -0.25707997134870453, "x2": 0.27155173859685555, "y2": -0.17316513916724638, "x3": 0.2575933304299965, "y3": -0.10949704194037634, "x4": 0.23645141092518937, "y4": -0.07422341531621304, "x5": 0.2941365166572055, "y5": -0.037731701952714816}, {"x0": 0.265120913258036, "y0": -0.20499256991430842, "grouping1": 0, "grouping2": 0, "grouping3": 1, "grouping4": 3, "grouping5": 4, "grouping6": 3, "Author": "Matthew Jewell", "URL": "https://scholar.google.co.uk/citations?user=OkUv-F4AAAAJ&hl=en", "KeyWords": "Law, Legal Theory, HCI, Ubicomp, Smart Technologies", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=OkUv-F4AAAAJ&hl=en", "Citations": "7", "Affiliation": "PhD Candidate ,  Edinburgh Law School", "x1": 0.0630953725681793, "y1": -0.41828224316809703, "x2": -0.03080301710836752, "y2": -0.21646717505121263, "x3": -0.05465914334736498, "y3": -0.15529610408699848, "x4": -0.05118791186996821, "y4": -0.14292567273679568, "x5": 0.03358608754966037, "y5": -0.15222799088744554}, {"x0": -0.27458348420387085, "y0": -0.20052833891890703, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 1, "Author": "Dominik Ziegler", "URL": "https://scholar.google.co.uk/citations?user=9L-xODcAAAAJ&hl=en", "KeyWords": "Scanning Probe Microscopy, Kelvin Probe Force Microscopy, Nanofabrication, Encased Cantilevers, BioMEMS", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=9L-xODcAAAAJ&hl=en", "Citations": "2672", "Affiliation": "CTO Nanosurf ,  Scuba Probe Technologies ,  Lawrence Berkeley National Laboratory", "x1": -0.5704199254117449, "y1": -0.08320860368543789, "x2": -0.5599435827012531, "y2": -0.08247524273658777, "x3": -0.5418663316727841, "y3": -0.15731244279022827, "x4": -0.5306595706469301, "y4": -0.19479374916363282, "x5": -0.4765128400243677, "y5": -0.2631730872670994}, {"x0": -0.09905830207287898, "y0": -0.13432320737963338, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 4, "Author": "Gianluca Andresani", "URL": "https://scholar.google.com/citations?user=poIiHR0AAAAJ&hl=en", "KeyWords": "Legal Philosophy, Political Philosophy, Social Epistemology, Constitutional Theory, Intellectual Property, IT Law & Regulatio", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=poIiHR0AAAAJ&hl=en", "Citations": "1044", "Affiliation": "Aberdeen University", "x1": 0.08994208345237731, "y1": 0.18719455852507969, "x2": 0.12561371074173244, "y2": 0.13800346508117833, "x3": 0.12756993649967405, "y3": 0.147241571834267, "x4": 0.12290425440040459, "y4": 0.17543869095017756, "x5": 0.07329716229905175, "y5": 0.20331745217083508}, {"x0": 0.3522342425961029, "y0": 0.03337128204861043, "grouping1": 0, "grouping2": 0, "grouping3": 1, "grouping4": 0, "grouping5": 2, "grouping6": 2, "Author": "Burkhard Schafer", "URL": "https://scholar.google.com/citations?user=vD2DRqoAAAAJ&hl=en", "KeyWords": "Jurisprudence, legal theory, comparative law, IT law", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=vD2DRqoAAAAJ&hl=en", "Citations": "1219", "Affiliation": "Professor of Computational Legal Theory ,  University of Edinburgh", "x1": 0.3349268088509476, "y1": -0.09024502837247045, "x2": 0.36075763763128943, "y2": -0.13399538115350593, "x3": 0.3788200472677821, "y3": -0.1309350076861332, "x4": 0.3798748484322239, "y4": -0.11780964849491386, "x5": 0.4159019234961965, "y5": -0.08381044938357915}, {"x0": -0.1590753597734296, "y0": -0.15075173575207074, "grouping1": 0, "grouping2": 1, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 4, "Author": "Paolo Cavaliere", "URL": "https://scholar.google.com/citations?user=HOYJ86sAAAAJ&hl=en", "KeyWords": "Freedom of Expression, Media Law", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=HOYJ86sAAAAJ&hl=en", "Citations": "14", "Affiliation": "University of Edinburgh Law School", "x1": -0.13068317895557263, "y1": 0.01380981061893873, "x2": -0.04914021274680309, "y2": -0.10385046152687646, "x3": 0.010774356189609558, "y3": -0.15084479402858256, "x4": 0.07571468505573728, "y4": -0.19711976339832768, "x5": 0.05828222953770063, "y5": -0.17449549182869076}];

    var recentCoordinates = [{"x0": 0.3551744943768566, "y0": 0.05544157570816945, "grouping1": 0, "grouping2": 1, "grouping3": 1, "grouping4": 0, "grouping5": 0, "grouping6": 1, "Author": "Guido Noto La Diega", "URL": "https://scholar.google.com/citations?user=B3U7yvcAAAAJ&hl=it", "KeyWords": "Intellectual Property, Privacy Law, IoT, AI, blockchain", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=B3U7yvcAAAAJ&hl=it", "Citations": "129", "Affiliation": "University of Stirling", "x1": -0.29946924386185875, "y1": 0.1255147955190797, "x2": -0.25095436246829667, "y2": 0.08686698450227598, "x3": -0.1822421294793363, "y3": -0.2719239836883129, "x4": -0.14422067287912155, "y4": -0.2297432674894057, "x5": -0.10981412207749469, "y5": -0.16961549147424837}, {"x0": 0.282441192867804, "y0": -0.050666363583633384, "grouping1": 0, "grouping2": 1, "grouping3": 1, "grouping4": 3, "grouping5": 0, "grouping6": 1, "Author": "Rossana Ducato", "URL": "https://scholar.google.com/citations?user=JnkeH28AAAAJ&hl=it", "KeyWords": "legal design, privacy and data protection, intellectual property, biobank and ehealth law, platform economy", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=JnkeH28AAAAJ&hl=it", "Citations": "93", "Affiliation": "Postdoc Research Fellow, UCLouvain and Université Saint-Louis - Bruxelles", "x1": -0.29802201253977917, "y1": 0.20302909776531874, "x2": -0.23219096513566884, "y2": 0.184023271770995, "x3": -0.14379454047346407, "y3": -0.17367927722754112, "x4": -0.12188587868210124, "y4": -0.14727795317128473, "x5": -0.07301902472770547, "y5": -0.08823463016371397}, {"x0": 0.11723001251080477, "y0": 0.4359221624994299, "grouping1": 0, "grouping2": 0, "grouping3": 2, "grouping4": 2, "grouping5": 2, "grouping6": 2, "Author": "Martin Kretschmer", "URL": "https://scholar.google.co.uk/citations?user=sbcJOSoAAAAJ&hl=en", "KeyWords": "Copyright and information law, intellectual property, creative industries, regulation theory, methodology", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=sbcJOSoAAAAJ&hl=en", "Citations": "1883", "Affiliation": "Professor, School of Law,College of Social Sciences, University of Glasgow", "x1": -0.12144369487539998, "y1": -0.20389757054616514, "x2": -0.12613351411308757, "y2": -0.38700923340210447, "x3": -0.1206466668718803, "y3": -0.46775748535392675, "x4": -0.09026093957410336, "y4": -0.4350241376872503, "x5": -0.07304358643068343, "y5": -0.3531598143137665}, {"x0": 0.008370418462639069, "y0": 0.5482669538334577, "grouping1": 0, "grouping2": 0, "grouping3": 2, "grouping4": 2, "grouping5": 2, "grouping6": 2, "Author": "Marta Iljadica", "URL": "https://scholar.google.co.uk/citations?user=JXTpQXIAAAAJ&hl=en", "KeyWords": "", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=JXTpQXIAAAAJ&hl=en", "Citations": "32", "Affiliation": "Lecturer in Intellectual Property, University of Glasgow", "x1": -0.04026254226306583, "y1": -0.2326717059678903, "x2": -0.06682675960961364, "y2": -0.408319198570965, "x3": -0.06151235123607161, "y3": -0.3399757742231748, "x4": -0.039855299561046165, "y4": -0.2997968984735026, "x5": -0.029018339166437944, "y5": -0.25303635401361324}, {"x0": -0.2562029379837852, "y0": -0.2946019966452498, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 0, "Author": "Israel Cedillo Lazcano", "URL": "https://scholar.google.com.mx/citations?user=SPrHADoAAAAJ&hl=en", "KeyWords": "Shadow Banking, FinTech, Cryptoassets, Artificial Intelligence, Intellectual Property", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.com.mx/citations?user=SPrHADoAAAAJ&hl=en", "Citations": "10", "Affiliation": "Lecturer in Banking and IP,IT Law at UDLAP", "x1": 0.36347900431581653, "y1": 0.04524901121942477, "x2": 0.37281333304937714, "y2": -0.1451638864825358, "x3": 0.4167580967886197, "y3": -0.13420871006993532, "x4": 0.4223553093294631, "y4": -0.07666908285616797, "x5": 0.42496829114534485, "y5": 0.01665012034978855}, {"x0": 0.485579200182243, "y0": -0.1868228422659818, "grouping1": 0, "grouping2": 1, "grouping3": 1, "grouping4": 0, "grouping5": 0, "grouping6": 1, "Author": "Dr Lachlan Urquhart", "URL": "https://scholar.google.co.uk/citations?user=o2gCskMAAAAJ&hl=en", "KeyWords": "Human Computer Interaction, Cybersecurity, Data Protection, Technology Law, Ubiquitous Computing.", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=o2gCskMAAAAJ&hl=en", "Citations": "354", "Affiliation": "University of Edinburgh; Horizon Digital Economy Research, University of Nottingham", "x1": -0.29106099917411826, "y1": 0.45886136668284155, "x2": -0.12535140518016424, "y2": 0.4955338011026699, "x3": -0.01956605970056054, "y3": 0.031160077157382542, "x4": 0.025507678551271926, "y4": 0.13948374470525862, "x5": 0.0651426944849334, "y5": 0.2576811276510334}, {"x0": -0.20653235487593535, "y0": -0.0024494475496678113, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 3, "grouping6": 4, "Author": "Mariela de Amstalden", "URL": "https://scholar.google.ch/citations?user=IoKBsjcAAAAJ&hl=en", "KeyWords": "Public International Law, International Economic Law, International Trade Law, Food Law, Public Health and Biotechnologies Law", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.ch/citations?user=IoKBsjcAAAAJ&hl=en", "Citations": "7", "Affiliation": "University of Edinburgh, School of Law", "x1": -0.03583030167386207, "y1": -0.3797194626344586, "x2": -0.18142374822827556, "y2": -0.12048849034758741, "x3": -0.26806268105329045, "y3": 0.42599451025597385, "x4": -0.30292820228782785, "y4": 0.44235190122588086, "x5": -0.3397424960061592, "y5": 0.463863614974945}, {"x0": -0.22044073944896264, "y0": 0.5275874498638466, "grouping1": 0, "grouping2": 0, "grouping3": 2, "grouping4": 2, "grouping5": 2, "grouping6": 2, "Author": "Jade Kouletakis", "URL": "https://scholar.google.com/citations?user=uE1oO1gAAAAJ&hl=en", "KeyWords": "intellectual property, public policy, public law, developing nations, disability", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=uE1oO1gAAAAJ&hl=en", "Citations": "2", "Affiliation": "Abertay University", "x1": 0.04037147854847496, "y1": -0.3580588922351777, "x2": -0.008679067802326043, "y2": -0.4949283562116065, "x3": -0.06654364357630532, "y3": -0.2622286470673194, "x4": -0.09082179298343364, "y4": -0.2126197270319654, "x5": -0.05834204770217546, "y5": -0.16745642453413018}, {"x0": -0.2261902621458239, "y0": 0.023602308454568576, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 3, "grouping6": 4, "Author": "Irene Couzigou, PhD, LLM", "URL": "https://scholar.google.com/citations?user=vNvRYksAAAAJ&hl=en", "KeyWords": "General Public International Law, The law of International Peace and Security, International Cyber Security Law, International H", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=vNvRYksAAAAJ&hl=en", "Citations": "78", "Affiliation": "Senior Lecturer University of Aberdeen School of Law (UK)", "x1": 0.004269771785703892, "y1": -0.3274341794451234, "x2": -0.10730120077789537, "y2": -0.11257080050871814, "x3": -0.18738418722621655, "y3": 0.5056053453452325, "x4": -0.22719531331595075, "y4": 0.5241079937455102, "x5": -0.25489693707992306, "y5": 0.5187172483932885}, {"x0": -0.3450149350200061, "y0": -0.014279622402904379, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 3, "grouping6": 4, "Author": "Patricia Živković", "URL": "https://scholar.google.com/citations?user=wIFFAosAAAAJ&hl=en", "KeyWords": "Commercial Arbitration, Negotiation, Biometrics, Data Protection, Private International Law", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=wIFFAosAAAAJ&hl=en", "Citations": "26", "Affiliation": "Lecturer in International Dispute Resolution", "x1": 0.15128705966999464, "y1": -0.15673008431645136, "x2": 0.09280825434269538, "y2": 0.1167448078454976, "x3": 0.08833364232428476, "y3": 0.39988869475597455, "x4": 0.07649781195764088, "y4": 0.45140960122607887, "x5": 0.05806579404384722, "y5": 0.5258513091205145}, {"x0": -0.2848276503807874, "y0": 0.01683912173491984, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 3, "grouping6": 4, "Author": "Dafouz Milne, Emma", "URL": "https://scholar.google.co.uk/citations?user=iStd81MAAAAJ&hl=en", "KeyWords": "Lingüística aplicada, CLIL, análisis del discurso", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=iStd81MAAAAJ&hl=en", "Citations": "1192", "Affiliation": "Universidad Complutense de Madrid", "x1": 0.4943620975893415, "y1": 0.10037253884328526, "x2": 0.528336841897714, "y2": -0.012705072145362865, "x3": 0.531851514359042, "y3": 0.09080121049918939, "x4": 0.5261146742988736, "y4": 0.19357689391314845, "x5": 0.5248148196319539, "y5": 0.3173541153359596}, {"x0": 0.10991759014160953, "y0": -0.2281014018966375, "grouping1": 0, "grouping2": 1, "grouping3": 1, "grouping4": 3, "grouping5": 4, "grouping6": 5, "Author": "C William R Webster", "URL": "https://scholar.google.co.uk/citations?user=mdypkb4AAAAJ&hl=en", "KeyWords": "", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=mdypkb4AAAAJ&hl=en", "Citations": "783", "Affiliation": "University of Stirling", "x1": 0.16095989594344987, "y1": 0.37901368214474995, "x2": 0.2884817625582965, "y2": 0.3114317753369134, "x3": 0.3068535889551522, "y3": -0.013969846736338332, "x4": 0.3367939619132014, "y4": 0.043501983620975224, "x5": 0.3539276820827101, "y5": 0.19732207833477328}, {"x0": -0.007393724115539517, "y0": 0.04620196667769554, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 3, "grouping6": 3, "Author": "Péter Cserne", "URL": "https://scholar.google.com/citations?user=qlvq1lwAAAAJ&hl=en", "KeyWords": "law and economics, legal epistemology, private law theory, history of legal and political thought", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=qlvq1lwAAAAJ&hl=en", "Citations": "205", "Affiliation": "University of Aberdeen", "x1": -0.23418530400943274, "y1": -0.25647984211126473, "x2": -0.3069893784576121, "y2": -0.06130664010509266, "x3": -0.3510023934094524, "y3": 0.18266425939297096, "x4": -0.3571345957612747, "y4": 0.21677276448593674, "x5": -0.3702137123597185, "y5": 0.29921849606223216}, {"x0": -0.3234665653696166, "y0": -0.3282048499461773, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 0, "Author": "Dr Mo Egan", "URL": "https://scholar.google.co.uk/citations?user=6o0j57EAAAAJ&hl=en", "KeyWords": "Law, Policing", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=6o0j57EAAAAJ&hl=en", "Citations": "10", "Affiliation": "Unknown affiliation", "x1": 0.38068575914527786, "y1": 0.08873956060781263, "x2": 0.3386077299087675, "y2": 0.032937878632633595, "x3": 0.2972761772140991, "y3": 0.2069500253831723, "x4": 0.2461714393236029, "y4": 0.2647071172104438, "x5": 0.2137404482262379, "y5": 0.3756202089058495}, {"x0": 0.4918794610113888, "y0": -0.0455447401484839, "grouping1": 0, "grouping2": 1, "grouping3": 1, "grouping4": 0, "grouping5": 0, "grouping6": 1, "Author": "Lilian Edwards", "URL": "https://scholar.google.com/citations?user=a6-onLoAAAAJ&hl=en", "KeyWords": "Internet law, IT law, e-commerce, privacy", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=a6-onLoAAAAJ&hl=en", "Citations": "2112", "Affiliation": "Newcastle Law School", "x1": -0.3916256846325246, "y1": 0.19515899070246442, "x2": -0.33832777213273174, "y2": 0.2517450429832296, "x3": -0.30367361679825694, "y3": 0.11357251332415645, "x4": -0.29040248452283607, "y4": 0.15333166658813133, "x5": -0.29475489364745133, "y5": 0.23501109658028246}, {"x0": 0.17673480568930416, "y0": -0.2757487357140957, "grouping1": 0, "grouping2": 1, "grouping3": 1, "grouping4": 3, "grouping5": 4, "grouping6": 5, "Author": "Matthew Jewell", "URL": "https://scholar.google.co.uk/citations?user=OkUv-F4AAAAJ&hl=en", "KeyWords": "Law, Legal Theory, HCI, Ubicomp, Smart Technologies", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=OkUv-F4AAAAJ&hl=en", "Citations": "7", "Affiliation": "PhD Candidate, Edinburgh Law School", "x1": -0.08505611259314105, "y1": 0.437272932867361, "x2": -0.009046964213709834, "y2": 0.376095951161398, "x3": 0.0038004093558179353, "y3": 0.06935809801828408, "x4": 0.01718180627161634, "y4": 0.15598616682250016, "x5": -0.02817764591241386, "y5": 0.27458238761638426}, {"x0": -0.28770788037490624, "y0": -0.1821407422247389, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 1, "grouping6": 0, "Author": "Dominik Ziegler", "URL": "https://scholar.google.co.uk/citations?user=9L-xODcAAAAJ&hl=en", "KeyWords": "Scanning Probe Microscopy, Kelvin Probe Force Microscopy, Nanofabrication, Encased Cantilevers, BioMEMS", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=https://scholar.google.co.uk/citations?user=9L-xODcAAAAJ&hl=en", "Citations": "2672", "Affiliation": "CTO Nanosurf, Scuba Probe Technologies, Lawrence Berkeley National Laboratory", "x1": 0.505664870985126, "y1": 0.17991360666664155, "x2": 0.5464030737405572, "y2": 0.07705832157676847, "x3": 0.5323742647607904, "y3": 0.1586735652473038, "x4": 0.5380261918244422, "y4": 0.23279105640638706, "x5": 0.5123389967891921, "y5": 0.31051771915921156}, {"x0": -0.15226144055333585, "y0": 0.033733059932410055, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 3, "grouping6": 4, "Author": "Gianluca Andresani", "URL": "https://scholar.google.com/citations?user=poIiHR0AAAAJ&hl=en", "KeyWords": "Legal Philosophy, Political Philosophy, Social Epistemology, Constitutional Theory, Intellectual Property, IT Law & Regulatio", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=poIiHR0AAAAJ&hl=en", "Citations": "1044", "Affiliation": "Aberdeen University", "x1": -0.05139803843825673, "y1": -0.17696415992983613, "x2": -0.08326385369269416, "y2": -0.2211725028282507, "x3": -0.1165280408845185, "y3": -0.11286118676492707, "x4": -0.12890677117438137, "y4": -0.09515005070421922, "x5": -0.10592391634284709, "y5": 0.008242478205887}, {"x0": 0.45847540044034263, "y0": 0.0069359990670203354, "grouping1": 0, "grouping2": 1, "grouping3": 1, "grouping4": 0, "grouping5": 0, "grouping6": 1, "Author": "Burkhard Schafer", "URL": "https://scholar.google.com/citations?user=vD2DRqoAAAAJ&hl=en", "KeyWords": "Jurisprudence, legal theory, comparative law, IT law", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=vD2DRqoAAAAJ&hl=en", "Citations": "1219", "Affiliation": "Professor of Computational Legal Theory, University of Edinburgh", "x1": -0.4003703977050383, "y1": -0.06204590873328112, "x2": -0.3902110180656548, "y2": 0.06965344009207557, "x3": -0.38851895266738923, "y3": 0.1312600074550317, "x4": -0.3793983377847419, "y4": 0.18406568868122825, "x5": -0.3930650201535913, "y5": 0.2808334470548306}, {"x0": -0.17576408541429203, "y0": -0.08596985539394726, "grouping1": 0, "grouping2": 0, "grouping3": 0, "grouping4": 1, "grouping5": 3, "grouping6": 4, "Author": "Paolo Cavaliere", "URL": "https://scholar.google.com/citations?user=HOYJ86sAAAAJ&hl=en", "KeyWords": "Freedom of Expression, Media Law", "PictureURL": "https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=HOYJ86sAAAAJ&hl=en", "Citations": "14", "Affiliation": "University of Edinburgh Law School", "x1": 0.14764439378329383, "y1": -0.05912377709933101, "x2": 0.05924901438032328, "y2": -0.03842709440223296, "x3": 0.03222756961893658, "y3": 0.2176338041229178, "x4": -0.015638584943294075, "y4": 0.2758716599475154, "x5": -0.022986984797618085, "y5": 0.4038671628894508}];

    var citedRankData = {"intellectual property": {3: [{"rank": 0}, {"rank": 3}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "legal theory": {3: [{"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 3}, {"rank": 0}, {"rank": -1}]}, "law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "it law": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "data protection": {3: [{"rank": 4}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "ubiquitous computing": {3: [{"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "ubicomp": {3: [{"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "the law of international peace and security": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "technology law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "social epistemology": {3: [{"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 3}, {"rank": 2}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}]}, "smart technologies": {3: [{"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "shadow banking": {3: [{"rank": 1}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "scanning probe microscopy": {3: [{"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "regulation theory": {3: [{"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": 1}, {"rank": -1}]}, "public policy": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 0}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}]}, "public law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "public international law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 2}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "public health and biotechnologies law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 0}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}]}, "private law theory": {3: [{"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "private international law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "privacy law": {3: [{"rank": 1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "privacy and data protection": {3: [{"rank": 1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "privacy": {3: [{"rank": 1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "political philosophy": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 2}]}, "policing": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 2}]}, "platform economy": {3: [{"rank": 2}, {"rank": 0}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}]}, "negotiation": {3: [{"rank": 2}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "nanofabrication": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "methodology": {3: [{"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 4}, {"rank": -1}]}, "media law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 0}]}, "lingüística aplicada": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "legal philosophy": {3: [{"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": 2}, {"rank": -1}]}, "legal epistemology": {3: [{"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}, {"rank": 2}, {"rank": -1}]}, "legal design": {3: [{"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "law and economics": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "kelvin probe force microscopy": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "jurisprudence": {3: [{"rank": 4}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "it law & regulatio": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "iot": {3: [{"rank": 0}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "internet law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}]}, "international trade law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "international h": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 3}, {"rank": 0}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "international economic law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "international cyber security law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "human computer interaction": {3: [{"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}]}, "history of legal and political thought": {3: [{"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": 1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "hci": {3: [{"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "general public international law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 2}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "freedom of expression": {3: [{"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 0}]}, "food law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}]}, "fintech": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "encased cantilevers": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "disability": {3: [{"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "developing nations": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "cybersecurity": {3: [{"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "cryptoassets": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "creative industries": {3: [{"rank": 2}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "copyright and information law": {3: [{"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}]}, "constitutional theory": {3: [{"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": -1}]}, "comparative law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "commercial arbitration": {3: [{"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 0}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "clil": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "blockchain": {3: [{"rank": 0}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "biometrics": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "biomems": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "biobank and ehealth law": {3: [{"rank": 1}, {"rank": 0}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "artificial intelligence": {3: [{"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "análisis del discurso": {3: [{"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}]}, "ai": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}};

    var recentRankData = {"intellectual property": {3: [{"rank": 0}, {"rank": 3}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "legal theory": {3: [{"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 3}, {"rank": 0}, {"rank": -1}]}, "law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "it law": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "data protection": {3: [{"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}]}, "": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "ubiquitous computing": {3: [{"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "ubicomp": {3: [{"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "the law of international peace and security": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "technology law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "social epistemology": {3: [{"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 2}, {"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}]}, "smart technologies": {3: [{"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "shadow banking": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "scanning probe microscopy": {3: [{"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 1}, {"rank": -1}]}, "regulation theory": {3: [{"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": 1}, {"rank": -1}]}, "public policy": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": 0}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}]}, "public law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "public international law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 2}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "public health and biotechnologies law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 0}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}]}, "private law theory": {3: [{"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "private international law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "privacy law": {3: [{"rank": 1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "privacy and data protection": {3: [{"rank": 1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "privacy": {3: [{"rank": 1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "political philosophy": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": 4}, {"rank": 2}]}, "policing": {3: [{"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}]}, "platform economy": {3: [{"rank": 3}, {"rank": 0}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 1}]}, "negotiation": {3: [{"rank": 1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "nanofabrication": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "methodology": {3: [{"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}]}, "media law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 0}]}, "lingüística aplicada": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "legal philosophy": {3: [{"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": 2}, {"rank": -1}]}, "legal epistemology": {3: [{"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}, {"rank": 2}, {"rank": -1}]}, "legal design": {3: [{"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "law and economics": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "kelvin probe force microscopy": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 0}, {"rank": 3}, {"rank": -1}, {"rank": -1}]}, "jurisprudence": {3: [{"rank": 4}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "it law & regulatio": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "iot": {3: [{"rank": 0}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "internet law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}]}, "international trade law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "international h": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 3}, {"rank": 0}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}]}, "international economic law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "international cyber security law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "human computer interaction": {3: [{"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}]}, "history of legal and political thought": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "hci": {3: [{"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "general public international law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 2}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}]}, "freedom of expression": {3: [{"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 0}]}, "food law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}]}, "fintech": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "encased cantilevers": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "disability": {3: [{"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "developing nations": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "cybersecurity": {3: [{"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "cryptoassets": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "creative industries": {3: [{"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "copyright and information law": {3: [{"rank": 3}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}]}, "constitutional theory": {3: [{"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": 0}, {"rank": 1}, {"rank": -1}]}, "comparative law": {3: [{"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}]}, "commercial arbitration": {3: [{"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": 0}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "clil": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "blockchain": {3: [{"rank": 0}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}, {"rank": -1}]}, "biometrics": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "biomems": {3: [{"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "biobank and ehealth law": {3: [{"rank": 1}, {"rank": 0}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}, "artificial intelligence": {3: [{"rank": 1}, {"rank": -1}, {"rank": -1}, {"rank": 3}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 2}, {"rank": -1}]}, "análisis del discurso": {3: [{"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 0}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": 1}]}, "ai": {3: [{"rank": 0}, {"rank": 1}, {"rank": 2}, {"rank": 3}, {"rank": 4}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}, {"rank": -1}]}};

    var citedClusters = [{"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 0, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 2, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 0, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 2, "grouping5,2": 2, "grouping5,3": 0, "grouping5,4": 0, "grouping5,5": 0, "grouping6,1": 0, "grouping6,2": 2, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 3}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 0, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 2, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 0, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 2, "grouping5,2": 2, "grouping5,3": 0, "grouping5,4": 0, "grouping5,5": 0, "grouping6,1": 0, "grouping6,2": 2, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 2}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 1, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 3, "grouping5,2": 3, "grouping5,3": 3, "grouping5,4": 3, "grouping5,5": 0, "grouping6,1": 3, "grouping6,2": 3, "grouping6,3": 0, "grouping6,4": 0, "grouping6,5": 3}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 1, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 3, "grouping5,2": 3, "grouping5,3": 3, "grouping5,4": 3, "grouping5,5": 0, "grouping6,1": 3, "grouping6,2": 3, "grouping6,3": 0, "grouping6,4": 0, "grouping6,5": 3}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 0, "grouping2,3": 1, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 1, "grouping3,5": 1, "grouping4,1": 2, "grouping4,2": 2, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 2, "grouping5,1": 0, "grouping5,2": 1, "grouping5,3": 1, "grouping5,4": 1, "grouping5,5": 3, "grouping6,1": 4, "grouping6,2": 4, "grouping6,3": 4, "grouping6,4": 1, "grouping6,5": 1}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 0, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 1, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 3, "grouping4,2": 1, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 4, "grouping5,2": 0, "grouping5,3": 2, "grouping5,4": 2, "grouping5,5": 2, "grouping6,1": 5, "grouping6,2": 5, "grouping6,3": 5, "grouping6,4": 5, "grouping6,5": 5}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 2, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 1, "grouping5,2": 4, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 1, "grouping6,2": 1, "grouping6,3": 1, "grouping6,4": 4, "grouping6,5": 4}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 1, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 3, "grouping5,2": 3, "grouping5,3": 3, "grouping5,4": 0, "grouping5,5": 0, "grouping6,1": 3, "grouping6,2": 3, "grouping6,3": 0, "grouping6,4": 0, "grouping6,5": 3}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 0, "grouping3,1": 2, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 1, "grouping5,2": 4, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 1, "grouping6,2": 1, "grouping6,3": 1, "grouping6,4": 4, "grouping6,5": 4}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 0, "grouping3,3": 1, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 2, "grouping4,2": 1, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 0, "grouping5,2": 0, "grouping5,3": 2, "grouping5,4": 2, "grouping5,5": 2, "grouping6,1": 4, "grouping6,2": 5, "grouping6,3": 5, "grouping6,4": 5, "grouping6,5": 5}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 1, "grouping3,5": 1, "grouping4,1": 2, "grouping4,2": 2, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 2, "grouping5,1": 0, "grouping5,2": 1, "grouping5,3": 1, "grouping5,4": 1, "grouping5,5": 1, "grouping6,1": 2, "grouping6,2": 0, "grouping6,3": 3, "grouping6,4": 3, "grouping6,5": 0}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 1, "grouping3,5": 1, "grouping4,1": 2, "grouping4,2": 3, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 2, "grouping5,1": 4, "grouping5,2": 1, "grouping5,3": 1, "grouping5,4": 1, "grouping5,5": 3, "grouping6,1": 5, "grouping6,2": 4, "grouping6,3": 4, "grouping6,4": 1, "grouping6,5": 1}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 2, "grouping5,2": 4, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 1, "grouping6,2": 1, "grouping6,3": 1, "grouping6,4": 4, "grouping6,5": 4}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 2, "grouping4,2": 3, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 0, "grouping5,2": 1, "grouping5,3": 2, "grouping5,4": 2, "grouping5,5": 2, "grouping6,1": 4, "grouping6,2": 4, "grouping6,3": 4, "grouping6,4": 5, "grouping6,5": 5}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 2, "grouping5,2": 4, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 0, "grouping6,2": 1, "grouping6,3": 1, "grouping6,4": 4, "grouping6,5": 4}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 0, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 1, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 3, "grouping4,2": 1, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 4, "grouping5,2": 0, "grouping5,3": 2, "grouping5,4": 2, "grouping5,5": 2, "grouping6,1": 5, "grouping6,2": 5, "grouping6,3": 5, "grouping6,4": 5, "grouping6,5": 5}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 1, "grouping3,5": 1, "grouping4,1": 2, "grouping4,2": 2, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 2, "grouping5,1": 0, "grouping5,2": 1, "grouping5,3": 1, "grouping5,4": 1, "grouping5,5": 1, "grouping6,1": 2, "grouping6,2": 0, "grouping6,3": 3, "grouping6,4": 3, "grouping6,5": 0}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 0, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 0, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 1, "grouping5,2": 2, "grouping5,3": 0, "grouping5,4": 0, "grouping5,5": 0, "grouping6,1": 1, "grouping6,2": 2, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 2}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 2, "grouping5,2": 4, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 0, "grouping6,2": 1, "grouping6,3": 1, "grouping6,4": 4, "grouping6,5": 4}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 2, "grouping4,2": 1, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 0, "grouping5,2": 0, "grouping5,3": 2, "grouping5,4": 2, "grouping5,5": 2, "grouping6,1": 4, "grouping6,2": 2, "grouping6,3": 5, "grouping6,4": 5, "grouping6,5": 5}];

    var recentClusters = [{"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 3, "grouping4,2": 3, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 2, "grouping5,2": 2, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 2, "grouping6,2": 2, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 2}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 3, "grouping4,2": 3, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 2, "grouping5,2": 2, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 2, "grouping6,2": 2, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 2}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 3, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 1, "grouping5,2": 3, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 1, "grouping6,2": 2, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 2}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 1, "grouping5,2": 3, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 5, "grouping6,2": 2, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 2}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 1, "grouping3,5": 1, "grouping4,1": 2, "grouping4,2": 2, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 2, "grouping5,1": 0, "grouping5,2": 0, "grouping5,3": 0, "grouping5,4": 1, "grouping5,5": 0, "grouping6,1": 3, "grouping6,2": 0, "grouping6,3": 0, "grouping6,4": 0, "grouping6,5": 0}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 0, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 1, "grouping4,2": 3, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 3, "grouping5,2": 2, "grouping5,3": 2, "grouping5,4": 2, "grouping5,5": 1, "grouping6,1": 4, "grouping6,2": 1, "grouping6,3": 1, "grouping6,4": 1, "grouping6,5": 1}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 0, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 1, "grouping5,2": 1, "grouping5,3": 1, "grouping5,4": 3, "grouping5,5": 3, "grouping6,1": 5, "grouping6,2": 5, "grouping6,3": 5, "grouping6,4": 4, "grouping6,5": 4}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 3, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 1, "grouping5,2": 4, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 5, "grouping6,2": 1, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 2}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 0, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 1, "grouping5,2": 1, "grouping5,3": 1, "grouping5,4": 3, "grouping5,5": 3, "grouping6,1": 5, "grouping6,2": 5, "grouping6,3": 5, "grouping6,4": 4, "grouping6,5": 4}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 4, "grouping5,2": 4, "grouping5,3": 1, "grouping5,4": 2, "grouping5,5": 1, "grouping6,1": 1, "grouping6,2": 5, "grouping6,3": 5, "grouping6,4": 3, "grouping6,5": 1}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 1, "grouping3,5": 1, "grouping4,1": 2, "grouping4,2": 2, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 2, "grouping5,1": 0, "grouping5,2": 0, "grouping5,3": 0, "grouping5,4": 0, "grouping5,5": 0, "grouping6,1": 3, "grouping6,2": 3, "grouping6,3": 3, "grouping6,4": 5, "grouping6,5": 5}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 1, "grouping3,5": 1, "grouping4,1": 1, "grouping4,2": 2, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 2, "grouping5,1": 0, "grouping5,2": 0, "grouping5,3": 0, "grouping5,4": 1, "grouping5,5": 0, "grouping6,1": 0, "grouping6,2": 0, "grouping6,3": 0, "grouping6,4": 0, "grouping6,5": 0}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 0, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 0, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 1, "grouping5,2": 3, "grouping5,3": 3, "grouping5,4": 3, "grouping5,5": 2, "grouping6,1": 1, "grouping6,2": 4, "grouping6,3": 4, "grouping6,4": 4, "grouping6,5": 3}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 2, "grouping4,2": 2, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 3, "grouping5,1": 0, "grouping5,2": 0, "grouping5,3": 0, "grouping5,4": 2, "grouping5,5": 1, "grouping6,1": 3, "grouping6,2": 3, "grouping6,3": 3, "grouping6,4": 3, "grouping6,5": 1}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 0, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 3, "grouping4,2": 3, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 2, "grouping5,2": 2, "grouping5,3": 3, "grouping5,4": 3, "grouping5,5": 2, "grouping6,1": 2, "grouping6,2": 4, "grouping6,3": 4, "grouping6,4": 4, "grouping6,5": 3}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 0, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 1, "grouping4,2": 3, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 3, "grouping5,2": 2, "grouping5,3": 2, "grouping5,4": 2, "grouping5,5": 1, "grouping6,1": 4, "grouping6,2": 1, "grouping6,3": 1, "grouping6,4": 1, "grouping6,5": 1}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 1, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 1, "grouping3,2": 1, "grouping3,3": 1, "grouping3,4": 1, "grouping3,5": 1, "grouping4,1": 2, "grouping4,2": 2, "grouping4,3": 2, "grouping4,4": 2, "grouping4,5": 2, "grouping5,1": 0, "grouping5,2": 0, "grouping5,3": 0, "grouping5,4": 0, "grouping5,5": 0, "grouping6,1": 3, "grouping6,2": 3, "grouping6,3": 3, "grouping6,4": 5, "grouping6,5": 5}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 1, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 0, "grouping3,5": 0, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 1, "grouping4,4": 1, "grouping4,5": 1, "grouping5,1": 1, "grouping5,2": 3, "grouping5,3": 4, "grouping5,4": 4, "grouping5,5": 4, "grouping6,1": 1, "grouping6,2": 1, "grouping6,3": 2, "grouping6,4": 2, "grouping6,5": 2}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 1, "grouping2,3": 1, "grouping2,4": 1, "grouping2,5": 0, "grouping3,1": 2, "grouping3,2": 2, "grouping3,3": 2, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 3, "grouping4,2": 0, "grouping4,3": 0, "grouping4,4": 0, "grouping4,5": 0, "grouping5,1": 2, "grouping5,2": 3, "grouping5,3": 3, "grouping5,4": 3, "grouping5,5": 2, "grouping6,1": 2, "grouping6,2": 4, "grouping6,3": 4, "grouping6,4": 4, "grouping6,5": 3}, {"grouping1,1": 0, "grouping1,2": 0, "grouping1,3": 0, "grouping1,4": 0, "grouping1,5": 0, "grouping2,1": 0, "grouping2,2": 0, "grouping2,3": 0, "grouping2,4": 0, "grouping2,5": 0, "grouping3,1": 0, "grouping3,2": 0, "grouping3,3": 0, "grouping3,4": 2, "grouping3,5": 2, "grouping4,1": 0, "grouping4,2": 1, "grouping4,3": 3, "grouping4,4": 3, "grouping4,5": 3, "grouping5,1": 4, "grouping5,2": 4, "grouping5,3": 2, "grouping5,4": 2, "grouping5,5": 1, "grouping6,1": 1, "grouping6,2": 1, "grouping6,3": 1, "grouping6,4": 1, "grouping6,5": 1}];

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const queryKeywordEmphasis = writable(3);
    const visKeywordEmphasis = writable(3);
    const visNumClusters = writable(5);
    const displayNames = writable(false);
    const datasetChoice = writable("Most Cited Publications");
    const selectedResearchInterest = writable("");
    const displayDistributions = writable(false);
    // const selectedDataset = writable("ML_MOST_CITED");

    const selectedResearcherInfo = writable({
      name: "",
      affiliation: "",
      scholarKeywords: ["","","","",""],
      citations: "",
      url: "",
      pictureURL: "https://scholar.google.com/citations/images/avatar_scholar_256.png"
    });

    /* src/components/PeopleMapView.svelte generated by Svelte v3.20.1 */

    const file = "src/components/PeopleMapView.svelte";

    function create_fragment(ctx) {
    	let div;
    	let t0;
    	let nav;
    	let input0;
    	let t1;
    	let label0;
    	let t2;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let input1;
    	let t7;
    	let input2;
    	let t8;
    	let label1;
    	let t9;
    	let p2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			nav = element("nav");
    			input0 = element("input");
    			t1 = space();
    			label0 = element("label");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Show All Names";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "#Clusters";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			label1 = element("label");
    			t9 = space();
    			p2 = element("p");
    			p2.textContent = "Show Distributions";
    			attr_dev(div, "id", "PeopleMap");
    			set_style(div, "width", "100%");
    			set_style(div, "height", "100%");
    			set_style(div, "background", "#FFFFFF");
    			add_location(div, file, 0, 0, 0);
    			attr_dev(input0, "id", "ShowNamesSwitch");
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "name", "ShowNamesSwitch");
    			attr_dev(input0, "class", "switch is-small is-rounded");
    			set_style(input0, "padding-top", "0px");
    			set_style(input0, "color", "purple");
    			set_style(input0, "min-width", "200px");
    			add_location(input0, file, 1239, 2, 39392);
    			attr_dev(label0, "for", "ShowNamesSwitch");
    			attr_dev(label0, "class", "svelte-46fghu");
    			add_location(label0, file, 1241, 2, 39602);
    			attr_dev(p0, "class", "text is-black");
    			set_style(p0, "width", "105%");
    			set_style(p0, "padding-top", "14px");
    			set_style(p0, "min-width", "140px");
    			add_location(p0, file, 1242, 2, 39643);
    			attr_dev(p1, "class", "text is-black");
    			set_style(p1, "padding-top", "14px");
    			add_location(p1, file, 1244, 2, 39748);
    			attr_dev(input1, "id", "sliderWithValue");
    			attr_dev(input1, "class", "slider has-output svelte-1v4uv99 is-circle is-purple");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "6");
    			attr_dev(input1, "step", "1");
    			attr_dev(input1, "type", "range");
    			set_style(input1, "margin-top", "0px");
    			set_style(input1, "outline", "none");
    			set_style(input1, "border-top-width", "0px");
    			set_style(input1, "border-right-width", "0px");
    			set_style(input1, "border-left-width", "0px");
    			set_style(input1, "border-bottom-width", "0px");
    			set_style(input1, "width", "150px");
    			set_style(input1, "padding-top", "37px");
    			set_style(input1, "fill", "#652DC1");
    			set_style(input1, "padding-right", "25px");
    			add_location(input1, file, 1245, 2, 39816);
    			attr_dev(input2, "id", "ShowGradientsSwitch");
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "name", "ShowGradientsSwitch");
    			attr_dev(input2, "class", "switch is-small is-rounded");
    			set_style(input2, "padding-top", "0px");
    			add_location(input2, file, 1247, 2, 40177);
    			attr_dev(label1, "for", "ShowGradientsSwitch");
    			attr_dev(label1, "class", "svelte-46fghu");
    			add_location(label1, file, 1249, 2, 40369);
    			attr_dev(p2, "class", "text is-black");
    			set_style(p2, "padding-top", "14px");
    			set_style(p2, "width", "20%");
    			set_style(p2, "min-width", "150px");
    			add_location(p2, file, 1250, 2, 40414);
    			attr_dev(nav, "class", "level is-mobile");
    			set_style(nav, "padding-top", "0px");
    			set_style(nav, "margin-top", "0px");
    			set_style(nav, "padding-bottom", "15px");
    			set_style(nav, "padding-left", "15px");
    			set_style(nav, "height", "30px");
    			set_style(nav, "min-width", "1340");
    			add_location(nav, file, 1238, 0, 39244);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, input0);
    			input0.checked = /*$displayNames*/ ctx[0];
    			append_dev(nav, t1);
    			append_dev(nav, label0);
    			append_dev(nav, t2);
    			append_dev(nav, p0);
    			append_dev(nav, t4);
    			append_dev(nav, p1);
    			append_dev(nav, t6);
    			append_dev(nav, input1);
    			set_input_value(input1, /*$visNumClusters*/ ctx[1]);
    			append_dev(nav, t7);
    			append_dev(nav, input2);
    			input2.checked = /*$displayDistributions*/ ctx[2];
    			append_dev(nav, t8);
    			append_dev(nav, label1);
    			append_dev(nav, t9);
    			append_dev(nav, p2);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "change", /*input0_change_handler*/ ctx[16]),
    				listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[17]),
    				listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[17]),
    				listen_dev(input2, "change", /*input2_change_handler*/ ctx[18])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$displayNames*/ 1) {
    				input0.checked = /*$displayNames*/ ctx[0];
    			}

    			if (dirty & /*$visNumClusters*/ 2) {
    				set_input_value(input1, /*$visNumClusters*/ ctx[1]);
    			}

    			if (dirty & /*$displayDistributions*/ 4) {
    				input2.checked = /*$displayDistributions*/ ctx[2];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
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
    	let $selectedResearchInterest;
    	let $displayNames;
    	let $visNumClusters;
    	let $visKeywordEmphasis;
    	let $displayDistributions;
    	let $queryKeywordEmphasis;
    	validate_store(selectedResearchInterest, "selectedResearchInterest");
    	component_subscribe($$self, selectedResearchInterest, $$value => $$invalidate(9, $selectedResearchInterest = $$value));
    	validate_store(displayNames, "displayNames");
    	component_subscribe($$self, displayNames, $$value => $$invalidate(0, $displayNames = $$value));
    	validate_store(visNumClusters, "visNumClusters");
    	component_subscribe($$self, visNumClusters, $$value => $$invalidate(1, $visNumClusters = $$value));
    	validate_store(visKeywordEmphasis, "visKeywordEmphasis");
    	component_subscribe($$self, visKeywordEmphasis, $$value => $$invalidate(10, $visKeywordEmphasis = $$value));
    	validate_store(displayDistributions, "displayDistributions");
    	component_subscribe($$self, displayDistributions, $$value => $$invalidate(2, $displayDistributions = $$value));
    	validate_store(queryKeywordEmphasis, "queryKeywordEmphasis");
    	component_subscribe($$self, queryKeywordEmphasis, $$value => $$invalidate(11, $queryKeywordEmphasis = $$value));

    	for (var i = 0; i < citedClusters.length; i++) {
    		citedCoordinates[i]["grouping1,0"] = citedCoordinates[i]["grouping1"];
    		citedCoordinates[i]["grouping2,0"] = citedCoordinates[i]["grouping2"];
    		citedCoordinates[i]["grouping3,0"] = citedCoordinates[i]["grouping3"];
    		citedCoordinates[i]["grouping4,0"] = citedCoordinates[i]["grouping4"];
    		citedCoordinates[i]["grouping5,0"] = citedCoordinates[i]["grouping5"];
    		citedCoordinates[i]["grouping6,0"] = citedCoordinates[i]["grouping6"];

    		for (var k = 1; k <= 10; k++) {
    			citedCoordinates[i]["grouping1," + k] = citedClusters[i]["grouping1," + k];
    			citedCoordinates[i]["grouping2," + k] = citedClusters[i]["grouping2," + k];
    			citedCoordinates[i]["grouping3," + k] = citedClusters[i]["grouping3," + k];
    			citedCoordinates[i]["grouping4," + k] = citedClusters[i]["grouping4," + k];
    			citedCoordinates[i]["grouping5," + k] = citedClusters[i]["grouping5," + k];
    			citedCoordinates[i]["grouping6," + k] = citedClusters[i]["grouping6," + k];
    		}
    	}

    	// Merge the data between recentCoordinates and recentClusters
    	for (var i = 0; i < recentClusters.length; i++) {
    		recentCoordinates[i]["grouping1,0"] = recentCoordinates[i]["grouping1"];
    		recentCoordinates[i]["grouping2,0"] = recentCoordinates[i]["grouping2"];
    		recentCoordinates[i]["grouping3,0"] = recentCoordinates[i]["grouping3"];
    		recentCoordinates[i]["grouping4,0"] = recentCoordinates[i]["grouping4"];
    		recentCoordinates[i]["grouping5,0"] = recentCoordinates[i]["grouping5"];
    		recentCoordinates[i]["grouping6,0"] = recentCoordinates[i]["grouping6"];

    		for (var k = 1; k <= 10; k++) {
    			recentCoordinates[i]["grouping1," + k] = recentClusters[i]["grouping1," + k];
    			recentCoordinates[i]["grouping2," + k] = recentClusters[i]["grouping2," + k];
    			recentCoordinates[i]["grouping3," + k] = recentClusters[i]["grouping3," + k];
    			recentCoordinates[i]["grouping4," + k] = recentClusters[i]["grouping4," + k];
    			recentCoordinates[i]["grouping5," + k] = recentClusters[i]["grouping5," + k];
    			recentCoordinates[i]["grouping6," + k] = recentClusters[i]["grouping6," + k];
    		}
    	}

    	var currTimeout = null;
    	var currentSelectedFaculty = citedCoordinates;
    	var currentSelectedFacultyRankData = citedRankData;
    	let hideAllTextTimeout = null;
    	let hideTextAnimating = false;
    	onMount(renderGraph);

    	// Hide all names when user hovers over the white space
    	const hideNames = (duration = 300) => {
    		if (!hideTextAnimating) {
    			hideTextAnimating = true;

    			d3.select("#PeopleMap").select("svg").selectAll("text.name-text").transition("hideText").duration(duration).ease(d3.easeCubicInOut).style("opacity", 0).on("end", () => {
    				hideTextAnimating = false;
    			});
    		}

    		// Refresh the timeout
    		clearTimeout(hideAllTextTimeout);

    		hideAllTextTimeout = setTimeout(showNames, 300);
    	};

    	// Show name if the mouse doesnt move for a certain time
    	const showNames = (duration = 300) => {
    		d3.select("#PeopleMap").select("svg").selectAll("text.name-text").transition("showText").duration(duration).ease(d3.easeCubicInOut).style("opacity", 1);
    	};

    	function renderGraph() {
    		var chartDiv = document.getElementById("PeopleMap");
    		var width = chartDiv.clientWidth;
    		var height = chartDiv.clientHeight;

    		// Calculate emphasis range
    		var countEmphasis = 0;

    		while (currentSelectedFaculty[0]["x" + countEmphasis] != null) {
    			countEmphasis += 1;
    		}

    		countEmphasis = countEmphasis - 1;

    		// append the svg object to the body of the page
    		var svg = d3.select("#PeopleMap").append("svg").attr("width", width).attr("height", height).append("g");

    		// Rectangle for registering clicks on the map
    		svg.append("rect").attr("width", width).attr("height", height).attr("opacity", "0%").on("click", function (d) {
    			legendRect.transition().duration(1000).attr("opacity", "0%");
    			topTag.transition().duration(1000).attr("opacity", "0%");
    			bottomTag.transition().duration(1000).attr("opacity", "0%");

    			if ($selectedResearchInterest != "") {
    				set_store_value(selectedResearchInterest, $selectedResearchInterest = "");
    			}

    			handleClick(currentlyClicked);
    		}).on("mousemove", () => {
    			
    		});

    		// Set domain of the xAxis
    		var x = d3.scaleLinear().range([80, width - 150]);

    		x.domain([
    			d3.min(currentSelectedFaculty, function (d) {
    				var min = d.x0;

    				for (var i = 0; i <= countEmphasis; i++) {
    					if (d["x" + i] < min) {
    						min = d["x" + i];
    					}
    				}

    				return min;
    			}),
    			d3.max(currentSelectedFaculty, function (d) {
    				var max = d.x0;

    				for (var i = 0; i <= countEmphasis; i++) {
    					if (d["x" + i] > max) {
    						max = d["x" + i];
    					}
    				}

    				return max;
    			})
    		]);

    		// Append xAxis
    		var xAxis = svg.append("g").attr("transform", "translate(0," + height + ")");

    		// Set domain of yAxis
    		var y = d3.scaleLinear().range([height - 60, 20]);

    		y.domain([
    			d3.min(currentSelectedFaculty, function (d) {
    				var min = d.y0;

    				for (var i = 0; i <= countEmphasis; i++) {
    					if (d["y" + i] < min) {
    						min = d["y" + i];
    					}
    				}

    				return min;
    			}),
    			d3.max(currentSelectedFaculty, function (d) {
    				var max = d.y0;

    				for (var i = 0; i <= countEmphasis; i++) {
    					if (d["y" + i] > max) {
    						max = d["y" + i];
    					}
    				}

    				return max;
    			})
    		]);

    		// Append yAxis
    		var yAxis = svg.append("g");

    		// Red, Orange, Yellow, Green, Turqoise, Blue
    		var colors = ["#eb3b5a", "#fa8231", "#f7b731", "#20bf6b", "#2d98da", "#8854d0"];

    		// 7 shade gradient of purple, starting with most dark and growing lighter after that
    		var purpleGradient = [
    			"#3f007d",
    			"#54278f",
    			"#6a51a3",
    			"#807dba",
    			"#9e9ac8",
    			"#bcbddc",
    			"#dadaeb",
    			"#efedf5",
    			"#fcfbfd"
    		];

    		// Filter out data with the selection
    		var dataFilter = currentSelectedFaculty.map(function (d) {
    			return {
    				xCoordinate: d["x3"],
    				yCoordinate: d["y3"],
    				Author: d.Author,
    				Group: d.grouping6,
    				Affiliation: d.Affiliation,
    				KeyWords: d.KeyWords,
    				Citations: d.Citations,
    				URL: d.URL,
    				PictureURL: d.PictureURL
    			};
    		});

    		var totalAuthors = {};

    		for (var i = 0; i < dataFilter.length; i++) {
    			totalAuthors[dataFilter[i].Author] = true;
    		}

    		// Currently click author
    		var currentlyClicked = "";

    		// Assign researcher detail view to display the first datapoint data
    		var keywordTokens = dataFilter[0].KeyWords.split(", ");

    		var finalTokens = ["", "", "", "", ""];

    		for (var i = 0; i < keywordTokens.length; i++) {
    			finalTokens[i] = keywordTokens[i];
    		}

    		var updatedResearcherSelection = {
    			name: dataFilter[0].Author,
    			affiliation: dataFilter[0].Affiliation,
    			scholarKeywords: finalTokens,
    			citations: dataFilter[0].Citations,
    			url: dataFilter[0].URL,
    			pictureURL: dataFilter[0].PictureURL
    		};

    		selectedResearcherInfo.set(updatedResearcherSelection);

    		//Isolates the clusters of researchers for ellipse computation
    		function splitResearchers(filteredData, groupingNumber) {
    			var arrayOfClusteredResearchers = [];
    			var total = 0;
    			var currentGroup = 0;
    			var currentSet = [];

    			while (total < filteredData.length) {
    				currentSet = filteredData.filter(function (d) {
    					if (d.Group == currentGroup) {
    						return d;
    					}
    				});

    				arrayOfClusteredResearchers[currentGroup] = currentSet;
    				total += currentSet.length;
    				currentGroup += 1;
    			}

    			return arrayOfClusteredResearchers;
    		}

    		//Separates the researcher groups into arrays of x and y coordinates
    		function generateXAndYCoordinates(splitGroups, keywordsEmphasis) {
    			var totalCoordinates = [];

    			for (var i = 0; i < splitGroups.length; i++) {
    				var currentGroup = [];

    				for (var j = 0; j < splitGroups[i].length; j++) {
    					currentGroup[j] = [splitGroups[i][j].xCoordinate, splitGroups[i][j].yCoordinate];
    				}

    				totalCoordinates[i] = currentGroup;
    			}

    			return totalCoordinates;
    		}

    		//Gets the center among all of the coordinates and the eigenvectors
    		function generateEllipseInfo(coordinateMatrices) {
    			var totalInfo = [];

    			for (var i = 0; i < coordinateMatrices.length; i++) {
    				var centerX = 0;
    				var centerY = 0;
    				var xValues = [];
    				var yValues = [];

    				for (var j = 0; j < coordinateMatrices[i].length; j++) {
    					centerX += coordinateMatrices[i][j][0];
    					centerY += coordinateMatrices[i][j][1];
    					xValues[j] = coordinateMatrices[i][j][0];
    					yValues[j] = coordinateMatrices[i][j][1];
    				}

    				centerX = centerX / coordinateMatrices[i].length;
    				centerY = centerY / coordinateMatrices[i].length;
    				var covarianceMatrix = lib$2(xValues, yValues);
    				var eigenvectors = SingularValueDecomposition.SVD(covarianceMatrix).u;
    				var eigenvalues = SingularValueDecomposition.SVD(covarianceMatrix).q;

    				var currentEllipseData = {
    					CenterX: centerX,
    					CenterY: centerY,
    					Eigenvectors: eigenvectors,
    					Eigenvalues: eigenvalues,
    					Group: i
    				};

    				totalInfo[i] = currentEllipseData;
    			}

    			return totalInfo;
    		}

    		// Process initial info for ellipses
    		var separation = splitResearchers(dataFilter);

    		var completedSet = generateXAndYCoordinates(separation);
    		var ellipseInfo = generateEllipseInfo(completedSet);
    		var currentEllipseInfo = ellipseInfo;

    		// Ellipses representing the Gaussian distribution
    		var outerEllipse = svg.selectAll("outerEllipse").data(ellipseInfo).enter().append("ellipse");

    		outerEllipse.attr("rx", function (d) {
    			return x(d.Eigenvalues[0] / d.Eigenvalues[1]) / 4;
    		}).attr("ry", function (d) {
    			return y(d.Eigenvalues[1]) / 4;
    		}).attr("transform", function (d) {
    			var angle = Math.atan(d.Eigenvectors[0][1] / d.Eigenvectors[0][0]);
    			angle = angle / 3.1415 * 180 + 90;
    			return "translate(" + x(d.CenterX) + "," + y(d.CenterY) + ") rotate(" + angle + ")";
    		}).style("fill", function (d) {
    			return "url(#radial-gradient" + d.Group + ")";
    		}).style("mix-blend-mode", "multiply").attr("opacity", "0%");

    		// Set the jittering width
    		var jitterWidth = 0;

    		// Initialize dots with Zero Keywords and Five Clusters
    		var dot = svg.selectAll("circle").data(dataFilter).enter().append("circle").attr("cx", function (d) {
    			return x(d.xCoordinate) + Math.random() * jitterWidth;
    		}).attr("cy", function (d) {
    			return y(d.yCoordinate) + Math.random() * jitterWidth;
    		}).attr("r", 8).style("fill", function (d) {
    			return colors[d.Group];
    		}).attr("opacity", "70%").on("mousemove", () => {
    			d3.event.stopPropagation();
    		}).on("mouseover", function (dataPoint) {
    			if (currentlyClicked == "") {
    				// Bypass the hide text timeout and show all text
    				showNames(0);

    				var keywordTokens = dataPoint.KeyWords.split(", ");
    				var finalTokens = ["", "", "", "", ""];

    				for (var i = 0; i < keywordTokens.length; i++) {
    					finalTokens[i] = keywordTokens[i];
    				}

    				var updatedResearcherSelection = {
    					name: dataPoint.Author,
    					affiliation: dataPoint.Affiliation,
    					scholarKeywords: finalTokens,
    					citations: dataPoint.Citations,
    					url: dataPoint.URL,
    					pictureURL: dataPoint.PictureURL
    				};

    				selectedResearcherInfo.set(updatedResearcherSelection);

    				text.data(dataFilter).transition().duration(300).text(function (d) {
    					if (d.Author == dataPoint.Author) {
    						return d.Author;
    					} else {
    						return "";
    					}
    				});

    				dot.data(dataFilter).transition().duration(300).attr("opacity", function (d) {
    					if (d.Author == dataPoint.Author) {
    						return "100%";
    					} else {
    						return "20%";
    					}
    				}).attr("r", function (d) {
    					if (d.Author == dataPoint.Author) {
    						return 10;
    					} else {
    						return 8;
    					}
    				});
    			}
    		}).on("mouseout", function (dataPoint) {
    			hideNames(0);

    			text.data(dataFilter).transition().duration(300).text(function (d) {
    				if ($displayNames == true) {
    					return d.Author;
    				} else {
    					return "";
    				}
    			});

    			dot.data(dataFilter).transition().duration(300).attr("opacity", function (d) {
    				if (currentlyClicked != "") {
    					if (currentlyClicked == d.Author) {
    						return "100%";
    					} else {
    						return "20%";
    					}
    				} else {
    					return "70%";
    				}
    			}).attr("r", function (d) {
    				if (currentlyClicked != "") {
    					if (currentlyClicked == d.Author) {
    						return 10;
    					} else {
    						return 8;
    					}
    				} else {
    					return 8;
    				}
    			});
    		}).on("click", function (dataPoint) {
    			handleClick(dataPoint.Author);
    		});

    		var text = svg.selectAll("text").data(dataFilter).enter().append("text").attr("class", "name-text").text(function (d) {
    			return "";
    		}).attr("x", function (d) {
    			return x(d.xCoordinate) + 10 + Math.random() * jitterWidth;
    		}).attr("y", function (d) {
    			return y(d.yCoordinate) + 4 + Math.random() * jitterWidth;
    		}).style("text-shadow", "-1.5px 0 white, 0 1.5px white, 1.5px 0 white, 0 -1.5px white").attr("font_family", "sans-serif").attr("font-size", "11px").attr("fill", "black").style("cursor", "pointer"); // Font type
    		// Font size
    		// Font color

    		// Insert ResearchQuery Legend
    		var legend = svg.append("defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "100%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");

    		legend.append("stop").attr("offset", "0%").attr("stop-color", "#3f007d").attr("stop-opacity", 1);
    		legend.append("stop").attr("offset", "100%").attr("stop-color", "#dadaeb").attr("stop-opacity", 1);
    		var legendRect = svg.append("rect").attr("width", 15).attr("height", 150).style("fill", "url(#gradient)").attr("transform", "translate(" + (width - 40) + ", 15)").attr("opacity", "0%");

    		// Legend tags    
    		var topTag = svg.append("text").text("More Aligned").attr("x", width - 110).attr("y", 20).attr("font_family", "sans-serif").attr("font-size", "10px").attr("fill", "black").attr("opacity", "0%"); // Font type
    		// Font size
    		// Font color

    		var bottomTag = svg.append("text").text("Less Aligned").attr("x", width - 110).attr("y", 165).attr("font_family", "sans-serif").attr("font-size", "10px").attr("fill", "black").attr("opacity", "0%"); // Font type
    		// Font size
    		// Font color

    		// Add gradient ellipses
    		var defs = svg.append("defs");

    		//Append a radialGradient element to the defs and give it a unique id
    		var radialGradient0 = defs.append("radialGradient").attr("id", "radial-gradient0").attr("rx", "50%").attr("ry", "50%");

    		radialGradient0.append("stop").attr("offset", "0%").attr("stop-color", colors[0]).attr("opacity", "50%");
    		radialGradient0.append("stop").attr("offset", "100%").attr("stop-color", "#F8F8F8").attr("opacity", "50%");
    		var radialGradient1 = defs.append("radialGradient").attr("id", "radial-gradient1").attr("rx", "50%").attr("ry", "50%");
    		radialGradient1.append("stop").attr("offset", "0%").attr("stop-color", colors[1]).attr("opacity", "50%");
    		radialGradient1.append("stop").attr("offset", "100%").attr("stop-color", "#F8F8F8").attr("opacity", "50%");
    		var radialGradient2 = defs.append("radialGradient").attr("id", "radial-gradient2").attr("rx", "50%").attr("ry", "50%");
    		radialGradient2.append("stop").attr("offset", "0%").attr("stop-color", colors[2]).attr("opacity", "50%");
    		radialGradient2.append("stop").attr("offset", "100%").attr("stop-color", "#F8F8F8").attr("opacity", "50%");
    		var radialGradient3 = defs.append("radialGradient").attr("id", "radial-gradient3").attr("rx", "50%").attr("ry", "50%");
    		radialGradient3.append("stop").attr("offset", "0%").attr("stop-color", colors[3]).attr("opacity", "50%");
    		radialGradient3.append("stop").attr("offset", "100%").attr("stop-color", "#F8F8F8").attr("opacity", "50%");
    		var radialGradient4 = defs.append("radialGradient").attr("id", "radial-gradient4").attr("rx", "50%").attr("ry", "50%");
    		radialGradient4.append("stop").attr("offset", "0%").attr("stop-color", colors[4]).attr("opacity", "50%");
    		radialGradient4.append("stop").attr("offset", "100%").attr("stop-color", "#F8F8F8").attr("opacity", "50%");
    		var radialGradient5 = defs.append("radialGradient").attr("id", "radial-gradient5").attr("rx", "50%").attr("ry", "50%");
    		radialGradient5.append("stop").attr("offset", "0%").attr("stop-color", colors[5]).attr("opacity", "50%");
    		radialGradient5.append("stop").attr("offset", "100%").attr("stop-color", "#F8F8F8").attr("opacity", "50%");

    		// Upon change of keywords emphasis, updates the map visualization
    		function updateKeywords(selectedGroup, clustersNumber) {
    			// Filter out data with the selection
    			var dataFilter = currentSelectedFaculty.map(function (d) {
    				return {
    					xCoordinate: d["x" + selectedGroup],
    					yCoordinate: d["y" + selectedGroup],
    					Author: d.Author,
    					Affiliation: d.Affiliation,
    					KeyWords: d.KeyWords,
    					Citations: d.Citations,
    					URL: d.URL,
    					Group: d["grouping" + clustersNumber + "," + selectedGroup],
    					PictureURL: d.PictureURL
    				};
    			});

    			dot.data(dataFilter).attr("pointer-events", "none").transition("dot-change").duration(1000).// Temporarlly disable pointer events
    			attr("cx", function (d) {
    				return x(+d.xCoordinate) + Math.random() * jitterWidth;
    			}).attr("cy", function (d) {
    				return y(+d.yCoordinate) + Math.random() * jitterWidth;
    			}).style("fill", function (d) {
    				return colors[d.Group];
    			}).on("end", (d, i, g) => {
    				// Restore pointer events after the animation
    				d3.select(g[i]).attr("pointer-events", "auto");
    			});

    			text.data(dataFilter).transition().duration(1000).attr("x", function (d) {
    				return x(d.xCoordinate) + 10 + Math.random() * jitterWidth;
    			}).attr("y", function (d) {
    				return y(d.yCoordinate) + 4 + Math.random() * jitterWidth;
    			});
    		}

    		// A function that updates the map with a new cluster coloring
    		function updateClusters(selectedGroup, keywordsEmphasis) {
    			// Filter out data with the selection
    			var dataFilter = currentSelectedFaculty.map(function (d) {
    				return {
    					Grouping: d["grouping" + selectedGroup + "," + keywordsEmphasis],
    					Author: d.Author,
    					Affiliation: d.Affiliation,
    					KeyWords: d.KeyWords,
    					Citations: d.Citations,
    					URL: d.URL,
    					PictureURL: d.PictureURL
    				};
    			});

    			dot.data(dataFilter).transition().duration(1000).style("fill", function (d) {
    				return colors[d.Grouping];
    			});
    		}

    		// A function that update the map with a new ranking coloring
    		function updateRanking(phrase, emphasis) {
    			// Assign new ranking for current Research Query
    			for (var i = 0; i < currentSelectedFaculty.length; i++) {
    				currentSelectedFaculty[i].currentRank = currentSelectedFacultyRankData[phrase][emphasis][i].rank;
    			}

    			// Filter out data with the selection
    			var dataFilter = currentSelectedFaculty.map(function (d) {
    				return {
    					Author: d.Author,
    					Affiliation: d.Affiliation,
    					CurrentRank: d.currentRank,
    					KeyWords: d.KeyWords,
    					Citations: d.Citations,
    					URL: d.URL,
    					PictureURL: d.PictureURL
    				};
    			});

    			dot.data(dataFilter).transition().duration(1000).style("fill", function (d) {
    				if (d.CurrentRank == -1 || d.CurrentRank >= 5) {
    					return purpleGradient[6];
    				} else {
    					return purpleGradient[d.CurrentRank];
    				}
    			});

    			legendRect.transition().duration(1000).attr("opacity", "100%");
    			topTag.transition().duration(1000).attr("opacity", "100%");
    			bottomTag.transition().duration(1000).attr("opacity", "100%");
    		}

    		// A function that updates the map with the researcher names, either displayed or undisplayed
    		function updateNames(selectedOption) {
    			// Filter out data with the selection
    			var dataFilter = currentSelectedFaculty.map(function (d) {
    				return {
    					Author: d.Author,
    					Affiliation: d.Affiliation,
    					KeyWords: d.KeyWords,
    					Citations: d.Citations,
    					URL: d.URL,
    					Rank: d.Rank,
    					PictureURL: d.PictureURL
    				};
    			});

    			// Track mousemove in show all name mode
    			svg.on("mousemove", selectedOption
    			? hideNames
    			: () => {
    					
    				});

    			text.data(dataFilter).transition().duration(1000).attr("font_family", "sans-serif").attr("font-size", "11px").attr("fill", "black").text(function (d) {
    				if (selectedOption == true) {
    					return d.Author; // Font type
    					// Font size
    					// Font color
    				} else {
    					return "";
    				}
    			});
    		}

    		// A function that updates the map with a new Gaussian distribution set
    		function updateDistributions(selectedOption, keywordsEmphasis, clustersNumber) {
    			outerEllipse.data(currentEllipseInfo).transition().duration(1000).attr("opacity", "0%");

    			// Filter out data with the selection
    			var dataFilter = currentSelectedFaculty.map(function (d) {
    				return {
    					xCoordinate: d["x" + keywordsEmphasis],
    					yCoordinate: d["y" + keywordsEmphasis],
    					Author: d.Author,
    					Affiliation: d.Affiliation,
    					KeyWords: d.KeyWords,
    					Citations: d.Citations,
    					URL: d.URL,
    					Group: d["grouping" + clustersNumber + "," + keywordsEmphasis],
    					PictureURL: d.PictureURL
    				};
    			});

    			var separation = splitResearchers(dataFilter);
    			var completedSet = generateXAndYCoordinates(separation);
    			var ellipseInfo = generateEllipseInfo(completedSet);
    			currentEllipseInfo = ellipseInfo;

    			outerEllipse.data(ellipseInfo).transition().duration(1000).attr("rx", function (d) {
    				var firstEigenvalue = d.Eigenvalues[0];
    				var secondEigenvalue = d.Eigenvalues[1];
    				var confidenceInterval = Math.sqrt(d.Eigenvalues[0] * 5.991 * 4);
    				return confidenceInterval * width / 2;
    			}).attr("ry", function (d) {
    				var firstEigenvalue = d.Eigenvalues[0];
    				var secondEigenvalue = d.Eigenvalues[1];
    				var confidenceInterval = Math.abs(Math.sqrt(d.Eigenvalues[1] * 5.991 * 4));
    				return confidenceInterval * height / 2;
    			}).attr("transform", function (d) {
    				var angle = Math.atan(d.Eigenvectors[0][1] / d.Eigenvectors[0][0]);
    				angle = angle / 3.1415 * 180;
    				return "translate(" + x(d.CenterX) + "," + y(d.CenterY) + ") rotate(" + angle + ")";
    			}).style("fill", function (d) {
    				return "url(#radial-gradient" + d.Group + ")";
    			}).style("mix-blend-mode", "multiply").attr("opacity", function (d) {
    				if (selectedOption == true) {
    					return "50%";
    				} else {
    					return "0%";
    				}
    			});
    		}

    		// A function that updates the map with the new dataset
    		function updateDataset(selectedKeywords, selectedClusters) {
    			// Filter out data with the selection
    			var dataFilter = currentSelectedFaculty.map(function (d) {
    				return {
    					xCoordinate: d["x" + selectedKeywords],
    					yCoordinate: d["y" + selectedKeywords],
    					Author: d.Author,
    					Affiliation: d.Affiliation,
    					KeyWords: d.KeyWords,
    					Citations: d.Citations,
    					URL: d.URL,
    					Grouping: d["grouping" + selectedClusters + "," + selectedKeywords],
    					PictureURL: d.PictureURL
    				};
    			});

    			dot.data(dataFilter).transition().duration(1000).attr("cx", function (d) {
    				return x(+d.xCoordinate) + Math.random() * jitterWidth;
    			}).attr("cy", function (d) {
    				return y(+d.yCoordinate) + Math.random() * jitterWidth;
    			}).style("fill", function (d) {
    				return colors[d.Grouping];
    			});

    			text.data(dataFilter).transition().duration(1000).attr("x", function (d) {
    				return x(d.xCoordinate) + 10;
    			}).attr("y", function (d) {
    				return y(d.yCoordinate) + 4;
    			});
    		}

    		function handleClick(dataPoint) {
    			var dataFilter = currentSelectedFaculty.map(function (d) {
    				return {
    					Grouping: d["grouping" + $visNumClusters + "," + $visKeywordEmphasis],
    					Author: d.Author,
    					Affiliation: d.Affiliation,
    					KeyWords: d.KeyWords,
    					Citations: d.Citations,
    					URL: d.URL,
    					PictureURL: d.PictureURL
    				};
    			});

    			if (currentlyClicked == "" & dataPoint != "") {
    				currentlyClicked = dataPoint;

    				dot.data(dataFilter).transition().duration(200).attr("opacity", function (d) {
    					if (d.Author == dataPoint) {
    						var keywordTokens = d.KeyWords.split(", ");
    						var finalTokens = ["", "", "", "", ""];

    						for (var i = 0; i < keywordTokens.length; i++) {
    							finalTokens[i] = keywordTokens[i];
    						}

    						var updatedResearcherSelection = {
    							name: d.Author,
    							affiliation: d.Affiliation,
    							scholarKeywords: finalTokens,
    							citations: d.Citations,
    							url: d.URL,
    							pictureURL: d.PictureURL
    						};

    						selectedResearcherInfo.set(updatedResearcherSelection);
    						return "100%";
    					} else {
    						return "20%";
    					}
    				}).attr("r", function (d) {
    					if (d.Author == dataPoint) {
    						return 10;
    					} else {
    						return 8;
    					}
    				}).attr("stroke-width", function (d) {
    					if (d.Author == dataPoint) {
    						return "2px";
    					} else {
    						return "0px";
    					}
    				}).attr("stroke", function (d) {
    					if (d.Author == dataPoint) {
    						return "#6495ED";
    					} else {
    						return "black";
    					}
    				});
    			} else if (currentlyClicked != "" & dataPoint == currentlyClicked) {
    				dot.data(dataFilter).transition().duration(200).attr("opacity", "70%").attr("r", 8).attr("stroke-width", "0px").attr("stroke", "black").style("fill", function (d) {
    					return colors[d.Grouping];
    				});

    				currentlyClicked = "";
    			}
    		}

    		// When the button is changed, run the updateKeywords function and update the map
    		visKeywordEmphasis.subscribe(selectedOption => {
    			updateKeywords(selectedOption, $visNumClusters);
    			updateDistributions($displayDistributions, selectedOption, $visNumClusters);
    			set_store_value(selectedResearchInterest, $selectedResearchInterest = "");
    			legendRect.transition().duration(1000).attr("opacity", "0%");
    			topTag.transition().duration(1000).attr("opacity", "0%");
    			bottomTag.transition().duration(1000).attr("opacity", "0%");
    		});

    		// When the button is changed, run the updateClusters function and update the map
    		visNumClusters.subscribe(selectedOption => {
    			updateClusters(selectedOption, $visKeywordEmphasis);
    			updateDistributions($displayDistributions, $visKeywordEmphasis, selectedOption);
    			set_store_value(selectedResearchInterest, $selectedResearchInterest = "");
    			legendRect.transition().duration(1000).attr("opacity", "0%");
    			topTag.transition().duration(1000).attr("opacity", "0%");
    			bottomTag.transition().duration(1000).attr("opacity", "0%");
    		});

    		// When the button is changed, run the updateNames function and update the map
    		displayNames.subscribe(selectedOption => {
    			// run the updateNames function with this selected option
    			updateNames(selectedOption);
    		});

    		// When the button is changed, run the updateDistributions function and update the map
    		displayDistributions.subscribe(selectedOption => {
    			updateDistributions(selectedOption, $visKeywordEmphasis, $visNumClusters);

    			if (selectedOption == true) {
    				set_store_value(selectedResearchInterest, $selectedResearchInterest = "");
    				legendRect.transition().duration(1000).attr("opacity", "0%");
    				topTag.transition().duration(1000).attr("opacity", "0%");
    				bottomTag.transition().duration(1000).attr("opacity", "0%");
    			}
    		});

    		// When a new research query is inputted, update the map with the new ranking
    		selectedResearchInterest.subscribe(value => {
    			if (value == "") {
    				legendRect.transition().duration(1000).attr("opacity", "0%");
    				topTag.transition().duration(1000).attr("opacity", "0%");
    				bottomTag.transition().duration(1000).attr("opacity", "0%");
    				updateClusters($visNumClusters, $visKeywordEmphasis);
    				handleClick(currentlyClicked);
    				return;
    			}

    			if (totalAuthors[value]) {
    				handleClick(value);
    				return;
    			}

    			var emphasis = $queryKeywordEmphasis;

    			if (currentSelectedFacultyRankData[value.toLowerCase()]) {
    				set_store_value(displayDistributions, $displayDistributions = false);
    				updateRanking(value.toLowerCase(), emphasis);
    			}

    			updateDistributions($displayDistributions, $visKeywordEmphasis, $visNumClusters);
    		});

    		// When a new dataset is selected, update the map with the new dataset
    		datasetChoice.subscribe(value => {
    			if (value == "Most Cited Publications") {
    				currentSelectedFaculty = citedCoordinates;
    				currentSelectedFacultyRankData = citedRankData;
    			} else if (value == "Most Recent Publications") {
    				currentSelectedFaculty = recentCoordinates;
    				currentSelectedFacultyRankData = recentRankData;
    			}

    			set_store_value(selectedResearchInterest, $selectedResearchInterest = "");
    			updateDataset($visKeywordEmphasis, $visNumClusters);
    			updateDistributions($displayDistributions, $visKeywordEmphasis, $visNumClusters);
    			legendRect.transition().duration(1000).attr("opacity", "0%");
    			topTag.transition().duration(1000).attr("opacity", "0%");
    			bottomTag.transition().duration(1000).attr("opacity", "0%");
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PeopleMapView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PeopleMapView", $$slots, []);

    	function input0_change_handler() {
    		$displayNames = this.checked;
    		displayNames.set($displayNames);
    	}

    	function input1_change_input_handler() {
    		$visNumClusters = to_number(this.value);
    		visNumClusters.set($visNumClusters);
    	}

    	function input2_change_handler() {
    		$displayDistributions = this.checked;
    		displayDistributions.set($displayDistributions);
    	}

    	$$self.$capture_state = () => ({
    		cov: lib$2,
    		SingularValueDecomposition,
    		citedCoordinates,
    		recentCoordinates,
    		citedResearchQuery: citedRankData,
    		recentResearchQuery: recentRankData,
    		citedClusters,
    		recentClusters,
    		i,
    		k,
    		onMount,
    		selectedResearcherInfo,
    		selectedResearchInterest,
    		visKeywordEmphasis,
    		visNumClusters,
    		displayNames,
    		displayDistributions,
    		queryKeywordEmphasis,
    		datasetChoice,
    		currTimeout,
    		currentSelectedFaculty,
    		currentSelectedFacultyRankData,
    		hideAllTextTimeout,
    		hideTextAnimating,
    		hideNames,
    		showNames,
    		renderGraph,
    		$selectedResearchInterest,
    		$displayNames,
    		$visNumClusters,
    		$visKeywordEmphasis,
    		$displayDistributions,
    		$queryKeywordEmphasis
    	});

    	$$self.$inject_state = $$props => {
    		if ("i" in $$props) i = $$props.i;
    		if ("k" in $$props) k = $$props.k;
    		if ("currTimeout" in $$props) currTimeout = $$props.currTimeout;
    		if ("currentSelectedFaculty" in $$props) currentSelectedFaculty = $$props.currentSelectedFaculty;
    		if ("currentSelectedFacultyRankData" in $$props) currentSelectedFacultyRankData = $$props.currentSelectedFacultyRankData;
    		if ("hideAllTextTimeout" in $$props) hideAllTextTimeout = $$props.hideAllTextTimeout;
    		if ("hideTextAnimating" in $$props) hideTextAnimating = $$props.hideTextAnimating;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$displayNames,
    		$visNumClusters,
    		$displayDistributions,
    		i,
    		k,
    		currentSelectedFaculty,
    		currentSelectedFacultyRankData,
    		hideAllTextTimeout,
    		hideTextAnimating,
    		$selectedResearchInterest,
    		$visKeywordEmphasis,
    		$queryKeywordEmphasis,
    		currTimeout,
    		hideNames,
    		showNames,
    		renderGraph,
    		input0_change_handler,
    		input1_change_input_handler,
    		input2_change_handler
    	];
    }

    class PeopleMapView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PeopleMapView",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/ResearcherDetailView.svelte generated by Svelte v3.20.1 */

    const file$1 = "src/components/ResearcherDetailView.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (66:10) { #if scholarKeyword.length != 0 }
    function create_if_block(ctx) {
    	let p;
    	let t0_value = /*scholarKeyword*/ ctx[6] + "";
    	let t0;
    	let t1;
    	let p_style_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*scholarKeyword*/ ctx[6], ...args);
    	}

    	function mouseenter_handler(...args) {
    		return /*mouseenter_handler*/ ctx[4](/*scholarKeyword*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(p, "style", p_style_value = "cursor: pointer; color: #8B72BE; text-align: left; margin-bottom: 0px; " + (/*lockedInterest*/ ctx[0] == /*scholarKeyword*/ ctx[6]
    			? "font-weight: bold;"
    			: "font-weight: normal;") + " margin-left: 20%");

    			attr_dev(p, "class", "text scholar-keyword is-size-5 svelte-1qt2cax");
    			add_location(p, file$1, 67, 10, 2262);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(p, "click", click_handler, false, false, false),
    				listen_dev(p, "mouseenter", mouseenter_handler, false, false, false),
    				listen_dev(p, "mouseleave", /*mouseleave_handler*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$selectedResearcherInfo*/ 2 && t0_value !== (t0_value = /*scholarKeyword*/ ctx[6] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*lockedInterest, $selectedResearcherInfo*/ 3 && p_style_value !== (p_style_value = "cursor: pointer; color: #8B72BE; text-align: left; margin-bottom: 0px; " + (/*lockedInterest*/ ctx[0] == /*scholarKeyword*/ ctx[6]
    			? "font-weight: bold;"
    			: "font-weight: normal;") + " margin-left: 20%")) {
    				attr_dev(p, "style", p_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:10) { #if scholarKeyword.length != 0 }",
    		ctx
    	});

    	return block;
    }

    // (65:8) {#each $selectedResearcherInfo.scholarKeywords as scholarKeyword }
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*scholarKeyword*/ ctx[6].length != 0 && create_if_block(ctx);

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
    			if (/*scholarKeyword*/ ctx[6].length != 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(65:8) {#each $selectedResearcherInfo.scholarKeywords as scholarKeyword }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let p0;
    	let t1_value = /*$selectedResearcherInfo*/ ctx[1].name + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*$selectedResearcherInfo*/ ctx[1].affiliation + "";
    	let t3;
    	let t4;
    	let p2;
    	let span;
    	let t6;
    	let t7_value = parseInt(/*$selectedResearcherInfo*/ ctx[1].citations) + "";
    	let t7;
    	let t8;
    	let p3;
    	let a;
    	let t9;
    	let a_href_value;
    	let t10;
    	let t11;
    	let each_value = /*$selectedResearcherInfo*/ ctx[1].scholarKeywords;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			p2 = element("p");
    			span = element("span");
    			span.textContent = "Citations:";
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			a = element("a");
    			t9 = text("Google Scholar");
    			t10 = text(" keywords");
    			t11 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (img.src !== (img_src_value = /*$selectedResearcherInfo*/ ctx[1].pictureURL)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1qt2cax");
    			add_location(img, file$1, 49, 12, 1221);
    			attr_dev(div0, "class", "image-container svelte-1qt2cax");
    			add_location(div0, file$1, 48, 8, 1179);
    			attr_dev(div1, "class", "photo");
    			set_style(div1, "margin-left", "auto");
    			set_style(div1, "margin-right", "auto");
    			set_style(div1, "width", "45%");
    			set_style(div1, "display", "block");
    			set_style(div1, "padding-left", "20px");
    			set_style(div1, "padding-right", "20px");
    			set_style(div1, "padding-top", "15%");
    			add_location(div1, file$1, 47, 6, 1018);
    			attr_dev(p0, "class", "text is-size-2 has-text-weight-bold svelte-1qt2cax");
    			set_style(p0, "color", "#484848");
    			set_style(p0, "text-align", "center");
    			set_style(p0, "margin-bottom", "0px");
    			add_location(p0, file$1, 53, 8, 1360);
    			attr_dev(p1, "class", "text is-size-5 svelte-1qt2cax");
    			set_style(p1, "color", "#484848");
    			set_style(p1, "text-align", "center");
    			set_style(p1, "margin-bottom", "0px");
    			add_location(p1, file$1, 54, 8, 1517);
    			attr_dev(span, "class", "light-font");
    			add_location(span, file$1, 57, 14, 1766);
    			attr_dev(p2, "class", "text is-size-6 svelte-1qt2cax");
    			set_style(p2, "color", "#484848");
    			set_style(p2, "text-align", "center");
    			set_style(p2, "margin-bottom", "20px");
    			add_location(p2, file$1, 56, 8, 1660);
    			attr_dev(a, "href", a_href_value = /*$selectedResearcherInfo*/ ctx[1].url);
    			attr_dev(a, "target", "_blank");
    			set_style(a, "color", "#652DC1");
    			add_location(a, file$1, 61, 12, 1999);
    			attr_dev(p3, "class", "text is-size-6 svelte-1qt2cax");
    			set_style(p3, "color", "#484848");
    			set_style(p3, "text-align", "left");
    			set_style(p3, "margin-bottom", "0px");
    			set_style(p3, "padding-left", "20%");
    			add_location(p3, file$1, 60, 8, 1879);
    			attr_dev(div2, "class", "content");
    			set_style(div2, "min-width", "410px");
    			add_location(div2, file$1, 52, 6, 1304);
    			attr_dev(div3, "class", "column");
    			add_location(div3, file$1, 46, 4, 991);
    			attr_dev(div4, "class", "columns is-centered");
    			set_style(div4, "background", "#F8F8F8");
    			set_style(div4, "min-width", "410px");
    			set_style(div4, "cursor", "default");
    			add_location(div4, file$1, 45, 2, 890);
    			set_style(div5, "background", "#F8F8F8");
    			add_location(div5, file$1, 43, 0, 852);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(p0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, p1);
    			append_dev(p1, t3);
    			append_dev(div2, t4);
    			append_dev(div2, p2);
    			append_dev(p2, span);
    			append_dev(p2, t6);
    			append_dev(p2, t7);
    			append_dev(div2, t8);
    			append_dev(div2, p3);
    			append_dev(p3, a);
    			append_dev(a, t9);
    			append_dev(p3, t10);
    			append_dev(div2, t11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$selectedResearcherInfo*/ 2 && img.src !== (img_src_value = /*$selectedResearcherInfo*/ ctx[1].pictureURL)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$selectedResearcherInfo*/ 2 && t1_value !== (t1_value = /*$selectedResearcherInfo*/ ctx[1].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$selectedResearcherInfo*/ 2 && t3_value !== (t3_value = /*$selectedResearcherInfo*/ ctx[1].affiliation + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*$selectedResearcherInfo*/ 2 && t7_value !== (t7_value = parseInt(/*$selectedResearcherInfo*/ ctx[1].citations) + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*$selectedResearcherInfo*/ 2 && a_href_value !== (a_href_value = /*$selectedResearcherInfo*/ ctx[1].url)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*lockedInterest, $selectedResearcherInfo, selectedResearchInterest*/ 3) {
    				each_value = /*$selectedResearcherInfo*/ ctx[1].scholarKeywords;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let $selectedResearcherInfo;
    	validate_store(selectedResearcherInfo, "selectedResearcherInfo");
    	component_subscribe($$self, selectedResearcherInfo, $$value => $$invalidate(1, $selectedResearcherInfo = $$value));
    	var researcherLocked = false;
    	var lockedInterest = "";

    	selectedResearchInterest.subscribe(value => {
    		if (value.length == 0) $$invalidate(0, lockedInterest = "");
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ResearcherDetailView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ResearcherDetailView", $$slots, []);

    	const click_handler = scholarKeyword => {
    		if (lockedInterest.length == 0) $$invalidate(0, lockedInterest = scholarKeyword); else $$invalidate(0, lockedInterest = "");
    	};

    	const mouseenter_handler = scholarKeyword => {
    		selectedResearchInterest.set(scholarKeyword);
    	};

    	const mouseleave_handler = () => {
    		selectedResearchInterest.set(lockedInterest);
    	};

    	$$self.$capture_state = () => ({
    		selectedResearcherInfo,
    		selectedResearchInterest,
    		researcherLocked,
    		lockedInterest,
    		$selectedResearcherInfo
    	});

    	$$self.$inject_state = $$props => {
    		if ("researcherLocked" in $$props) researcherLocked = $$props.researcherLocked;
    		if ("lockedInterest" in $$props) $$invalidate(0, lockedInterest = $$props.lockedInterest);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		lockedInterest,
    		$selectedResearcherInfo,
    		researcherLocked,
    		click_handler,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class ResearcherDetailView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ResearcherDetailView",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /*!
     * string_score.js: String Scoring Algorithm 0.1.22
     *
     * http://joshaven.com/string_score
     * https://github.com/joshaven/string_score
     *
     * Copyright (C) 2009-2014 Joshaven Potter <yourtech@gmail.com>
     * Special thanks to all of the contributors listed here https://github.com/joshaven/string_score
     * MIT License: http://opensource.org/licenses/MIT
     *
     * Date: Tue Mar 1 2011
     * Updated: Tue Mar 10 2015
    */

    /*jslint nomen:true, white:true, browser:true,devel:true */

    /**
     * Scores a string against another string.
     *    'Hello World'.score('he');         //=> 0.5931818181818181
     *    'Hello World'.score('Hello');    //=> 0.7318181818181818
     */
    String.prototype.score = function (word, fuzziness) {

      // If the string is equal to the word, perfect match.
      if (this === word) { return 1; }

      //if it's not a perfect match and is empty return 0
      if (word === "") { return 0; }

      var runningScore = 0,
          charScore,
          finalScore,
          string = this,
          lString = string.toLowerCase(),
          strLength = string.length,
          lWord = word.toLowerCase(),
          wordLength = word.length,
          idxOf,
          startAt = 0,
          fuzzies = 1,
          fuzzyFactor,
          i;

      // Cache fuzzyFactor for speed increase
      if (fuzziness) { fuzzyFactor = 1 - fuzziness; }

      // Walk through word and add up scores.
      // Code duplication occurs to prevent checking fuzziness inside for loop
      if (fuzziness) {
        for (i = 0; i < wordLength; i+=1) {

          // Find next first case-insensitive match of a character.
          idxOf = lString.indexOf(lWord[i], startAt);

          if (idxOf === -1) {
            fuzzies += fuzzyFactor;
          } else {
            if (startAt === idxOf) {
              // Consecutive letter & start-of-string Bonus
              charScore = 0.7;
            } else {
              charScore = 0.1;

              // Acronym Bonus
              // Weighing Logic: Typing the first character of an acronym is as if you
              // preceded it with two perfect character matches.
              if (string[idxOf - 1] === ' ') { charScore += 0.8; }
            }

            // Same case bonus.
            if (string[idxOf] === word[i]) { charScore += 0.1; }

            // Update scores and startAt position for next round of indexOf
            runningScore += charScore;
            startAt = idxOf + 1;
          }
        }
      } else {
        for (i = 0; i < wordLength; i+=1) {
          idxOf = lString.indexOf(lWord[i], startAt);
          if (-1 === idxOf) { return 0; }

          if (startAt === idxOf) {
            charScore = 0.7;
          } else {
            charScore = 0.1;
            if (string[idxOf - 1] === ' ') { charScore += 0.8; }
          }
          if (string[idxOf] === word[i]) { charScore += 0.1; }
          runningScore += charScore;
          startAt = idxOf + 1;
        }
      }

      // Reduce penalty for longer strings.
      finalScore = 0.5 * (runningScore / strLength    + runningScore / wordLength) / fuzzies;

      if ((lWord[0] === lString[0]) && (finalScore < 0.85)) {
        finalScore += 0.15;
      }

      return finalScore;
    };

    /* src/components/StatsView.svelte generated by Svelte v3.20.1 */

    const { Object: Object_1 } = globals;
    const file$2 = "src/components/StatsView.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (155:2) {#each choices as choice}
    function create_each_block$1(ctx) {
    	let a;
    	let span;
    	let div;
    	let i;
    	let i_class_value;
    	let t0;
    	let t1_value = /*choice*/ ctx[12]["name"] + "";
    	let t1;
    	let t2;
    	let dispose;

    	function mousedown_handler(...args) {
    		return /*mousedown_handler*/ ctx[11](/*choice*/ ctx[12], ...args);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			span = element("span");
    			div = element("div");
    			i = element("i");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();

    			attr_dev(i, "class", i_class_value = "fas " + (/*choice*/ ctx[12]["type"] == "author"
    			? "fa-user-graduate"
    			: "fa-book"));

    			attr_dev(i, "aria-hidden", "true");
    			add_location(i, file$2, 158, 12, 5022);
    			add_location(div, file$2, 157, 8, 5004);
    			attr_dev(span, "class", "panel-icon");
    			add_location(span, file$2, 156, 6, 4970);
    			attr_dev(a, "class", "panel-block svelte-16ee7a");
    			add_location(a, file$2, 155, 4, 4877);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);
    			append_dev(a, span);
    			append_dev(span, div);
    			append_dev(div, i);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			if (remount) dispose();
    			dispose = listen_dev(a, "mousedown", mousedown_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*choices*/ 1 && i_class_value !== (i_class_value = "fas " + (/*choice*/ ctx[12]["type"] == "author"
    			? "fa-user-graduate"
    			: "fa-book"))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*choices*/ 1 && t1_value !== (t1_value = /*choice*/ ctx[12]["name"] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(155:2) {#each choices as choice}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div6;
    	let nav;
    	let div3;
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let p0;
    	let t2;
    	let div0;
    	let p1;
    	let t4;
    	let i0;
    	let t5;
    	let div1;
    	let p2;
    	let t7;
    	let i1;
    	let t8;
    	let div4;
    	let p3;
    	let input;
    	let t9;
    	let span0;
    	let i2;
    	let t10;
    	let a0;
    	let t11;
    	let a1;
    	let span1;
    	let i3;
    	let t12;
    	let div5;
    	let dispose;
    	let each_value = /*choices*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			nav = element("nav");
    			div3 = element("div");
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			p0 = element("p");
    			p0.textContent = "Georgia Tech IDEaS Faculty";
    			t2 = space();
    			div0 = element("div");
    			p1 = element("p");
    			p1.textContent = `${citedCoordinates.length}`;
    			t4 = space();
    			i0 = element("i");
    			t5 = space();
    			div1 = element("div");
    			p2 = element("p");
    			p2.textContent = `${Object.keys(citedRankData).length}`;
    			t7 = space();
    			i1 = element("i");
    			t8 = space();
    			div4 = element("div");
    			p3 = element("p");
    			input = element("input");
    			t9 = space();
    			span0 = element("span");
    			i2 = element("i");
    			t10 = space();
    			a0 = element("a");
    			t11 = space();
    			a1 = element("a");
    			span1 = element("span");
    			i3 = element("i");
    			t12 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (img.src !== (img_src_value = "./logo.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "50px%");
    			set_style(img, "height", "50px");
    			set_style(img, "margin-right", "10px");
    			add_location(img, file$2, 100, 6, 2515);
    			attr_dev(p0, "class", "text has-text-white");
    			set_style(p0, "font-size", "30px");
    			set_style(p0, "padding-right", "25px");
    			set_style(p0, "padding-right", "30px");
    			set_style(p0, "min-width", "400px");
    			add_location(p0, file$2, 101, 6, 2600);
    			attr_dev(p1, "class", "text has-text-white");
    			set_style(p1, "opacity", "75%");
    			set_style(p1, "padding-right", "5px");
    			set_style(p1, "font-size", "1.8rem");
    			add_location(p1, file$2, 107, 8, 2944);
    			attr_dev(i0, "class", "fas fa-child fa-2x");
    			set_style(i0, "color", "white");
    			set_style(i0, "opacity", "75%");
    			add_location(i0, file$2, 108, 8, 3074);
    			attr_dev(div0, "class", "level-item has-text-centered");
    			attr_dev(div0, "aria-label", "Scholars Analyzed");
    			attr_dev(div0, "data-balloon-pos", "down");
    			set_style(div0, "padding-right", "20px");
    			set_style(div0, "margin-right", "0px");
    			set_style(div0, "min-width", "65px");
    			add_location(div0, file$2, 106, 6, 2773);
    			attr_dev(p2, "class", "text has-text-white");
    			set_style(p2, "opacity", "75%");
    			set_style(p2, "padding-right", "5px");
    			set_style(p2, "font-size", "1.8rem");
    			add_location(p2, file$2, 112, 8, 3317);
    			attr_dev(i1, "class", "fas fa-atom fa-2x");
    			set_style(i1, "color", "white");
    			set_style(i1, "opacity", "75%");
    			add_location(i1, file$2, 113, 8, 3459);
    			attr_dev(div1, "class", "level-item has-text-centered");
    			attr_dev(div1, "aria-label", "Keywords Analyzed");
    			attr_dev(div1, "data-balloon-pos", "down");
    			set_style(div1, "min-width", "85px");
    			set_style(div1, "padding-right", "10px");
    			add_location(div1, file$2, 111, 6, 3165);
    			attr_dev(div2, "class", "level-left");
    			add_location(div2, file$2, 99, 4, 2484);
    			attr_dev(div3, "class", "flex-2");
    			attr_dev(div3, "style", "flex-2: flex-direction; row; justify-content: flex-start; min-width: 820px;");
    			add_location(div3, file$2, 97, 2, 2374);
    			attr_dev(input, "class", "input");
    			attr_dev(input, "id", "autocomplete-input");
    			attr_dev(input, "type", "text");
    			set_style(input, "width", "320px");
    			attr_dev(input, "placeholder", "Query a Researcher or Area of Study");
    			add_location(input, file$2, 125, 6, 3796);
    			attr_dev(i2, "class", "fas fa-search");
    			attr_dev(i2, "aria-hidden", "true");
    			add_location(i2, file$2, 130, 8, 4095);
    			attr_dev(span0, "class", "icon is-left");
    			add_location(span0, file$2, 129, 6, 4059);
    			attr_dev(p3, "class", "control has-icons-left");
    			set_style(p3, "padding-right", "10px");
    			add_location(p3, file$2, 124, 4, 3726);
    			attr_dev(a0, "class", "delete is-large");
    			set_style(a0, "padding-right", "15px");
    			add_location(a0, file$2, 134, 4, 4172);
    			attr_dev(i3, "class", "fab fa-github fa-2x");
    			add_location(i3, file$2, 142, 10, 4483);
    			attr_dev(span1, "class", "icon is-small");
    			add_location(span1, file$2, 141, 8, 4444);
    			attr_dev(a1, "href", "https://github.com/poloclub/people-map");
    			attr_dev(a1, "target", "_blank");
    			set_style(a1, "color", "white");
    			set_style(a1, "margin-left", "20px");
    			set_style(a1, "padding-top", "12px");
    			add_location(a1, file$2, 140, 4, 4311);
    			attr_dev(div4, "class", "panel-block svelte-16ee7a");
    			set_style(div4, "padding-left", "0px");
    			set_style(div4, "border", "0px solid white");
    			set_style(div4, "padding-left", "10px");
    			set_style(div4, "padding-right", "10px");
    			set_style(div4, "min-width", "300px");
    			set_style(div4, "overflow", "visible");
    			add_location(div4, file$2, 123, 2, 3566);
    			attr_dev(nav, "class", "level is-mobile svelte-16ee7a");
    			set_style(nav, "padding", "10px 10px");
    			set_style(nav, "margin-bottom", "0px");
    			set_style(nav, "width", "1340px");
    			set_style(nav, "margin-left", "auto");
    			set_style(nav, "margin-right", "auto");
    			add_location(nav, file$2, 95, 0, 2241);
    			attr_dev(div5, "id", "autocomplete-choices");
    			set_style(div5, "visibility", "hidden");
    			set_style(div5, "top", "100px");
    			set_style(div5, "left", "100px");
    			set_style(div5, "z-index", "100");
    			set_style(div5, "position", "absolute");
    			set_style(div5, "width", "300px");
    			set_style(div5, "background", "white");
    			add_location(div5, file$2, 153, 0, 4693);
    			set_style(div6, "background-color", "#652DC1");
    			add_location(div6, file$2, 93, 0, 2199);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, nav);
    			append_dev(nav, div3);
    			append_dev(div3, div2);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, p0);
    			append_dev(div2, t2);
    			append_dev(div2, div0);
    			append_dev(div0, p1);
    			append_dev(div0, t4);
    			append_dev(div0, i0);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, p2);
    			append_dev(div1, t7);
    			append_dev(div1, i1);
    			append_dev(nav, t8);
    			append_dev(nav, div4);
    			append_dev(div4, p3);
    			append_dev(p3, input);
    			set_input_value(input, /*$selectedResearchInterest*/ ctx[1]);
    			append_dev(p3, t9);
    			append_dev(p3, span0);
    			append_dev(span0, i2);
    			append_dev(div4, t10);
    			append_dev(div4, a0);
    			append_dev(div4, t11);
    			append_dev(div4, a1);
    			append_dev(a1, span1);
    			append_dev(span1, i3);
    			append_dev(div6, t12);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "keydown", /*handleKeydown*/ ctx[3], false, false, false),
    				listen_dev(input, "focus", /*onFocus*/ ctx[4], false, false, false),
    				listen_dev(input, "blur", /*onBlur*/ ctx[5], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    				listen_dev(a0, "click", /*click_handler*/ ctx[10], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$selectedResearchInterest*/ 2 && input.value !== /*$selectedResearchInterest*/ ctx[1]) {
    				set_input_value(input, /*$selectedResearchInterest*/ ctx[1]);
    			}

    			if (dirty & /*handleInterestSelect, choices*/ 5) {
    				each_value = /*choices*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let $selectedResearchInterest;
    	validate_store(selectedResearchInterest, "selectedResearchInterest");
    	component_subscribe($$self, selectedResearchInterest, $$value => $$invalidate(1, $selectedResearchInterest = $$value));
    	var newRankData = {};
    	var fixedKeys = [];
    	var authors = {};

    	citedCoordinates.forEach(curr => {
    		authors[curr["Author"]] = true;
    	});

    	datasetChoice.subscribe(value => {
    		if (value == "Most Cited") {
    			newRankData = citedRankData;
    		} else {
    			newRankData = recentRankData;
    		}

    		fixedKeys = Object.keys(newRankData).map(key => {
    			var name = key.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    			var type = "interest";
    			return { name, type };
    		});

    		for (var key in authors) {
    			fixedKeys.push({ name: key, type: "author" });
    		}
    	});

    	var choices = [];

    	selectedResearchInterest.subscribe(val => {
    		$$invalidate(0, choices = fixedKeys.sort((a, b) => b["name"].score(val) - a["name"].score(val)).slice(0, 5));
    	});

    	var handleInterestSelect = choice => {
    		selectedResearchInterest.set(choice);
    	};

    	var handleKeydown = () => {
    		var key = event.key;
    		var keyCode = event.keyCode;

    		if (keyCode == 13) {
    			selectedResearchInterest.set(choices[0]["name"]);
    		}
    	};

    	var onFocus = () => {
    		var input = document.getElementById("autocomplete-input");
    		var choices = document.getElementById("autocomplete-choices");
    		choices.style.top = input.getBoundingClientRect().top + 50 + "px";
    		choices.style.left = input.getBoundingClientRect().left + "px";
    		choices.style.width = input.getBoundingClientRect().width + "px";
    		choices.style.visibility = "visible";
    	};

    	var onBlur = () => {
    		var choices = document.getElementById("autocomplete-choices");
    		choices.style.top = "1000px";
    		choices.style.left = "1000px";
    		choices.style.visibility = "hidden";
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StatsView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("StatsView", $$slots, []);

    	function input_input_handler() {
    		$selectedResearchInterest = this.value;
    		selectedResearchInterest.set($selectedResearchInterest);
    	}

    	const click_handler = () => {
    		selectedResearchInterest.set("");
    	};

    	const mousedown_handler = choice => {
    		handleInterestSelect(choice["name"]);
    	};

    	$$self.$capture_state = () => ({
    		queryKeywordEmphasis,
    		selectedResearchInterest,
    		datasetChoice,
    		citedRankData,
    		recentRankData,
    		citedCoordinates,
    		newRankData,
    		fixedKeys,
    		authors,
    		choices,
    		handleInterestSelect,
    		handleKeydown,
    		onFocus,
    		onBlur,
    		$selectedResearchInterest
    	});

    	$$self.$inject_state = $$props => {
    		if ("newRankData" in $$props) newRankData = $$props.newRankData;
    		if ("fixedKeys" in $$props) fixedKeys = $$props.fixedKeys;
    		if ("authors" in $$props) authors = $$props.authors;
    		if ("choices" in $$props) $$invalidate(0, choices = $$props.choices);
    		if ("handleInterestSelect" in $$props) $$invalidate(2, handleInterestSelect = $$props.handleInterestSelect);
    		if ("handleKeydown" in $$props) $$invalidate(3, handleKeydown = $$props.handleKeydown);
    		if ("onFocus" in $$props) $$invalidate(4, onFocus = $$props.onFocus);
    		if ("onBlur" in $$props) $$invalidate(5, onBlur = $$props.onBlur);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		choices,
    		$selectedResearchInterest,
    		handleInterestSelect,
    		handleKeydown,
    		onFocus,
    		onBlur,
    		newRankData,
    		fixedKeys,
    		authors,
    		input_input_handler,
    		click_handler,
    		mousedown_handler
    	];
    }

    class StatsView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatsView",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/SummaryView.svelte generated by Svelte v3.20.1 */

    const file$3 = "src/components/SummaryView.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let ul0;
    	let li0;
    	let a0;
    	let t9;
    	let p3;
    	let t11;
    	let ul1;
    	let li1;
    	let a1;
    	let t13;
    	let p4;
    	let t14;
    	let a2;
    	let t16;
    	let a3;
    	let t18;
    	let a4;
    	let t20;
    	let a5;
    	let t22;
    	let a6;
    	let t24;
    	let a7;
    	let t26;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "What is PeopleMap?";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Discovering research expertise at institutions can be a difficult task. Manually curated university directories easily become out of date and often lack the information necessary to understand a researcher’s interests and past work, making it harder to explore the diversity of research at an institution and pinpoint potential collaborators, resulting in lost opportunities for both internal and external entities to discover new connections and nurture research collaboration.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "To solve this problem, we have developed PeopleMap, the first interactive, open-source, web-based tool that visually “maps out”researchers based on their research interests and publications by leveraging embeddings generated by natural language processing (NLP) techniques. PeopleMap provides a new engaging way for institutions to summarize their research talents and for people to discover new connections. PeopleMap is developed with ease-of-use and sustainability in mind. Using only researchers’ Google Scholar profiles as input, PeopleMap can be readily adopted by any institution using its publicly-accessible repository and detailed documentation.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "To access the Github repository for PeopleMap, click the following link:";
    			t7 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "PeopleMap Repository";
    			t9 = space();
    			p3 = element("p");
    			p3.textContent = "To access the documentation for PeopleMap, click the following link:";
    			t11 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "PeopleMap Documentation";
    			t13 = space();
    			p4 = element("p");
    			t14 = text("PeopleMap is brought to you by: ");
    			a2 = element("a");
    			a2.textContent = "Jon Saad-Falcon";
    			t16 = text(", ");
    			a3 = element("a");
    			a3.textContent = "Omar Shaikh";
    			t18 = text(", ");
    			a4 = element("a");
    			a4.textContent = "Jay Wang";
    			t20 = text(", ");
    			a5 = element("a");
    			a5.textContent = "Austin Wright";
    			t22 = text(", ");
    			a6 = element("a");
    			a6.textContent = "Sasha Richardson";
    			t24 = text(", and ");
    			a7 = element("a");
    			a7.textContent = "Polo Chau";
    			t26 = text(".");
    			attr_dev(h1, "class", "text is-size-1");
    			add_location(h1, file$3, 12, 2, 263);
    			attr_dev(p0, "class", "text is-size-5");
    			add_location(p0, file$3, 13, 2, 318);
    			attr_dev(p1, "class", "text is-size-5");
    			add_location(p1, file$3, 15, 2, 833);
    			attr_dev(p2, "class", "text is-size-5");
    			add_location(p2, file$3, 17, 2, 1525);
    			attr_dev(a0, "href", "https://github.com/poloclub/people-map");
    			attr_dev(a0, "target", "_blank");
    			set_style(a0, "color", "#652DC1");
    			add_location(a0, file$3, 20, 9, 1671);
    			add_location(li0, file$3, 20, 4, 1666);
    			attr_dev(ul0, "class", "text is-size-5");
    			add_location(ul0, file$3, 19, 2, 1634);
    			attr_dev(p3, "class", "text is-size-5");
    			add_location(p3, file$3, 23, 2, 1805);
    			attr_dev(a1, "href", "https://app.gitbook.com/@poloclub/s/people-map/");
    			attr_dev(a1, "target", "_blank");
    			set_style(a1, "color", "#652DC1");
    			add_location(a1, file$3, 26, 9, 1947);
    			add_location(li1, file$3, 26, 4, 1942);
    			attr_dev(ul1, "class", "text is-size-5");
    			add_location(ul1, file$3, 25, 2, 1910);
    			attr_dev(a2, "href", "https://www.linkedin.com/in/jonsaadfalcon/");
    			attr_dev(a2, "target", "_blank");
    			set_style(a2, "color", "#652DC1");
    			add_location(a2, file$3, 29, 61, 2152);
    			attr_dev(a3, "href", "https://www.linkedin.com/in/oshaikh13/");
    			attr_dev(a3, "target", "_blank");
    			set_style(a3, "color", "#652DC1");
    			add_location(a3, file$3, 29, 175, 2266);
    			attr_dev(a4, "href", "https://zijie.wang/");
    			attr_dev(a4, "target", "_blank");
    			set_style(a4, "color", "#652DC1");
    			add_location(a4, file$3, 29, 281, 2372);
    			attr_dev(a5, "href", "https://austinpwright.com/");
    			attr_dev(a5, "target", "_blank");
    			set_style(a5, "color", "#652DC1");
    			add_location(a5, file$3, 29, 365, 2456);
    			attr_dev(a6, "href", "https://www.linkedin.com/in/sasha-richardson/");
    			attr_dev(a6, "target", "_blank");
    			set_style(a6, "color", "#652DC1");
    			add_location(a6, file$3, 29, 461, 2552);
    			attr_dev(a7, "href", "https://poloclub.github.io/polochau/");
    			attr_dev(a7, "target", "_blank");
    			set_style(a7, "color", "#652DC1");
    			add_location(a7, file$3, 29, 583, 2674);
    			attr_dev(p4, "class", "text is-size-5");
    			add_location(p4, file$3, 29, 2, 2093);
    			attr_dev(div, "class", "content svelte-1xglvnw");
    			add_location(div, file$3, 11, 0, 239);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(div, t7);
    			append_dev(div, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(div, t9);
    			append_dev(div, p3);
    			append_dev(div, t11);
    			append_dev(div, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a1);
    			append_dev(div, t13);
    			append_dev(div, p4);
    			append_dev(p4, t14);
    			append_dev(p4, a2);
    			append_dev(p4, t16);
    			append_dev(p4, a3);
    			append_dev(p4, t18);
    			append_dev(p4, a4);
    			append_dev(p4, t20);
    			append_dev(p4, a5);
    			append_dev(p4, t22);
    			append_dev(p4, a6);
    			append_dev(p4, t24);
    			append_dev(p4, a7);
    			append_dev(p4, t26);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SummaryView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SummaryView", $$slots, []);
    	return [];
    }

    class SummaryView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SummaryView",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/ToggleRow.svelte generated by Svelte v3.20.1 */

    const file$4 = "src/components/ToggleRow.svelte";

    function create_fragment$4(ctx) {
    	let div14;
    	let nav;
    	let div13;
    	let div0;
    	let p0;
    	let t1;
    	let div5;
    	let div4;
    	let div1;
    	let button0;
    	let span0;
    	let t2;
    	let t3;
    	let span1;
    	let i0;
    	let t4;
    	let div3;
    	let div2;
    	let a0;
    	let p1;
    	let t6;
    	let hr0;
    	let t7;
    	let a1;
    	let p2;
    	let div4_class_value;
    	let t9;
    	let div6;
    	let p3;
    	let t11;
    	let div11;
    	let div10;
    	let div7;
    	let button1;
    	let span2;
    	let t12_value = displayAdjective(/*$visKeywordEmphasis*/ ctx[3]) + "";
    	let t12;
    	let t13;
    	let span3;
    	let i1;
    	let t14;
    	let div9;
    	let div8;
    	let a2;
    	let p4;
    	let t16;
    	let hr1;
    	let t17;
    	let a3;
    	let p5;
    	let t19;
    	let hr2;
    	let t20;
    	let a4;
    	let p6;
    	let t22;
    	let hr3;
    	let t23;
    	let a5;
    	let p7;
    	let div10_class_value;
    	let t25;
    	let div12;
    	let p8;
    	let dispose;

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			nav = element("nav");
    			div13 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Create map based on";
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			t2 = text(/*$datasetChoice*/ ctx[2]);
    			t3 = space();
    			span1 = element("span");
    			i0 = element("i");
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			a0 = element("a");
    			p1 = element("p");
    			p1.textContent = "Most Cited Publications";
    			t6 = space();
    			hr0 = element("hr");
    			t7 = space();
    			a1 = element("a");
    			p2 = element("p");
    			p2.textContent = "Most Recent Publications";
    			t9 = space();
    			div6 = element("div");
    			p3 = element("p");
    			p3.textContent = "with";
    			t11 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div7 = element("div");
    			button1 = element("button");
    			span2 = element("span");
    			t12 = text(t12_value);
    			t13 = space();
    			span3 = element("span");
    			i1 = element("i");
    			t14 = space();
    			div9 = element("div");
    			div8 = element("div");
    			a2 = element("a");
    			p4 = element("p");
    			p4.textContent = "No";
    			t16 = space();
    			hr1 = element("hr");
    			t17 = space();
    			a3 = element("a");
    			p5 = element("p");
    			p5.textContent = "Mild";
    			t19 = space();
    			hr2 = element("hr");
    			t20 = space();
    			a4 = element("a");
    			p6 = element("p");
    			p6.textContent = "Moderate";
    			t22 = space();
    			hr3 = element("hr");
    			t23 = space();
    			a5 = element("a");
    			p7 = element("p");
    			p7.textContent = "Strong";
    			t25 = space();
    			div12 = element("div");
    			p8 = element("p");
    			p8.textContent = "emphasis on people's research areas specified on Google Scholar.";
    			attr_dev(p0, "class", "text has-text-white");
    			set_style(p0, "font-size", "20px");
    			set_style(p0, "padding-left", "20px");
    			set_style(p0, "margin-right", "0px");
    			set_style(p0, "padding-right", "8px");
    			add_location(p0, file$4, 59, 10, 1449);
    			attr_dev(div0, "class", "level-item");
    			set_style(div0, "margin-right", "0px");
    			add_location(div0, file$4, 58, 8, 1388);
    			set_style(span0, "color", "white");
    			set_style(span0, "font-size", "20px");
    			add_location(span0, file$4, 67, 18, 2216);
    			attr_dev(i0, "class", "fas fa-angle-up fa-2x");
    			set_style(i0, "color", "white");
    			set_style(i0, "padding-left", "3px");
    			set_style(i0, "padding-right", "8px");
    			attr_dev(i0, "aria-hidden", "true");
    			add_location(i0, file$4, 69, 20, 2380);
    			attr_dev(span1, "class", "icon is-small");
    			set_style(span1, "padding-right", "5px");
    			add_location(span1, file$4, 68, 18, 2303);
    			attr_dev(button0, "class", "button");
    			set_style(button0, "background-color", "#8B72BE");
    			set_style(button0, "border", "0px solid white");
    			set_style(button0, "border-radius", "15px");
    			set_style(button0, "padding-left", "6px");
    			set_style(button0, "padding-right", "6px");
    			attr_dev(button0, "aria-haspopup", "true");
    			attr_dev(button0, "aria-controls", "dropdown-menu");
    			add_location(button0, file$4, 66, 16, 1955);
    			attr_dev(div1, "class", "dropdown-trigger");
    			set_style(div1, "background-color", "#8B72BE");
    			set_style(div1, "border-radius", "10px");
    			add_location(div1, file$4, 65, 14, 1852);
    			set_style(p1, "color", "white");
    			set_style(p1, "font-size", "15px");
    			set_style(p1, "background", "#8B72BE");
    			add_location(p1, file$4, 77, 20, 2907);
    			attr_dev(a0, "class", "dropdown-item svelte-1x7xby5");
    			set_style(a0, "background", "#8B72BE");
    			add_location(a0, file$4, 76, 18, 2759);
    			attr_dev(hr0, "class", "dropdown-divider");
    			add_location(hr0, file$4, 79, 18, 3039);
    			set_style(p2, "color", "white");
    			set_style(p2, "font-size", "15px");
    			set_style(p2, "background", "#8B72BE");
    			add_location(p2, file$4, 81, 20, 3236);
    			attr_dev(a1, "class", "dropdown-item svelte-1x7xby5");
    			set_style(a1, "background", "#8B72BE");
    			add_location(a1, file$4, 80, 18, 3087);
    			attr_dev(div2, "class", "dropdown-content");
    			set_style(div2, "background-color", "#8B72BE");
    			add_location(div2, file$4, 75, 16, 2675);
    			attr_dev(div3, "class", "dropdown-menu");
    			attr_dev(div3, "id", "dropdown-menu");
    			attr_dev(div3, "role", "menu");
    			add_location(div3, file$4, 74, 14, 2600);
    			attr_dev(div4, "class", div4_class_value = "dropdown is-up " + (/*dropdownShownDataset*/ ctx[0] ? "is-active" : ""));
    			set_style(div4, "padding-left", "2%");
    			add_location(div4, file$4, 64, 12, 1741);
    			attr_dev(div5, "class", "level-item");
    			set_style(div5, "overflow", "visible");
    			set_style(div5, "margin-right", "0px");
    			set_style(div5, "padding-right", "8px");
    			add_location(div5, file$4, 63, 8, 1638);
    			attr_dev(p3, "class", "text has-text-white");
    			set_style(p3, "font-size", "20px");
    			add_location(p3, file$4, 88, 10, 3521);
    			attr_dev(div6, "class", "level-item");
    			set_style(div6, "margin-right", "0px");
    			set_style(div6, "padding-right", "8px");
    			add_location(div6, file$4, 87, 8, 3439);
    			set_style(span2, "color", "white");
    			set_style(span2, "font-size", "20px");
    			add_location(span2, file$4, 96, 18, 4215);
    			attr_dev(i1, "class", "fas fa-angle-up fa-2x");
    			set_style(i1, "color", "white");
    			set_style(i1, "padding-left", "3px");
    			set_style(i1, "padding-right", "8px");
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file$4, 98, 20, 4403);
    			attr_dev(span3, "class", "icon is-medium");
    			set_style(span3, "padding-right", "5px");
    			add_location(span3, file$4, 97, 18, 4325);
    			attr_dev(button1, "class", "button");
    			attr_dev(button1, "aria-haspopup", "true");
    			set_style(button1, "background-color", "#8B72BE");
    			set_style(button1, "border", "0px solid white");
    			set_style(button1, "border-radius", "15px");
    			set_style(button1, "padding-left", "6px");
    			set_style(button1, "padding-right", "6px");
    			attr_dev(button1, "aria-controls", "dropdown-menu");
    			add_location(button1, file$4, 95, 16, 3953);
    			attr_dev(div7, "class", "dropdown-trigger");
    			set_style(div7, "background-color", "#8B72BE");
    			set_style(div7, "border-radius", "10px");
    			add_location(div7, file$4, 94, 14, 3850);
    			set_style(p4, "color", "white");
    			set_style(p4, "font-size", "15px");
    			set_style(p4, "background", "#8B72BE");
    			add_location(p4, file$4, 106, 20, 4921);
    			attr_dev(a2, "class", "dropdown-item svelte-1x7xby5");
    			set_style(a2, "background", "#8B72BE");
    			add_location(a2, file$4, 105, 18, 4796);
    			attr_dev(hr1, "class", "dropdown-divider");
    			add_location(hr1, file$4, 108, 18, 5032);
    			set_style(p5, "color", "white");
    			set_style(p5, "font-size", "15px");
    			set_style(p5, "background", "#8B72BE");
    			add_location(p5, file$4, 110, 20, 5205);
    			attr_dev(a3, "class", "dropdown-item svelte-1x7xby5");
    			set_style(a3, "background", "#8B72BE");
    			add_location(a3, file$4, 109, 18, 5080);
    			attr_dev(hr2, "class", "dropdown-divider");
    			add_location(hr2, file$4, 112, 18, 5319);
    			set_style(p6, "color", "white");
    			set_style(p6, "font-size", "15px");
    			set_style(p6, "background", "#8B72BE");
    			add_location(p6, file$4, 114, 20, 5492);
    			attr_dev(a4, "class", "dropdown-item svelte-1x7xby5");
    			set_style(a4, "background", "#8B72BE");
    			add_location(a4, file$4, 113, 18, 5367);
    			attr_dev(hr3, "class", "dropdown-divider");
    			add_location(hr3, file$4, 116, 18, 5610);
    			set_style(p7, "color", "white");
    			set_style(p7, "font-size", "15px");
    			set_style(p7, "background", "#8B72BE");
    			add_location(p7, file$4, 118, 20, 5783);
    			attr_dev(a5, "class", "dropdown-item svelte-1x7xby5");
    			set_style(a5, "background", "#8B72BE");
    			add_location(a5, file$4, 117, 18, 5658);
    			attr_dev(div8, "class", "dropdown-content");
    			set_style(div8, "background-color", "#8B72BE");
    			set_style(div8, "width", "150px");
    			add_location(div8, file$4, 104, 16, 4698);
    			attr_dev(div9, "class", "dropdown-menu");
    			attr_dev(div9, "id", "dropdown-menu");
    			attr_dev(div9, "role", "menu");
    			add_location(div9, file$4, 103, 14, 4623);
    			attr_dev(div10, "class", div10_class_value = "dropdown is-up " + (/*dropdownShownEmphasis*/ ctx[1] ? "is-active" : ""));
    			set_style(div10, "padding-left", "2%");
    			add_location(div10, file$4, 93, 12, 3738);
    			attr_dev(div11, "class", "level-item");
    			set_style(div11, "overflow", "visible");
    			set_style(div11, "margin-right", "0px");
    			set_style(div11, "padding-right", "8px");
    			add_location(div11, file$4, 92, 8, 3635);
    			attr_dev(p8, "class", "text has-text-white");
    			set_style(p8, "font-size", "20px");
    			add_location(p8, file$4, 125, 10, 6004);
    			attr_dev(div12, "class", "level-item");
    			add_location(div12, file$4, 124, 8, 5969);
    			attr_dev(div13, "class", "level-left");
    			add_location(div13, file$4, 57, 6, 1355);
    			attr_dev(nav, "class", "level is-mobile svelte-1x7xby5");
    			set_style(nav, "padding", "10px 10px");
    			set_style(nav, "margin-bottom", "0px");
    			set_style(nav, "width", "1340px");
    			set_style(nav, "margin-left", "auto");
    			set_style(nav, "margin-right", "auto");
    			add_location(nav, file$4, 55, 4, 1218);
    			set_style(div14, "background-color", "#652DC1");
    			add_location(div14, file$4, 53, 0, 1172);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, nav);
    			append_dev(nav, div13);
    			append_dev(div13, div0);
    			append_dev(div0, p0);
    			append_dev(div13, t1);
    			append_dev(div13, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, button0);
    			append_dev(button0, span0);
    			append_dev(span0, t2);
    			append_dev(button0, t3);
    			append_dev(button0, span1);
    			append_dev(span1, i0);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, a0);
    			append_dev(a0, p1);
    			append_dev(div2, t6);
    			append_dev(div2, hr0);
    			append_dev(div2, t7);
    			append_dev(div2, a1);
    			append_dev(a1, p2);
    			append_dev(div13, t9);
    			append_dev(div13, div6);
    			append_dev(div6, p3);
    			append_dev(div13, t11);
    			append_dev(div13, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div7);
    			append_dev(div7, button1);
    			append_dev(button1, span2);
    			append_dev(span2, t12);
    			append_dev(button1, t13);
    			append_dev(button1, span3);
    			append_dev(span3, i1);
    			append_dev(div10, t14);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, a2);
    			append_dev(a2, p4);
    			append_dev(div8, t16);
    			append_dev(div8, hr1);
    			append_dev(div8, t17);
    			append_dev(div8, a3);
    			append_dev(a3, p5);
    			append_dev(div8, t19);
    			append_dev(div8, hr2);
    			append_dev(div8, t20);
    			append_dev(div8, a4);
    			append_dev(a4, p6);
    			append_dev(div8, t22);
    			append_dev(div8, hr3);
    			append_dev(div8, t23);
    			append_dev(div8, a5);
    			append_dev(a5, p7);
    			append_dev(div13, t25);
    			append_dev(div13, div12);
    			append_dev(div12, p8);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false),
    				listen_dev(a0, "click", /*click_handler_1*/ ctx[7], false, false, false),
    				listen_dev(a1, "click", /*click_handler_2*/ ctx[8], false, false, false),
    				listen_dev(button1, "click", /*click_handler_3*/ ctx[9], false, false, false),
    				listen_dev(a2, "click", /*click_handler_4*/ ctx[10], false, false, false),
    				listen_dev(a3, "click", /*click_handler_5*/ ctx[11], false, false, false),
    				listen_dev(a4, "click", /*click_handler_6*/ ctx[12], false, false, false),
    				listen_dev(a5, "click", /*click_handler_7*/ ctx[13], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$datasetChoice*/ 4) set_data_dev(t2, /*$datasetChoice*/ ctx[2]);

    			if (dirty & /*dropdownShownDataset*/ 1 && div4_class_value !== (div4_class_value = "dropdown is-up " + (/*dropdownShownDataset*/ ctx[0] ? "is-active" : ""))) {
    				attr_dev(div4, "class", div4_class_value);
    			}

    			if (dirty & /*$visKeywordEmphasis*/ 8 && t12_value !== (t12_value = displayAdjective(/*$visKeywordEmphasis*/ ctx[3]) + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*dropdownShownEmphasis*/ 2 && div10_class_value !== (div10_class_value = "dropdown is-up " + (/*dropdownShownEmphasis*/ ctx[1] ? "is-active" : ""))) {
    				attr_dev(div10, "class", div10_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function displayAdjective(number) {
    	if (number == 0) {
    		return "No";
    	} else if (number == 1) {
    		return "Mild";
    	} else if (number == 3) {
    		return "Moderate";
    	} else if (number == 5) {
    		return "Strong";
    	} else {
    		return "Not labeled";
    	}
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $datasetChoice;
    	let $visKeywordEmphasis;
    	validate_store(datasetChoice, "datasetChoice");
    	component_subscribe($$self, datasetChoice, $$value => $$invalidate(2, $datasetChoice = $$value));
    	validate_store(visKeywordEmphasis, "visKeywordEmphasis");
    	component_subscribe($$self, visKeywordEmphasis, $$value => $$invalidate(3, $visKeywordEmphasis = $$value));
    	var dropdownShownDataset = false;
    	var dropdownShownEmphasis = false;

    	const selectionClickedDataset = selection => {
    		$$invalidate(0, dropdownShownDataset = !dropdownShownDataset);

    		if (selection) {
    			datasetChoice.set(selection);
    		}
    	};

    	const selectionClickedEmphasis = selection => {
    		var adjustedSelection = selection + 1;
    		$$invalidate(1, dropdownShownEmphasis = !dropdownShownEmphasis);

    		if (adjustedSelection) {
    			visKeywordEmphasis.set(adjustedSelection - 1);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ToggleRow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ToggleRow", $$slots, []);

    	const click_handler = () => {
    		selectionClickedDataset();
    	};

    	const click_handler_1 = () => {
    		selectionClickedDataset("Most Cited Publications");
    	};

    	const click_handler_2 = () => {
    		selectionClickedDataset("Most Recent Publications");
    	};

    	const click_handler_3 = () => {
    		selectionClickedEmphasis();
    	};

    	const click_handler_4 = () => {
    		selectionClickedEmphasis(0);
    	};

    	const click_handler_5 = () => {
    		selectionClickedEmphasis(1);
    	};

    	const click_handler_6 = () => {
    		selectionClickedEmphasis(3);
    	};

    	const click_handler_7 = () => {
    		selectionClickedEmphasis(5);
    	};

    	$$self.$capture_state = () => ({
    		queryKeywordEmphasis,
    		visKeywordEmphasis,
    		visNumClusters,
    		displayNames,
    		displayDistributions,
    		datasetChoice,
    		dropdownShownDataset,
    		dropdownShownEmphasis,
    		selectionClickedDataset,
    		selectionClickedEmphasis,
    		displayAdjective,
    		$datasetChoice,
    		$visKeywordEmphasis
    	});

    	$$self.$inject_state = $$props => {
    		if ("dropdownShownDataset" in $$props) $$invalidate(0, dropdownShownDataset = $$props.dropdownShownDataset);
    		if ("dropdownShownEmphasis" in $$props) $$invalidate(1, dropdownShownEmphasis = $$props.dropdownShownEmphasis);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		dropdownShownDataset,
    		dropdownShownEmphasis,
    		$datasetChoice,
    		$visKeywordEmphasis,
    		selectionClickedDataset,
    		selectionClickedEmphasis,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class ToggleRow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToggleRow",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.20.1 */
    const file$5 = "src/App.svelte";

    function create_fragment$5(ctx) {
    	let t0;
    	let div3;
    	let div0;
    	let t1;
    	let div2;
    	let div1;
    	let t2;
    	let t3;
    	let current;
    	const statsview = new StatsView({ $$inline: true });
    	const peoplemapview = new PeopleMapView({ $$inline: true });
    	const researcherdetailview = new ResearcherDetailView({ $$inline: true });
    	const togglerow = new ToggleRow({ $$inline: true });
    	const summaryview = new SummaryView({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(statsview.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			create_component(peoplemapview.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(researcherdetailview.$$.fragment);
    			t2 = space();
    			create_component(togglerow.$$.fragment);
    			t3 = space();
    			create_component(summaryview.$$.fragment);
    			attr_dev(div0, "class", "column");
    			set_style(div0, "min-height", "625px");
    			set_style(div0, "padding-bottom", "35px");
    			set_style(div0, "margin-bottom", "0px");
    			set_style(div0, "background", "#FFFFFF");
    			set_style(div0, "padding-right", "0px");
    			set_style(div0, "padding-left", "0px");
    			set_style(div0, "margin-left", "0px");
    			set_style(div0, "margin-right", "0px");
    			set_style(div0, "width", "100%");
    			set_style(div0, "padding-top", "0px");
    			add_location(div0, file$5, 21, 2, 759);
    			attr_dev(div1, "class", "level-item");
    			set_style(div1, "width", "400px");
    			add_location(div1, file$5, 25, 4, 1107);
    			attr_dev(div2, "class", "column is-narrow");
    			set_style(div2, "padding-right", "20px");
    			set_style(div2, "margin", "0px");
    			set_style(div2, "padding-left", "18px");
    			add_location(div2, file$5, 24, 2, 1010);
    			attr_dev(div3, "class", "columns is-mobile svelte-19oxtzl");
    			set_style(div3, "margin-top", "0px");
    			set_style(div3, "padding-top", "0px");
    			set_style(div3, "margin-bottom", "0px");
    			set_style(div3, "padding-left", "0px");
    			set_style(div3, "padding-right", "0px");
    			set_style(div3, "min-width", "1300px");
    			set_style(div3, "width", "1340px");
    			set_style(div3, "margin-left", "auto");
    			set_style(div3, "margin-right", "auto");
    			add_location(div3, file$5, 20, 0, 552);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(statsview, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(peoplemapview, div0, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			mount_component(researcherdetailview, div1, null);
    			insert_dev(target, t2, anchor);
    			mount_component(togglerow, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(summaryview, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statsview.$$.fragment, local);
    			transition_in(peoplemapview.$$.fragment, local);
    			transition_in(researcherdetailview.$$.fragment, local);
    			transition_in(togglerow.$$.fragment, local);
    			transition_in(summaryview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statsview.$$.fragment, local);
    			transition_out(peoplemapview.$$.fragment, local);
    			transition_out(researcherdetailview.$$.fragment, local);
    			transition_out(togglerow.$$.fragment, local);
    			transition_out(summaryview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(statsview, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			destroy_component(peoplemapview);
    			destroy_component(researcherdetailview);
    			if (detaching) detach_dev(t2);
    			destroy_component(togglerow, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(summaryview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		PeopleMapView,
    		ResearcherDetailView,
    		StatsView,
    		SummaryView,
    		ToggleRow
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

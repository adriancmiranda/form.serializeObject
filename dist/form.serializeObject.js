(function(global, factory) {
	'use strict';

	var library = global.jQuery || global.Zepto || global.ender || global.$;

	if (typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = global.document ? factory(global, library, true) :
			function(w) {
				if (!w.document) {
					throw new Error('Class requires a window with a document');
				}
				return factory(w, library);
			};
	} else {
		factory(global, library);
	}

}(typeof window !== 'undefined' ? window : this, function(window, $, noGlobal) {
	'use strict';
	
	var patterns = {
		validate:/^[a-z_][a-z0-9_]*(?:\[(?:\d*|[a-z0-9_]+)\])*$/i,
		named:/^[a-z0-9_]+$/i,
		fixed:/^\d+$/,
		push:/^$/,
		key:/[a-z0-9_]+|(?=\[\])/gi
	};

	function FormSerializer(helper, $form){
		var data = {}, pushes = {};
		
		function build(base, key, value){
			base[key] = value;
			return base;
		}

		function makeObject(root, value){
			var keys = root.match(patterns.key), k;

			// nest, nest, ..., nest
			while ((k = keys.pop()) !== undefined){
				// foo[]
				if(patterns.push.test(k)){
					var idx = incrementPush(root.replace(/\[\]$/, ''));
					value = build([], idx, value);
				}

				// foo[n]
				else if(patterns.fixed.test(k)){
					value = build([], k, value);
				}

				// foo; foo[bar]
				else if(patterns.named.test(k)){
					value = build({}, k, value);
				}
			}
			
			return value;
		}

		function incrementPush(key){
			if (pushes[key] === undefined){
				pushes[key] = 0;
			}
			return pushes[key]++;
		}

		function encode(pair){
			switch ($('[name="' + pair.name + '"]', $form).attr('type')){
			case 'checkbox':
				return pair.value === 'on' ? true : pair.value;
			default:
				return pair.value;
			}
		}

		function addPair(pair){
			if (!patterns.validate.test(pair.name)) return this;
			var obj = makeObject(pair.name, encode(pair));
			data = helper.extend(true, data, obj);
			return this;
		}

		function addPairs(pairs){
			if(!helper.isArray(pairs)){
				throw new Error('formSerializer.addPairs expects an Array');
			}
			for(var i=0, len=pairs.length; i<len; i++){
				this.addPair(pairs[i]);
			}
			return this;
		}

		function serialize(){
			return data;
		}

		function serializeJSON(){
			return JSON.stringify(serialize());
		}

		// public API
		this.addPair = addPair;
		this.addPairs = addPairs;
		this.serialize = serialize;
		this.serializeJSON = serializeJSON;
	}

	FormSerializer.patterns = patterns;

	FormSerializer.serializeObject = function serializeObject(){
		if (this.length > 1) {
			return new Error('jquery-serialize-object can only serialize one form at a time');
		}
		return new FormSerializer($, this).addPairs(this.serializeArray()).serialize();
	};

	FormSerializer.serializeJSON = function serializeJSON(){
		if (this.length > 1) {
			return new Error('jquery-serialize-object can only serialize one form at a time');
		}
		return new FormSerializer($, this).addPairs(this.serializeArray()).serializeJSON();
	};

	// Expose `$.serializeObject` and `$.serializeJSON` identifiers,
	// even in jQuery || Zepto || ender || $.
	if (typeof $.fn !== 'undefined') {
		$.fn.serializeObject = FormSerializer.serializeObject;
		$.fn.serializeJSON = FormSerializer.serializeJSON;
	}

	// Expose `$.serializeObject` identifier, even
	// in AMD and CommonJS for browser emulators.
	if (typeof noGlobal === typeof undefined) {
		window.FormSerializer = FormSerializer;
	}

	return FormSerializer;
}));
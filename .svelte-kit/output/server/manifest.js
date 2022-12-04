export const manifest = {
	appDir: "_app",
	appPath: "potential-pancake/_app",
	assets: new Set([".nojekyll","favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		entry: {"file":"_app/immutable/start-2e591f70.js","imports":["_app/immutable/start-2e591f70.js","_app/immutable/chunks/index-8f0aa09d.js","_app/immutable/chunks/singletons-aa4b358b.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js')
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		}
	}
};

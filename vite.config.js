import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
    base: "/potential-pancake/",
	plugins: [sveltekit()]
};

export default config;

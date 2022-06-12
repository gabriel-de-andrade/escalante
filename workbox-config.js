module.exports = {
	globDirectory: './',
	globPatterns: [
		'**/*.{html,css,png,ico,js}'
	],
	swDest: './sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	sourcemap: false,
	mode: 'production'
};

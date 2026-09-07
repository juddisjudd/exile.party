let open = $state(false);

/** One palette lives in the directory; the top bar button and the shortcuts drive it through this. */
export const searchPalette = {
	get open() {
		return open;
	},
	show() {
		open = true;
	},
	hide() {
		open = false;
	}
};

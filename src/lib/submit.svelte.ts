let open = $state(false);

/** One dialog lives in the root layout; every "Submit a tool" control drives it through this. */
export const submitDialog = {
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

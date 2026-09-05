<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	let canvas: HTMLCanvasElement;

	/* Gerstner waves, not plain sines: the horizontal displacement term is what gives water
	   sharp crests and wide flat troughs. Three octaves is enough to stop it looking periodic. */
	const WAVES = [
		{ dx: 0.97, dz: 0.24, length: 26, amp: 0.62, speed: 0.9, steep: 0.9 },
		{ dx: 0.6, dz: -0.8, length: 12, amp: 0.3, speed: 1.35, steep: 0.8 },
		{ dx: -0.42, dz: 0.91, length: 5.5, amp: 0.13, speed: 2.0, steep: 0.65 }
	].map((wv) => {
		const len = Math.hypot(wv.dx, wv.dz);
		const k = (Math.PI * 2) / wv.length;
		return { ...wv, dx: wv.dx / len, dz: wv.dz / len, k };
	});

	const MAX_AMP = WAVES.reduce((sum, wv) => sum + wv.amp, 0);

	const COLS = 150;
	const ROWS = 62;
	const Z_NEAR = 4;
	const Z_FAR = 210;
	const CAM_Y = 3.1;
	const FOG = 62;
	/** The buffer renders at half size and is scaled up, which costs a quarter of the fill and softens the spray. */
	const SCALE = 0.5;

	onMount(() => {
		const context = canvas.getContext('2d');
		if (!context) return;
		const ctx: CanvasRenderingContext2D = context;

		const buffer = document.createElement('canvas');
		const bufferCtx = buffer.getContext('2d');
		if (!bufferCtx) return;
		const bctx: CanvasRenderingContext2D = bufferCtx;

		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		const scheme = matchMedia('(prefers-color-scheme: dark)');

		let bw = 0;
		let bh = 0;
		let acc = new Float32Array(0);
		let image: ImageData | null = null;
		let rgb: [number, number, number] = [10, 33, 192];
		let raf = 0;
		let onScreen = true;
		const t0 = performance.now();

		/** The canvas carries `text-accent`, so the theme tokens drive the colour. */
		function readColour() {
			const parsed = getComputedStyle(canvas).color.match(/\d+(\.\d+)?/g);
			if (parsed && parsed.length >= 3) {
				rgb = [Number(parsed[0]), Number(parsed[1]), Number(parsed[2])];
			}
		}

		/** Spread one particle over the four pixels it sits between, so motion stays smooth. */
		function splat(x: number, y: number, weight: number) {
			const x0 = Math.floor(x);
			const y0 = Math.floor(y);
			if (x0 < 0 || y0 < 0 || x0 + 1 >= bw || y0 + 1 >= bh) return;
			const fx = x - x0;
			const fy = y - y0;
			const i = y0 * bw + x0;
			acc[i] += weight * (1 - fx) * (1 - fy);
			acc[i + 1] += weight * fx * (1 - fy);
			acc[i + bw] += weight * (1 - fx) * fy;
			acc[i + bw + 1] += weight * fx * fy;
		}

		function draw(time: number) {
			if (!image || bw === 0 || bh === 0) return;
			acc.fill(0);

			const horizon = bh * 0.34;
			const focal = bh * 0.95;
			const cx = bw * 0.5;
			const zStep = Math.pow(Z_FAR / Z_NEAR, 1 / (ROWS - 1));
			/* Fades in from the left so the headline sits on clean canvas, and back out before the
			   right edge so the swell reads as a band rather than a block pinned to the corner. */
			const fadeInFrom = bw * 0.24;
			const fadeInTo = bw * 0.58;
			const fadeOutFrom = bw * 0.86;
			const fadeOutSpan = bw * 0.14;

			let z = Z_NEAR;
			for (let j = 0; j < ROWS; j++, z *= zStep) {
				const inv = focal / z;
				const halfWorld = (bw * 0.5 * 1.25) / inv;
				const stride = (halfWorld * 2) / (COLS - 1);
				const fog = Math.exp(-z / FOG);
				// Near rows cover more screen per particle, so lift them to keep density even.
				const density = fog * Math.min(1, 0.35 + z * 0.09);
				if (density < 0.004) continue;

				for (let i = 0; i < COLS; i++) {
					const worldX = -halfWorld + stride * i;

					let height = 0;
					let offX = 0;
					let offZ = 0;
					for (let n = 0; n < WAVES.length; n++) {
						const wv = WAVES[n];
						const phase = wv.k * (wv.dx * worldX + wv.dz * z) + time * wv.speed;
						const s = Math.sin(phase);
						const c = Math.cos(phase);
						height += wv.amp * s;
						offX += wv.steep * wv.amp * wv.dx * c;
						offZ += wv.steep * wv.amp * wv.dz * c;
					}

					const zz = z + offZ;
					if (zz < 0.5) continue;
					const proj = focal / zz;
					const sx = cx + (worldX + offX) * proj;
					if (sx < 0 || sx >= bw) continue;
					const sy = horizon + (CAM_Y - height) * proj;
					if (sy < 0 || sy >= bh) continue;

					let edge =
						sx <= fadeInFrom ? 0 : Math.min(1, (sx - fadeInFrom) / (fadeInTo - fadeInFrom));
					if (sx > fadeOutFrom) edge *= Math.max(0, 1 - (sx - fadeOutFrom) / fadeOutSpan);
					if (edge <= 0.002) continue;

					// Crests catch the light; troughs stay dark. This is what reads as foam.
					const crest = 0.5 + (0.5 * height) / MAX_AMP;
					splat(sx, sy, density * edge * (0.12 + 1.5 * crest * crest * crest));
				}
			}

			const data = image.data;
			const [r, g, b] = rgb;
			for (let p = 0, q = 0; p < acc.length; p++, q += 4) {
				const a = acc[p];
				data[q] = r;
				data[q + 1] = g;
				data[q + 2] = b;
				data[q + 3] = a > 0.001 ? (1 - Math.exp(-a * 1.35)) * 205 : 0;
			}

			bctx.putImageData(image, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
		}

		function render() {
			draw(reduced.matches ? 8 : (performance.now() - t0) / 1000);
		}

		function loop() {
			render();
			raf = requestAnimationFrame(loop);
		}

		function play() {
			if (raf || !onScreen || reduced.matches || document.hidden) return;
			raf = requestAnimationFrame(loop);
		}

		function pause() {
			if (!raf) return;
			cancelAnimationFrame(raf);
			raf = 0;
		}

		function resize() {
			const rect = canvas.getBoundingClientRect();
			if (rect.width < 2 || rect.height < 2) return;
			canvas.width = Math.round(rect.width);
			canvas.height = Math.round(rect.height);
			bw = Math.max(2, Math.round(rect.width * SCALE));
			bh = Math.max(2, Math.round(rect.height * SCALE));
			buffer.width = bw;
			buffer.height = bh;
			acc = new Float32Array(bw * bh);
			image = bctx.createImageData(bw, bh);
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			render();
		}

		function repaint() {
			readColour();
			if (!raf) render();
		}

		function onMotionChange() {
			if (reduced.matches) {
				pause();
				render();
			} else {
				play();
			}
		}

		function onVisibility() {
			if (document.hidden) pause();
			else play();
		}

		const sizeObserver = new ResizeObserver(resize);
		sizeObserver.observe(canvas);

		const screenObserver = new IntersectionObserver((entries) => {
			onScreen = entries[0].isIntersecting;
			if (onScreen) play();
			else pause();
		});
		screenObserver.observe(canvas);

		// The explicit Light/Dark choice lands as an attribute on <html>.
		const themeObserver = new MutationObserver(repaint);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		readColour();
		resize();
		play();

		reduced.addEventListener('change', onMotionChange);
		scheme.addEventListener('change', repaint);
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			pause();
			sizeObserver.disconnect();
			screenObserver.disconnect();
			themeObserver.disconnect();
			reduced.removeEventListener('change', onMotionChange);
			scheme.removeEventListener('change', repaint);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
</script>

<canvas bind:this={canvas} aria-hidden="true" class="block text-accent {className}"></canvas>

<style>
	/* Softens the bottom edge; the left fade is baked into the particle weights. */
	canvas {
		mask-image: linear-gradient(to bottom, #000 62%, transparent 100%);
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import * as gmaps from '@googlemaps/js-api-loader';
	const { Loader } = gmaps;
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';

	let mapElement: HTMLElement;

	onMount(async function () {
		const loader = new Loader({
			apiKey: PUBLIC_GOOGLE_MAP_API_KEY,
			version: 'weekly'
		});

		const { Map } = await loader.importLibrary('maps');

		new Map(mapElement, {
			center: { lat: -34.397, lng: 150.644 },
			zoom: 8
		});
	});
</script>

<div bind:this={mapElement} style="height: 100%;"></div>

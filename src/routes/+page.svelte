<script lang="ts">
	import { onMount } from 'svelte';
	import * as gmaps from '@googlemaps/js-api-loader';
	const { Loader } = gmaps;
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';

	let mapElement: HTMLElement;
	let userList: string[] = $state([]);
	let loading: boolean = $state(true);

	let summarize: string[] = $state([]);

	onMount(async function () {
		const loader = new Loader({
			apiKey: PUBLIC_GOOGLE_MAP_API_KEY,
			version: 'weekly'
		});

		const { Map, InfoWindow } = await loader.importLibrary('maps');

		let map = new Map(mapElement, {
			center: { lat: 37.571834, lng: 126.977231 },
			zoom: 11,
			mapId: 'f40c54c8ad07a1c9'
		});

		async function nearbySearch() {
			//@ts-ignore
			const { Place, SearchNearbyRankPreference } = (await google.maps.importLibrary(
				'places'
			)) as google.maps.PlacesLibrary;
			const { AdvancedMarkerElement } = (await google.maps.importLibrary(
				'marker'
			)) as google.maps.MarkerLibrary;

			// Restrict within the map viewport.
			let center = new google.maps.LatLng(37.571834, 126.977231);

			const request = {
				// required parameters
				fields: ['displayName', 'formattedAddress', 'location', 'reviews'],
				locationRestriction: {
					center: center,
					radius: 500
				},
				// optional parameters
				includedPrimaryTypes: ['restaurant'],
				maxResultCount: 5,
				rankPreference: SearchNearbyRankPreference.POPULARITY,
				language: 'ko-KR',
				region: 'kr'
			};

			//@ts-ignore
			const { places } = await Place.searchNearby(request);

			if (places.length) {
				const { LatLngBounds } = (await google.maps.importLibrary(
					'core'
				)) as google.maps.CoreLibrary;
				const bounds = new LatLngBounds();

				// Loop through and get all the results.
				places.forEach((place, index) => {
					let infoWindow;
					let contentString;
					let gen_string: string = '';
					let infoString;
					const markerView = new AdvancedMarkerElement({
						map,
						position: place.location,
						title: place.displayName
					});

					bounds.extend(place.location as google.maps.LatLng);

					if (place.reviews && place.reviews.length > 0) {
						place.reviews.forEach((reivew) => {
							// Get info for the first review.
							let reviewRating = reivew.rating;
							let reviewText = reivew.text;
							let authorName = reivew.authorAttribution!.displayName;
							let authorUri = reivew.authorAttribution!.uri;

							// Format the review using HTML.
							contentString = `
								<div id="title"><b>${place.displayName}</b></div>
								<div id="address">${place.formattedAddress}</div>
								<a href="${authorUri}" target="_blank">Author: ${authorName}</a>
								<div id="rating">Rating: ${reviewRating} stars</div>
								<div id="rating"><p>Review: ${reviewText}</p></div>`;
							userList.push(contentString);
							gen_string = gen_string + ' ' + reviewText;
							infoString = `<div id="title"><b>${place.displayName}</b></div>
								<div id="address">${place.formattedAddress}</div>`;
						});
					} else {
						contentString = 'No reviews were found for ' + place.displayName + '.';
					}
					infoWindow = new InfoWindow({
						content: infoString,
						ariaLabel: place.displayName
					});
					infoWindow.open({
						anchor: markerView,
						map
					});
					summarize[index] = gen_string;
				});

				map.fitBounds(bounds);
			} else {
				console.log('No results');
			}
		}
		nearbySearch().then(
			async () =>
				await fetch('/api', { method: 'POST', body: JSON.stringify({ reviews: summarize[0] }) })
					.then((response) => response.json())
					.then((result) => console.log(result.data[0].text))
		);
		loading = false;
	});
</script>

<div class="h-full w-full">
	<div bind:this={mapElement} class="mx-auto h-1/2 w-10/12"></div>
	{#if !loading}
		{#each userList as content}
			{@html content}
		{/each}
	{/if}
</div>

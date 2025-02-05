<script lang="ts">
	import { onMount } from 'svelte';
	import * as googlemaps from '@googlemaps/js-api-loader';
	const { Loader } = googlemaps;
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';

	let mapElement: HTMLElement;
	// $state() 로 해당 객체를 반응형으로 변경
	let userList: string[] = $state([]);
	let loading: boolean = $state(true);

	let summarize: string[] = $state([]);

	// API 장애 대비 비동기 처리 (Asynchronous)
	// └ 불러오는 시간 동안 다른 작업을 처리하기 위함
	onMount(async function () {
		// API Key를 통한 식별 및 생성자
		const loader = new Loader({
			apiKey: PUBLIC_GOOGLE_MAP_API_KEY,
			version: 'weekly'
		});
		// API Key가 정상적으로 식별된 경우 Map, InfoWindow 클래스를 불러옴
		const { Map, InfoWindow } = await loader.importLibrary('maps');

		// Map 클래스의 초기값 설정
		let map = new Map(mapElement, {
			// center 값 추후 수정 예정
			// └ 초기값 위치는 테스트용 (서울 종로)
			center: { lat: 37.571834, lng: 126.977231 },
			zoom: 11,
			mapId: 'f40c54c8ad07a1c9'
		});

		// 주변 장소 찾기 기능을 활용하기 위한 함수 정의
		async function nearbySearch() {
			//@ts-ignore
			const { Place, SearchNearbyRankPreference } = (await google.maps.importLibrary(
				'places'
			)) as google.maps.PlacesLibrary;
			const { AdvancedMarkerElement } = (await google.maps.importLibrary(
				'marker'
			)) as google.maps.MarkerLibrary;

			// Restrict within the map viewport.
			// center 값 추후 수정 예정
			// └ 초기값 위치는 테스트용 (서울 종로)
			let center = new google.maps.LatLng(37.571834, 126.977231);

			const request = {
				// required parameters
				// 가져올 데이터 목록 (이름, 정형 주소, 위치, 리뷰)
				fields: ['displayName', 'formattedAddress', 'location', 'reviews'],
				locationRestriction: {
					center: center,
					// 반경
					radius: 500
				},
				// optional parameters
				// 가져올 분류군 : 식당
				includedPrimaryTypes: ['restaurant'],
				// center 기준 최대 장소 정보 : 5
				maxResultCount: 5,
				rankPreference: SearchNearbyRankPreference.POPULARITY,
				language: 'ko-KR',
				region: 'kr'
			};

			//@ts-ignore
			// 설정 값 전달 후 리턴값을 places 저장
			const { places } = await Place.searchNearby(request);

			if (places.length) {
				const { LatLngBounds } = (await google.maps.importLibrary(
					'core'
				)) as google.maps.CoreLibrary;
				const bounds = new LatLngBounds();

				// Loop through and get all the results.
				// 반환된 주변 장소 정보 5개 각각 적용
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

					// 각 장소 정보에 리뷰 내용(5개) 각각 적용
					// └ LLM AI 리뷰 요약에 활용할 정보 추출
					if (place.reviews && place.reviews.length > 0) {
						place.reviews.forEach((reivew) => {
							// Get info for the first review.
							let reviewRating = reivew.rating;
							let reviewText = reivew.text;
							let authorName = reivew.authorAttribution!.displayName;
							let authorUri = reivew.authorAttribution!.uri;

							// Format the review using HTML.
							// 추출된 정보를 쉽게 확인할 수 있도록 HTML 내용으로 변환
							contentString = `
								<div id="title"><b>${place.displayName}</b></div>
								<div id="address">${place.formattedAddress}</div>
								<a href="${authorUri}" target="_blank">Author: ${authorName}</a>
								<div id="rating">Rating: ${reviewRating} stars</div>
								<div id="rating"><p>Review: ${reviewText}</p></div>`;
							userList.push(contentString);
							// 리뷰 정보 전달 (페이지에 내용 표시)
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
					// 요약할 정보를 배열로 정리
					summarize[index] = gen_string;
				});

				map.fitBounds(bounds);
			} else {
				console.log('No results');
			}
		}
		// nearbySearch() 함수 호출 및 정상 반환 시 다음 기능 수행
		// └ 'routes/api' 하위로 추출된 리뷰 정보 전달
		// └ './routes/api' 도 가능? -> Java Servlet에서는 가능한데 잘 모르겠음
		nearbySearch().then(
			async () =>
				await fetch('/api', { method: 'POST', body: JSON.stringify({ reviews: summarize[1] }) })
					.then((response) => response.json())
					.then((result) => console.log(result.data[0].text))
			// summarize[0]과 data[0]은 구글맵에서 추출한 주변 장소 정보 5개 중 1개만 테스트로 진행하기 위한 내용
			// 1개 장소에 5개의 리뷰를 /api 로 전달함 (json)
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
